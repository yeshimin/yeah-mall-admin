<template>
  <QuillEditor ref="editorRef" v-model:content="content" content-type="html" :options="options" @update:content="emit('update:modelValue', content)" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { request } from '@/utils/request'
import { resolveApiUrl } from '@/utils/download'

const props = withDefaults(defineProps<{ modelValue?: string; height?: number }>(), { modelValue: '', height: 360 })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const editorRef = ref<InstanceType<typeof QuillEditor>>()
const content = ref(props.modelValue)
const options = { theme: 'snow', placeholder: '请输入内容' }

watch(() => props.modelValue, (value) => { if (value !== content.value) content.value = value || '' })

onMounted(() => {
  const quill = editorRef.value?.getQuill()
  quill?.getModule('toolbar').addHandler('image', () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const formData = new FormData()
      formData.append('file', file)
      const response = await request<{ fileKey: string }>({ url: '/mch/storage/upload', method: 'post', data: formData })
      const range = quill.getSelection(true)
      quill.insertEmbed(range.index, 'image', resolveApiUrl(`/public/storage/preview?fileKey=${encodeURIComponent(response.data.fileKey)}`))
    }
    input.click()
  })
})
</script>
