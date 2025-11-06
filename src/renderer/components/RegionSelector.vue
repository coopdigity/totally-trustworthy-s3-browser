<template>
  <el-select
    v-model="selectedRegion"
    placeholder="Select Region"
    @change="handleRegionChange"
    style="width: 250px"
  >
    <el-option
      v-for="region in regions"
      :key="region.code"
      :label="`${region.name} (${region.code})`"
      :value="region.code"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { AwsRegion } from '@shared/types'

const props = defineProps<{
  defaultRegion?: string
}>()

const emit = defineEmits<{
  regionSelected: [region: string]
}>()

const regions = ref<AwsRegion[]>([])
const selectedRegion = ref<string>('')

onMounted(async () => {
  const result = await window.electronAPI.getRegions()

  if (result.success && result.data) {
    regions.value = result.data

    if (props.defaultRegion) {
      selectedRegion.value = props.defaultRegion
      emit('regionSelected', selectedRegion.value)
    }
  } else {
    ElMessage.error(result.error || 'Failed to load regions')
  }
})

watch(() => props.defaultRegion, (newRegion) => {
  if (newRegion) {
    selectedRegion.value = newRegion
    emit('regionSelected', selectedRegion.value)
  }
})

function handleRegionChange(region: string) {
  emit('regionSelected', region)
}
</script>
