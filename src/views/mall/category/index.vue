<template>
  <div class="mall-page merchant-category-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" :model="search" class="mall-query-form" @submit.prevent="applyFilter">
        <el-form-item label="店铺分类名称">
          <el-input v-model="search.name" clearable placeholder="请输入店铺分类名称或编码" @clear="applyFilter" />
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
        <el-button type="primary" icon="Plus" @click="openCreateDialog">新增店铺分类</el-button>
      </div>
    </section>

    <section class="mall-table-panel merchant-category-panel">
      <div class="mp-table-toolbar">
        <div>
          <span class="shelf-mark"></span>
          <b>店铺分类树</b>
          <small>共 {{ totalCount }} 个分类 · 一级 {{ rootCount }} 个 · 最多两级，商品挂载二级分类</small>
        </div>
        <div class="ptc-tools">
          <el-button size="small" :disabled="totalCount === 0" @click="expandAll">展开全部</el-button>
          <el-button size="small" :disabled="totalCount === 0" @click="collapseAll">折叠全部</el-button>
        </div>
      </div>

      <el-table data-ym-table="r1"
        ref="tableRef"
        v-loading="loading"
        :data="displayTree"
        row-key="id"
        :tree-props="{ children: 'children' }"
        :indent="18"
        class="ptc-table"
        @expand-change="handleExpandChange"
        @selection-change="selectedRows = $event"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column
          label="店铺分类名称"
          min-width="250"
          class-name="ptc-name-column"
          label-class-name="ptc-name-column"
        >
          <template #default="{ row }">
            <span :class="['ptc-name', { 'is-root': Number(row.level) === 1 }]">{{ row.name }}</span>
            <em v-if="row.children?.length" class="ptc-chip">{{ row.children.length }}</em>
          </template>
        </el-table-column>
        <el-table-column label="分类图片" width="92" align="center">
          <template #default="{ row }">
            <span :class="['ptc-thumb', `t${Number(row.level) || 1}`]">
              <StorageImage v-if="row.image" :src="row.image" width="100%" height="100%" />
              <em v-else>{{ String(row.name || '').slice(0, 1) }}</em>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="分类编码" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <CopyableText :value="row.code" label="分类编码" />
          </template>
        </el-table-column>
        <el-table-column label="层级" min-width="70" align="center">
          <template #default="{ row }">{{ Number(row.level) === 1 ? '一级' : '二级' }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" min-width="64" align="center" />
        <el-table-column label="备注" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="ptc-muted">{{ row.remark || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="ptc-muted">{{ row.updateTime || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="104" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="removeCategories(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="mp-empty">
            <el-icon><Filter /></el-icon>
            <b>没有匹配的店铺分类</b>
            <span>调整分类名称或编码后重试</span>
          </div>
        </template>
      </el-table>
    </section>

    <el-dialog
      v-model="dialogVisible"
      width="560px"
      :close-on-click-modal="!submitting"
      :close-on-press-escape="!submitting"
      :show-close="!submitting"
      @closed="resetForm"
    >
      <template #header>
        <div class="mp-dialog-head">
          <span class="drawer-kicker">{{ form.id ? 'EDIT' : 'CREATE' }}</span>
          <h2>{{ form.id ? '编辑店铺分类' : '新增店铺分类' }}</h2>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="mp-form-grid">
        <el-form-item label="上级分类" prop="parentId" class="is-wide">
          <el-select v-model="form.parentId" clearable placeholder="不选择表示一级分类" style="width: 100%">
            <el-option v-for="node in parentOptions" :key="node.id" :label="node.name" :value="node.id" />
          </el-select>
          <span class="mp-form-tip">店铺分类最多两级；商品只能挂载到二级分类。</span>
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" maxlength="64" placeholder="请输入店铺分类名称" />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="form.code" maxlength="64" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="分类图片" class="is-wide">
          <StorageFileUpload
            v-model="form.image"
            :file-type="imageTypes"
            :file-size="2"
            upload-scope="merchant"
            empty-text="上传文件"
            filled-text="更换图片"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="1" :max="999" />
        </el-form-item>
        <el-form-item prop="remark" class="is-wide">
          <template #label>备注 <small>{{ form.remark.length }}/255</small></template>
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            maxlength="255"
            placeholder="选填分类说明"
          />
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
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Filter } from '@element-plus/icons-vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import StorageFileUpload from '@/components/mall/StorageFileUpload.vue'
import StorageImage from '@/components/mall/StorageImage.vue'
import {
  createCategory,
  deleteCategory,
  getCategoryDetail,
  getCategoryTree,
  updateCategory,
  type ProductCategoryRecord,
} from '@/api/mall/category'
import { getCurrentShop } from '@/utils/shop'
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'

defineOptions({ name: 'ShopProductCategoryPage' })

type CategoryRecord = Omit<ProductCategoryRecord, 'parentId' | 'children'> & {
  parentId: string | number | null
  children?: CategoryRecord[]
}

// 原型首次进入展开到一级分类，改大该值可展开到更深层级
const DEFAULT_EXPAND_DEPTH = 1
const imageTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const tableRef = ref<TableInstance>()
const formRef = ref<FormInstance>()
const categories = ref<CategoryRecord[]>([])
const selectedRows = ref<CategoryRecord[]>([])
const search = reactive({ name: '' })
const activeKeyword = ref('')
// 用户手动展开的节点 key，刷新数据后据此还原展开状态；不参与渲染，故用普通 Set
const expandedKeys = new Set<string>()
let syncingExpansion = false
let seeded = false
const form = reactive<CategoryRecord>(createEmptyForm())

const rules: FormRules = {
  name: [{ required: true, message: '请输入店铺分类名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入分类编码', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'change' }],
}

const parentOptions = computed(() =>
  categories.value.filter((node) => String(node.id) !== String(form.id)),
)
const displayTree = computed(() => {
  const keyword = activeKeyword.value.trim().toLowerCase()
  return keyword ? filterTree(categories.value, keyword) : categories.value
})
const totalCount = computed(() => countNodes(categories.value))
const rootCount = computed(() => categories.value.length)
const batchDeleteText = computed(() =>
  selectedRows.value.length ? `批量删除 (${selectedRows.value.length})` : '批量删除',
)

watch(displayTree, () => {
  void nextTick(() => applyExpansion())
})

function createEmptyForm(): CategoryRecord {
  return { id: '', parentId: null, code: '', name: '', image: '', sort: 1, remark: '' }
}

function currentShopId() {
  return getCurrentShop()?.id || ''
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

async function loadCategories() {
  const shopId = currentShopId()
  if (!shopId) {
    categories.value = []
    return
  }
  loading.value = true
  try {
    const response = await getCategoryTree({ shopId })
    categories.value = (response.data || []) as CategoryRecord[]
    seedExpandedKeys()
    selectedRows.value = []
    tableRef.value?.clearSelection()
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
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

async function openEditDialog(row: CategoryRecord) {
  try {
    const response = await getCategoryDetail(row.id)
    Object.assign(form, createEmptyForm(), response.data, {
      parentId: Number(response.data.parentId) === 0 ? null : response.data.parentId,
    })
    dialogVisible.value = true
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  }
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
      image: form.image || '',
      sort: form.sort,
      remark: form.remark.trim(),
    }
    if (form.id) await updateCategory({ ...payload, id: form.id })
    else await createCategory(payload)
    ElMessage.success(form.id ? '店铺分类已保存' : '店铺分类已新增')
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
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个店铺商品分类吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
    })
    await deleteCategory(ids)
    ElMessage.success('分类已删除')
    await loadCategories()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '删除失败')
  }
}

onMounted(() => void loadCategories())
</script>

<style scoped>
.merchant-category-panel {
  display: flex;
  flex-direction: column;
}
</style>