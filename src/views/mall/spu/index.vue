// 迁移自 spu/index.vue，风格与 banner/specDef 保持一致
<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" @submit.prevent>
      <el-form-item label="商品名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入商品名称" clearable style="width: 200px"
          @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="所属分类" prop="categoryId">
        <el-tree-select v-model="queryParams.categoryId" :data="categoryTree"
          :props="{ label: 'name', value: 'id', children: 'children' }" placeholder="请选择商品分类" check-strictly
          :render-after-expand="false" style="width: 200px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="filteredTableData" @selection-change="handleSelectionChange" row-key="id">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="id" label="ID" align="center" />
      <el-table-column prop="mainImage" label="主图" align="center">
        <template #default="scope">
          <ImagePreview :src="getFullImageUrl(scope.row.mainImage)" :width="40" :height="40" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="商品名称" align="center" />
      <el-table-column prop="categoryName" label="分类名称" align="center" />
      <el-table-column prop="createBy" label="创建人" align="center" />
      <el-table-column prop="createTime" label="创建时间" align="center" />
      <el-table-column prop="updateBy" label="更新人" align="center" />
      <el-table-column prop="updateTime" label="更新时间" align="center" />
      <el-table-column label="操作" width="320" align="center" class-name="small-padding fixed-width">
  <template #default="scope">
    <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
    <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
    <el-button link type="primary" icon="Picture" @click="handleImageManage(scope.row)">图片管理</el-button>
    <el-button link type="primary" icon="PriceTag" @click="handleSkuManage(scope.row.id)">SKU管理</el-button>
  </template>
</el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="Number(total)" v-model:page="queryParams.current" v-model:limit="queryParams.size"
      @pagination="getList" />

    <el-dialog v-model="createDialogVisible" title="创建商品" width="800px" @close="createDialogVisible = false">
      <el-steps :active="createStep" finish-status="success" simple>
        <el-step title="基本信息" />
        <el-step title="详细描述" />
        <el-step title="规格设置" />
      </el-steps>
      <el-form :model="createForm" :rules="createFormRules" label-width="90px" v-show="createStep === 0">
        <el-form-item label="商品分类" prop="categoryId">
          <el-tree-select v-model="createForm.categoryId" :data="categoryTree"
            :props="{ label: 'name', value: 'id', children: 'children' }" placeholder="请选择商品分类" check-strictly
            :render-after-expand="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入商品名称" />
        </el-form-item>
      </el-form>
      <el-form :model="createForm" :rules="createFormRules" label-width="90px" v-show="createStep === 1">
        <el-form-item label="详细描述" prop="detailDesc">
          <Editor v-model="createForm.detailDesc" :height="400" />
        </el-form-item>
      </el-form>
      <el-form :model="createForm" :rules="createFormRules" label-width="90px" v-show="createStep === 2">
        <el-form-item label="规格">
          <div class="spec-container">
            <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
              <el-tag v-for="spec in specList" :key="spec.id"
                :class="activeSpecId === spec.id ? 'active-spec-tag' : 'default-spec-tag'"
                style="cursor: pointer; user-select: none; display: inline-flex; align-items: center; justify-content: center; padding: 6px 12px !important; margin: 0 8px 8px 0 !important; border-radius: 6px; transition: all 0.2s ease; font-weight: 400; font-size: 14px; line-height: normal; height: auto; transform: none; vertical-align: middle; overflow: visible; position: relative; top: 0;"
                @click="() => handleSpecTagClickOnly(spec.id)">
                {{ spec.specName }}
              </el-tag>
            </div>
            <el-divider style="margin: 10px 0 20px 0;" />
            <div v-if="activeSpecId">
              <el-check-tag v-for="opt in specOptMap[activeSpecId] || []" :key="opt.id"
                :checked="isOptSelected(activeSpecId, opt.id)" @change="checked => toggleOpt(activeSpecId, opt.id)"
                style="margin: 0 8px 8px 0; padding: 6px 12px; border-radius: 6px; font-size: 14px; transition: all 0.2s ease;">
                {{ opt.optName }}
              </el-check-tag>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createStep > 0 ? createStep-- : createDialogVisible = false">上一步</el-button>
        <el-button v-if="createStep < 2" type="primary" @click="createStep++">下一步</el-button>
        <el-button v-else type="primary" @click="handleCreateConfirm">确 定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑商品" width="800px" @close="editDialogVisible = false">
      <el-steps :active="editStep" finish-status="success" simple>
        <el-step title="基本信息" />
        <el-step title="详细描述" />
        <el-step title="规格设置" />
      </el-steps>
      <el-form :model="editForm" :rules="editFormRules" label-width="90px" v-show="editStep === 0">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品分类" prop="categoryId">
          <el-tree-select v-model="editForm.categoryId" :data="categoryTree"
            :props="{ label: 'name', value: 'id', children: 'children' }" placeholder="请选择商品分类" check-strictly
            :render-after-expand="false" style="width: 100%" />
        </el-form-item>
      </el-form>
      <el-form :model="editForm" :rules="editFormRules" label-width="90px" v-show="editStep === 1">
        <el-form-item label="详细描述" prop="detailDesc">
          <Editor v-model="editForm.detailDesc" :height="400" />
        </el-form-item>
      </el-form>
      <el-form :model="editForm" :rules="editFormRules" label-width="90px" v-show="editStep === 2">
        <el-form-item label="规格">
          <div class="spec-container">
            <div style="margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
              <el-tag v-for="spec in specList" :key="spec.id"
                :class="editActiveSpecId === spec.id ? 'active-spec-tag' : 'default-spec-tag'"
                style="cursor: pointer; user-select: none; display: inline-flex; align-items: center; justify-content: center; padding: 6px 12px !important; margin: 0 8px 8px 0 !important; border-radius: 6px; transition: all 0.2s ease; font-weight: 400; font-size: 14px; line-height: normal; height: auto; transform: none; vertical-align: middle; overflow: visible; position: relative; top: 0;"
                @click="() => handleEditSpecTagClick(spec.id)">
                {{ spec.specName }}
              </el-tag>
            </div>
            <el-divider style="margin: 10px 0 20px 0;" />
            <div v-if="editActiveSpecId">
              <el-check-tag v-for="opt in specOptMap[editActiveSpecId] || []" :key="opt.id"
                :checked="isEditOptSelected(editActiveSpecId, opt.id)"
                @change="checked => toggleEditOpt(editActiveSpecId, opt.id)"
                style="margin: 0 8px 8px 0; padding: 6px 12px; border-radius: 6px; font-size: 14px; transition: all 0.2s ease;">
                {{ opt.optName }}
              </el-check-tag>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editStep > 0 ? editStep-- : editDialogVisible = false">上一步</el-button>
        <el-button v-if="editStep < 2" type="primary" @click="editStep++">下一步</el-button>
        <el-button v-else type="primary" @click="handleEditConfirm">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 图片管理弹出框 -->
    <el-dialog v-model="imageManageDialogVisible" :title="'图片管理 - ' + currentProduct.name" width="600px" @close="handleImageManageClose" :close-on-press-escape="false">
      <el-tabs v-model="activeImageTab">
        <!-- 主图tab -->
        <el-tab-pane label="主图" name="main">
          <!-- 主图展示 -->
          <div class="main-image-container">
            <ImagePreview v-if="mainImageUrl" :src="mainImageUrl" :width="200" :height="200" />
            <i v-else class="el-icon-plus main-image-uploader-icon"></i>
          </div>

          <!-- 主图上传 -->
          <el-upload
            class="main-image-uploader"
            :show-file-list="false"
            :on-success="handleMainImageSuccess"
            :before-upload="beforeMainImageUpload"
            :http-request="handleMainImageUpload">
            <el-button type="primary">上传主图</el-button>
          </el-upload>
        </el-tab-pane>

        <!-- 滚动图tab -->
        <el-tab-pane label="滚动图" name="carousel">
          <!-- 滚动图列表 -->
          <div class="carousel-images" style="margin-bottom: 20px;">
            <div v-for="(image, index) in carouselImages" :key="index" class="carousel-image-item">
              <ImagePreview :src="image.url" :width="100" :height="100" />
              <el-button type="danger" icon="Delete" circle @click="handleDeleteCarouselImage(index)"></el-button>
            </div>
          </div>

          <!-- 分页 -->
          <pagination v-show="imageTotal > 0" :total="imageTotal" v-model:page="imageQueryParamsRef.current" v-model:limit="imageQueryParamsRef.size"
            @pagination="handleImageManage(currentProduct)" style="margin-bottom: 20px;" />

          <!-- 滚动图上传 -->
          <el-upload
            class="carousel-image-uploader"
            :show-file-list="false"
            :on-success="handleCarouselImageSuccess"
            :before-upload="beforeCarouselImageUpload"
            :http-request="handleCarouselImageUpload">
            <el-button type="primary">上传滚动图</el-button>
          </el-upload>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { resolveApiUrl } from '@/utils/download'
import { listSpu, createSpu, updateSpu, deleteSpu, getSpuDetail, setMainImage } from '@/api/mall/spu'
import { setCarouselImages, listSpuImages, deleteSpuImage } from '@/api/mall/spuImage'
import { getCategoryTree } from '@/api/mall/category'
import { listSpecDef, listSpecOptDef } from '@/api/mall/specDef'
import RightToolbar from '@/components/RightToolbar/index.vue'
import Pagination from '@/components/Pagination/index.vue'
import ImagePreview from '@/components/ImagePreview/index.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, CircleCheck, PriceTag } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import Editor from '@/components/Editor/index.vue'

const tableData = ref([])
const loading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const selectedRows = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0
)
const router = useRouter()

const queryParams = ref({
  name: '',
  categoryId: '',
  current: 1,
  size: 10
})

const createDialogVisible = ref(false)
const createStep = ref(0)
const createForm = ref({ name: '', categoryId: '', specs: [], detailDesc: '' })
const createFormRules = {
  name: [ { required: true, message: '请输入商品名称', trigger: 'blur' } ],
  categoryId: [ { required: true, message: '请输入所属分类', trigger: 'blur' } ]
}

const editDialogVisible = ref(false)
const editStep = ref(0)
const editForm = ref({ id: '', name: '', categoryId: '', specs: [], detailDesc: '', detailImages: null })
const editFormRules = {
  name: [ { required: true, message: '请输入商品名称', trigger: 'blur' } ],
  categoryId: [ { required: true, message: '请选择所属分类', trigger: 'blur' } ]
}

// 图片管理相关
const imageManageDialogVisible = ref(false)
const activeImageTab = ref('main')
const currentProduct = ref({})
const mainImageUrl = ref('')
const carouselImages = ref([])
const imageTotal = ref(0)
const imageQueryParamsRef = ref({
  current: 1,
  size: 10
})

const editActiveSpecId = ref(null)
const editSelectedSpecs = ref([])
const categoryTree = ref([])
const specList = ref([])
const specOptMap = ref({}) // {specId: [选项列表]}
const activeSpecId = ref(null)
const selectedSpecs = ref([]) // [{specId, optIds: []}]

const filteredTableData = computed(() => tableData.value)

fetchCategoryTree()

// 获取分类树
async function fetchCategoryTree() {
  const res = await getCategoryTree({ shopId: getShopId() })
  categoryTree.value = res.data || []
}
// 获取所有规格及选项
async function fetchSpecs() {
  const res = await listSpecDef({ shopId: getShopId() })
  specList.value = res.data?.records || []
  // 获取每个规格的选项
  for (const spec of specList.value) {
    const optRes = await listSpecOptDef({ shopId: getShopId(), specId: spec.id })
    specOptMap.value[spec.id] = optRes.data || []
  }
  if (specList.value.length) activeSpecId.value = specList.value[0].id
}

// 规格选项选择逻辑
function toggleOpt(specId, optId) {
  let spec = selectedSpecs.value.find(s => s.specId === specId)
  if (!spec) {
    spec = { specId, optIds: [] }
    selectedSpecs.value.push(spec)
  }
  const idx = spec.optIds.indexOf(optId)
  if (idx > -1) {
    spec.optIds.splice(idx, 1)
  } else {
    spec.optIds.push(optId)
  }
}
function isOptSelected(specId, optId) {
  // const optIds = editSelectedSpecs.value[specId] || []
  // return optIds.includes(optId)
  const spec = selectedSpecs.value.find(item => item.specId === specId)
  return spec ? spec.optIds.includes(optId) : false
}
function isEditOptSelected(specId, optId) {
  console.log('isEditOptSelected...specId: ' + specId + ', optId: ' + optId + ', editSelectedSpecs.value: ' + JSON.stringify(editSelectedSpecs.value))
  const spec = editSelectedSpecs.value.find(item => item.specId == specId)
  let r = spec ? spec.optIds.includes(optId) : false
  console.log('r: ' + r);
  return r;
}
function handleSpecTagClickOnly(specId) {
  activeSpecId.value = specId;
}
function handleEditSpecTagClick(specId) {
  editActiveSpecId.value = specId;
}
// 删除规格全选相关函数
// function isSpecAllSelected(specId) {
//   const opts = specOptMap.value[specId] || []
//   const spec = selectedSpecs.value.find(s => s.specId === specId)
//   return spec && spec.optIds.length === opts.length
// }
// function handleSpecAllSelect(specId, checked) {
//   const opts = specOptMap.value[specId] || []
//   let spec = selectedSpecs.value.find(s => s.specId === specId)
//   if (!spec) {
//     spec = { specId, optIds: [] }
//     selectedSpecs.value.push(spec)
//   }
//   if (checked) {
//     spec.optIds = opts.map(opt => opt.id)
//   } else {
//     spec.optIds = []
//   }
// }
function handleSpecClear(specId) {
  const spec = selectedSpecs.value.find(s => s.specId === specId)
  if (spec) spec.optIds = []
}

function handleQuery() {
  queryParams.value.current = 1
  getList()
}
function resetQuery() {
  queryParams.value.name = ''
  queryParams.value.categoryId = ''
  handleQuery()
}
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  selectedRows.value = selection
  single.value = selection.length !== 1
  multiple.value = !selection.length
}
function handleAdd() {
  createForm.value = { name: '', categoryId: '', specs: [], detailDesc: '' }
  createStep.value = 0
  selectedSpecs.value = []
  fetchSpecs()
  createDialogVisible.value = true
}
// 从富文本内容中提取图片URL并解析出fileKey
function extractImagesFromRichText(content) {
  if (!content) return [];

  const fileKeys = [];
  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const imageUrl = match[1];
    // 从URL中提取fileKey
    const urlParams = new URLSearchParams(imageUrl.split('?')[1] || '');
    const fileKey = urlParams.get('fileKey');
    if (fileKey) {
      fileKeys.push(fileKey);
    }
  }

  return fileKeys;
}

function handleCreateConfirm() {
  if (!createForm.value.name || !createForm.value.categoryId) {
    ElMessage.warning('请填写完整信息')
    return
  }

  createForm.value.specs = selectedSpecs.value.filter(s => s.optIds.length)
  console.log('selectedSpecs.value: ', JSON.stringify(createForm.value.specs))

  // 提取富文本中的图片
  const detailImages = extractImagesFromRichText(createForm.value.detailDesc);

  createSpu({
    shopId: getShopId(),
    name: createForm.value.name,
    categoryId: createForm.value.categoryId,
    specs: createForm.value.specs,
    detailDesc: createForm.value.detailDesc,
    detailImages: detailImages
  }).then(res => {
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    getList()
  }).catch(() => {
    ElMessage.error('创建失败')
  })
}
function handleUpdate(row) {
  let target = row
  if (!target) {
    if (selectedRows.value.length !== 1) {
      ElMessage.warning('请选择一个要编辑的商品')
      return
    }
    target = selectedRows.value[0]
  }
  // 调用详情接口获取产品规格配置
  getSpuDetail(row.id).then(res => {
    const data = res.data || {};
    // 初始化表单数据
    editForm.value = {
      ...data,
      detailImages: data.detailImages || null
    };
    // 保存原始的detailDesc用于比较
    editForm.value.originalDetailDesc = data.detailDesc || '';
    // 初始化规格选择状态
    editSelectedSpecs.value = (data.specs || []).map(spec => {
      return {
        specId: String(spec.specId),
        optIds: spec.opts.map(opt => opt.optId)
      }
    });
    console.log('editSelectedSpecs.value: ', JSON.stringify(editSelectedSpecs.value))
    // 设置默认选中的规格
    if (data.specs && data.specs.length) {
      editActiveSpecId.value = data.specs[0].specId;
    }
    // 初始化详细描述
    editForm.value.detailDesc = data.detailDesc || '';

  //   editSelectedSpecs.value = []
    fetchSpecs().then(() => {
      // 初始化规格数据
      // if (row.specs && row.specs.length) {
      //   // 初始化规格选择状态
      //   editSelectedSpecs.value = data.specs.reduce((acc, spec) => {
      //     acc[spec.specId] = spec.opts.map(opt => opt.optId);
      //     return acc;
      //   }, {})
      //   if (editSpecs.value.length) {
      //     editActiveSpecId.value = editSpecs.value[0].specId
      //   }
      // }
  })

    // 数据加载完成后显示编辑弹窗
    editStep.value = 0;
    editDialogVisible.value = true;
  }).catch(error => {
    console.error('获取产品详情失败:', error);
    // 即使接口调用失败也显示弹窗，避免用户操作受阻
    editDialogVisible.value = true;
  });
}
function handleEditConfirm() {
  if (!editForm.value.name || !editForm.value.categoryId) {
    ElMessage.warning('请填写完整信息')
    return
  }

  editForm.value.specs = editSelectedSpecs.value.filter(s => s.optIds.length)
  console.log('editForm.value.specs: ', JSON.stringify(editForm.value.specs))

  // 检查富文本内容是否有改动
  let detailImages = null;
  if (editForm.value.detailDesc !== editForm.value.originalDetailDesc) {
    // 提取富文本中的图片
    detailImages = extractImagesFromRichText(editForm.value.detailDesc);
  }

  updateSpu({
    ...editForm.value,
    detailDesc: editForm.value.detailDesc,
    detailImages: detailImages
  }).then(() => {
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    getList()
  }).catch(() => ElMessage.error('修改失败'))
}
function handleSkuManage(spuId) {
  // 直接使用路径导航确保兼容性
  router.push({ path: '/mall/sku', query: { spuId } })
}

// 图片管理处理函数
function handleImageManage(row) {
  currentProduct.value = row
  // 使用列表数据中的mainImage字段
  mainImageUrl.value = row.mainImage ? getFullImageUrl(row.mainImage) : ''
  carouselImages.value = []

  // 获取滚动图列表
  const imageQueryParams = {
    shopId: getShopId(),
    spuId: currentProduct.value.id,
    'conditions_': 'id:sort:asc',
    current: imageQueryParamsRef.value.current,
    size: imageQueryParamsRef.value.size
  }
  listSpuImages(imageQueryParams).then(res => {
    carouselImages.value = res.data.records.map(item => ({
      url: getFullImageUrl(item.imageUrl),
      id: item.id
    }))
    imageTotal.value = res.data.total
  }).catch(error => {
    console.error('获取滚动图列表失败:', error)
  })

  imageManageDialogVisible.value = true
}

function handleDelete(row) {
  let targets = []
  if (row && row.id) {
    targets = [row.id]
  } else {
    if (!ids.value.length) {
      ElMessage.warning('请选择要删除的商品')
      return
    }
    targets = ids.value
  }
  ElMessageBox.confirm(
    `确认要删除选中的商品吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteSpu(targets).then(() => {
      ElMessage.success('删除成功')
      getList()

    }).catch(() => {})
  }).catch(() => {})
}
function getShopId() {
  return localStorage.getItem('shopId') || ''
}
function getList() {
  loading.value = true
  let conditions = []
  if (queryParams.value.name) {
    conditions.push(`name:like:${queryParams.value.name}`)
  }
  // 分类可根据实际接口调整
  const params = {
    shopId: getShopId(),
    size: queryParams.value.size,
    current: queryParams.value.current
  }
  if (conditions.length) {
    params['conditions_'] = conditions.join(',')
  }
  // categoryId
  if (queryParams.value.categoryId) {
    params['categoryId'] = queryParams.value.categoryId
  }
  listSpu(params).then(res => {
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}
onMounted(() => {
  getList()
})

function toggleEditOpt(specId, optId) {
  console.log('toggleEditOpt', specId, optId, JSON.stringify(editSelectedSpecs.value))
  let spec = editSelectedSpecs.value.find(s => s.specId == specId)
  if (!spec) {
    spec = { specId, optIds: [] }
    editSelectedSpecs.value.push(spec)
  }
  const idx = spec.optIds.indexOf(optId)
  if (idx > -1) {
    spec.optIds.splice(idx, 1)
  } else {
    spec.optIds.push(optId)
  }
}

// 构造完整的图片URL
function getFullImageUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

// 构造完整的API URL
function getFullApiUrl(apiPath) {
  return resolveApiUrl(apiPath)
}

// 图片管理相关处理函数
function handleMainImageUpload(option) {
  // 自定义主图上传处理
  const formData = new FormData();
  formData.append('file', option.file);
  formData.append('shopId', getShopId());
  formData.append('spuId', currentProduct.value.id);

  setMainImage(formData).then(response => {
    // 调用Element Plus上传组件的成功回调
    option.onSuccess(response);
  }).catch(error => {
    // 调用Element Plus上传组件的失败回调
    option.onError(error);
  });
}

function handleCarouselImageUpload(option) {
  // 自定义滚动图上传处理
  const formData = new FormData();
  formData.append('file', option.file);
  formData.append('shopId', getShopId());
  formData.append('spuId', currentProduct.value.id);

  setCarouselImages(formData).then(response => {
    // 调用Element Plus上传组件的成功回调
    option.onSuccess(response);
  }).catch(error => {
    // 调用Element Plus上传组件的失败回调
    option.onError(error);
  });
}

function handleMainImageSuccess(response, file, fileList) {
  // 处理主图上传成功
  // 更新主图URL为新上传的图片
  mainImageUrl.value = getFullImageUrl(response.data.mainImage)

  // 不再同步到列表，只在关闭弹窗后刷新列表
  ElMessage.success('主图设置成功')
}

function beforeMainImageUpload(file) {
  // 主图上传前的检查
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('上传头像图片只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!')
  }

  return isJPG && isLt2M
}

function handleCarouselImageSuccess(response, file, fileList) {
  // 处理滚动图上传成功
  // 更新本地预览
  carouselImages.value.push({
    url: response.data.url, // 假设API返回的图片URL在response.data.url
    id: Date.now() // 临时ID，实际应该使用API返回的ID
  })

  // 刷新滚动图列表
  const imageQueryParams = {
    shopId: getShopId(),
    spuId: currentProduct.value.id,
    'conditions_': 'id:sort:asc',
    current: imageQueryParamsRef.value.current,
    size: imageQueryParamsRef.value.size
  }
  listSpuImages(imageQueryParams).then(res => {
    carouselImages.value = res.data.records.map(item => ({
      url: getFullImageUrl(item.imageUrl),
      id: item.id
    }))
    imageTotal.value = res.data.total
  }).catch(error => {
    console.error('刷新滚动图列表失败:', error)
  })
}

function beforeCarouselImageUpload(file) {
  // 滚动图上传前的检查
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('上传图片只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
  }

  return isJPG && isLt2M
}

function handleDeleteCarouselImage(index) {
  // 删除滚动图
  const imageId = carouselImages.value[index].id;

  ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 将imageId作为数组传递给deleteSpuImage
    deleteSpuImage([imageId]).then(() => {
      ElMessage.success('删除成功');
      // 从本地数组中移除
      carouselImages.value.splice(index, 1);

      // 刷新滚动图列表
      const imageQueryParams = {
        shopId: getShopId(),
        spuId: currentProduct.value.id,
        'conditions_': 'id:sort:asc',
        current: imageQueryParamsRef.value.current,
        size: imageQueryParamsRef.value.size
      };

      listSpuImages(imageQueryParams).then(res => {
        carouselImages.value = res.data.records.map(item => ({
          url: getFullImageUrl(item.imageUrl),
          id: item.id
        }));
        imageTotal.value = res.data.total;
      }).catch(error => {
        console.error('刷新滚动图列表失败:', error);
      });
    }).catch(() => {
      ElMessage.error('删除失败');
    });
  }).catch(() => {
    // 用户取消删除
  });
}

function handleImageManageClose() {
  // 图片管理弹窗关闭时的处理
  // 重新刷新列表
  getList()

  // 重置相关状态
  mainImageUrl.value = ''
  carouselImages.value = []
  currentProduct.value = {}
}

</script>

<style scoped>
.app-container {
  padding: 24px;
}
.mb8 {
  margin-bottom: 8px;
}
/* 规格样式优化 */
.el-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}
.el-tag--primary {
  background-color: #2d62ed;
  color: #ffffff;
  box-shadow: 0 3px 12px rgba(45, 98, 237, 0.35);
}
.el-tag--info {
  background-color: #f2f3f5;
  color: #4e5969;
  border: 1px solid #e5e6eb;
}
.el-tag:hover:not(.el-tag--primary) {
  border-color: #dcdfe6;
  background-color: #eef0f3;
  transform: translateY(-2px);
}
.el-check-tag {
  border: 1px solid #e0e0e0;
}
.el-check-tag:hover {
  border-color: #409eff;
}
.el-check-tag.is-checked {
  background-color: #f0f7ff;
  border-color: #409eff;
  color: #409eff;
}
.spec-container { padding: 10px; }
.active-spec-tag { background: #e6f0ff; color: #1890ff; border: 1px solid #b3d8ff; box-sizing: border-box; }
.default-spec-tag { background: #f5f5f5; color: #333; border: 1px solid #e0e0e0; box-sizing: border-box; }
.active-spec-tag:hover, .default-spec-tag:hover { transform: none !important; padding: 6px 16px !important; border-width: 1px !important; box-shadow: none !important; outline: none !important; }
.spec-title {
  margin-bottom: 12px;
  font-weight: 500;
  color: #333;
}

/* 图片管理样式 */
.main-image-container {
  width: 200px;
  height: 200px;
  margin-bottom: 20px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-image-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 200px;
  height: 40px;
}

.main-image-uploader:hover {
  border-color: var(--el-color-primary);
}

.main-image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 200px;
  height: 200px;
  text-align: center;
  line-height: 200px;
}

.main-image {
  width: 200px;
  height: 200px;
  display: block;
}

.carousel-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  padding-top: 10px;
}

.carousel-image-item {
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 10px;
}

.carousel-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.carousel-image-item .el-button {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 20px;
  height: 20px;
  padding: 0;
}

.carousel-image-uploader {
  width: 100%;
}
</style>
