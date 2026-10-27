<template>
  <el-image
    v-if="primarySource"
    :src="primarySource"
    :preview-src-list="preview ? previewSources : []"
    :style="imageStyle"
    :fit="fit"
    preview-teleported
  >
    <template #error>
      <div class="storage-image-placeholder"><el-icon><Picture /></el-icon></div>
    </template>
  </el-image>
  <div v-else class="storage-image-placeholder" :style="imageStyle">
    <el-icon><Picture /></el-icon>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import { getStoragePreviewUrl } from '@/utils/storage'

const props = withDefaults(defineProps<{
  src?: string | null
  width?: string | number
  height?: string | number
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  preview?: boolean
}>(), {
  src: '',
  width: 80,
  height: 80,
  fit: 'cover',
  preview: true,
})

const sourceKeys = computed(() => String(props.src || '').split(',').map((item) => item.trim()).filter(Boolean))
const previewSources = computed(() => sourceKeys.value.map((item) => getStoragePreviewUrl(item)))
const primarySource = computed(() => previewSources.value[0] || '')
const imageStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))
</script>

<style scoped>
.storage-image-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
  border-radius: 4px;
}
</style>
