<template>
  <div class="quick-entry-page mall-page">
    <div v-show="showSearch" class="search-bar">
      <el-form class="search-form" :inline="true" :model="search" @submit.prevent="handleSearch">
        <el-form-item label="入口名称">
          <el-input v-model="search.name" clearable placeholder="请输入入口名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="search.isEnabled" clearable placeholder="请选择状态">
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="action-bar">
      <div class="action-buttons">
        <el-button type="primary" @click="openCreateDialog">新增入口</el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="removeEntries()">批量删除</el-button>
      </div>
      <MallListTools v-model:showSearch="showSearch" @refresh="loadEntries" />
    </div>

    <div class="table-container">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="entries"
        stripe
        height="100%"
        @selection-change="selectedRows = $event"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="入口" min-width="180">
          <template #default="{ row }">
            <div class="entry-name">
              <StorageImage :src="row.icon" :width="40" :height="40" />
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="跳转地址" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">{{ row.target || '-' }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="isEnabled" label="状态" width="90">
          <template #default="{ row }">
            <el-switch v-model="row.isEnabled" @change="changeStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" width="170" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="removeEntries(row)">删除</el-button>
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
      v-model="dialogVisible"
      :title="form.id ? '编辑快捷入口' : '新增快捷入口'"
      width="560px"
      :close-on-click-modal="!submitting"
      :close-on-press-escape="!submitting"
      :show-close="!submitting"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="入口名称" prop="name">
          <el-input v-model="form.name" maxlength="32" placeholder="请输入入口名称" />
        </el-form-item>
        <el-form-item label="跳转地址" prop="target">
          <el-input v-model="form.target" maxlength="255" placeholder="例如 /pages/points-mall/list" />
        </el-form-item>
        <el-form-item label="入口图标" prop="icon">
          <StorageFileUpload v-model="form.icon" :file-type="imageTypes" :file-size="2" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="1" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="isEnabled">
          <el-switch v-model="form.isEnabled" />
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
import { reactive, ref, onMounted } from 'vue'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import MallListTools from '@/components/mall/MallListTools.vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import StorageFileUpload from '@/components/mall/StorageFileUpload.vue'
import StorageImage from '@/components/mall/StorageImage.vue'
import {
  createQuickEntry,
  deleteQuickEntry,
  queryQuickEntryList,
  updateQuickEntry,
  type QuickEntryRecord,
} from '@/api/mall/quickEntry'
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'
import { buildConditions } from '@/utils/query'

defineOptions({ name: 'QuickEntryPage' })

const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
const loading = ref(false)
const submitting = ref(false)
const showSearch = ref(true)
const dialogVisible = ref(false)
const tableRef = ref<TableInstance>()
const formRef = ref<FormInstance>()
const entries = ref<QuickEntryRecord[]>([])
const selectedRows = ref<QuickEntryRecord[]>([])
const search = reactive({ name: '', isEnabled: undefined as boolean | undefined })
const page = reactive({ current: 1, size: 10, total: 0 })
const form = reactive<QuickEntryRecord>(createEmptyForm())

const rules: FormRules = {
  name: [{ required: true, message: '请输入入口名称', trigger: 'blur' }],
  icon: [{ required: true, message: '请上传入口图标', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'change' }],
}

function createEmptyForm(): QuickEntryRecord {
  return { id: '', name: '', icon: '', type: 1, target: '', sort: 1, isEnabled: true, remark: '' }
}

async function loadEntries() {
  loading.value = true
  try {
    const response = await queryQuickEntryList({
      current: page.current,
      size: page.size,
      conditions_: buildConditions([
        { field: 'name', operator: 'like', value: search.name },
        { field: 'sort', operator: 'sort', value: 'asc' },
        { field: 'createTime', operator: 'sort', value: 'desc' },
      ]),
      isEnabled: search.isEnabled,
    })
    entries.value = response.data?.records || []
    page.total = Number(response.data?.total || 0)
    selectedRows.value = []
    tableRef.value?.clearSelection()
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.current = 1
  void loadEntries()
}

function handleReset() {
  search.name = ''
  search.isEnabled = undefined
  handleSearch()
}

function handlePageChange(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
  void loadEntries()
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row: QuickEntryRecord) {
  Object.assign(form, createEmptyForm(), row)
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
    if (form.id) await updateQuickEntry(form)
    else await createQuickEntry(form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await loadEntries()
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  } finally {
    submitting.value = false
  }
}

async function changeStatus(row: QuickEntryRecord) {
  const next = row.isEnabled
  try {
    await updateQuickEntry(row)
    ElMessage.success(`入口已${next ? '启用' : '禁用'}`)
  } catch (error) {
    row.isEnabled = !next
    ElMessage.error(getRequestErrorMessage(error) || '状态更新失败')
  }
}

async function removeEntries(row?: QuickEntryRecord) {
  const ids = row ? [row.id] : selectedRows.value.map((item) => item.id)
  if (!ids.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个快捷入口吗？`, '删除确认', { type: 'warning' })
    await deleteQuickEntry(ids)
    ElMessage.success('删除成功')
    await loadEntries()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '删除失败')
  }
}

onMounted(() => void loadEntries())
</script>

<style scoped>
.quick-entry-page {
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
.entry-name { display: flex; align-items: center; gap: 12px; }
</style>
