<template>
  <div class="mall-page merchant-product-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" :model="queryParams" class="mall-query-form" @submit.prevent="handleQuery">
        <el-form-item label="商品名称">
          <el-input v-model="queryParams.name" clearable placeholder="请输入商品名称" @clear="handleQuery" />
        </el-form-item>
        <el-form-item label="所属分类">
          <el-select v-model="queryParams.categoryId" clearable placeholder="全部分类" style="width: 180px">
            <el-option v-for="cat in leafCategories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品状态">
          <el-select v-model="queryParams.isEnabled" clearable placeholder="全部状态" style="width: 140px">
            <el-option label="已上架" :value="true" />
            <el-option label="已下架" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item class="mall-query-actions">
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="primary" native-type="submit" icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
      <div class="mall-business-actions">
        <el-button :disabled="selectedRows.length !== 1" @click="handleUpdate()">修改</el-button>
        <el-button type="danger" plain :disabled="selectedRows.length === 0" @click="handleDelete()">{{ deleteText }}</el-button>
        <el-button type="primary" icon="Plus" @click="handleAdd">新增商品</el-button>
      </div>
    </section>

    <section class="mall-table-panel">
      <el-table data-ym-table="r58" v-loading="loading" :data="tableData" row-key="id" @selection-change="selectedRows = $event">
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column prop="id" label="ID" width="170" align="center" />
        <el-table-column label="主图" width="80" align="center">
          <template #default="{ row }">
            <span class="mp-thumb">
              <StorageImage v-if="row.mainImage" :src="row.mainImage" width="100%" height="100%" :preview="false" />
              <el-icon v-else><Picture /></el-icon>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="商品名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <CopyableText :value="row.name" label="商品名称" />
          </template>
        </el-table-column>
        <el-table-column label="商品副标题" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="mp-subtitle">{{ row.subtitle || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="['status-ticket', row.isEnabled ? 'tone-success' : 'tone-neutral']">
              {{ row.isEnabled ? '已上架' : '已下架' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createBy" label="创建人" width="110" align="center" />
        <el-table-column label="创建时间" width="170" align="center">
          <template #default="{ row }">
            <span class="mp-time">{{ row.createTime || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="updateBy" label="更新人" width="110" align="center" />
        <el-table-column label="更新时间" width="170" align="center">
          <template #default="{ row }">
            <span class="mp-time">{{ row.updateTime || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-button link type="primary" @click="handleUpdate(row)">编辑</el-button>
              <el-dropdown trigger="click" popper-class="mp-row-menu" @command="handleSpuAction($event, row)">
                <el-button link type="primary">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="sku">SKU 管理</el-dropdown-item>
                    <el-dropdown-item command="image">图片管理</el-dropdown-item>
                    <el-dropdown-item command="status">{{ row.isEnabled ? '下架' : '上架' }}</el-dropdown-item>
                    <el-dropdown-item command="delete" divided class="mp-danger-action">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="mp-empty">
            <el-icon><Filter /></el-icon>
            <b>没有匹配的商品</b>
            <span>调整筛选条件后重试</span>
          </div>
        </template>
      </el-table>

      <MallPagination
        :total="total"
        :page="queryParams.current"
        :limit="queryParams.size"
        @pagination="handlePageChange"
      />
    </section>

    <el-dialog
      v-model="editorVisible"
      width="960px"
      class="mp-editor-dialog"
      append-to-body
      destroy-on-close
      :close-on-click-modal="!submitting"
      :close-on-press-escape="!submitting"
      :show-close="!submitting"
    >
      <template #header>
        <div class="mp-dialog-head">
          <span class="drawer-kicker">PRODUCT EDITOR</span>
          <h2>{{ editorMode === 'create' ? '创建商品' : '编辑商品' }}</h2>
        </div>
      </template>

      <div class="mp-steps">
        <div
          v-for="(label, index) in editorSteps"
          :key="label"
          :class="['mp-step', { active: editorStep === index, done: editorStep > index }]"
        >
          <i>{{ editorStep > index ? '✓' : index + 1 }}</i>
          <span>{{ label }}</span>
        </div>
      </div>

      <div class="mp-editor-body">
        <el-form
          v-show="editorStep === 0"
          ref="editorFormRef"
          :model="editorForm"
          :rules="editorRules"
          label-position="top"
          class="mp-form-grid"
        >
          <el-form-item prop="categoryId" class="is-wide">
            <template #label>商品分类 <small>商品只能挂载到二级分类</small></template>
            <el-select v-model="editorForm.categoryId" placeholder="请选择商品分类" style="width: 100%">
              <el-option v-for="cat in leafCategories" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="商品名称" prop="name" class="is-wide">
            <el-input v-model="editorForm.name" maxlength="64" placeholder="请输入商品名称" />
          </el-form-item>
          <el-form-item prop="subtitle" class="is-wide">
            <template #label>商品副标题 <small>{{ editorForm.subtitle.length }}/128</small></template>
            <el-input v-model="editorForm.subtitle" maxlength="128" placeholder="选填，用于商品列表补充卖点" />
          </el-form-item>
        </el-form>

        <div v-if="editorStep === 1" class="mp-detail-editor">
          <div class="mp-detail-heading">
            <b>商品详情</b>
            <span>支持图文、链接和视频内容，图片会自动上传至当前商家存储空间。</span>
          </div>
          <RichTextEditor
            v-model="editorForm.detailDesc"
            :height="420"
            upload-scope="merchant"
            placeholder="输入商品详情说明，可插入图片并进行基础排版。"
          />
        </div>

        <div v-show="editorStep === 2" class="mp-spec-editor">
          <div class="mp-spec-tags">
            <button
              v-for="spec in specList"
              :key="spec.id"
              type="button"
              :class="['mp-spec-tag', { active: activeSpecId === spec.id }]"
              @click="activeSpecId = spec.id"
            >
              {{ spec.specName }}
            </button>
          </div>
          <div class="mp-opt-tags">
            <button
              v-for="opt in activeOptions"
              :key="opt.id"
              type="button"
              :class="['mp-opt-tag', { checked: isOptChecked(opt.id) }]"
              @click="toggleOpt(opt.id)"
            >
              {{ opt.optName }}
            </button>
          </div>
          <div class="mp-spec-summary">
            <span v-for="item in specSummary" :key="item.specId" class="mp-spec-chip">{{ item.text }}</span>
            <small v-if="!specSummary.length">尚未选择规格选项，创建后可在 SKU 管理中配置具体规格组合。</small>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button :disabled="submitting" @click="handleEditorBack">{{ editorStep > 0 ? '上一步' : '取消' }}</el-button>
        <el-button v-if="editorStep < 2" type="primary" @click="editorStep++">下一步</el-button>
        <el-button v-else type="primary" :loading="submitting" @click="submitEditor">确 定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="imageVisible"
      width="600px"
      class="mp-image-dialog"
      append-to-body
      :before-close="handleImageBeforeClose"
      @closed="handleImageClosed"
    >
      <template #header>
        <div class="mp-dialog-head">
          <span class="drawer-kicker">IMAGES</span>
          <h2>图片管理 - {{ currentProduct.name }}</h2>
        </div>
      </template>

      <div class="mp-image-tabs">
        <button type="button" :class="{ active: imageTab === 'main' }" @click="imageTab = 'main'">主图</button>
        <button type="button" :class="{ active: imageTab === 'carousel' }" @click="imageTab = 'carousel'">滚动图</button>
      </div>

      <div class="mp-image-hint">
        <el-icon><Picture /></el-icon>
        <span>上传仅生成临时预览，点击「完成」才会保存生效；直接关闭将放弃更改，未保存的图片会被自动释放。</span>
      </div>

      <div v-if="imageTab === 'main'" class="mp-main-image">
        <div class="mp-main-preview">
          <StorageImage v-if="mainImageKey" :src="mainImageKey" width="100%" height="100%" />
          <span v-else class="mp-main-empty"><el-icon><Plus /></el-icon></span>
        </div>
        <el-upload
          :show-file-list="false"
          accept="image/jpeg,image/png"
          :before-upload="beforeImageUpload"
          :http-request="uploadMainImage"
        >
          <el-button type="primary" :loading="uploading">上传主图</el-button>
        </el-upload>
        <small>JPG/PNG 格式，大小不超过 2MB。上架商品前必须先设置主图。</small>
      </div>

      <div v-else class="mp-carousel" v-loading="imageLoading">
        <div class="mp-carousel-list">
          <div v-for="image in carouselImages" :key="image.id" class="mp-carousel-item">
            <StorageImage :src="image.url" width="100%" height="100%" />
            <button type="button" class="mp-carousel-del" title="删除图片" @click="handleDeleteCarouselImage(image)">
              <el-icon><Close /></el-icon>
            </button>
          </div>
          <el-upload
            :show-file-list="false"
            accept="image/jpeg,image/png"
            :before-upload="beforeImageUpload"
            :http-request="uploadCarouselImage"
          >
            <span class="mp-carousel-add">
              <el-icon><Plus /></el-icon>
              <span>上传滚动图</span>
            </span>
          </el-upload>
        </div>
        <small>已配置 {{ carouselImages.length }} 张滚动图，按上传顺序展示。</small>
      </div>

      <template #footer>
        <div class="mp-image-footer">
          <span v-if="imageDirty" class="mp-image-dirty">有未保存的更改</span>
          <el-button :disabled="imageSaving" @click="handleImageCancel">取消</el-button>
          <el-button type="primary" :loading="imageSaving" @click="handleImageSave">完成</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Close, Filter, Picture, Plus } from '@element-plus/icons-vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import RichTextEditor from '@/components/mall/RichTextEditor.vue'
import StorageImage from '@/components/mall/StorageImage.vue'
import { getCurrentShop } from '@/utils/shop'
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'
import { createSpu, deleteSpu, getSpuDetail, listSpu, setMainImage, updateSpu, updateSpuStatus } from '@/api/mall/spu'
import { createSpuImage, deleteSpuImage, listSpuImages } from '@/api/mall/spuImage'
import { uploadMerchantStorageFile } from '@/api/storage'
import { getCategoryTree } from '@/api/mall/category'
import { listSpecDef, listSpecOptDef } from '@/api/mall/specDef'

defineOptions({ name: 'ProductSpuPage' })

const router = useRouter()
const editorSteps = ['基本信息', '详细描述', '规格设置']

const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const selectedRows = ref([])
const queryParams = ref({ current: 1, size: 10, name: '', categoryId: '', isEnabled: '' })
const categoryTree = ref([])
const specList = ref([])
const specOptMap = ref({})

const submitting = ref(false)
const editorVisible = ref(false)
const editorMode = ref('create')
const editorStep = ref(0)
const editorFormRef = ref(null)
const editorForm = ref(createEmptyForm())
const activeSpecId = ref(null)
const selectedSpecs = ref([])
const originalDetailDesc = ref('')

const imageVisible = ref(false)
const imageTab = ref('main')
const imageLoading = ref(false)
const uploading = ref(false)
const imageSaving = ref(false)
const currentProduct = ref({})
const mainImageKey = ref('')
const originalMainKey = ref('')
const carouselImages = ref([])
const originalCarousel = ref([])

const imageDirty = computed(() => {
  if (mainImageKey.value !== originalMainKey.value) return true
  if (carouselImages.value.some((item) => item.isNew)) return true
  const workingIds = new Set(carouselImages.value.filter((item) => !item.isNew).map((item) => String(item.id)))
  return originalCarousel.value.some((item) => !workingIds.has(String(item.id)))
})

const editorRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择商品分类（仅二级分类可挂载商品）', trigger: 'change' }],
}

const leafCategories = computed(() => collectLeaves(categoryTree.value))
const activeOptions = computed(() => specOptMap.value[activeSpecId.value] || [])
const deleteText = computed(() => (selectedRows.value.length ? `删除 (${selectedRows.value.length})` : '删除'))
const specSummary = computed(() =>
  selectedSpecs.value
    .filter((spec) => spec.optIds.length)
    .map((spec) => {
      const name = specList.value.find((item) => item.id === spec.specId)?.specName || ''
      const options = specOptMap.value[spec.specId] || []
      const optNames = spec.optIds.map((id) => options.find((opt) => opt.id === id)?.optName || '').filter(Boolean)
      return { specId: spec.specId, text: `${name}：${optNames.join('、')}` }
    }),
)

function createEmptyForm() {
  return { id: '', name: '', subtitle: '', categoryId: '', detailDesc: '' }
}

function getShopId() {
  return getCurrentShop()?.id || ''
}

function collectLeaves(nodes = [], out = []) {
  for (const node of nodes) {
    if (Number(node.level) === 2) out.push({ id: String(node.id), name: node.name })
    if (node.children?.length) collectLeaves(node.children, out)
  }
  return out
}

async function fetchCategoryTree() {
  try {
    const res = await getCategoryTree({ shopId: getShopId() })
    categoryTree.value = res.data || []
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  }
}

async function fetchSpecs() {
  try {
    const res = await listSpecDef({ shopId: getShopId(), current: 1, size: 200 })
    specList.value = (res.data?.records || []).map((spec) => ({ id: String(spec.id), specName: spec.specName }))
    const map = {}
    for (const spec of specList.value) {
      const optRes = await listSpecOptDef({ shopId: getShopId(), specId: spec.id })
      map[spec.id] = (optRes.data || []).map((opt) => ({ id: String(opt.id), optName: opt.optName }))
    }
    specOptMap.value = map
    if (!activeSpecId.value || !map[activeSpecId.value]) activeSpecId.value = specList.value[0]?.id ?? null
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  }
}

async function getList() {
  loading.value = true
  try {
    const params = {
      shopId: getShopId(),
      current: queryParams.value.current,
      size: queryParams.value.size,
    }
    const name = queryParams.value.name.trim()
    if (name) params.name = name
    if (queryParams.value.categoryId) params.categoryId = queryParams.value.categoryId
    if (queryParams.value.isEnabled === true || queryParams.value.isEnabled === false) {
      params.isEnabled = queryParams.value.isEnabled
    }
    const res = await listSpu(params)
    tableData.value = res.data?.records || []
    total.value = Number(res.data?.total || 0)
    selectedRows.value = []
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.value.current = 1
  void getList()
}

function handlePageChange(value) {
  queryParams.value.current = value.page
  queryParams.value.size = value.limit
  void getList()
}

function resetQuery() {
  queryParams.value.name = ''
  queryParams.value.categoryId = ''
  queryParams.value.isEnabled = ''
  handleQuery()
}

function isOptChecked(optId) {
  const spec = selectedSpecs.value.find((item) => item.specId === activeSpecId.value)
  return Boolean(spec && spec.optIds.includes(optId))
}

function toggleOpt(optId) {
  const specId = activeSpecId.value
  if (!specId) return
  let spec = selectedSpecs.value.find((item) => item.specId === specId)
  if (!spec) {
    spec = { specId, optIds: [] }
    selectedSpecs.value.push(spec)
  }
  const index = spec.optIds.indexOf(optId)
  if (index > -1) spec.optIds.splice(index, 1)
  else spec.optIds.push(optId)
}

async function handleAdd() {
  editorMode.value = 'create'
  editorForm.value = createEmptyForm()
  selectedSpecs.value = []
  originalDetailDesc.value = ''
  activeSpecId.value = null
  editorStep.value = 0
  editorVisible.value = true
  await fetchSpecs()
}

async function handleUpdate(row) {
  let target = row
  if (!target?.id) {
    if (selectedRows.value.length !== 1) {
      ElMessage.warning('请选择一个要编辑的商品')
      return
    }
    target = selectedRows.value[0]
  }
  let detail
  try {
    const res = await getSpuDetail(target.id)
    detail = res.data || target
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '获取商品详情失败，请重试')
    return
  }
  editorMode.value = 'edit'
  editorForm.value = {
    id: String(detail.id ?? target.id),
    name: detail.name ?? '',
    subtitle: detail.subtitle ?? '',
    categoryId: detail.categoryId ? String(detail.categoryId) : '',
    detailDesc: detail.detailDesc ?? '',
  }
  originalDetailDesc.value = detail.detailDesc || ''
  selectedSpecs.value = (detail.specs || []).map((spec) => ({
    specId: String(spec.specId),
    optIds: (spec.opts || []).map((opt) => String(opt.optId)),
  }))
  editorStep.value = 0
  editorVisible.value = true
  await fetchSpecs()
  const firstPicked = selectedSpecs.value.find((spec) => spec.optIds.length)
  activeSpecId.value = firstPicked?.specId ?? specList.value[0]?.id ?? null
}

function handleEditorBack() {
  if (editorStep.value > 0) editorStep.value--
  else editorVisible.value = false
}

function extractImagesFromRichText(content) {
  if (!content) return []
  const fileKeys = []
  const imgRegex = /<img[^>]+src="([^"]+)"/g
  let match
  while ((match = imgRegex.exec(content)) !== null) {
    const urlParams = new URLSearchParams(match[1].split('?')[1] || '')
    const fileKey = urlParams.get('fileKey')
    if (fileKey) fileKeys.push(fileKey)
  }
  return fileKeys
}

async function submitEditor() {
  if (submitting.value) return
  try {
    await editorFormRef.value?.validate()
  } catch {
    editorStep.value = 0
    return
  }
  submitting.value = true
  try {
    const detailDesc = editorForm.value.detailDesc || ''
    const payload = {
      shopId: getShopId(),
      name: editorForm.value.name.trim(),
      subtitle: editorForm.value.subtitle.trim(),
      categoryId: editorForm.value.categoryId,
      detailDesc,
      specs: selectedSpecs.value
        .filter((spec) => spec.optIds.length)
        .map((spec) => ({ specId: spec.specId, optIds: spec.optIds })),
    }
    if (editorMode.value === 'edit') {
      const detailImages = detailDesc !== originalDetailDesc.value ? extractImagesFromRichText(detailDesc) : null
      await updateSpu({ ...payload, id: editorForm.value.id, detailImages })
      ElMessage.success('商品信息已保存')
    } else {
      await createSpu({ ...payload, detailImages: extractImagesFromRichText(detailDesc) })
      ElMessage.success('商品已创建，请设置主图并配置 SKU 后上架')
    }
    editorVisible.value = false
    await getList()
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  } finally {
    submitting.value = false
  }
}

function handleSpuAction(command, row) {
  if (command === 'sku') router.push({ path: '/mall/sku', query: { spuId: row.id } })
  else if (command === 'image') handleImageManage(row)
  else if (command === 'status') void handleStatusChange(row)
  else if (command === 'delete') void handleDelete(row)
}

async function handleStatusChange(row) {
  const nextEnabled = !row.isEnabled
  const action = nextEnabled ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(`确认${action}商品“${row.name}”吗？`, `${action}确认`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
    await updateSpuStatus({ id: row.id, shopId: getShopId(), isEnabled: nextEnabled })
    ElMessage.success(`商品已${action}`)
    await getList()
  } catch (error) {
    if (!isUserCancel(error)) {
      const message = getRequestErrorMessage(error)
      if (message) ElMessage.error(message)
    }
  }
}

async function handleDelete(row) {
  const targets = row?.id ? [row.id] : selectedRows.value.map((item) => item.id)
  try {
    await ElMessageBox.confirm(
      `确认要删除选中的 ${targets.length} 个商品吗？删除后关联 SKU 与规格配置将一并移除。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
      },
    )
    await deleteSpu(targets)
    ElMessage.success(`已删除 ${targets.length} 个商品（关联 SKU 一并删除）`)
    await getList()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '删除失败')
  }
}

function handleImageManage(row) {
  currentProduct.value = row
  mainImageKey.value = row.mainImage || ''
  originalMainKey.value = row.mainImage || ''
  carouselImages.value = []
  originalCarousel.value = []
  imageTab.value = 'main'
  imageVisible.value = true
  void loadCarouselImages()
}

async function loadCarouselImages() {
  imageLoading.value = true
  try {
    const res = await listSpuImages({ shopId: getShopId(), spuId: currentProduct.value.id, current: 1, size: 200 })
    const records = (res.data?.records || [])
      .slice()
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0) || Number(a.id) - Number(b.id))
      .map((item) => ({ id: item.id, url: item.imageUrl || '' }))
    carouselImages.value = records.map((item) => ({ ...item }))
    originalCarousel.value = records.map((item) => ({ ...item }))
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  } finally {
    imageLoading.value = false
  }
}

function beforeImageUpload(file) {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) ElMessage.error('上传图片只能是 JPG/PNG 格式!')
  if (!isLt2M) ElMessage.error('上传图片大小不能超过 2MB!')
  return isImage && isLt2M
}

// 上传仅取得临时fileKey（isUsed=false）并预览，不落库；点击「完成」才保存业务并markUse。
async function uploadMainImage(option) {
  uploading.value = true
  try {
    const res = await uploadMerchantStorageFile(option.file)
    mainImageKey.value = res.data?.fileKey || ''
    ElMessage.success('主图已上传，点击「完成」保存')
    option.onSuccess?.(res)
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
    option.onError?.(error)
  } finally {
    uploading.value = false
  }
}

async function uploadCarouselImage(option) {
  uploading.value = true
  try {
    const res = await uploadMerchantStorageFile(option.file)
    const key = res.data?.fileKey || ''
    carouselImages.value = [
      ...carouselImages.value,
      { id: `tmp-${Date.now()}-${Math.floor(Math.random() * 100000)}`, url: key, isNew: true },
    ]
    ElMessage.success('滚动图已上传，点击「完成」保存')
    option.onSuccess?.(res)
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
    option.onError?.(error)
  } finally {
    uploading.value = false
  }
}

function handleDeleteCarouselImage(image) {
  carouselImages.value = carouselImages.value.filter((item) => item.id !== image.id)
}

async function handleImageSave() {
  if (!imageDirty.value) {
    imageVisible.value = false
    return
  }
  imageSaving.value = true
  try {
    const shopId = getShopId()
    const spuId = currentProduct.value.id
    if (mainImageKey.value && mainImageKey.value !== originalMainKey.value) {
      await setMainImage({ shopId, spuId, mainImage: mainImageKey.value })
    }
    for (const item of carouselImages.value.filter((image) => image.isNew)) {
      await createSpuImage({ shopId, spuId, imageUrl: item.url })
    }
    const workingIds = new Set(carouselImages.value.filter((image) => !image.isNew).map((image) => String(image.id)))
    const removedIds = originalCarousel.value.filter((image) => !workingIds.has(String(image.id))).map((image) => image.id)
    if (removedIds.length) await deleteSpuImage(removedIds)
    ElMessage.success('图片已保存')
    imageVisible.value = false
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  } finally {
    imageSaving.value = false
  }
}

function discardImageChanges() {
  if (imageDirty.value) ElMessage.info('已放弃未保存的图片更改')
}

function handleImageCancel() {
  discardImageChanges()
  imageVisible.value = false
}

function handleImageBeforeClose(done) {
  discardImageChanges()
  done()
}

function handleImageClosed() {
  mainImageKey.value = ''
  originalMainKey.value = ''
  carouselImages.value = []
  originalCarousel.value = []
  currentProduct.value = {}
  void getList()
}

onMounted(() => {
  void getList()
  void fetchCategoryTree()
})
</script>

<style scoped>
.mp-carousel-list :deep(.el-upload) {
  display: flex;
}
</style>