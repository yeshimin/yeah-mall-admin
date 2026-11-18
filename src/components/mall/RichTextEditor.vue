<template>
  <div class="rich-text-editor" :class="{ readonly }" :style="{ height: `${height}px` }">
    <QuillEditor
      :content="readonly ? '' : content"
      content-type="html"
      theme="snow"
      :read-only="readonly"
      :placeholder="placeholder"
      :toolbar="toolbar"
      @ready="configureEditor"
      @update:content="handleContentUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import type Quill from 'quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { uploadMerchantStorageFile, uploadStorageFile } from '@/api/storage'
import { getStoragePreviewUrl } from '@/utils/storage'

const props = withDefaults(defineProps<{
  modelValue?: string
  height?: number
  readonly?: boolean
  placeholder?: string
  uploadScope?: 'platform' | 'merchant'
}>(), {
  modelValue: '',
  height: 360,
  readonly: false,
  placeholder: '请输入内容',
  uploadScope: 'platform',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const content = ref(props.modelValue)
let readonlyQuill: Quill | null = null
const toolbar = props.readonly ? false : [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ size: ['small', false, 'large', 'huge'] }],
  [{ header: [1, 2, 3, false] }],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  ['link', 'image', 'video', 'clean'],
]

watch(() => props.modelValue, (value) => {
  if (props.readonly) {
    readonlyQuill?.clipboard.dangerouslyPasteHTML(value || '', 'silent')
    return
  }
  if ((value || '') !== content.value) content.value = value || ''
})

function handleContentUpdate(value: string) {
  content.value = value
  emit('update:modelValue', value)
}

function configureEditor(editor: Quill) {
  if (props.readonly) {
    // vue-quill 1.x 只读态直接写 innerHTML，Quill 2 会丢弃无 data-list 的列表节点，改走剪贴板转换
    readonlyQuill = editor
    editor.clipboard.dangerouslyPasteHTML(props.modelValue || '', 'silent')
    return
  }
  const toolbarModule = editor.getModule('toolbar') as {
    addHandler?: (name: string, handler: () => void) => void
  }
  toolbarModule.addHandler?.('image', () => selectAndUploadImage(editor))
}

function selectAndUploadImage(editor: Quill) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    const response = props.uploadScope === 'merchant'
      ? await uploadMerchantStorageFile(file)
      : await uploadStorageFile({ file, isPublic: true, isUsed: false })
    const range = editor.getSelection(true)
    editor.insertEmbed(range.index, 'image', getStoragePreviewUrl(response.data.fileKey), 'user')
    editor.setSelection(range.index + 1, 0, 'silent')
  }
  input.click()
}
</script>

<style scoped>
.rich-text-editor {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: #fff;
}

.rich-text-editor:focus-within {
  border-color: var(--el-color-primary);
}

.rich-text-editor :deep(.ql-toolbar.ql-snow) {
  flex: 0 0 auto;
  border: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.rich-text-editor :deep(.ql-container.ql-snow) {
  flex: 1;
  min-height: 0;
  border: 0;
}

.rich-text-editor :deep(.ql-editor) {
  height: 100%;
  overflow-y: auto;
}

.rich-text-editor.readonly :deep(.ql-toolbar) {
  display: none;
}
</style>
