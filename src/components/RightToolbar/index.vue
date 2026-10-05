<template>
  <div class="right-toolbar">
    <el-tooltip v-if="search" :content="showSearch ? '隐藏搜索' : '显示搜索'">
      <el-button circle @click="emit('update:showSearch', !showSearch)">
        <el-icon><Search /></el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip content="刷新">
      <el-button circle @click="emit('queryTable')">
        <el-icon><Refresh /></el-icon>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { Refresh, Search } from '@element-plus/icons-vue'

defineProps({
  showSearch: { type: Boolean, default: true },
  search: { type: Boolean, default: true },
})

const emit = defineEmits<{
  'update:showSearch': [value: boolean]
  queryTable: []
}>()
</script>

<style scoped>
.right-toolbar {
  display: inline-flex;
  gap: 8px;
  margin-left: auto;
}
</style>
