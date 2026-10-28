<template>
  <div class="spec-page mall-page">
    <div v-show="showSearch" class="search-bar">
      <el-form class="search-form" :inline="true" :model="search" @submit.prevent="handleSearch">
        <el-form-item label="规格名称">
          <el-input v-model="search.specName" clearable placeholder="请输入规格名称" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="action-bar">
      <div class="action-buttons">
        <el-button type="primary" @click="openSpecForm()">新增规格</el-button>
        <el-button type="danger" :disabled="selectedSpecs.length === 0" @click="removeSpecs()">批量删除</el-button>
      </div>
      <MallListTools v-model:showSearch="showSearch" @refresh="loadSpecs" />
    </div>

    <div class="table-container">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="specs"
        stripe
        height="100%"
        @selection-change="selectedSpecs = $event"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="specName" label="规格名称" min-width="180" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column prop="updateTime" label="更新时间" width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-button link type="primary" @click="openOptions(row)">规格选项</el-button>
              <el-button link type="primary" @click="openSpecForm(row)">编辑</el-button>
              <el-button link type="danger" @click="removeSpecs(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <MallPagination
      :total="page.total"
      :page="page.current"
      :limit="page.size"
      @pagination="handlePageChange"
    />

    <el-dialog
      v-model="specDialog.visible"
      :title="specDialog.form.id ? '编辑规格' : '新增规格'"
      width="500px"
      :close-on-click-modal="!specDialog.submitting"
      @closed="resetSpecForm"
    >
      <el-form ref="specFormRef" :model="specDialog.form" :rules="specRules" label-width="96px">
        <el-form-item label="规格名称" prop="specName">
          <el-input v-model="specDialog.form.specName" maxlength="64" placeholder="例如颜色、尺寸" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="specDialog.submitting" @click="specDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="specDialog.submitting" @click="saveSpec">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="optionsDialog.visible" :title="`${optionsDialog.spec?.specName || ''} · 规格选项`" width="720px">
      <div class="options-action">
        <el-button type="primary" @click="openOptionForm()">新增选项</el-button>
      </div>
      <el-table v-loading="optionsDialog.loading" :data="optionsDialog.options" stripe>
        <el-table-column prop="optName" label="选项名称" min-width="180" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column prop="updateTime" label="更新时间" width="170" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-button link type="primary" @click="openOptionForm(row)">编辑</el-button>
              <el-button link type="danger" @click="removeOption(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog
      v-model="optionDialog.visible"
      :title="optionDialog.form.id ? '编辑规格选项' : '新增规格选项'"
      width="500px"
      append-to-body
      :close-on-click-modal="!optionDialog.submitting"
      @closed="resetOptionForm"
    >
      <el-form ref="optionFormRef" :model="optionDialog.form" :rules="optionRules" label-width="96px">
        <el-form-item label="选项名称" prop="optName">
          <el-input v-model="optionDialog.form.optName" maxlength="64" placeholder="请输入选项名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="optionDialog.submitting" @click="optionDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="optionDialog.submitting" @click="saveOption">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import MallListTools from '@/components/mall/MallListTools.vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import {
  createSpecDef,
  createSpecOptDef,
  deleteSpecDef,
  deleteSpecOptDef,
  listSpecDef,
  listSpecOptDef,
  updateSpecDef,
  updateSpecOptDef,
  type SpecDefinition,
  type SpecOptionDefinition,
} from '@/api/mall/specDef'
import { getCurrentShop } from '@/utils/shop'
import { buildConditions } from '@/utils/query'
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'

defineOptions({ name: 'ProductSpecPage' })

const loading = ref(false)
const showSearch = ref(true)
const tableRef = ref<TableInstance>()
const specFormRef = ref<FormInstance>()
const optionFormRef = ref<FormInstance>()
const specs = ref<SpecDefinition[]>([])
const selectedSpecs = ref<SpecDefinition[]>([])
const search = reactive({ specName: '' })
const page = reactive({ current: 1, size: 10, total: 0 })
const specDialog = reactive({ visible: false, submitting: false, form: { id: '', specName: '' } })
const optionsDialog = reactive({
  visible: false,
  loading: false,
  spec: null as SpecDefinition | null,
  options: [] as SpecOptionDefinition[],
})
const optionDialog = reactive({ visible: false, submitting: false, form: { id: '', optName: '' } })

const specRules: FormRules = {
  specName: [{ required: true, message: '请输入规格名称', trigger: 'blur' }],
}
const optionRules: FormRules = {
  optName: [{ required: true, message: '请输入选项名称', trigger: 'blur' }],
}

function shopId() {
  return getCurrentShop()?.id || ''
}

async function loadSpecs() {
  const currentShopId = shopId()
  if (!currentShopId) {
    specs.value = []
    page.total = 0
    return
  }
  loading.value = true
  try {
    const response = await listSpecDef({
      shopId: currentShopId,
      current: page.current,
      size: page.size,
      conditions_: buildConditions([
        { field: 'specName', operator: 'like', value: search.specName },
        { field: 'createTime', operator: 'sort', value: 'desc' },
      ]),
    })
    specs.value = response.data?.records || []
    page.total = Number(response.data?.total || 0)
    selectedSpecs.value = []
    tableRef.value?.clearSelection()
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.current = 1
  void loadSpecs()
}

function handleReset() {
  search.specName = ''
  handleSearch()
}

function handlePageChange(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
  void loadSpecs()
}

function openSpecForm(row?: SpecDefinition) {
  Object.assign(specDialog.form, { id: row?.id || '', specName: row?.specName || '' })
  specDialog.visible = true
}

function resetSpecForm() {
  Object.assign(specDialog.form, { id: '', specName: '' })
  specFormRef.value?.clearValidate()
}

async function saveSpec() {
  if (!specFormRef.value || specDialog.submitting) return
  const currentShopId = shopId()
  if (!currentShopId) {
    ElMessage.warning('请先选择店铺')
    return
  }
  specDialog.submitting = true
  try {
    await specFormRef.value.validate()
    const specName = specDialog.form.specName.trim()
    if (specDialog.form.id) await updateSpecDef({ id: specDialog.form.id, specName })
    else await createSpecDef({ shopId: currentShopId, specName })
    ElMessage.success('保存成功')
    specDialog.visible = false
    await loadSpecs()
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  } finally {
    specDialog.submitting = false
  }
}

async function removeSpecs(row?: SpecDefinition) {
  const ids = row ? [row.id] : selectedSpecs.value.map((item) => item.id)
  if (!ids.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个规格吗？`, '删除确认', { type: 'warning' })
    await deleteSpecDef(ids)
    ElMessage.success('删除成功')
    await loadSpecs()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '删除失败')
  }
}

async function openOptions(spec: SpecDefinition) {
  optionsDialog.spec = spec
  optionsDialog.visible = true
  await loadOptions()
}

async function loadOptions() {
  const currentShopId = shopId()
  if (!currentShopId || !optionsDialog.spec) return
  optionsDialog.loading = true
  try {
    const response = await listSpecOptDef({ shopId: currentShopId, specId: optionsDialog.spec.id })
    optionsDialog.options = response.data || []
  } finally {
    optionsDialog.loading = false
  }
}

function openOptionForm(row?: SpecOptionDefinition) {
  Object.assign(optionDialog.form, { id: row?.id || '', optName: row?.optName || '' })
  optionDialog.visible = true
}

function resetOptionForm() {
  Object.assign(optionDialog.form, { id: '', optName: '' })
  optionFormRef.value?.clearValidate()
}

async function saveOption() {
  if (!optionFormRef.value || optionDialog.submitting || !optionsDialog.spec) return
  const currentShopId = shopId()
  if (!currentShopId) {
    ElMessage.warning('请先选择店铺')
    return
  }
  optionDialog.submitting = true
  try {
    await optionFormRef.value.validate()
    const optName = optionDialog.form.optName.trim()
    if (optionDialog.form.id) {
      await updateSpecOptDef({ shopId: currentShopId, id: optionDialog.form.id, optName })
    } else {
      await createSpecOptDef({ shopId: currentShopId, specId: optionsDialog.spec.id, optName })
    }
    ElMessage.success('保存成功')
    optionDialog.visible = false
    await loadOptions()
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  } finally {
    optionDialog.submitting = false
  }
}

async function removeOption(row: SpecOptionDefinition) {
  try {
    await ElMessageBox.confirm(`确定删除规格选项“${row.optName}”吗？`, '删除确认', { type: 'warning' })
    await deleteSpecOptDef([row.id])
    ElMessage.success('删除成功')
    await loadOptions()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '删除失败')
  }
}

onMounted(() => void loadSpecs())
</script>

<style scoped>
.spec-page {
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
.options-action { display: flex; justify-content: flex-end; margin-bottom: 16px; }
</style>
