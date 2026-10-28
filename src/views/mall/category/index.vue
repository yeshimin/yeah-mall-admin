<template>
  <div class="category-page mall-page">
    <div v-show="showSearch" class="search-bar">
      <el-form class="search-form" :inline="true" :model="search" @submit.prevent="handleSearch">
        <el-form-item label="分类名称">
          <el-input v-model="search.name" clearable placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="action-bar">
      <div class="action-buttons">
        <el-button type="primary" @click="openCreateDialog">新增分类</el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="removeCategories()">批量删除</el-button>
      </div>
      <MallListTools v-model:showSearch="showSearch" @refresh="refreshPage" />
    </div>

    <div class="table-container">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="categories"
        row-key="id"
        stripe
        height="100%"
        default-expand-all
        :tree-props="{ children: 'children' }"
        @selection-change="selectedRows = $event"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="分类名称" min-width="180" />
        <el-table-column prop="code" label="分类编码" min-width="150" show-overflow-tooltip />
        <el-table-column prop="level" label="层级" width="80" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" width="170" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="removeCategories(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <MallPagination
      v-if="search.name && page.total > 0"
      :total="page.total"
      :page="page.current"
      :limit="page.size"
      @pagination="handlePageChange"
    />

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑分类' : '新增分类'"
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
          <el-input v-model="form.name" maxlength="64" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="form.code" maxlength="64" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="1" :max="999" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="submitting" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import MallListTools from '@/components/mall/MallListTools.vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import {
  createCategory,
  deleteCategory,
  getCategoryDetail,
  getCategoryTree,
  queryCategoryList,
  updateCategory,
  type ProductCategoryRecord,
} from '@/api/mall/category'
import { getCurrentShop } from '@/utils/shop'
import { buildConditions } from '@/utils/query'
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'

defineOptions({ name: 'ProductCategoryPage' })

type CategoryRecord = Omit<ProductCategoryRecord, 'parentId' | 'children'> & {
  parentId: string | number | null
  children?: CategoryRecord[]
  disabled?: boolean
}

const treeProps = { value: 'id', label: 'name', children: 'children', disabled: 'disabled' }
const loading = ref(false)
const submitting = ref(false)
const showSearch = ref(true)
const dialogVisible = ref(false)
const tableRef = ref<TableInstance>()
const formRef = ref<FormInstance>()
const categories = ref<CategoryRecord[]>([])
const categoryTree = ref<CategoryRecord[]>([])
const selectedRows = ref<CategoryRecord[]>([])
const search = reactive({ name: '' })
const page = reactive({ current: 1, size: 10, total: 0 })
const form = reactive<CategoryRecord>(createEmptyForm())

const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入分类编码', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'change' }],
}

const parentOptions = computed(() => disableCurrentBranch(categoryTree.value, form.id))

function createEmptyForm(): CategoryRecord {
  return { id: '', parentId: null, code: '', name: '', sort: 1, remark: '' }
}

function currentShopId() {
  return getCurrentShop()?.id || ''
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

async function loadCategoryTree() {
  const shopId = currentShopId()
  if (!shopId) {
    categoryTree.value = []
    return
  }
  const response = await getCategoryTree({ shopId })
  categoryTree.value = response.data || []
}

async function loadCategories() {
  const shopId = currentShopId()
  if (!shopId) {
    categories.value = []
    page.total = 0
    return
  }

  loading.value = true
  try {
    if (search.name.trim()) {
      const response = await queryCategoryList({
        shopId,
        current: page.current,
        size: page.size,
        conditions_: buildConditions([
          { field: 'name', operator: 'like', value: search.name.trim() },
          { field: 'sort', operator: 'sort', value: 'asc' },
        ]),
      })
      categories.value = response.data?.records || []
      page.total = Number(response.data?.total || 0)
    } else {
      await loadCategoryTree()
      categories.value = categoryTree.value
      page.total = 0
    }
    selectedRows.value = []
    tableRef.value?.clearSelection()
  } finally {
    loading.value = false
  }
}

async function refreshPage() {
  await loadCategoryTree()
  await loadCategories()
}

function handleSearch() {
  page.current = 1
  void loadCategories()
}

function handleReset() {
  search.name = ''
  handleSearch()
}

function handlePageChange(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
  void loadCategories()
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

async function openEditDialog(row: CategoryRecord) {
  const response = await getCategoryDetail(row.id)
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
  const shopId = currentShopId()
  if (!shopId) {
    ElMessage.warning('请先选择店铺')
    return
  }

  submitting.value = true
  try {
    await formRef.value.validate()
    const payload = {
      shopId,
      parentId: form.parentId || 0,
      code: form.code.trim(),
      name: form.name.trim(),
      sort: form.sort,
      remark: form.remark.trim(),
    }
    if (form.id) await updateCategory({ ...payload, id: form.id })
    else await createCategory(payload)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await refreshPage()
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
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个商品分类吗？`, '删除确认', { type: 'warning' })
    await deleteCategory(ids)
    ElMessage.success('删除成功')
    await refreshPage()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '删除失败')
  }
}

onMounted(() => void refreshPage())
</script>

<style scoped>
.category-page {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #fff;
}

.search-bar { margin-bottom: 20px; }
.action-bar { display: flex; justify-content: space-between; align-items: center; }
.action-buttons { display: flex; gap: 12px; }
.table-container { flex: 1; min-height: 0; margin-top: 20px; }
</style>
