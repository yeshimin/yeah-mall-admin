<template>
  <div v-if="!hidden" class="mall-pagination">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :background="background"
      :layout="layout"
      :page-sizes="pageSizes"
      :total="normalizedTotal"
      @current-change="emitPageChange"
      @size-change="emitSizeChange"
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
  limit: 10,
  pageSizes: () => [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: false,
  hidden: false,
})

const emit = defineEmits<{
  'update:page': [value: number]
  'update:limit': [value: number]
  pagination: [value: { page: number; limit: number }]
}>()

const normalizedTotal = computed(() => Number(props.total) || 0)
const currentPage = computed({
  get: () => props.page,
  set: (value: number) => emit('update:page', value),
})
const pageSize = computed({
  get: () => props.limit,
  set: (value: number) => emit('update:limit', value),
})

function emitPageChange(page: number) {
  emit('pagination', { page, limit: pageSize.value })
}

function emitSizeChange(limit: number) {
  const lastPage = Math.max(1, Math.ceil(normalizedTotal.value / limit))
  const page = Math.min(currentPage.value, lastPage)
  if (page !== currentPage.value) {
    emit('update:page', page)
  }
  emit('pagination', { page, limit })
}
</script>

<style scoped>
.mall-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
