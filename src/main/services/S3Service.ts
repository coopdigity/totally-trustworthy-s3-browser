import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand
} from '@aws-sdk/client-s3'
import { fromIni } from '@aws-sdk/credential-providers'
import { createWriteStream } from 'fs'
import { readFile, mkdir } from 'fs/promises'
import { pipeline } from 'stream/promises'
import { dirname } from 'path'
import type { S3Bucket, S3ListResult, S3Object } from '@shared/types'

export class S3Service {
  private client: S3Client | null = null

  setProfile(profileName: string, region: string) {
    const credentials = fromIni({ profile: profileName })

    this.client = new S3Client({
      region,
      credentials
    })
  }

  async listBuckets(): Promise<S3Bucket[]> {
    if (!this.client) {
      throw new Error('S3 client not initialized. Call setProfile first.')
    }

    try {
      const command = new ListBucketsCommand({})
      const response = await this.client.send(command)

      return (response.Buckets || []).map(bucket => ({
        name: bucket.Name!,
        creationDate: bucket.CreationDate
      }))
    } catch (error) {
      console.error('Error listing buckets:', error)
      throw error
    }
  }

  async listObjects(bucket: string, prefix: string = '', continuationToken?: string): Promise<S3ListResult> {
    if (!this.client) {
      throw new Error('S3 client not initialized. Call setProfile first.')
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: '/',
        ContinuationToken: continuationToken
      })

      const response = await this.client.send(command)

      // Extract folders (common prefixes)
      const folders = (response.CommonPrefixes || [])
        .map(p => p.Prefix!)
        .filter(Boolean)

      // Extract files (objects)
      const objects: S3Object[] = (response.Contents || [])
        .filter(obj => obj.Key !== prefix) // Exclude the prefix itself
        .map(obj => ({
          key: obj.Key!,
          size: obj.Size || 0,
          lastModified: obj.LastModified || new Date(),
          isFolder: false
        }))

      return {
        objects,
        folders,
        continuationToken: response.NextContinuationToken
      }
    } catch (error) {
      console.error('Error listing objects:', error)
      throw error
    }
  }

  async downloadFile(bucket: string, key: string, savePath: string): Promise<void> {
    if (!this.client) {
      throw new Error('S3 client not initialized. Call setProfile first.')
    }

    try {
      // Ensure directory exists
      const dir = dirname(savePath)
      await mkdir(dir, { recursive: true })

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      })

      const response = await this.client.send(command)

      if (!response.Body) {
        throw new Error('No response body')
      }

      const writeStream = createWriteStream(savePath)
      await pipeline(response.Body as any, writeStream)
    } catch (error) {
      console.error('Error downloading file:', error)
      throw error
    }
  }

  async uploadFile(bucket: string, key: string, filePath: string): Promise<void> {
    if (!this.client) {
      throw new Error('S3 client not initialized. Call setProfile first.')
    }

    try {
      // If filePath is empty, create an empty folder object
      let fileContent: Buffer
      if (filePath && filePath.length > 0) {
        fileContent = await readFile(filePath)
      } else {
        fileContent = Buffer.from('')
      }

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileContent
      })

      await this.client.send(command)
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    if (!this.client) {
      throw new Error('S3 client not initialized. Call setProfile first.')
    }

    try {
      // If key ends with '/', it's a folder - need to delete all objects with that prefix
      if (key.endsWith('/')) {
        await this.deleteFolder(bucket, key)
      } else {
        const command = new DeleteObjectCommand({
          Bucket: bucket,
          Key: key
        })
        await this.client.send(command)
      }
    } catch (error) {
      console.error('Error deleting object:', error)
      throw error
    }
  }

  private async deleteFolder(bucket: string, prefix: string): Promise<void> {
    if (!this.client) {
      throw new Error('S3 client not initialized.')
    }

    try {
      // List all objects with this prefix
      let continuationToken: string | undefined
      const objectsToDelete: { Key: string }[] = []

      do {
        const listCommand = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken
        })

        const listResponse = await this.client.send(listCommand)

        if (listResponse.Contents) {
          objectsToDelete.push(
            ...listResponse.Contents.map(obj => ({ Key: obj.Key! }))
          )
        }

        continuationToken = listResponse.NextContinuationToken
      } while (continuationToken)

      // Delete all objects in batches of 1000 (S3 limit)
      if (objectsToDelete.length > 0) {
        for (let i = 0; i < objectsToDelete.length; i += 1000) {
          const batch = objectsToDelete.slice(i, i + 1000)
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: batch
            }
          })
          await this.client.send(deleteCommand)
        }
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
      throw error
    }
  }
}
