<template>
  <div class="storage-file-upload">
    <el-upload
      :http-request="upload"
      :before-upload="validate"
      :show-file-list="false"
      :accept="accept"
    >
      <el-button type="primary" :loading="uploading">{{ modelValue ? '重新上传' : '选择文件' }}</el-button>
    </el-upload>
    <el-link v-if="modelValue" type="primary" :href="previewUrl" target="_blank">查看文件</el-link>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadStorageFile } from '@/api/storage'
import { getRequestErrorMessage } from '@/utils/error'
import { getStoragePreviewUrl } from '@/utils/storage'

const props = withDefaults(defineProps<{
  modelValue?: string
  fileSize?: number
  fileType?: string[]
  isUsed?: boolean
}>(), {
  modelValue: '',
  fileSize: 5,
  fileType: () => [],
  isUsed: true,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const uploading = ref(false)
const normalizedTypes = computed(() => props.fileType.map((item) => item.toLowerCase().replace(/^\./, '')))
const accept = computed(() => normalizedTypes.value.map((item) => `.${item}`).join(','))
const previewUrl = computed(() => getStoragePreviewUrl(props.modelValue))

function validate(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  if (normalizedTypes.value.length && !normalizedTypes.value.includes(extension)) {
    ElMessage.error(`仅支持 ${normalizedTypes.value.join('、')} 格式`)
    return false
  }
  if (file.size > props.fileSize * 1024 * 1024) {
    ElMessage.error(`文件大小不能超过 ${props.fileSize}MB`)
    return false
  }
  return true
}

async function upload(options: { file: File; onSuccess: (value: unknown) => void; onError: (error: Error) => void }) {
  uploading.value = true
  try {
    const response = await uploadStorageFile({ file: options.file, isPublic: true, isUsed: props.isUsed })
    emit('update:modelValue', response.data.fileKey)
    options.onSuccess(response.data)
    ElMessage.success('上传成功')
  } catch (error) {
    const message = getRequestErrorMessage(error) || '上传失败'
    options.onError(new Error(message))
    ElMessage.error(message)
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.storage-file-upload {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
</style>
