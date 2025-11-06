<template>
  <div class="bucket-list">
    <div class="bucket-list-header">
      <h3>Buckets</h3>
      <el-button
        :icon="Refresh"
        size="small"
        circle
        @click="loadBuckets"
        :loading="loading"
      />
    </div>

    <div class="bucket-filter">
      <el-input
        v-model="filterText"
        placeholder="Filter buckets..."
        clearable
        size="small"
      />
    </div>

    <div class="bucket-list-content">
      <div v-if="loading && buckets.length === 0" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <el-menu
        v-else
        :default-active="selectedBucket"
        @select="handleBucketSelect"
      >
        <el-menu-item
          v-for="bucket in filteredBuckets"
          :key="bucket.name"
          :index="bucket.name"
        >
          <Icon icon="gravity-ui:bucket" class="bucket-icon" :width="18" :height="18" />
          <span>{{ bucket.name }}</span>
        </el-menu-item>
      </el-menu>

      <div v-if="!loading && buckets.length === 0" class="empty-state">
        <el-empty description="No buckets found" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import type { S3Bucket } from '@shared/types'

const props = defineProps<{
  profile: string
  region: string
}>()

const emit = defineEmits<{
  bucketSelected: [bucket: string]
}>()

const buckets = ref<S3Bucket[]>([])
const selectedBucket = ref<string>('')
const loading = ref(false)
const filterText = ref<string>('')

const filteredBuckets = computed(() => {
  if (!filterText.value) {
    return buckets.value
  }
  const search = filterText.value.toLowerCase()
  return buckets.value.filter(bucket =>
    bucket.name.toLowerCase().includes(search)
  )
})

watch(() => [props.profile, props.region], () => {
  loadBuckets()
}, { immediate: true })

async function loadBuckets() {
  if (!props.profile || !props.region) return

  loading.value = true
  buckets.value = []
  selectedBucket.value = ''

  try {
    const result = await window.electronAPI.listBuckets(props.profile, props.region)

    if (result.success && result.data) {
      buckets.value = result.data
    } else {
      ElMessage.error(result.error || 'Failed to load buckets')
    }
  } catch (error) {
    ElMessage.error('Failed to load buckets')
  } finally {
    loading.value = false
  }
}

function handleBucketSelect(bucket: string) {
  selectedBucket.value = bucket
  emit('bucketSelected', bucket)
}
</script>

<style scoped>
.bucket-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bucket-list-header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dcdfe6;
  flex-shrink: 0;
}

.bucket-list-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.bucket-filter {
  padding: 10px 15px;
  flex-shrink: 0;
}

.bucket-list-content {
  flex: 1;
  overflow-x: auto !important;
  overflow-y: auto !important;
  min-height: 0;
}

.loading-state, .empty-state {
  padding: 20px;
}

.el-menu {
  border: none;
  display: table;
  width: 100%;
}

.el-menu :deep(.el-menu-item) {
  height: 32px;
  line-height: 32px;
  padding: 0 15px;
  white-space: nowrap;
  margin: 0;
  width: max-content;
  min-width: 100%;
}

.bucket-icon {
  color: #ff9900;
  margin-right: 4px;
}
</style>
