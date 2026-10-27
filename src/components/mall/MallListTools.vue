<template>
  <div class="mall-list-tools">
    <el-tooltip v-if="search" :content="showSearch ? '收起查询条件' : '展开查询条件'">
      <el-button circle aria-label="切换查询条件" @click="toggleSearch">
        <el-icon><Search /></el-icon>
      </el-button>
    </el-tooltip>
    <el-tooltip content="刷新列表">
      <el-button circle aria-label="刷新列表" @click="emit('refresh')">
        <el-icon><Refresh /></el-icon>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { Refresh, Search } from '@element-plus/icons-vue'

const props = withDefaults(defineProps<{
  showSearch?: boolean
  search?: boolean
}>(), {
  showSearch: true,
  search: true,
})

const emit = defineEmits<{
  'update:showSearch': [value: boolean]
  refresh: []
}>()

function toggleSearch() {
  emit('update:showSearch', !props.showSearch)
}
</script>

<style scoped>
.mall-list-tools {
  display: inline-flex;
  gap: 8px;
  margin-left: auto;
}
</style>
