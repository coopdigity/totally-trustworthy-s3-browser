import type { ListObjectsRequest, DownloadFileRequest, UploadFileRequest, PreviewFileRequest, DeleteObjectRequest, IpcResponse } from '@shared/types'

declare global {
  interface Window {
    electronAPI: {
      getPathForFile: (file: File) => string
      getProfiles: () => Promise<IpcResponse<any>>
      getRegions: () => Promise<IpcResponse<any>>
      listBuckets: (profileName: string, region: string) => Promise<IpcResponse<any>>
      listObjects: (request: ListObjectsRequest) => Promise<IpcResponse<any>>
      downloadFile: (request: DownloadFileRequest) => Promise<IpcResponse<any>>
      uploadFile: (request: UploadFileRequest) => Promise<IpcResponse<any>>
      previewFile: (request: PreviewFileRequest) => Promise<IpcResponse<any>>
      deleteObject: (request: DeleteObjectRequest) => Promise<IpcResponse<any>>
      selectDownloadPath: (defaultFilename: string) => Promise<IpcResponse<string>>
      selectUploadFile: () => Promise<IpcResponse<{ path: string; name: string }[]>>
    }
  }
}

export {}
