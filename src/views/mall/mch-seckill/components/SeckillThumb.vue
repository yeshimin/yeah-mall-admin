<template>
  <span class="ms-thumb">
    <img v-if="preview && !failed" :src="preview" :alt="alt" @error="failed = true" />
    <el-icon v-else><Picture /></el-icon>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import { getStoragePreviewUrl } from '@/utils/storage'

const props = defineProps<{
  src?: string | null
  alt?: string
}>()

const failed = ref(false)
const preview = computed(() => (props.src ? getStoragePreviewUrl(props.src) : ''))

watch(
  () => props.src,
  () => {
    failed.value = false
  },
)
</script>