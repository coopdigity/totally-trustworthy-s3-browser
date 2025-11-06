import { ipcMain, dialog, shell } from 'electron'
import { basename, join } from 'path'
import { tmpdir } from 'os'
import { AwsProfileReader } from '../services/AwsProfileReader'
import { S3Service } from '../services/S3Service'
import { RegionService } from '../services/RegionService'
import { IpcChannel, type IpcResponse, type ListObjectsRequest, type DownloadFileRequest, type UploadFileRequest, type PreviewFileRequest, type DeleteObjectRequest } from '@shared/types'

const profileReader = new AwsProfileReader()
const s3Service = new S3Service()

export function setupIpcHandlers() {
  // Get AWS profiles
  ipcMain.handle(IpcChannel.GET_PROFILES, async (): Promise<IpcResponse<any>> => {
    try {
      const profiles = await profileReader.getProfiles()
      return { success: true, data: profiles }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Get AWS regions
  ipcMain.handle(IpcChannel.GET_REGIONS, async (): Promise<IpcResponse<any>> => {
    try {
      const regions = RegionService.getRegions()
      return { success: true, data: regions }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // List S3 buckets
  ipcMain.handle(IpcChannel.LIST_BUCKETS, async (_, profileName: string, region: string): Promise<IpcResponse<any>> => {
    try {
      s3Service.setProfile(profileName, region)
      const buckets = await s3Service.listBuckets()
      return { success: true, data: buckets }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // List S3 objects
  ipcMain.handle(IpcChannel.LIST_OBJECTS, async (_, request: ListObjectsRequest): Promise<IpcResponse<any>> => {
    try {
      const result = await s3Service.listObjects(request.bucket, request.prefix, request.continuationToken)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Download file
  ipcMain.handle(IpcChannel.DOWNLOAD_FILE, async (_, request: DownloadFileRequest): Promise<IpcResponse<any>> => {
    try {
      await s3Service.downloadFile(request.bucket, request.key, request.savePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Upload file
  ipcMain.handle(IpcChannel.UPLOAD_FILE, async (_, request: UploadFileRequest): Promise<IpcResponse<any>> => {
    try {
      await s3Service.uploadFile(request.bucket, request.key, request.filePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Select download path
  ipcMain.handle(IpcChannel.SELECT_DOWNLOAD_PATH, async (_, defaultFilename: string): Promise<IpcResponse<string>> => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: defaultFilename,
        properties: ['createDirectory', 'showOverwriteConfirmation']
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Download cancelled' }
      }

      return { success: true, data: result.filePath }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Select upload file(s)
  ipcMain.handle(IpcChannel.SELECT_UPLOAD_FILE, async (): Promise<IpcResponse<{ path: string; name: string }[]>> => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'Upload cancelled' }
      }

      const files = result.filePaths.map(filePath => ({
        path: filePath,
        name: basename(filePath)
      }))

      return { success: true, data: files }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Preview file - download to temp and open
  ipcMain.handle(IpcChannel.PREVIEW_FILE, async (_, request: PreviewFileRequest): Promise<IpcResponse<any>> => {
    try {
      const fileName = basename(request.key)
      const tempPath = join(tmpdir(), 's3browser-preview', fileName)

      // Download to temp directory
      await s3Service.downloadFile(request.bucket, request.key, tempPath)

      // Open with default application
      await shell.openPath(tempPath)

      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Delete object
  ipcMain.handle(IpcChannel.DELETE_OBJECT, async (_, request: DeleteObjectRequest): Promise<IpcResponse<any>> => {
    try {
      await s3Service.deleteObject(request.bucket, request.key)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
