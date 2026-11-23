<template>
  <div class="mall-page platform-category-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" :model="search" class="mall-query-form" @submit.prevent="applyFilter">
        <el-form-item label="分类名称">
          <el-input v-model="search.name" clearable placeholder="请输入平台分类名称或编码" @clear="applyFilter" />
        </el-form-item>
        <el-form-item class="mall-query-actions">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" native-type="submit" icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
      <div class="mall-business-actions">
        <el-button type="danger" plain :disabled="selectedRows.length === 0" @click="removeCategories()">
          {{ batchDeleteText }}
        </el-button>
        <el-button type="primary" icon="Plus" @click="openCreateDialog">新增平台分类</el-button>
      </div>
    </section>

    <section class="mall-table-panel platform-category-panel">
      <div class="category-tree-bar">
        <div class="category-tree-summary">
          <span class="category-tree-title">平台分类树</span>
          <span class="category-tree-count">{{ summaryText }}</span>
        </div>
        <div class="category-tree-tools">
          <el-button size="small" :disabled="totalCount === 0" @click="expandAll">展开全部</el-button>
          <el-button size="small" :disabled="totalCount === 0" @click="collapseAll">折叠全部</el-button>
        </div>
      </div>

      <el-table data-ym-table="r39"
        ref="tableRef"
        v-loading="loading"
        :data="displayTree"
        row-key="id"
        :tree-props="{ children: 'children' }"
        :indent="18"
        class="category-tree-table"
        @expand-change="handleExpandChange"
        @selection-change="selectedRows = $event"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column
          label="平台分类名称"
          min-width="260"
          class-name="category-name-column"
          label-class-name="category-name-column"
        >
          <template #default="{ row }">
            <span :class="['category-name', { 'is-root': Number(row.level) === 1 }]">{{ row.name }}</span>
            <span v-if="row.children?.length" class="category-child-count">{{ row.children.length }}</span>
          </template>
        </el-table-column>
        <el-table-column label="分类图片" width="92" align="center">
          <template #default="{ row }">
            <StorageImage :src="row.image" :width="40" :height="40" :preview="Boolean(row.image)" />
          </template>
        </el-table-column>
        <el-table-column prop="code" label="分类编码" min-width="140" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" min-width="70" align="center" />
        <el-table-column prop="remark" label="备注" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="category-muted">{{ row.remark || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="category-muted">{{ row.updateTime || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
              <el-button link type="primary" @click="openCreateChildDialog(row)">新增子分类</el-button>
              <el-button link type="danger" @click="removeCategories(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :image-size="72" :description="emptyDescription" />
        </template>
      </el-table>
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      :close-on-click-modal="!submitting"
      :close-on-press-escape="!submitting"
      :show-close="!submitting"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="上级分类" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="parentOptions"
            :props="treeProps"
            node-key="id"
            check-strictly
            clearable
            placeholder="不选择表示一级分类"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" maxlength="64" placeholder="请输入平台分类名称" />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="form.code" maxlength="64" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="分类图片">
          <StorageFileUpload v-model="form.image" :file-type="imageTypes" :file-size="2" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="1" :max="999" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
      <p class="category-dialog-tip">树形一次展示全量分类，不提供分页；默认折叠，可用右上角「展开全部」查看层级。</p>
      <template #footer>
        <el-button :disabled="submitting" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import StorageFileUpload from '@/components/mall/StorageFileUpload.vue'
import StorageImage from '@/components/mall/StorageImage.vue'
import {
  createPlatformCategory,
  deletePlatformCategories,
  getPlatformCategoryDetail,
  getPlatformCategoryTree,
  updatePlatformCategory,
  type PlatformCategoryRecord,
} from '@/api/mall/platformCategory'
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'

defineOptions({ name: 'PlatformProductCategoryPage' })

type CategoryRecord = Omit<PlatformCategoryRecord, 'parentId' | 'children'> & {
  parentId: string | number | null
  children?: CategoryRecord[]
  disabled?: boolean
}

// 默认全折叠；改大该值可让页面首次进入时展开到指定层级
const DEFAULT_EXPAND_DEPTH = 0
const treeProps = { value: 'id', label: 'name', children: 'children', disabled: 'disabled' }
const imageTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const tableRef = ref<TableInstance>()
const formRef = ref<FormInstance>()
const categories = ref<CategoryRecord[]>([])
const categoryTree = ref<CategoryRecord[]>([])
const selectedRows = ref<CategoryRecord[]>([])
const search = reactive({ name: '' })
const activeKeyword = ref('')
// 用户手动展开的节点 key，刷新数据后据此还原展开状态；不参与渲染，故用普通 Set
const expandedKeys = new Set<string>()
let syncingExpansion = false
let seeded = false
const form = reactive<CategoryRecord>(createEmptyForm())

const rules: FormRules = {
  name: [{ required: true, message: '请输入平台分类名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入分类编码', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'change' }],
}

const parentOptions = computed(() => disableCurrentBranch(categoryTree.value, form.id))
const dialogTitle = computed(() => {
  if (form.id) return '编辑平台分类'
  return form.parentId ? '新增子分类' : '新增平台分类'
})
const displayTree = computed(() => {
  const keyword = activeKeyword.value.trim().toLowerCase()
  return keyword ? filterTree(categories.value, keyword) : categories.value
})
const totalCount = computed(() => countNodes(categories.value))
const rootCount = computed(() => categories.value.length)
const summaryText = computed(() => {
  const base = `共 ${totalCount.value} 个分类 · 一级 ${rootCount.value} 个`
  return activeKeyword.value.trim() ? `${base} · 命中 ${displayTree.value.length} 个一级节点` : base
})
const batchDeleteText = computed(() =>
  selectedRows.value.length ? `批量删除 (${selectedRows.value.length})` : '批量删除',
)
const emptyDescription = computed(() =>
  activeKeyword.value.trim() ? '没有匹配的平台分类' : '暂无平台分类数据',
)

watch(displayTree, () => {
  void nextTick(() => applyExpansion())
})

function createEmptyForm(): CategoryRecord {
  return { id: '', parentId: null, code: '', name: '', image: '', sort: 1, remark: '' }
}

function countNodes(nodes: CategoryRecord[]): number {
  return nodes.reduce((total, node) => total + 1 + (node.children?.length ? countNodes(node.children) : 0), 0)
}

function filterTree(nodes: CategoryRecord[], keyword: string): CategoryRecord[] {
  const matched: CategoryRecord[] = []
  nodes.forEach((node) => {
    const hit =
      String(node.name || '').toLowerCase().includes(keyword) ||
      String(node.code || '').toLowerCase().includes(keyword)
    const children = node.children?.length ? filterTree(node.children, keyword) : []
    if (hit) {
      matched.push({ ...node, children: node.children?.length ? node.children : undefined })
    } else if (children.length) {
      matched.push({ ...node, children })
    }
  })
  return matched
}

function seedExpandedKeys() {
  if (seeded) return
  seeded = true
  if (DEFAULT_EXPAND_DEPTH <= 0) return
  const walk = (nodes: CategoryRecord[], level: number) => {
    nodes.forEach((node) => {
      if (!node.children?.length) return
      if (level <= DEFAULT_EXPAND_DEPTH) expandedKeys.add(String(node.id))
      walk(node.children, level + 1)
    })
  }
  walk(categories.value, 1)
}

// 按记录下来的展开 key 还原；搜索时临时全部展开，不改动记录，清空搜索后自动回到原状态
function applyExpansion() {
  const searching = Boolean(activeKeyword.value.trim())
  syncingExpansion = true
  const walk = (nodes: CategoryRecord[]) => {
    nodes.forEach((node) => {
      if (!node.children?.length) return
      tableRef.value?.toggleRowExpansion(node, searching || expandedKeys.has(String(node.id)))
      walk(node.children)
    })
  }
  walk(displayTree.value)
  syncingExpansion = false
}

function handleExpandChange(row: CategoryRecord, expanded: boolean) {
  if (syncingExpansion) return
  const key = String(row.id)
  if (expanded) expandedKeys.add(key)
  else expandedKeys.delete(key)
}

function expandAll() {
  const walk = (nodes: CategoryRecord[]) => {
    nodes.forEach((node) => {
      if (!node.children?.length) return
      expandedKeys.add(String(node.id))
      walk(node.children)
    })
  }
  walk(displayTree.value)
  applyExpansion()
}

function collapseAll() {
  expandedKeys.clear()
  applyExpansion()
}

function disableCurrentBranch(nodes: CategoryRecord[], currentId: string, parentBlocked = false): CategoryRecord[] {
  return nodes.map((node) => {
    const blocked = parentBlocked || Boolean(currentId && String(node.id) === String(currentId))
    return {
      ...node,
      disabled: blocked,
      children: node.children ? disableCurrentBranch(node.children, currentId, blocked) : undefined,
    }
  })
}

async function loadCategories() {
  loading.value = true
  try {
    const response = await getPlatformCategoryTree()
    const tree = (response.data || []) as CategoryRecord[]
    categories.value = tree
    categoryTree.value = tree
    seedExpandedKeys()
    selectedRows.value = []
    tableRef.value?.clearSelection()
  } finally {
    loading.value = false
  }
}

function applyFilter() {
  activeKeyword.value = search.name
}

function handleReset() {
  search.name = ''
  activeKeyword.value = ''
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

function openCreateChildDialog(row: CategoryRecord) {
  resetForm()
  Object.assign(form, createEmptyForm(), { parentId: row.id })
  dialogVisible.value = true
}

async function openEditDialog(row: CategoryRecord) {
  const response = await getPlatformCategoryDetail(row.id)
  Object.assign(form, createEmptyForm(), response.data, {
    parentId: Number(response.data.parentId) === 0 ? null : response.data.parentId,
  })
  dialogVisible.value = true
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  formRef.value?.clearValidate()
}

async function submitForm() {
  if (!formRef.value || submitting.value) return
  submitting.value = true
  try {
    await formRef.value.validate()
    const payload = {
      parentId: form.parentId || 0,
      code: form.code.trim(),
      name: form.name.trim(),
      image: form.image || '',
      sort: form.sort,
      remark: form.remark.trim(),
    }
    if (form.id) await updatePlatformCategory({ ...payload, id: form.id })
    else await createPlatformCategory(payload)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await loadCategories()
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  } finally {
    submitting.value = false
  }
}

async function removeCategories(row?: CategoryRecord) {
  const ids = row ? [row.id] : selectedRows.value.map((item) => item.id)
  if (!ids.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个平台分类吗？`, '删除确认', { type: 'warning' })
    await deletePlatformCategories(ids)
    ElMessage.success('删除成功')
    await loadCategories()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '删除失败')
  }
}

onMounted(() => void loadCategories())
</script>

<style scoped>
.platform-category-panel {
  display: flex;
  flex-direction: column;
}

.category-tree-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--mall-line);
  background: #f8faf8;
}

.category-tree-summary {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 10px;
}

.category-tree-title {
  color: var(--mall-ink);
  font-size: 13px;
  font-weight: 700;
}

.category-tree-count {
  color: var(--mall-muted);
  font-size: 12px;
}

.category-tree-tools {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.mall-page .category-tree-table :deep(td.category-name-column .cell),
.mall-page .category-tree-table :deep(th.category-name-column .cell) {
  display: block;
  overflow: hidden;
  text-align: left !important;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-tree-table :deep(.el-table__expand-icon) {
  color: var(--mall-brand);
}

.category-name {
  color: var(--mall-ink-secondary);
  font-size: 13px;
}

.category-name.is-root {
  color: var(--mall-ink);
  font-weight: 700;
}

.category-child-count {
  display: inline-flex;
  min-width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  padding: 0 5px;
  color: var(--mall-muted);
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  background: #eef2ef;
}

.category-muted {
  color: var(--mall-muted);
}

.category-dialog-tip {
  margin: 0 0 4px;
  color: var(--mall-muted);
  font-size: 12px;
  line-height: 1.6;
}
</style>
