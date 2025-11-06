<template>
  <div class="s3-explorer">
    <div class="explorer-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item @click="navigateToRoot">
          {{ bucket }}
        </el-breadcrumb-item>
        <el-breadcrumb-item
          v-for="(part, index) in pathParts"
          :key="index"
          @click="navigateToPath(index)"
        >
          {{ part }}
        </el-breadcrumb-item>
      </el-breadcrumb>

      <div class="header-actions">
        <el-button
          :icon="FolderAdd"
          size="small"
          @click="handleNewFolderClick"
        >
          New Folder
        </el-button>
        <el-button
          :icon="Upload"
          size="small"
          @click="handleUploadClick"
        >
          Upload
        </el-button>
        <el-button
          :icon="Refresh"
          size="small"
          circle
          @click="loadObjects"
          :loading="loading"
        />
      </div>
    </div>

    <div class="explorer-filter">
      <el-input
        v-model="filterText"
        placeholder="Filter files and folders..."
        clearable
        size="small"
      />
    </div>

    <div v-if="loading && objects.length === 0" class="loading-state">
      <el-skeleton :rows="8" animated />
    </div>

    <el-table
      v-else
      :data="filteredDisplayItems"
      style="width: 100%"
      @row-click="handleRowClick"
      :row-class-name="getRowClassName"
      @drop.prevent="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      :class="{ 'drag-over': isDragging }"
    >
      <el-table-column label="Actions" width="180" align="left">
        <template #default="scope">
          <div class="action-buttons">
            <el-button
              v-if="!scope.row.isFolder"
              :icon="View"
              size="small"
              circle
              title="Preview"
              @click.stop="handlePreviewClick(scope.row)"
            />
            <el-button
              v-if="!scope.row.isFolder"
              :icon="Download"
              size="small"
              circle
              title="Download"
              @click.stop="handleDownloadClick(scope.row)"
            />
            <el-button
              :icon="CopyDocument"
              size="small"
              circle
              title="Copy S3 Path"
              @click.stop="handleCopyPath(scope.row)"
            />
            <el-button
              :icon="Delete"
              size="small"
              circle
              title="Delete"
              plain
              class="delete-button"
              @click.stop="handleDeleteClick(scope.row)"
            />
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Name" min-width="300">
        <template #default="scope">
          <div class="file-name">
            <el-icon v-if="scope.row.isFolder" size="18" class="folder-icon">
              <Folder />
            </el-icon>
            <Icon v-else :icon="getFileIcon(scope.row)" :width="18" :height="18" />
            <span>{{ scope.row.displayName }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Size" width="120" align="right">
        <template #default="scope">
          {{ scope.row.isFolder ? '-' : formatSize(scope.row.size) }}
        </template>
      </el-table-column>

      <el-table-column label="Last Modified" width="200">
        <template #default="scope">
          {{ scope.row.isFolder ? '-' : formatDate(scope.row.lastModified) }}
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && displayItems.length === 0" class="empty-state">
      <el-empty description="This folder is empty" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, Upload, Download, Folder, View, CopyDocument, Delete, FolderAdd
} from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import type { S3Object } from '@shared/types'

const props = defineProps<{
  bucket: string
}>()

const emit = defineEmits<{
  download: [bucket: string, key: string]
  upload: [bucket: string, prefix: string]
  preview: [bucket: string, key: string]
  refreshRequested: []
}>()

// Expose refresh method to parent
defineExpose({
  refresh: loadObjects
})

interface DisplayItem extends S3Object {
  displayName: string
}

const objects = ref<S3Object[]>([])
const folders = ref<string[]>([])
const currentPrefix = ref<string>('')
const loading = ref(false)
const filterText = ref<string>('')
const isDragging = ref(false)

const pathParts = computed(() => {
  if (!currentPrefix.value) return []
  return currentPrefix.value.split('/').filter(Boolean)
})

const displayItems = computed<DisplayItem[]>(() => {
  const items: DisplayItem[] = []

  // Add folders
  folders.value.forEach(folder => {
    const parts = folder.split('/')
    const displayName = parts[parts.length - 2] || parts[parts.length - 1]
    items.push({
      key: folder,
      displayName,
      size: 0,
      lastModified: new Date(),
      isFolder: true
    })
  })

  // Add files
  objects.value.forEach(obj => {
    const displayName = obj.key.split('/').pop() || obj.key
    items.push({
      ...obj,
      displayName
    })
  })

  return items
})

const filteredDisplayItems = computed(() => {
  if (!filterText.value) {
    return displayItems.value
  }
  const search = filterText.value.toLowerCase()
  return displayItems.value.filter(item =>
    item.displayName.toLowerCase().includes(search)
  )
})

watch(() => props.bucket, () => {
  currentPrefix.value = ''
  loadObjects()
}, { immediate: true })

async function loadObjects() {
  if (!props.bucket) return

  loading.value = true

  try {
    const result = await window.electronAPI.listObjects({
      bucket: props.bucket,
      prefix: currentPrefix.value
    })

    if (result.success && result.data) {
      objects.value = result.data.objects
      folders.value = result.data.folders
    } else {
      ElMessage.error(result.error || 'Failed to load objects')
    }
  } catch (error) {
    ElMessage.error('Failed to load objects')
  } finally {
    loading.value = false
  }
}

function handleRowClick(row: DisplayItem) {
  if (row.isFolder) {
    currentPrefix.value = row.key
    loadObjects()
  }
}

function navigateToRoot() {
  currentPrefix.value = ''
  loadObjects()
}

function navigateToPath(index: number) {
  const parts = currentPrefix.value.split('/').filter(Boolean)
  currentPrefix.value = parts.slice(0, index + 1).join('/') + '/'
  loadObjects()
}

function handleDownloadClick(item: DisplayItem) {
  emit('download', props.bucket, item.key)
}

function handlePreviewClick(item: DisplayItem) {
  emit('preview', props.bucket, item.key)
}

function handleCopyPath(item: DisplayItem) {
  const s3Path = `s3://${props.bucket}/${item.key}`
  navigator.clipboard.writeText(s3Path)
    .then(() => {
      ElMessage.success('S3 path copied to clipboard')
    })
    .catch(() => {
      ElMessage.error('Failed to copy to clipboard')
    })
}

function handleUploadClick() {
  emit('upload', props.bucket, currentPrefix.value)
}

async function handleNewFolderClick() {
  try {
    const { value: folderName } = await ElMessageBox.prompt(
      'Enter folder name:',
      'Create New Folder',
      {
        confirmButtonText: 'Create',
        cancelButtonText: 'Cancel',
        inputPattern: /^[a-zA-Z0-9-_\.]+$/,
        inputErrorMessage: 'Folder name can only contain letters, numbers, hyphens, underscores, and dots'
      }
    )

    if (!folderName) return

    // S3 folders are created by uploading an empty object with a trailing slash
    const folderKey = currentPrefix.value + folderName + '/'

    const result = await window.electronAPI.uploadFile({
      bucket: props.bucket,
      key: folderKey,
      filePath: '' // Empty file path for folder creation
    })

    if (result.success) {
      ElMessage.success('Folder created successfully')
      loadObjects()
    } else {
      ElMessage.error(result.error || 'Failed to create folder')
    }
  } catch {
    // User cancelled
  }
}

async function handleDeleteClick(item: DisplayItem) {
  const itemType = item.isFolder ? 'folder' : 'file'

  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete this ${itemType}?<br><strong>${item.displayName}</strong>`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )

    const result = await window.electronAPI.deleteObject({
      bucket: props.bucket,
      key: item.key
    })

    if (result.success) {
      ElMessage.success(`${itemType} deleted successfully`)
      loadObjects()
    } else {
      ElMessage.error(result.error || 'Delete failed')
    }
  } catch {
    // User cancelled
  }
}

function handleDragOver(event: DragEvent) {
  isDragging.value = true
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

function handleDragLeave() {
  isDragging.value = false
}

async function handleDrop(event: DragEvent) {
  isDragging.value = false

  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length === 0) return

  // Get file paths using Electron's webUtils API
  const filePaths: { name: string; path: string }[] = []
  for (const file of files) {
    try {
      const filePath = window.electronAPI.getPathForFile(file)
      if (filePath) {
        filePaths.push({ name: file.name, path: filePath })
      }
    } catch (error) {
      console.error('Error getting file path:', error)
    }
  }

  if (filePaths.length === 0) {
    ElMessage.error('Unable to access file paths')
    return
  }

  // Build file list for confirmation
  let fileListHtml = ''
  if (filePaths.length <= 10) {
    fileListHtml = '<ul style="text-align: left; max-height: 300px; overflow-y: auto;">'
    filePaths.forEach(file => {
      fileListHtml += `<li>${file.name}</li>`
    })
    fileListHtml += '</ul>'
  } else {
    fileListHtml = `<p><strong>${filePaths.length} files selected</strong></p>`
  }

  const currentPath = currentPrefix.value || '(root)'

  try {
    await ElMessageBox.confirm(
      `<div>
        <p>Upload the following files to <strong>s3://${props.bucket}/${currentPath}</strong>?</p>
        ${fileListHtml}
      </div>`,
      'Confirm Upload',
      {
        confirmButtonText: 'Upload',
        cancelButtonText: 'Cancel',
        type: 'info',
        dangerouslyUseHTMLString: true
      }
    )

    // User confirmed, proceed with upload
    let successCount = 0
    let failCount = 0

    for (const file of filePaths) {
      const key = currentPrefix.value + file.name
      const result = await window.electronAPI.uploadFile({
        bucket: props.bucket,
        key,
        filePath: file.path
      })

      if (result.success) {
        successCount++
      } else {
        failCount++
        console.error(`Failed to upload ${file.name}:`, result.error)
      }
    }

    // Show summary message
    if (successCount > 0 && failCount === 0) {
      ElMessage.success(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`)
    } else if (successCount > 0 && failCount > 0) {
      ElMessage.warning(`Uploaded ${successCount} file${successCount > 1 ? 's' : ''}, ${failCount} failed`)
    } else {
      ElMessage.error('All uploads failed')
    }

    // Refresh the view if any succeeded
    if (successCount > 0) {
      loadObjects()
    }
  } catch {
    // User cancelled
  }
}

function getRowClassName({ row }: { row: DisplayItem }) {
  return row.isFolder ? 'folder-row' : ''
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString()
}

function getFileIcon(item: DisplayItem): string {
  const fileName = item.displayName.toLowerCase()
  const extension = fileName.substring(fileName.lastIndexOf('.'))

  // Map extensions to VSCode icon names
  const iconMap: Record<string, string> = {
    // Programming languages
    '.js': 'vscode-icons:file-type-js-official',
    '.jsx': 'vscode-icons:file-type-reactjs',
    '.ts': 'vscode-icons:file-type-typescript-official',
    '.tsx': 'vscode-icons:file-type-reactts',
    '.py': 'vscode-icons:file-type-python',
    '.java': 'vscode-icons:file-type-java',
    '.go': 'vscode-icons:file-type-go',
    '.rs': 'vscode-icons:file-type-rust',
    '.php': 'vscode-icons:file-type-php',
    '.rb': 'vscode-icons:file-type-ruby',
    '.c': 'vscode-icons:file-type-c',
    '.cpp': 'vscode-icons:file-type-cpp',
    '.cs': 'vscode-icons:file-type-csharp',
    '.swift': 'vscode-icons:file-type-swift',
    '.kt': 'vscode-icons:file-type-kotlin',

    // Web
    '.html': 'vscode-icons:file-type-html',
    '.css': 'vscode-icons:file-type-css',
    '.scss': 'vscode-icons:file-type-scss',
    '.sass': 'vscode-icons:file-type-sass',
    '.less': 'vscode-icons:file-type-less',
    '.vue': 'vscode-icons:file-type-vue',

    // Data/Config
    '.json': 'vscode-icons:file-type-json',
    '.xml': 'vscode-icons:file-type-xml',
    '.yaml': 'vscode-icons:file-type-yaml',
    '.yml': 'vscode-icons:file-type-yaml',
    '.toml': 'vscode-icons:file-type-toml',
    '.ini': 'vscode-icons:file-type-ini',
    '.conf': 'vscode-icons:file-type-config',
    '.config': 'vscode-icons:file-type-config',
    '.env': 'vscode-icons:file-type-dotenv',

    // Documents
    '.pdf': 'vscode-icons:file-type-pdf2',
    '.doc': 'vscode-icons:file-type-word',
    '.docx': 'vscode-icons:file-type-word',
    '.xls': 'vscode-icons:file-type-excel',
    '.xlsx': 'vscode-icons:file-type-excel',
    '.ppt': 'vscode-icons:file-type-powerpoint',
    '.pptx': 'vscode-icons:file-type-powerpoint',
    '.txt': 'vscode-icons:file-type-text',
    '.md': 'vscode-icons:file-type-markdown',
    '.csv': 'vscode-icons:file-type-excel',

    // Images
    '.png': 'vscode-icons:file-type-image',
    '.jpg': 'vscode-icons:file-type-image',
    '.jpeg': 'vscode-icons:file-type-image',
    '.gif': 'vscode-icons:file-type-image',
    '.svg': 'vscode-icons:file-type-svg',
    '.ico': 'vscode-icons:file-type-image',
    '.webp': 'vscode-icons:file-type-image',
    '.bmp': 'vscode-icons:file-type-image',

    // Video
    '.mp4': 'vscode-icons:file-type-video',
    '.avi': 'vscode-icons:file-type-video',
    '.mov': 'vscode-icons:file-type-video',
    '.wmv': 'vscode-icons:file-type-video',
    '.flv': 'vscode-icons:file-type-video',
    '.mkv': 'vscode-icons:file-type-video',
    '.webm': 'vscode-icons:file-type-video',

    // Audio
    '.mp3': 'vscode-icons:file-type-audio',
    '.wav': 'vscode-icons:file-type-audio',
    '.flac': 'vscode-icons:file-type-audio',
    '.ogg': 'vscode-icons:file-type-audio',
    '.m4a': 'vscode-icons:file-type-audio',

    // Archives
    '.zip': 'vscode-icons:file-type-zip',
    '.rar': 'vscode-icons:file-type-zip',
    '.7z': 'vscode-icons:file-type-zip',
    '.tar': 'vscode-icons:file-type-zip',
    '.gz': 'vscode-icons:file-type-zip',
    '.bz2': 'vscode-icons:file-type-zip',

    // Build/Package
    '.lock': 'vscode-icons:file-type-lock',
    '.log': 'vscode-icons:file-type-log',
    '.sql': 'vscode-icons:file-type-sql',
    '.sh': 'vscode-icons:file-type-shell',
    '.bat': 'vscode-icons:file-type-bat',
    '.dockerfile': 'vscode-icons:file-type-docker',
  }

  // Check for specific filenames
  const fileNameMap: Record<string, string> = {
    'package.json': 'vscode-icons:file-type-node',
    'package-lock.json': 'vscode-icons:file-type-node',
    'tsconfig.json': 'vscode-icons:file-type-tsconfig',
    'dockerfile': 'vscode-icons:file-type-docker',
    'docker-compose.yml': 'vscode-icons:file-type-docker',
    '.gitignore': 'vscode-icons:file-type-git',
    '.env': 'vscode-icons:file-type-dotenv',
    'readme.md': 'vscode-icons:file-type-readme',
  }

  if (fileNameMap[fileName]) {
    return fileNameMap[fileName]
  }

  return iconMap[extension] || 'vscode-icons:default-file'
}
</script>

<style scoped>
.s3-explorer {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 20px;
}

.explorer-header {
  padding: 0 0 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dcdfe6;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.explorer-filter {
  padding: 0 0 15px 0;
  flex-shrink: 0;
}

.el-breadcrumb {
  font-size: 14px;
}

.el-breadcrumb :deep(.el-breadcrumb__item) {
  cursor: pointer;
}

.el-breadcrumb :deep(.el-breadcrumb__item:hover) {
  color: #409eff;
}

.el-table {
  flex: 1;
  overflow-y: auto;
}

.action-buttons {
  display: flex;
  gap: 5px;
  justify-content: center;
  align-items: center;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.folder-row) {
  cursor: pointer;
  font-weight: 500;
}

:deep(.folder-row:hover) {
  background-color: #f5f7fa;
}

.loading-state, .empty-state {
  padding: 40px;
  flex: 1;
  overflow-y: auto;
}

.folder-icon {
  color: #ff9900;
}

.drag-over {
  outline: 3px dashed #409eff;
  outline-offset: -3px;
  background-color: rgba(64, 158, 255, 0.05);
}

.delete-button {
  color: #f56c6c;
  border-color: #f56c6c;
}

.delete-button:hover {
  color: #fff;
  background-color: #f56c6c;
  border-color: #f56c6c;
}
</style>
