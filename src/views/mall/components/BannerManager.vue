<template>
  <div class="banner-page mall-page">
    <div v-if="scope === 'platform'" v-show="showSearch" class="search-bar">
      <el-form class="search-form" :inline="true" :model="search" @submit.prevent="handleSearch">
        <el-form-item label="跳转目标">
          <el-input v-model="search.target" clearable placeholder="搜索 /pages/ 站内路径" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="search.isEnabled" clearable placeholder="全部状态" style="width: 130px">
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
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="removeBanners()">
          批量删除<span v-if="selectedRows.length"> ({{ selectedRows.length }})</span>
        </el-button>
        <el-button type="primary" icon="Plus" @click="openForm()">新增 Banner</el-button>
      </div>
      <MallListTools v-model:showSearch="showSearch" :search="scope === 'platform'" @refresh="loadBanners" />
    </div>

    <div class="table-container">
      <div v-if="scope === 'platform'" class="ho-table-intro">
        <span><el-icon><View /></el-icon>App 首屏全宽轮播已启用 Banner，按排序从小到大展示；建议保持 3–5 张，图片比例为 15:8。</span>
        <b>已启用 {{ enabledCount }} / {{ bannerTotal }}</b>
      </div>
      <div class="table-body">
        <el-table data-ym-table="r2"
          ref="tableRef"
          v-loading="loading"
          :data="banners"
          height="100%"
          @selection-change="selectedRows = $event"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="Banner 图片" min-width="230">
            <template #default="{ row }">
              <div class="ho-banner-cell">
                <StorageImage :src="row.imageUrl" :width="180" :height="96" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="跳转目标" min-width="200">
            <template #default="{ row }">
              <span v-if="row.target" class="ho-target">
                <i />
                <span class="ho-target-path" :title="row.target">{{ row.target }}</span>
              </span>
              <span v-else class="ho-target-empty">不跳转</span>
            </template>
          </el-table-column>
          <el-table-column v-if="scope === 'platform'" label="排序" min-width="64">
            <template #default="{ row }">
              <div class="ho-sort-cell">{{ row.sort ?? 1 }}</div>
            </template>
          </el-table-column>
          <el-table-column v-if="scope === 'platform'" label="状态" min-width="100">
            <template #default="{ row }">
              <div class="ho-status-cell">
                <el-switch
                  v-model="row.isEnabled"
                  :loading="statusLoadingId === row.id"
                  @change="changeStatus(row)"
                />
                <em>{{ row.isEnabled ? '启用' : '禁用' }}</em>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="150">
            <template #default="{ row }">
              <div class="ho-time-cell">{{ formatDateTime(row.createTime) }}</div>
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
                <el-button link type="primary" @click="openForm(row)">编辑</el-button>
                <el-button link type="danger" @click="removeBanners(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <div class="ho-empty">
              <el-icon :size="28"><Picture /></el-icon>
              <b>没有匹配的 Banner</b>
              <span>调整跳转目标或状态后重试</span>
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
      v-model="dialog.visible"
      :title="dialog.id ? '编辑 Banner' : '新增 Banner'"
      width="620px"
      :close-on-click-modal="!dialog.submitting"
      :close-on-press-escape="!dialog.submitting"
      :show-close="!dialog.submitting"
      @closed="resetDialog"
    >
      <div v-if="dialog.currentImage" class="current-image">
        <span>当前图片</span>
        <StorageImage :src="dialog.currentImage" :width="240" :height="128" />
      </div>
      <el-form label-position="top">
        <el-form-item label="跳转目标">
          <el-input v-model="dialog.target" maxlength="500" clearable placeholder="留空（点击 Banner 不跳转），例如 /pages/product/list" />
          <div class="field-tip">直接填写 App 实际页面路径（如 /pages/product/list，可带查询参数）；留空时点击 Banner 不跳转。</div>
        </el-form-item>
        <div v-if="scope === 'platform'" class="banner-form-grid">
          <el-form-item label="排序">
            <el-input-number v-model="dialog.sort" :min="1" :max="999" controls-position="right" />
            <div class="field-tip">数值越小越靠前，App 按此顺序轮播。</div>
          </el-form-item>
          <el-form-item label="状态">
            <div class="form-switch">
              <el-switch v-model="dialog.isEnabled" />
              <em>{{ dialog.isEnabled ? '启用' : '禁用' }}</em>
            </div>
            <div class="field-tip">启用后才会在 App 首屏展示。</div>
          </el-form-item>
        </div>
      </el-form>
      <el-upload
        v-model:file-list="dialog.files"
        action="#"
        accept="image/*"
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
      >
        <el-button type="primary">{{ dialog.id ? '选择新图片（可选）' : '选择图片' }}</el-button>
        <template #tip>
          <div class="upload-tip">支持 JPG、PNG、GIF、BMP、WebP、SVG，建议 750 × 400（15:8），单张不超过 5MB。</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button :disabled="dialog.submitting" @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.submitting" @click="saveBanner">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { TableInstance, UploadFile, UploadFiles, UploadUserFile } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, View } from '@element-plus/icons-vue'
import MallListTools from '@/components/mall/MallListTools.vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import StorageImage from '@/components/mall/StorageImage.vue'
import {
  createMerchantBanner,
  createPlatformBanner,
  deleteMerchantBanners,
  deletePlatformBanners,
  queryMerchantBanners,
  queryPlatformBanners,
  updateMerchantBanner,
  updatePlatformBanner,
  type BannerRecord,
} from '@/api/mall/banner'
import { getCurrentShop } from '@/utils/shop'
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'
import { buildConditions } from '@/utils/query'

const props = withDefaults(defineProps<{ scope: 'platform' | 'merchant'; showPreview?: boolean }>(), {
  showPreview: false,
})
const emit = defineEmits<{ preview: [] }>()

const loading = ref(false)
const showSearch = ref(true)
const tableRef = ref<TableInstance>()
const banners = ref<BannerRecord[]>([])
const selectedRows = ref<BannerRecord[]>([])
const enabledCount = ref(0)
const bannerTotal = ref(0)
const statusLoadingId = ref('')
const search = reactive({ target: '', isEnabled: undefined as boolean | undefined })
const page = reactive({ current: 1, size: 10, total: 0 })
const dialog = reactive({
  visible: false,
  submitting: false,
  id: '',
  currentImage: '',
  target: '',
  sort: 1,
  isEnabled: true,
  files: [] as UploadUserFile[],
})

function shopId() {
  return getCurrentShop()?.id || ''
}

async function loadBanners() {
  const currentShopId = shopId()
  if (props.scope === 'merchant' && !currentShopId) {
    banners.value = []
    page.total = 0
    return
  }
  loading.value = true
  try {
    const params = {
      current: page.current,
      size: page.size,
      shopId: props.scope === 'merchant' ? currentShopId : undefined,
      conditions_: buildConditions(
        props.scope === 'platform'
          ? [
              { field: 'target', operator: 'like', value: search.target },
              { field: 'isEnabled', operator: 'eq', value: search.isEnabled },
              { field: 'sort', operator: 'sort', value: 'asc' },
              { field: 'id', operator: 'sort', value: 'asc' },
            ]
          : [{ field: 'id', operator: 'sort', value: 'desc' }],
      ),
    }
    const [response, enabledResponse, totalResponse] = await Promise.all([
      props.scope === 'merchant' ? queryMerchantBanners(params) : queryPlatformBanners(params),
      props.scope === 'platform'
        ? queryPlatformBanners({
            current: 1,
            size: 1,
            conditions_: buildConditions([{ field: 'isEnabled', operator: 'eq', value: true }]),
          })
        : Promise.resolve(null),
      props.scope === 'platform'
        ? queryPlatformBanners({ current: 1, size: 1 })
        : Promise.resolve(null),
    ])
    banners.value = response.data?.records || []
    page.total = Number(response.data?.total || 0)
    enabledCount.value = Number(enabledResponse?.data?.total || 0)
    bannerTotal.value = Number(totalResponse?.data?.total || 0)
    selectedRows.value = []
    tableRef.value?.clearSelection()
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.current = 1
  void loadBanners()
}

function handleReset() {
  search.target = ''
  search.isEnabled = undefined
  handleSearch()
}

function handlePageChange(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
  void loadBanners()
}

function formatDateTime(value?: string) {
  return value ? value.slice(0, 19) : '—'
}

function openForm(row?: BannerRecord) {
  resetDialog()
  dialog.id = row?.id || ''
  dialog.currentImage = row?.imageUrl || ''
  dialog.target = row?.target || ''
  dialog.sort = Number(row?.sort ?? 1)
  dialog.isEnabled = row?.isEnabled ?? true
  dialog.visible = true
}

function resetDialog() {
  dialog.id = ''
  dialog.currentImage = ''
  dialog.target = ''
  dialog.sort = 1
  dialog.isEnabled = true
  dialog.files = []
}

function handleFileChange(file: UploadFile, files: UploadFiles) {
  const raw = file.raw
  if (!raw) return
  if (!raw.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    dialog.files = []
    return
  }
  if (raw.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    dialog.files = []
    return
  }
  dialog.files = files.slice(-1)
}

async function saveBanner() {
  const file = dialog.files[0]?.raw
  if (!file && !dialog.id) {
    ElMessage.warning('请选择新图片')
    return
  }
  const target = dialog.target.trim()
  if (target && !target.startsWith('/pages/')) {
    ElMessage.warning('跳转目标必须是 /pages/ 开头的 App 站内路径，留空表示不跳转')
    return
  }
  if (props.scope === 'platform' && (!dialog.sort || dialog.sort < 1)) {
    ElMessage.warning('排序必须大于等于 1')
    return
  }
  const currentShopId = shopId()
  if (props.scope === 'merchant' && !currentShopId) {
    ElMessage.warning('请先选择店铺')
    return
  }

  dialog.submitting = true
  try {
    if (props.scope === 'merchant') {
      if (dialog.id) await updateMerchantBanner(dialog.id, currentShopId, file, { target })
      else await createMerchantBanner(currentShopId, file!, { target })
    } else if (dialog.id) {
      await updatePlatformBanner(dialog.id, file, target, dialog.sort, dialog.isEnabled)
    } else {
      await createPlatformBanner(file!, target, dialog.sort, dialog.isEnabled)
    }
    ElMessage.success('保存成功')
    dialog.visible = false
    await loadBanners()
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '保存失败')
  } finally {
    dialog.submitting = false
  }
}

async function changeStatus(row: BannerRecord) {
  const next = Boolean(row.isEnabled)
  statusLoadingId.value = row.id
  try {
    await updatePlatformBanner(row.id, undefined, row.target || '', Number(row.sort ?? 1), next)
    ElMessage.success(`Banner 已${next ? '启用' : '禁用'}`)
    await loadBanners()
  } catch (error) {
    row.isEnabled = !next
    ElMessage.error(getRequestErrorMessage(error) || '状态更新失败')
  } finally {
    statusLoadingId.value = ''
  }
}

async function removeBanners(row?: BannerRecord) {
  const ids = row ? [row.id] : selectedRows.value.map((item) => item.id)
  if (!ids.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个 Banner 吗？`, '删除确认', { type: 'warning' })
    if (props.scope === 'merchant') await deleteMerchantBanners(ids)
    else await deletePlatformBanners(ids)
    ElMessage.success('删除成功')
    await loadBanners()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '删除失败')
  }
}

onMounted(() => void loadBanners())
</script>

<style scoped>
.banner-page {
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

.ho-banner-cell { display: flex; width: max-content; max-width: 100%; margin: 0 auto; padding: 6px 0; text-align: left; }
.ho-banner-cell :deep(.el-image) { display: block; overflow: hidden; border-radius: 8px 2px 8px 2px; }

.ho-sort-cell { width: max-content; margin: 0 auto; color: var(--mall-ink-secondary); font-size: 12px; text-align: left; }

.ho-status-cell { display: flex; width: max-content; margin: 0 auto; align-items: center; gap: 8px; text-align: left; }
.ho-status-cell em { color: var(--mall-muted); font-size: 12px; font-style: normal; }

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

.ho-time-cell { display: flex; width: max-content; margin: 0 auto; align-items: center; color: var(--ym-ink-secondary); font-size: 12px; font-variant-numeric: tabular-nums; text-align: left; white-space: nowrap; }

.ho-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 32px 0; color: var(--ym-muted); }
.ho-empty b { color: var(--ym-ink); font-size: 14px; font-weight: 600; }
.ho-empty span { font-size: 12px; }

.current-image { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; color: var(--mall-ink-secondary, #30423a); }
.upload-tip { margin-top: 8px; color: var(--mall-muted, #65726a); font-size: 12px; }
.field-tip { margin-top: 6px; color: var(--mall-muted, #65726a); font-size: 12px; line-height: 1.5; }

.banner-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
.form-switch { display: flex; align-items: center; gap: 8px; }
.form-switch em { color: var(--mall-muted); font-size: 12px; font-style: normal; }
</style>
