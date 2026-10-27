<template>
  <div class="banner-page">
    <div class="action-bar">
      <div class="action-buttons">
        <el-button type="primary" @click="openForm()">新增 Banner</el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="removeBanners()">批量删除</el-button>
      </div>
      <MallListTools :search="false" @refresh="loadBanners" />
    </div>

    <div class="table-container">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="banners"
        stripe
        height="100%"
        @selection-change="selectedRows = $event"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="Banner 图片" min-width="260">
          <template #default="{ row }">
            <StorageImage :src="row.imageUrl" :width="180" :height="72" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column prop="updateTime" label="更新时间" width="170" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-button link type="primary" @click="openForm(row)">更换图片</el-button>
              <el-button link type="danger" @click="removeBanners(row)">删除</el-button>
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
      v-model="dialog.visible"
      :title="dialog.id ? '更换 Banner 图片' : '新增 Banner'"
      width="560px"
      :close-on-click-modal="!dialog.submitting"
      :close-on-press-escape="!dialog.submitting"
      :show-close="!dialog.submitting"
      @closed="resetDialog"
    >
      <div v-if="dialog.currentImage" class="current-image">
        <span>当前图片</span>
        <StorageImage :src="dialog.currentImage" :width="240" :height="96" />
      </div>
      <el-upload
        v-model:file-list="dialog.files"
        action="#"
        accept="image/*"
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
      >
        <el-button type="primary">选择新图片</el-button>
        <template #tip>
          <div class="upload-tip">支持 JPG、PNG、GIF、WebP、SVG 等图片，大小不超过 5MB。</div>
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

const props = defineProps<{ scope: 'platform' | 'merchant' }>()
const loading = ref(false)
const tableRef = ref<TableInstance>()
const banners = ref<BannerRecord[]>([])
const selectedRows = ref<BannerRecord[]>([])
const page = reactive({ current: 1, size: 10, total: 0 })
const dialog = reactive({
  visible: false,
  submitting: false,
  id: '',
  currentImage: '',
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
      conditions_: 'id:sort:desc',
    }
    const response = props.scope === 'merchant'
      ? await queryMerchantBanners(params)
      : await queryPlatformBanners(params)
    banners.value = response.data?.records || []
    page.total = Number(response.data?.total || 0)
    selectedRows.value = []
    tableRef.value?.clearSelection()
  } finally {
    loading.value = false
  }
}

function handlePageChange(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
  void loadBanners()
}

function openForm(row?: BannerRecord) {
  resetDialog()
  dialog.id = row?.id || ''
  dialog.currentImage = row?.imageUrl || ''
  dialog.visible = true
}

function resetDialog() {
  dialog.id = ''
  dialog.currentImage = ''
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
  if (!file) {
    ElMessage.warning('请选择新图片')
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
      if (dialog.id) await updateMerchantBanner(dialog.id, currentShopId, file)
      else await createMerchantBanner(currentShopId, file)
    } else if (dialog.id) {
      await updatePlatformBanner(dialog.id, file)
    } else {
      await createPlatformBanner(file)
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
  padding: 20px;
  background: #fff;
}

.action-bar { display: flex; justify-content: space-between; align-items: center; }
.action-buttons { display: flex; gap: 12px; }
.table-container { flex: 1; min-height: 0; margin-top: 20px; }
.current-image { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; color: #606266; }
.upload-tip { margin-top: 8px; color: #909399; font-size: 12px; }
</style>
