// AWS Profile types
export interface AwsProfile {
  name: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  sessionToken?: string
}

// AWS Region type
export interface AwsRegion {
  code: string
  name: string
}

// S3 Bucket type
export interface S3Bucket {
  name: string
  creationDate?: Date
}

// S3 Object types
export interface S3Object {
  key: string
  size: number
  lastModified: Date
  isFolder: boolean
}

export interface S3ListResult {
  objects: S3Object[]
  folders: string[]
  continuationToken?: string
}

// IPC Channel definitions
export enum IpcChannel {
  // Profile operations
  GET_PROFILES = 'aws:get-profiles',

  // Region operations
  GET_REGIONS = 'aws:get-regions',

  // S3 operations
  LIST_BUCKETS = 's3:list-buckets',
  LIST_OBJECTS = 's3:list-objects',
  DOWNLOAD_FILE = 's3:download-file',
  UPLOAD_FILE = 's3:upload-file',
  DELETE_OBJECT = 's3:delete-object',

  // File system operations
  SELECT_DOWNLOAD_PATH = 'fs:select-download-path',
  SELECT_UPLOAD_FILE = 'fs:select-upload-file',
  PREVIEW_FILE = 's3:preview-file'
}

// IPC Request/Response types
export interface ListObjectsRequest {
  bucket: string
  prefix?: string
  continuationToken?: string
}

export interface DownloadFileRequest {
  bucket: string
  key: string
  savePath: string
}

export interface UploadFileRequest {
  bucket: string
  key: string
  filePath: string
}

export interface PreviewFileRequest {
  bucket: string
  key: string
}

export interface DeleteObjectRequest {
  bucket: string
  key: string
}

export interface IpcResponse<T> {
  success: boolean
  data?: T
  error?: string
}
