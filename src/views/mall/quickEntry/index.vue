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
          <el-button type="primary" native-type="submit" icon="Search">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="action-bar">
      <div class="action-buttons">
        <el-button v-if="showPreview" icon="View" @click="emit('preview')">预览效果</el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="removeEntries()">
          批量删除<span v-if="selectedRows.length"> ({{ selectedRows.length }})</span>
        </el-button>
        <el-button type="primary" icon="Plus" @click="openCreateDialog">新增入口</el-button>
      </div>
      <MallListTools v-model:showSearch="showSearch" @refresh="loadEntries" />
    </div>

    <div class="table-container">
      <div class="ho-table-intro" :class="{ 'is-warn': enabledCount > 10 }">
        <span><el-icon><Grid /></el-icon>App 首页最多展示前 10 个已启用入口，超出部分不会展示；排序数值越小越靠前。</span>
        <b>{{ enabledCount > 10 ? `已启用 ${enabledCount} · 超出 ${enabledCount - 10}` : `已启用 ${enabledCount} / 10` }}</b>
      </div>
      <div class="table-body">
        <el-table data-ym-table="r44"
          ref="tableRef"
          v-loading="loading"
          :data="entries"
          height="100%"
          @selection-change="selectedRows = $event"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="入口" min-width="180">
            <template #default="{ row }">
              <div class="ho-entry-cell">
                <HomeQuickIcon :entry="row" :size="38" />
                <div class="ho-entry-copy">
                  <b :title="row.name">{{ row.name }}</b>
                  <small>{{ row.icon ? '自定义图标' : '默认图标' }}</small>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="跳转目标" min-width="200">
            <template #default="{ row }">
              <span v-if="row.target" class="ho-target">
                <i />
                <span class="ho-target-path" :title="row.target">{{ row.target }}</span>
              </span>
              <span v-else class="ho-target-empty">按内置动作跳转</span>
            </template>
          </el-table-column>
          <el-table-column label="排序" min-width="64">
            <template #default="{ row }">
              <div class="ho-sort-cell">{{ row.sort }}</div>
            </template>
          </el-table-column>
          <el-table-column label="状态" min-width="100">
            <template #default="{ row }">
              <div class="ho-status-cell">
                <el-switch v-model="row.isEnabled" @change="changeStatus(row)" />
                <em>{{ row.isEnabled ? '启用' : '禁用' }}</em>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="150">
            <template #default="{ row }">
              <span class="ho-remark-cell">{{ row.remark || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" min-width="150">
            <template #default="{ row }">
              <div class="ho-time-cell">{{ formatDateTime(row.updateTime) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <div class="table-row-actions">
                <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                <el-button link type="danger" @click="removeEntries(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <div class="ho-empty">
              <el-icon :size="28"><Grid /></el-icon>
              <b>没有匹配的快捷入口</b>
              <span>调整名称或状态后重试</span>
            </div>
          </template>
        </el-table>
      </div>
    </div>

    <MallPagination
      :total="page.total"
      :page="page.current"
      :limit="page.size"
      @pagination="handlePageChange"
    />

    <el-dialog
      v-model="dialogVisible"
      class="quick-entry-dialog"
      width="620px"
      :close-on-click-modal="!submitting"
      :close-on-press-escape="!submitting"
      :show-close="!submitting"
      @closed="resetForm"
    >
      <template #header>
        <div class="quick-entry-dialog-head">
          <span class="drawer-kicker">QUICK ENTRY</span>
          <h2>{{ form.id ? '编辑快捷入口' : '新增快捷入口' }}</h2>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="入口名称" prop="name">
          <el-input v-model="form.name" maxlength="32" placeholder="请输入入口名称" />
        </el-form-item>
        <el-form-item>
          <template #label><span class="entry-form-label">入口图标 <small>选填</small></span></template>
          <div v-if="form.icon" class="entry-icon-field">
            <HomeQuickIcon :entry="form" :size="44" />
            <div class="entry-icon-copy">
              <el-button link type="primary" @click="form.icon = ''">移除图标</el-button>
              <small>已选择自定义图标</small>
            </div>
          </div>
          <div class="entry-icon-upload">
            <StorageFileUpload v-model="form.icon" :file-type="imageTypes" :file-size="2" />
            <span class="form-tip">支持 JPG / PNG / GIF / BMP / WebP / SVG，单张不超过 2MB</span>
          </div>
        </el-form-item>
        <el-form-item prop="target">
          <template #label><span class="entry-form-label">跳转目标 <small>选填</small></span></template>
          <el-input v-model="form.target" maxlength="255" clearable placeholder="留空（按内置动作跳转），例如 /pages/product/list" />
          <div class="form-tip">直接填写 App 实际页面路径，需以 /pages/ 开头，可带查询参数；留空时按内置动作跳转。</div>
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="form.sort" :min="1" :max="999" controls-position="right" />
            <div class="form-tip">数值越小越靠前，App 首页最多展示 10 个已启用入口</div>
          </el-form-item>
          <el-form-item label="状态">
            <div class="form-switch">
              <el-switch v-model="form.isEnabled" />
              <em>{{ form.isEnabled ? '启用' : '禁用' }}</em>
            </div>
          </el-form-item>
        </div>
        <el-form-item>
          <template #label><span class="entry-form-label">备注 <small>选填</small></span></template>
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="255" show-word-limit placeholder="补充入口用途或上线说明" />
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
import { Grid } from '@element-plus/icons-vue'
import MallListTools from '@/components/mall/MallListTools.vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import StorageFileUpload from '@/components/mall/StorageFileUpload.vue'
import HomeQuickIcon from '../components/HomeQuickIcon.vue'
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

withDefaults(defineProps<{ showPreview?: boolean }>(), { showPreview: false })
const emit = defineEmits<{ preview: [] }>()

const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
const loading = ref(false)
const submitting = ref(false)
const showSearch = ref(true)
const dialogVisible = ref(false)
const tableRef = ref<TableInstance>()
const formRef = ref<FormInstance>()
const entries = ref<QuickEntryRecord[]>([])
const selectedRows = ref<QuickEntryRecord[]>([])
const enabledCount = ref(0)
const search = reactive({ name: '', isEnabled: undefined as boolean | undefined })
const page = reactive({ current: 1, size: 10, total: 0 })
const form = reactive<QuickEntryRecord>(createEmptyForm())

const rules: FormRules = {
  name: [{ required: true, message: '请输入入口名称', trigger: 'blur' }],
  target: [
    {
      validator: (_rule, value, callback) => {
        const target = String(value || '').trim()
        if (target && !target.startsWith('/pages/')) {
          callback(new Error('跳转目标需以 /pages/ 开头，或留空按内置动作跳转'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  sort: [{ required: true, message: '请输入排序', trigger: 'change' }],
}

function createEmptyForm(): QuickEntryRecord {
  return { id: '', name: '', icon: '', type: 1, target: '', sort: 1, isEnabled: true, remark: '' }
}

function formatDateTime(value?: string) {
  return value ? value.slice(0, 19) : '—'
}

async function loadEntries() {
  loading.value = true
  try {
    const [response, enabledResponse] = await Promise.all([
      queryQuickEntryList({
        current: page.current,
        size: page.size,
        conditions_: buildConditions([
          { field: 'name', operator: 'like', value: search.name },
          { field: 'isEnabled', operator: 'eq', value: search.isEnabled },
          { field: 'sort', operator: 'sort', value: 'asc' },
          { field: 'createTime', operator: 'sort', value: 'desc' },
        ]),
      }),
      queryQuickEntryList({
        current: 1,
        size: 1,
        conditions_: buildConditions([{ field: 'isEnabled', operator: 'eq', value: true }]),
      }),
    ])
    entries.value = response.data?.records || []
    page.total = Number(response.data?.total || 0)
    enabledCount.value = Number(enabledResponse.data?.total || 0)
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
  form.sort = Math.max(0, ...entries.value.map((item) => Number(item.sort) || 0)) + 1
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
}

.action-bar { display: flex; justify-content: space-between; align-items: center; }
.action-buttons { display: flex; gap: 12px; }
.table-container { display: flex; min-height: 0; flex: 1; flex-direction: column; }
.table-body { min-height: 0; flex: 1; }

.ho-table-intro {
  display: flex;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  color: var(--mall-muted);
  border-bottom: 1px solid var(--mall-line);
  background: #fbfdfb;
  font-size: 11px;
  line-height: 1.5;
}

.ho-table-intro > span { display: flex; min-width: 0; align-items: center; gap: 6px; }
.ho-table-intro .el-icon { flex: 0 0 auto; color: var(--mall-brand); }
.ho-table-intro > b { flex: 0 0 auto; color: var(--mall-ink-secondary); font-size: 11px; font-weight: 600; }
.ho-table-intro.is-warn { color: #8f4b40; background: #f9e8e6; }
.ho-table-intro.is-warn .el-icon,
.ho-table-intro.is-warn > b { color: #be412b; }
.ho-entry-cell {
  display: flex;
  width: max-content;
  max-width: 100%;
  margin: 0 auto;
  align-items: center;
  gap: 10px;
  text-align: left;
}

.ho-entry-copy { display: flex; min-width: 0; flex-direction: column; gap: 2px; text-align: left; }
.ho-entry-copy b { overflow: hidden; color: var(--ym-ink); font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.ho-entry-copy small { color: var(--ym-muted); font-size: 11px; }

.ho-target {
  display: inline-flex;
  width: max-content;
  max-width: 100%;
  align-items: center;
  gap: 6px;
  color: var(--ym-ink-secondary);
  font-family: var(--ym-font-mono);
  font-size: 12px;
  text-align: left;
}

.ho-target i {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--ym-brand);
}

.ho-target-path { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ho-target-empty { display: block; width: max-content; margin: 0 auto; color: var(--ym-muted); font-size: 12px; }

.ho-sort-cell { width: max-content; margin: 0 auto; color: var(--ym-ink-secondary); font-size: 12px; text-align: left; }
.ho-status-cell { display: flex; width: max-content; margin: 0 auto; align-items: center; gap: 8px; text-align: left; }
.ho-status-cell em { color: var(--ym-muted); font-size: 12px; font-style: normal; }

.ho-remark-cell {
  display: block;
  width: max-content;
  max-width: 180px;
  margin: 0 auto;
  overflow: hidden;
  color: var(--ym-muted);
  font-size: 12px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ho-time-cell { display: flex; width: max-content; margin: 0 auto; align-items: center; color: var(--ym-ink-secondary); font-size: 12px; font-variant-numeric: tabular-nums; text-align: left; white-space: nowrap; }

.ho-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 32px 0; color: var(--ym-muted); }
.ho-empty b { color: var(--ym-ink); font-size: 14px; font-weight: 600; }
.ho-empty span { font-size: 12px; }

.quick-entry-dialog-head { display: flex; flex-direction: column; gap: 5px; }
.quick-entry-dialog-head .drawer-kicker { display: block; color: var(--mall-brand); font-family: var(--ym-font-mono); font-size: 10px; font-weight: 700; letter-spacing: .12em; }
.quick-entry-dialog-head h2 { margin: 0; color: var(--mall-ink); font-size: 19px; font-weight: 700; }
.entry-form-label small { color: var(--mall-muted); font-weight: 400; }
.entry-icon-field { display: flex; width: 100%; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--mall-line); border-radius: 7px; background: #fbfdfb; }
.entry-icon-copy { display: flex; min-width: 0; flex-direction: column; align-items: flex-start; gap: 3px; }
.entry-icon-copy small { color: var(--mall-muted); font-size: 11px; line-height: 1.4; }
.entry-icon-upload { display: flex; width: 100%; align-items: center; flex-wrap: wrap; gap: 8px 12px; }
.entry-icon-field + .entry-icon-upload { margin-top: 10px; }
.form-tip { color: var(--mall-muted); font-size: 12px; line-height: 1.5; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
.form-switch { display: flex; align-items: center; gap: 8px; }
.form-switch em { color: var(--ym-muted); font-size: 12px; font-style: normal; }
:global(.quick-entry-dialog .el-dialog__header) { margin-right: 0; padding-bottom: 16px; border-bottom: 1px solid var(--mall-line); }
:global(.quick-entry-dialog .el-dialog__footer) { padding-top: 16px; border-top: 1px solid var(--mall-line); }
</style>
