<template>
  <div class="mall-page merchant-spec-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" :model="search" class="mall-query-form" @submit.prevent="handleSearch">
        <el-form-item label="规格名称">
          <el-input v-model="search.specName" clearable placeholder="请输入规格名称" @clear="handleSearch" />
        </el-form-item>
        <el-form-item class="mall-query-actions">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" native-type="submit" icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
      <div class="mall-business-actions">
        <el-button type="primary" icon="Plus" @click="openSpecForm()">新增规格</el-button>
        <el-button type="danger" plain :disabled="selectedSpecs.length === 0" @click="removeSpecs()">
          {{ batchDeleteText }}
        </el-button>
      </div>
    </section>

    <section class="mall-table-panel">
      <el-table data-ym-table="r56"
        ref="tableRef"
        v-loading="loading"
        :data="specs"
        row-key="id"
        @selection-change="selectedSpecs = $event"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column label="规格名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <CopyableText :value="row.specName" label="规格名称" />
          </template>
        </el-table-column>
        <el-table-column label="选项数" width="90" align="center">
          <template #default="{ row }">{{ row.optCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="168" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="mp-time">{{ row.createTime || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="168" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="mp-time">{{ row.updateTime || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-button link type="primary" @click="openOptions(row)">规格选项</el-button>
              <el-button link type="primary" @click="openSpecForm(row)">编辑</el-button>
              <el-button link type="danger" @click="removeSpecs(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="mp-empty">
            <el-icon><Filter /></el-icon>
            <b>没有匹配的规格</b>
            <span>调整规格名称后重试</span>
          </div>
        </template>
      </el-table>

      <MallPagination
        :total="page.total"
        :page="page.current"
        :limit="page.size"
        @pagination="handlePageChange"
      />
    </section>

    <el-dialog
      v-model="specDialog.visible"
      width="500px"
      :close-on-click-modal="!specDialog.submitting"
      :close-on-press-escape="!specDialog.submitting"
      :show-close="!specDialog.submitting"
      @closed="resetSpecForm"
    >
      <template #header>
        <div class="mp-dialog-head">
          <span class="drawer-kicker">{{ specDialog.form.id ? 'EDIT' : 'CREATE' }}</span>
          <h2>{{ specDialog.form.id ? '编辑规格' : '新增规格' }}</h2>
        </div>
      </template>
      <el-form ref="specFormRef" :model="specDialog.form" :rules="specRules" label-position="top" class="mp-form-grid">
        <el-form-item label="规格名称" prop="specName" class="is-wide">
          <el-input v-model="specDialog.form.specName" maxlength="64" placeholder="例如颜色、尺寸" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="specDialog.submitting" @click="specDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="specDialog.submitting" @click="saveSpec">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="optionsDialog.visible" width="720px" class="mp-options-dialog" append-to-body>
      <template #header>
        <div class="mp-dialog-head">
          <span class="drawer-kicker">OPTIONS</span>
          <h2>{{ optionsDialog.spec?.specName || '' }} · 规格选项</h2>
        </div>
      </template>
      <div class="mp-options-action">
        <el-button type="primary" icon="Plus" @click="openOptionForm()">新增选项</el-button>
      </div>
      <el-table data-ym-table="r57" v-loading="optionsDialog.loading" :data="optionsDialog.options" row-key="id">
        <el-table-column label="选项名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.optName }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="168" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="mp-time">{{ row.createTime || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="168" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="mp-time">{{ row.updateTime || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-button link type="primary" @click="openOptionForm(row)">编辑</el-button>
              <el-button link type="danger" @click="removeOption(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="mp-empty">
            <el-icon><Filter /></el-icon>
            <b>暂无规格选项</b>
            <span>点击「新增选项」添加可选值</span>
          </div>
        </template>
      </el-table>
      <template #footer>
        <el-button type="primary" @click="optionsDialog.visible = false">完成</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="optionDialog.visible"
      width="500px"
      append-to-body
      :close-on-click-modal="!optionDialog.submitting"
      :close-on-press-escape="!optionDialog.submitting"
      :show-close="!optionDialog.submitting"
      @closed="resetOptionForm"
    >
      <template #header>
        <div class="mp-dialog-head">
          <span class="drawer-kicker">{{ optionDialog.form.id ? 'EDIT' : 'CREATE' }}</span>
          <h2>{{ optionDialog.form.id ? '编辑规格选项' : '新增规格选项' }}</h2>
        </div>
      </template>
      <el-form ref="optionFormRef" :model="optionDialog.form" :rules="optionRules" label-position="top" class="mp-form-grid">
        <el-form-item label="选项名称" prop="optName" class="is-wide">
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
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Filter } from '@element-plus/icons-vue'
import CopyableText from '@/components/mall/CopyableText.vue'
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
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'

defineOptions({ name: 'ProductSpecPage' })

const loading = ref(false)
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

const batchDeleteText = computed(() =>
  selectedSpecs.value.length ? `批量删除 (${selectedSpecs.value.length})` : '批量删除',
)

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
      specName: search.specName.trim(),
    })
    specs.value = response.data?.records || []
    page.total = Number(response.data?.total || 0)
    selectedSpecs.value = []
    tableRef.value?.clearSelection()
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
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
    ElMessage.success(specDialog.form.id ? '规格已保存' : '规格已新增')
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
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个规格吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
    })
    await deleteSpecDef(ids)
    ElMessage.success(`已删除 ${ids.length} 个规格`)
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
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
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
    ElMessage.success(optionDialog.form.id ? '选项已保存' : '选项已新增')
    optionDialog.visible = false
    await loadOptions()
    await loadSpecs()
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  } finally {
    optionDialog.submitting = false
  }
}

async function removeOption(row: SpecOptionDefinition) {
  try {
    await ElMessageBox.confirm(`确定删除规格选项“${row.optName}”吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
    })
    await deleteSpecOptDef([row.id])
    ElMessage.success('选项已删除')
    await loadOptions()
    await loadSpecs()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '删除失败')
  }
}

onMounted(() => void loadSpecs())
</script>