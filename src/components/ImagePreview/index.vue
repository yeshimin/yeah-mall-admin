<template>
  <el-image v-if="resolvedSource" :src="resolvedSource" :preview-src-list="previewSources" :style="imageStyle" fit="cover" preview-teleported>
    <template #error>
      <div class="image-error"><el-icon><PictureFilled /></el-icon></div>
    </template>
  </el-image>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PictureFilled } from '@element-plus/icons-vue'
import { resolveApiUrl } from '@/utils/download'

const props = withDefaults(defineProps<{
  src?: string
  width?: string | number
  height?: string | number
}>(), {
  src: '',
  width: 80,
  height: 80,
})

function resolveSource(value: string) {
  if (/^https?:\/\//.test(value) || value.startsWith('/api/')) return value
  if (value.startsWith('/')) return resolveApiUrl(value)
  return resolveApiUrl(`/public/storage/preview?fileKey=${encodeURIComponent(value)}`)
}

const sources = computed(() => props.src.split(',').map((item) => item.trim()).filter(Boolean))
const resolvedSource = computed(() => sources.value[0] ? resolveSource(sources.value[0]) : '')
const previewSources = computed(() => sources.value.map(resolveSource))
const imageStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))
</script>

<style scoped>
.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
</style>
