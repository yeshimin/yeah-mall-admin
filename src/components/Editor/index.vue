<template>
  <div class="editor" :class="{ 'editor-readonly': readonly }" :style="editorStyle">
    <QuillEditor
      v-model:content="content"
      content-type="html"
      :options="options"
      :read-only="readonly"
      @ready="handleEditorReady"
      @update:content="emit('update:modelValue', content)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { request } from '@/utils/request'
import { resolveApiUrl } from '@/utils/download'

const props = withDefaults(defineProps<{ modelValue?: string; height?: number; readonly?: boolean }>(), {
  modelValue: '',
  height: 360,
  readonly: false,
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const content = ref(props.modelValue)
const options = {
  theme: 'snow',
  readOnly: props.readonly,
  placeholder: '请输入内容',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, false] }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['clean'],
      ['link', 'image', 'video'],
    ],
  },
}

const editorStyle = computed(() => ({ height: `${props.height}px` }))

watch(() => props.modelValue, (value) => { if (value !== content.value) content.value = value || '' })

function handleEditorReady(quill: ReturnType<InstanceType<typeof QuillEditor>['getQuill']>) {
  if (props.readonly) {
    return
  }
  quill.getModule('toolbar').addHandler('image', () => {
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
}
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.editor:focus-within {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}

.editor-readonly {
  background: #f8fafc;
  border-color: #e4e7ed;
}

.editor-readonly :deep(.ql-toolbar.ql-snow) {
  display: none;
}

.editor-readonly :deep(.ql-editor) {
  cursor: default;
}

.editor-readonly :deep(.ql-editor img) {
  max-width: 100%;
  height: auto;
}

.editor :deep(.ql-toolbar.ql-snow) {
  flex: 0 0 auto;
  padding: 10px 12px 6px;
  white-space: normal;
  background: #f8fafc;
  border: 0;
  border-bottom: 1px solid #e4e7ed;
}

.editor :deep(.ql-toolbar .ql-formats) {
  margin-right: 12px;
  margin-bottom: 4px;
}

.editor :deep(.ql-container.ql-snow) {
  flex: 1 1 auto;
  height: auto;
  min-height: 0;
  border: 0;
}

.editor :deep(.ql-editor) {
  height: 100%;
  padding: 16px 18px;
  overflow-y: auto;
  color: #303133;
  line-height: 1.6;
  word-break: break-word;
}
</style>
