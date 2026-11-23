<template>
  <div class="mall-page merchant-shop-page merchant-banner-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" class="mall-query-form" @submit.prevent="handleSearch">
        <div class="mchs-filter-fields">
          <el-form-item label="标题或目标" class="mchs-filter-field mchs-filter-keyword">
            <el-input
              v-model="draft.keyword"
              clearable
              placeholder="搜索轮播标题或跳转目标"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="状态" class="mchs-filter-field mchs-filter-status">
            <el-select v-model="draft.status" placeholder="全部状态">
              <el-option label="全部状态" value="all" />
              <el-option label="启用" value="on" />
              <el-option label="停用" value="off" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item class="mall-query-actions">
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="primary" native-type="submit">
            <el-icon><Search /></el-icon>查询
          </el-button>
        </el-form-item>
      </el-form>
      <div class="mall-business-actions">
        <el-button type="danger" plain :disabled="selectedIds.length === 0" @click="openBatchDelete">
          {{ selectedIds.length ? `批量删除 (${selectedIds.length})` : '批量删除' }}
        </el-button>
        <el-button type="primary" icon="Plus" @click="openCreate">新增轮播图</el-button>
      </div>
    </section>

    <section class="mall-table-panel">
      <div class="mchs-intro">
        <span>
          <el-icon :size="15"><Picture /></el-icon>
          店铺轮播图展示在 App 店铺首页，按排序升序轮播；建议维护 3–5 张，图片比例 15:8。
        </span>
        <div class="mchs-intro-right">
          <span class="mchs-intro-chip"><i></i>{{ enabledCount }} 张启用中</span>
          <b>共 {{ rows.length }} 张</b>
        </div>
      </div>

      <el-table
        data-ym-table="r90"
        v-loading="loading"
        :data="pagedRows"
        row-key="id"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="44" align="center" />
        <el-table-column label="轮播图" width="170" align="center" header-align="center">
          <template #default="{ row }">
            <span class="mchs-banner-thumb">
              <StorageImage :src="row.imageUrl" width="146" height="78" :preview="false" />
            </span>
          </template>
        </el-table-column>
        <el-table-column label="轮播标题" min-width="144" align="center" header-align="center">
          <template #default="{ row }">
            <div class="mchs-title-cell">
              <b :title="row.title">{{ row.title || '—' }}</b>
              <small>{{ row.isEnabled ? '展示中' : '已停用' }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="跳转类型" min-width="96" align="center" header-align="center">
          <template #default="{ row }">
            <span class="status-ticket tone-info">{{ jumpTypeOf(row.target) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="跳转目标" min-width="240" align="center" header-align="center">
          <template #default="{ row }">
            <span v-if="row.target" class="mchs-target" :title="row.target">
              <el-icon><Share /></el-icon>
              <span>{{ row.target }}</span>
            </span>
            <span v-else class="mchs-target is-empty">不跳转</span>
          </template>
        </el-table-column>
        <el-table-column label="排序" min-width="56" align="center" header-align="center">
          <template #default="{ row }">
            <span class="mchs-sort">{{ Number(row.sort || 1) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="92" align="center" header-align="center">
          <template #default="{ row }">
            <button
              type="button"
              class="mchs-state-toggle"
              :class="{ 'is-on': row.isEnabled }"
              :aria-pressed="!!row.isEnabled"
              :disabled="toggleLoadingId === row.id"
              @click="toggleStatus(row)"
            >
              <i />
              <span>{{ row.isEnabled ? '启用' : '停用' }}</span>
            </button>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="124" align="center" header-align="center">
          <template #default="{ row }">
            <span class="mchs-time">{{ displayTime(row.updateTime || row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center" header-align="center">
          <template #default="{ row }">
            <div class="mchs-actions">
              <button type="button" class="mchs-link" @click="openEdit(row)">编辑</button>
              <button type="button" class="mchs-link danger" @click="openDelete([row])">删除</button>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <div class="mchs-empty">
            <el-icon><Picture /></el-icon>
            <b>没有匹配的轮播图</b>
            <span>调整标题、目标或状态后重新查询</span>
          </div>
        </template>
      </el-table>

      <MallPagination
        :total="filteredRows.length"
        :page="page.current"
        :limit="page.size"
        variant="admin"
        @pagination="handlePagination"
      />
    </section>

    <el-dialog
      v-model="editorVisible"
      class="mchs-dialog mchs-banner-dialog"
      width="720px"
      :show-close="false"
      :with-header="false"
      append-to-body
      destroy-on-close
      @closed="handleEditorClosed"
    >
      <div class="mchs-dialog-head">
        <div>
          <span class="mchs-dialog-kicker">{{ editor.id ? 'EDIT' : 'CREATE' }}</span>
          <h2>{{ editor.id ? '编辑轮播图' : '新增轮播图' }}</h2>
        </div>
        <button type="button" class="mchs-dialog-close" aria-label="关闭" @click="editorVisible = false">×</button>
      </div>

      <div class="mchs-banner-editor">
        <div class="mchs-upload-block">
          <span class="mchs-field-label">轮播图片 <em>*</em></span>
          <input ref="uploadInputRef" type="file" accept="image/*" class="mchs-upload-input" @change="readImage" />
          <button type="button" class="mchs-upload-tile" @click="chooseImage">
            <img v-if="editor.previewUrl" :src="editor.previewUrl" alt="轮播图预览" />
            <StorageImage v-else-if="editor.imageUrl" :src="editor.imageUrl" width="100%" height="100%" :preview="false" />
            <span v-else class="mchs-upload-empty">
              <el-icon :size="22"><Plus /></el-icon>
              <b>上传轮播图片</b>
              <small>750 × 400，JPG / PNG</small>
            </span>
            <span class="mchs-upload-veil">
              <el-icon :size="17"><Picture /></el-icon>
              {{ editor.previewUrl || editor.imageUrl ? '更换图片' : '选择图片' }}
            </span>
          </button>
          <small>建议 750 × 400（15:8），支持 JPG、PNG，单张不超过 5MB</small>
        </div>

        <div class="mchs-banner-fields">
          <label class="mchs-field">
            <span>轮播标题 <em>*</em></span>
            <input v-model="editor.title" maxlength="50" placeholder="例如：耳机新品上市" />
          </label>
          <label class="mchs-field">
            <span>跳转类型</span>
            <select :value="editor.jumpType" @change="changeJumpType(($event.target as HTMLSelectElement).value)">
              <option v-for="type in JUMP_TYPES" :key="type" :value="type">{{ type }}</option>
            </select>
          </label>
          <label class="mchs-field wide">
            <span>跳转目标</span>
            <input v-model="editor.target" placeholder="留空表示不跳转，例如 /pages/product/list?category=home" />
            <small>支持 App 站内 /pages/ 路径，可带查询参数；留空时点击轮播图不跳转。</small>
          </label>
          <div class="mchs-banner-row">
            <label class="mchs-field">
              <span>排序</span>
              <input v-model.number="editor.sort" type="number" min="1" max="999" />
              <small>数值越小越靠前</small>
            </label>
            <label class="mchs-field">
              <span>状态</span>
              <button
                type="button"
                class="mchs-state-toggle is-boxed"
                :class="{ 'is-on': editor.isEnabled }"
                :aria-pressed="editor.isEnabled"
                @click="editor.isEnabled = !editor.isEnabled"
              >
                <i />
                <span>{{ editor.isEnabled ? '启用' : '停用' }}</span>
              </button>
              <small>停用后不在 App 店铺首页展示</small>
            </label>
          </div>
        </div>
      </div>

      <p class="mchs-dialog-tip">轮播图保存后立即同步到 App 店铺首页，停用仅隐藏展示，不会删除图片。</p>
      <div class="mchs-dialog-actions">
        <button type="button" @click="editorVisible = false">取消</button>
        <button type="button" class="primary" :disabled="editorSubmitting" @click="saveEditor">保存轮播图</button>
      </div>
    </el-dialog>

    <el-dialog
      v-model="deleteVisible"
      class="mchs-dialog mchs-confirm-dialog"
      width="500px"
      :show-close="false"
      :with-header="false"
      append-to-body
      destroy-on-close
    >
      <div class="mchs-dialog-head">
        <div>
          <span class="mchs-dialog-kicker danger-kicker">DELETE</span>
          <h2>删除轮播图</h2>
        </div>
        <button type="button" class="mchs-dialog-close" aria-label="关闭" @click="deleteVisible = false">×</button>
      </div>
      <div class="mchs-danger-confirm">
        <el-icon :size="22"><Picture /></el-icon>
        <div>
          <b>确定删除选中的 {{ deleteTargets.length }} 张轮播图吗？</b>
          <span>{{ deleteTargets.map((item) => item.title || item.imageUrl).join('、') }}</span>
          <small>删除后 App 店铺首页将不再展示，操作不可恢复。</small>
        </div>
      </div>
      <div class="mchs-dialog-actions">
        <button type="button" @click="deleteVisible = false">取消</button>
        <button type="button" class="danger-solid" :disabled="deleteSubmitting" @click="confirmDelete">确认删除</button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Plus, Search, Share } from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import StorageImage from '@/components/mall/StorageImage.vue'
import {
  createMerchantBanner,
  deleteMerchantBanners,
  queryMerchantBanners,
  updateMerchantBanner,
  type BannerRecord,
} from '@/api/mall/banner'
import { buildConditions } from '@/utils/query'
import { getCurrentShop } from '@/utils/shop'
import '@/assets/yeah-mall-shop.css'

defineOptions({ name: 'MerchantBannerPage' })

const JUMP_TYPES = ['不跳转', '商品列表', '商品详情', '积分商城', '领券中心', '拼团活动', '秒杀活动', '自定义路径']
const TARGET_PRESETS: Record<string, string> = {
  商品列表: '/pages/product/list',
  商品详情: '/pages/product/detail?id=',
  积分商城: '/pages/points-mall/list',
  领券中心: '/pages/coupons/list',
  拼团活动: '/pages/group-buy/list',
  秒杀活动: '/pages/seckill/list',
}

const loading = ref(false)
const rows = ref<BannerRecord[]>([])
const draft = reactive({ keyword: '', status: 'all' })
const query = reactive({ keyword: '', status: 'all' })
const selectedIds = ref<string[]>([])
const page = reactive({ current: 1, size: 10 })
const toggleLoadingId = ref('')

const editorVisible = ref(false)
const editorSubmitting = ref(false)
const uploadInputRef = ref<HTMLInputElement>()
let previewObjectUrl = ''
const editor = reactive({
  id: '',
  title: '',
  imageUrl: '',
  previewUrl: '',
  target: '',
  jumpType: '不跳转',
  sort: 1 as number | string,
  isEnabled: true,
  file: null as File | null,
})

const deleteVisible = ref(false)
const deleteSubmitting = ref(false)
const deleteTargets = ref<BannerRecord[]>([])

const enabledCount = computed(() => rows.value.filter((item) => item.isEnabled).length)
const filteredRows = computed(() => {
  const keyword = query.keyword.trim()
  return rows.value
    .filter((item) => {
      const keywordMatch = !keyword || `${item.title || ''}${item.target || ''}${jumpTypeOf(item.target)}`.includes(keyword)
      const statusMatch = query.status === 'all' || (query.status === 'on' ? !!item.isEnabled : !item.isEnabled)
      return keywordMatch && statusMatch
    })
    .sort((a, b) => Number(a.sort || 1) - Number(b.sort || 1) || String(a.id).localeCompare(String(b.id)))
})
const pagedRows = computed(() => {
  const start = (page.current - 1) * page.size
  return filteredRows.value.slice(start, start + page.size)
})

function jumpTypeOf(target?: string) {
  const path = String(target || '')
  if (!path) return '不跳转'
  if (path.startsWith('/pages/product/detail')) return '商品详情'
  if (path.startsWith('/pages/product/list')) return '商品列表'
  if (path.startsWith('/pages/points-mall')) return '积分商城'
  if (path.startsWith('/pages/coupons')) return '领券中心'
  if (path.startsWith('/pages/group-buy')) return '拼团活动'
  if (path.startsWith('/pages/seckill')) return '秒杀活动'
  return '自定义路径'
}

function presetTarget(type: string, current: string) {
  if (type === '不跳转') return ''
  if (type === '自定义路径') return current || ''
  return TARGET_PRESETS[type] || ''
}

function displayTime(value?: string) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '—'
}

async function loadBanners() {
  const shopId = getCurrentShop()?.id
  if (!shopId) {
    rows.value = []
    return
  }
  loading.value = true
  try {
    const response = await queryMerchantBanners({
      current: 1,
      size: 200,
      shopId,
      conditions_: buildConditions([
        { field: 'sort', operator: 'sort', value: 'asc' },
        { field: 'id', operator: 'sort', value: 'asc' },
      ]),
    })
    rows.value = response.data?.records || []
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.keyword = draft.keyword
  query.status = draft.status
  page.current = 1
  selectedIds.value = []
}

function resetQuery() {
  draft.keyword = ''
  draft.status = 'all'
  query.keyword = ''
  query.status = 'all'
  page.current = 1
  selectedIds.value = []
}

function handleSelectionChange(selection: BannerRecord[]) {
  selectedIds.value = selection.map((item) => item.id)
}

function handlePagination(payload: { page: number; limit: number }) {
  page.current = payload.page
  page.size = payload.limit
}

function openCreate() {
  resetEditor()
  editor.id = ''
  editor.sort = rows.value.reduce((max, item) => Math.max(max, Number(item.sort || 0)), 0) + 1
  editorVisible.value = true
}

function openEdit(row: BannerRecord) {
  resetEditor()
  editor.id = row.id
  editor.title = row.title || ''
  editor.imageUrl = row.imageUrl || ''
  editor.target = row.target || ''
  editor.jumpType = jumpTypeOf(row.target)
  editor.sort = Number(row.sort || 1)
  editor.isEnabled = row.isEnabled !== false
  editorVisible.value = true
}

function resetEditor() {
  releasePreview()
  editor.id = ''
  editor.title = ''
  editor.imageUrl = ''
  editor.previewUrl = ''
  editor.target = ''
  editor.jumpType = '不跳转'
  editor.sort = 1
  editor.isEnabled = true
  editor.file = null
}

function releasePreview() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl)
    previewObjectUrl = ''
  }
}

function handleEditorClosed() {
  releasePreview()
  editorSubmitting.value = false
}

function chooseImage() {
  if (!uploadInputRef.value) return
  uploadInputRef.value.value = ''
  uploadInputRef.value.click()
}

function readImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择 JPG、PNG 等图片文件')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片不能超过 5MB')
    return
  }
  releasePreview()
  previewObjectUrl = URL.createObjectURL(file)
  editor.previewUrl = previewObjectUrl
  editor.file = file
}

function changeJumpType(type: string) {
  editor.jumpType = type
  editor.target = presetTarget(type, editor.target)
}

async function saveEditor() {
  const title = editor.title.trim()
  if (!title) {
    ElMessage.warning('请输入轮播标题')
    return
  }
  if (!editor.imageUrl && !editor.file) {
    ElMessage.warning('请上传轮播图片')
    return
  }
  const target = editor.target.trim()
  if (target && !target.startsWith('/pages/')) {
    ElMessage.warning('跳转目标必须以 /pages/ 开头的站内路径')
    return
  }
  if (!editor.sort || Number(editor.sort) < 1) {
    ElMessage.warning('排序值必须大于等于 1')
    return
  }
  const shopId = getCurrentShop()?.id
  if (!shopId) {
    ElMessage.warning('请先选择店铺')
    return
  }
  editorSubmitting.value = true
  try {
    const fields = {
      title,
      target,
      sort: Number(editor.sort),
      isEnabled: editor.isEnabled,
    }
    if (editor.id) {
      await updateMerchantBanner(editor.id, shopId, editor.file || undefined, fields)
      ElMessage.success('轮播图已更新')
    } else {
      await createMerchantBanner(shopId, editor.file as File, fields)
      ElMessage.success('轮播图已新增')
    }
    editorVisible.value = false
    await loadBanners()
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    editorSubmitting.value = false
  }
}

async function toggleStatus(row: BannerRecord) {
  const shopId = getCurrentShop()?.id
  if (!shopId) return
  const next = !row.isEnabled
  toggleLoadingId.value = row.id
  try {
    await updateMerchantBanner(row.id, shopId, undefined, {
      title: row.title || '',
      target: row.target || '',
      sort: Number(row.sort || 1),
      isEnabled: next,
    })
    await loadBanners()
    ElMessage.success(next ? '轮播图已启用' : '轮播图已停用')
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    toggleLoadingId.value = ''
  }
}

function openDelete(targets: BannerRecord[]) {
  deleteTargets.value = targets
  deleteVisible.value = true
}

function openBatchDelete() {
  openDelete(rows.value.filter((item) => selectedIds.value.includes(item.id)))
}

async function confirmDelete() {
  if (!deleteTargets.value.length) return
  deleteSubmitting.value = true
  try {
    await deleteMerchantBanners(deleteTargets.value.map((item) => item.id))
    ElMessage.success(`已删除 ${deleteTargets.value.length} 张轮播图`)
    deleteVisible.value = false
    selectedIds.value = []
    await loadBanners()
    const lastPage = Math.max(1, Math.ceil(filteredRows.value.length / page.size))
    page.current = Math.min(page.current, lastPage)
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    deleteSubmitting.value = false
  }
}

onMounted(loadBanners)
onBeforeUnmount(releasePreview)
</script>