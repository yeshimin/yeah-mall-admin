<template>
  <div v-show="!hidden" class="pagination-container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :background="background"
      :layout="layout"
      :page-sizes="pageSizes"
      :total="Number(total)"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  total: number | string
  page?: number
  limit?: number
  pageSizes?: number[]
  layout?: string
  background?: boolean
  hidden?: boolean
}>(), {
  page: 1,
  limit: 20,
  pageSizes: () => [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true,
  hidden: false,
})

const emit = defineEmits<{
  'update:page': [value: number]
  'update:limit': [value: number]
  pagination: [value: { page: number; limit: number }]
}>()

const currentPage = computed({
  get: () => props.page,
  set: (value: number) => emit('update:page', value),
})
const pageSize = computed({
  get: () => props.limit,
  set: (value: number) => emit('update:limit', value),
})

function handleCurrentChange(page: number) {
  emit('pagination', { page, limit: pageSize.value })
}

function handleSizeChange(limit: number) {
  const page = currentPage.value * limit > Number(props.total) ? 1 : currentPage.value
  emit('pagination', { page, limit })
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
