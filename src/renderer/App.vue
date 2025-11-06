<template>
  <div id="app">
    <el-container direction="vertical">
      <el-header height="60px">
        <div class="header-content">
          <h1>
            Totally Trustworthy S3 Browser
            <PinkyPromiseIcon :size="28" />
          </h1>
          <div class="header-controls">
            <ProfileSelector @profile-selected="handleProfileSelected" />
            <RegionSelector
              :default-region="defaultRegion"
              @region-selected="handleRegionSelected"
            />
          </div>
        </div>
      </el-header>
      <el-container class="main-container">
        <el-aside width="300px">
          <BucketList
            v-if="currentProfile && currentRegion"
            :profile="currentProfile"
            :region="currentRegion"
            @bucket-selected="handleBucketSelected"
          />
        </el-aside>
        <el-main>
          <S3Explorer
            v-if="currentBucket"
            ref="s3ExplorerRef"
            :bucket="currentBucket"
            @download="handleDownload"
            @upload="handleUpload"
            @preview="handlePreview"
          />
          <el-empty v-else description="Select a bucket to browse" />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import ProfileSelector from './components/ProfileSelector.vue'
import RegionSelector from './components/RegionSelector.vue'
import BucketList from './components/BucketList.vue'
import S3Explorer from './components/S3Explorer.vue'
import PinkyPromiseIcon from './components/PinkyPromiseIcon.vue'

const currentProfile = ref<string>('')
const currentRegion = ref<string>('')
const defaultRegion = ref<string>('')
const currentBucket = ref<string>('')
const s3ExplorerRef = ref<InstanceType<typeof S3Explorer> | null>(null)

function handleProfileSelected(profile: string, region?: string) {
  currentProfile.value = profile
  defaultRegion.value = region || 'us-east-1'
  currentRegion.value = defaultRegion.value
  currentBucket.value = ''
}

function handleRegionSelected(region: string) {
  currentRegion.value = region
  currentBucket.value = ''
}

function handleBucketSelected(bucket: string) {
  currentBucket.value = bucket
}

async function handleDownload(bucket: string, key: string) {
  const fileName = key.split('/').pop() || 'download'
  const pathResult = await window.electronAPI.selectDownloadPath(fileName)

  if (!pathResult.success || !pathResult.data) {
    return
  }

  const result = await window.electronAPI.downloadFile({
    bucket,
    key,
    savePath: pathResult.data
  })

  if (result.success) {
    ElMessage.success('File downloaded successfully')
  } else {
    ElMessage.error(result.error || 'Download failed')
  }
}

async function handlePreview(bucket: string, key: string) {
  const result = await window.electronAPI.previewFile({
    bucket,
    key
  })

  if (result.success) {
    ElMessage.success('Opening file preview')
  } else {
    ElMessage.error(result.error || 'Preview failed')
  }
}

async function handleUpload(bucket: string, prefix: string) {
  const fileResult = await window.electronAPI.selectUploadFile()

  if (!fileResult.success || !fileResult.data || fileResult.data.length === 0) {
    return
  }

  const files = fileResult.data
  let successCount = 0
  let failCount = 0

  for (const file of files) {
    const key = prefix + file.name
    const result = await window.electronAPI.uploadFile({
      bucket,
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

  // Refresh the explorer view
  if (successCount > 0 && s3ExplorerRef.value) {
    s3ExplorerRef.value.refresh()
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  overflow: hidden;
}

.el-container {
  height: 100%;
}

.main-container {
  height: calc(100% - 60px);
}

.el-header {
  background-color: #ff9900;
  color: #232f3e;
  padding: 0;
  flex-shrink: 0;
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.el-header h1 {
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.el-aside {
  background-color: #f5f7fa;
  border-right: 1px solid #dcdfe6;
  overflow: hidden;
  height: 100%;
}

.el-main {
  padding: 20px 20px 0 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
