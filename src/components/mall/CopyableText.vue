<template>
  <button
    class="copyable-text"
    type="button"
    :title="`${label}：${normalizedValue}（点击复制）`"
    :aria-label="`复制${label}：${normalizedValue}`"
    @click="copy"
  >
    {{ normalizedValue }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = withDefaults(defineProps<{
  value?: string | number | null
  label?: string
}>(), {
  value: '',
  label: '内容',
})

const normalizedValue = computed(() => String(props.value ?? ''))

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const input = document.createElement('textarea')
  input.value = text
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  input.remove()
}

async function copy() {
  try {
    await writeClipboard(normalizedValue.value)
    ElMessage.success(`${props.label}已复制`)
  } catch {
    ElMessage.error('复制失败，请手动选择内容')
  }
}
</script>

<style scoped>
.copyable-text {
  display: inline;
  width: auto;
  height: auto;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  text-decoration: none;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  cursor: copy;
}

.copyable-text:hover,
.copyable-text:focus-visible {
  color: var(--mall-brand, #24634f);
  text-decoration-line: underline;
  text-decoration-style: dashed;
  outline: 0;
}
</style>
