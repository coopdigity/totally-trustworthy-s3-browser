import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { IpcChannel, type ListObjectsRequest, type DownloadFileRequest, type UploadFileRequest, type PreviewFileRequest, type DeleteObjectRequest, type IpcResponse } from '@shared/types'

contextBridge.exposeInMainWorld('electronAPI', {
  // Utility for getting file paths from File objects (for drag-and-drop)
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),

  // Profile operations
  getProfiles: (): Promise<IpcResponse<any>> =>
    ipcRenderer.invoke(IpcChannel.GET_PROFILES),

  // Region operations
  getRegions: (): Promise<IpcResponse<any>> =>
    ipcRenderer.invoke(IpcChannel.GET_REGIONS),

  // S3 operations
  listBuckets: (profileName: string, region: string): Promise<IpcResponse<any>> =>
    ipcRenderer.invoke(IpcChannel.LIST_BUCKETS, profileName, region),

  listObjects: (request: ListObjectsRequest): Promise<IpcResponse<any>> =>
    ipcRenderer.invoke(IpcChannel.LIST_OBJECTS, request),

  downloadFile: (request: DownloadFileRequest): Promise<IpcResponse<any>> =>
    ipcRenderer.invoke(IpcChannel.DOWNLOAD_FILE, request),

  uploadFile: (request: UploadFileRequest): Promise<IpcResponse<any>> =>
    ipcRenderer.invoke(IpcChannel.UPLOAD_FILE, request),

  previewFile: (request: PreviewFileRequest): Promise<IpcResponse<any>> =>
    ipcRenderer.invoke(IpcChannel.PREVIEW_FILE, request),

  deleteObject: (request: DeleteObjectRequest): Promise<IpcResponse<any>> =>
    ipcRenderer.invoke(IpcChannel.DELETE_OBJECT, request),

  // File system operations
  selectDownloadPath: (defaultFilename: string): Promise<IpcResponse<string>> =>
    ipcRenderer.invoke(IpcChannel.SELECT_DOWNLOAD_PATH, defaultFilename),

  selectUploadFile: (): Promise<IpcResponse<{ path: string; name: string }[]>> =>
    ipcRenderer.invoke(IpcChannel.SELECT_UPLOAD_FILE)
})
