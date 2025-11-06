<template>
  <img
    src="../assets/pinky-promise-outline.png"
    :width="size"
    :height="size"
    alt="Pinky Promise"
    style="display: block;"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number | string
}>(), {
  size: 28
})
</script>
