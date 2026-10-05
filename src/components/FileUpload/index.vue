<template>
  <div class="file-upload">
    <el-upload :http-request="handleUpload" :before-upload="validateFile" :show-file-list="false">
      <el-button type="primary" :loading="uploading">选择文件</el-button>
    </el-upload>
    <el-link v-if="modelValue" type="primary" :href="previewUrl" target="_blank">已上传文件</el-link>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadStorageFile } from '@/api/storage'
import { getRequestErrorMessage } from '@/utils/error'

const props = withDefaults(defineProps<{
  modelValue?: string
  fileSize?: number
  fileType?: string[]
}>(), { modelValue: '', fileSize: 5, fileType: () => [] })

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const uploading = ref(false)
const previewUrl = computed(() => `/public/storage/preview?fileKey=${encodeURIComponent(props.modelValue)}`)

function validateFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  if (props.fileType.length && !props.fileType.map((item) => item.toLowerCase()).includes(extension)) {
    ElMessage.error(`文件格式不正确，请上传 ${props.fileType.join('/')} 格式文件`)
    return false
  }
  if (file.size > props.fileSize * 1024 * 1024) {
    ElMessage.error(`文件大小不能超过 ${props.fileSize}MB`)
    return false
  }
  return true
}

async function handleUpload(options: { file: File; onSuccess: (response: unknown) => void; onError: (error: Error) => void }) {
  uploading.value = true
  try {
    const response = await uploadStorageFile({ file: options.file, isPublic: true, isUsed: true })
    emit('update:modelValue', response.data.fileKey)
    options.onSuccess(response.data)
    ElMessage.success('上传成功')
  } catch (error) {
    options.onError(new Error(getRequestErrorMessage(error) || '上传失败'))
    ElMessage.error(getRequestErrorMessage(error) || '上传失败')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.file-upload { display: inline-flex; align-items: center; gap: 12px; }
</style>
