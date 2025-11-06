import { readFile } from 'fs/promises'
import { homedir } from 'os'
import { join } from 'path'
import type { AwsProfile } from '@shared/types'

export class AwsProfileReader {
  private credentialsPath: string
  private configPath: string

  constructor() {
    const homeDir = homedir()
    this.credentialsPath = join(homeDir, '.aws', 'credentials')
    this.configPath = join(homeDir, '.aws', 'config')
  }

  async getProfiles(): Promise<AwsProfile[]> {
    const profiles = new Map<string, AwsProfile>()

    try {
      // Parse credentials file
      const credentials = await this.parseCredentials()
      credentials.forEach((cred, name) => {
        profiles.set(name, { name, ...cred })
      })

      // Parse config file and merge
      const configs = await this.parseConfig()
      configs.forEach((config, name) => {
        const existing = profiles.get(name) || { name }
        profiles.set(name, { ...existing, ...config })
      })

      return Array.from(profiles.values())
    } catch (error) {
      console.error('Error reading AWS profiles:', error)
      return []
    }
  }

  private async parseCredentials(): Promise<Map<string, Partial<AwsProfile>>> {
    const profiles = new Map<string, Partial<AwsProfile>>()

    try {
      const content = await readFile(this.credentialsPath, 'utf-8')
      let currentProfile: string | null = null

      for (const line of content.split('\n')) {
        const trimmed = line.trim()

        // Profile header
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          currentProfile = trimmed.slice(1, -1)
          profiles.set(currentProfile, {})
          continue
        }

        // Key-value pairs
        if (currentProfile && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=')
          const value = valueParts.join('=').trim()
          const profile = profiles.get(currentProfile)!

          if (key.trim() === 'aws_access_key_id') {
            profile.accessKeyId = value
          } else if (key.trim() === 'aws_secret_access_key') {
            profile.secretAccessKey = value
          } else if (key.trim() === 'aws_session_token') {
            profile.sessionToken = value
          }
        }
      }
    } catch (error) {
      console.error('Error parsing credentials file:', error)
    }

    return profiles
  }

  private async parseConfig(): Promise<Map<string, Partial<AwsProfile>>> {
    const profiles = new Map<string, Partial<AwsProfile>>()

    try {
      const content = await readFile(this.configPath, 'utf-8')
      let currentProfile: string | null = null

      for (const line of content.split('\n')) {
        const trimmed = line.trim()

        // Profile header - handle both [profile name] and [default]
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          const header = trimmed.slice(1, -1)
          currentProfile = header.startsWith('profile ') ? header.slice(8) : header
          profiles.set(currentProfile, {})
          continue
        }

        // Key-value pairs
        if (currentProfile && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=')
          const value = valueParts.join('=').trim()
          const profile = profiles.get(currentProfile)!

          if (key.trim() === 'region') {
            profile.region = value
          }
        }
      }
    } catch (error) {
      console.error('Error parsing config file:', error)
    }

    return profiles
  }
}
