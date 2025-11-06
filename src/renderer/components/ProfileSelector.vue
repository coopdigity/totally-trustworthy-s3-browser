<template>
  <el-select
    v-model="selectedProfile"
    placeholder="Select AWS Profile"
    @change="handleProfileChange"
    style="width: 200px"
  >
    <el-option
      v-for="profile in profiles"
      :key="profile.name"
      :label="profile.name"
      :value="profile.name"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { AwsProfile } from '@shared/types'

const emit = defineEmits<{
  profileSelected: [profileName: string, region?: string]
}>()

const profiles = ref<AwsProfile[]>([])
const selectedProfile = ref<string>('')

onMounted(async () => {
  const result = await window.electronAPI.getProfiles()

  if (result.success && result.data) {
    profiles.value = result.data

    // Auto-select first profile if available
    if (profiles.value.length > 0) {
      selectedProfile.value = profiles.value[0].name
      handleProfileChange(selectedProfile.value)
    }
  } else {
    ElMessage.error(result.error || 'Failed to load AWS profiles')
  }
})

function handleProfileChange(profileName: string) {
  const profile = profiles.value.find(p => p.name === profileName)
  emit('profileSelected', profileName, profile?.region)
}
</script>
