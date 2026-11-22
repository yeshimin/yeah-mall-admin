<template>
  <div v-if="!hidden" class="mall-pagination" :class="{ 'is-admin': variant === 'admin' }">
    <span v-if="variant === 'admin'" class="mall-pagination-summary">
      第 {{ currentPage }}/{{ totalPages }} 页
    </span>
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :background="background"
      :layout="variant === 'admin' ? 'prev, pager, next, sizes' : layout"
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
  variant?: 'default' | 'admin'
}>(), {
  page: 1,
  limit: 10,
  pageSizes: () => [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: false,
  hidden: false,
  variant: 'default',
})

const emit = defineEmits<{
  'update:page': [value: number]
  'update:limit': [value: number]
  pagination: [value: { page: number; limit: number }]
}>()

const normalizedTotal = computed(() => Number(props.total) || 0)
const totalPages = computed(() => Math.max(1, Math.ceil(normalizedTotal.value / props.limit)))
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

.mall-pagination.is-admin {
  min-height: 48px;
  align-items: center;
  gap: 5px;
  box-sizing: border-box;
  padding: 7px 12px;
}

.mall-pagination.is-admin .mall-pagination-summary {
  margin-right: 8px;
  color: var(--ym-muted, #65726a);
  font-size: 12px;
  line-height: 17px;
}

.mall-pagination.is-admin :deep(.el-pagination) {
  gap: 5px;
  padding: 0;
}

.mall-pagination.is-admin :deep(.el-pagination > *) {
  margin: 0;
}

.mall-pagination.is-admin :deep(.btn-prev),
.mall-pagination.is-admin :deep(.btn-next),
.mall-pagination.is-admin :deep(.el-pager li) {
  box-sizing: border-box;
  width: 27px;
  min-width: 27px;
  height: 30px;
  margin: 0;
  padding: 1px 6px;
  color: var(--ym-ink, #17251f);
  border: 1px solid var(--ym-line, #dce4de);
  border-radius: 5px;
  background: #fff;
  font-size: 12px;
  font-weight: 400;
}

.mall-pagination.is-admin :deep(.btn-prev .el-icon),
.mall-pagination.is-admin :deep(.btn-next .el-icon) {
  font-size: 16px;
}

.mall-pagination.is-admin :deep(.btn-prev:disabled),
.mall-pagination.is-admin :deep(.btn-next:disabled) {
  color: var(--ym-ink, #17251f);
  border-color: var(--ym-line, #dce4de);
  background: #fff;
}

.mall-pagination.is-admin :deep(.el-pager li.is-active) {
  color: #fff;
  border-color: var(--ym-brand, #24634f);
  background: var(--ym-brand, #24634f);
}

.mall-pagination.is-admin :deep(.el-pagination__sizes) {
  width: 67px;
  margin-left: 6px;
}

.mall-pagination.is-admin :deep(.el-pagination__sizes .el-select) {
  position: relative;
  width: 67px;
}

.mall-pagination.is-admin :deep(.el-pagination__sizes .el-select__wrapper) {
  min-height: 30px;
  box-sizing: border-box;
  padding: 0 0 0 4px;
  border-radius: 5px;
  box-shadow: 0 0 0 1px var(--ym-line, #dce4de) inset;
  font-size: 12px;
}

.mall-pagination.is-admin :deep(.el-pagination__sizes .el-select__selected-item) {
  color: var(--ym-ink, #17251f);
  font-size: 12px;
}

.mall-pagination.is-admin :deep(.el-pagination__sizes .el-select__suffix) {
  display: none;
}

.mall-pagination.is-admin :deep(.el-pagination__sizes .el-select::after) {
  position: absolute;
  top: 50%;
  right: 8px;
  width: 5px;
  height: 5px;
  border-right: 1px solid var(--ym-ink, #17251f);
  border-bottom: 1px solid var(--ym-ink, #17251f);
  content: '';
  pointer-events: none;
  transform: translateY(-65%) rotate(45deg);
}

:global(#app .mall-pagination.is-admin .el-select__wrapper) {
  border-radius: 5px;
}
</style>
