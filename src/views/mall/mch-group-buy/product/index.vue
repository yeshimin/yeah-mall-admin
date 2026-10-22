<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="searchFormRef" :inline="true" v-show="showSearch">
      <el-form-item label="商品名称">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入商品名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select
          v-model="queryParams.auditStatus"
          placeholder="请选择审核状态"
          clearable
          style="width: 120px"
        >
          <el-option label="待审核" value="1" />
          <el-option label="已通过" value="2" />
          <el-option label="已驳回" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetQuery">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="productList" style="width: 100%">
      <el-table-column label="序号" type="index" width="80" />
      <el-table-column prop="name" label="商品名称" min-width="200" />
      <el-table-column label="商品图片" width="120">
        <template #default="scope">
          <el-image
            v-if="scope.row.mainImage"
            :src="getImagePreviewUrl(scope.row.mainImage)"
            fit="cover"
            style="width: 80px; height: 80px"
          >
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <el-empty v-else description="" style="width: 80px; height: 80px" />
        </template>
      </el-table-column>
      <el-table-column prop="minOriginPrice" label="原价" width="100">
        <template #default="scope">
          ¥{{ scope.row.minOriginPrice }}
        </template>
      </el-table-column>
      <el-table-column prop="minGroupPrice" label="拼团价" width="100">
        <template #default="scope">
          {{ formatPriceRange(scope.row.minGroupPrice, scope.row.maxGroupPrice) }}
        </template>
      </el-table-column>
      <el-table-column prop="groupStock" label="报名库存" width="100" />
      <el-table-column prop="minPeople" label="每团人数" width="120" />
      <el-table-column prop="sales" label="销量" width="100" />
      <el-table-column prop="auditStatus" label="审核状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.auditStatus)">
            {{ getStatusText(scope.row.auditStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" plain @click="handleView(scope.row)">
            <el-icon><View /></el-icon>
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" style="margin-top: 20px; text-align: right;">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="Number(pagination.total)"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog title="拼团商品详情" v-model="detailDialogVisible" width="720px">
      <el-form :model="detailProduct" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="活动名称"><el-input v-model="detailProduct.activityName" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="店铺"><el-input v-model="detailProduct.shopName" disabled /></el-form-item></el-col>
        </el-row>
        <el-form-item label="商品信息">
          <div class="detail-product-summary">
            <el-image v-if="detailProduct.mainImage" :src="getImagePreviewUrl(detailProduct.mainImage)" fit="cover" class="detail-product-image" />
            <div>
              <div class="detail-product-name">{{ detailProduct.name || '-' }}</div>
              <div class="detail-product-meta">原价 {{ detailProduct.originPrice }}，拼团价 {{ detailProduct.groupPrice }}，库存 {{ detailProduct.groupStock }}</div>
            </div>
          </div>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="每团人数"><el-input :model-value="String(detailProduct.minPeople || '-')" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="销量"><el-input :model-value="String(detailProduct.sales || 0)" disabled /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="创建时间"><el-input :model-value="detailProduct.createTime || '-'" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="更新时间"><el-input :model-value="detailProduct.updateTime || '-'" disabled /></el-form-item></el-col>
        </el-row>
        <el-form-item label="审核状态"><el-tag :type="getStatusTagType(detailProduct.auditStatus)">{{ getStatusText(detailProduct.auditStatus) }}</el-tag></el-form-item>
        <el-form-item label="商品描述">
          <Editor v-model="detailProduct.detailDesc" :height="240" readonly />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="detailDialogVisible = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { Search, Refresh, Picture, View } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import RightToolbar from '@/components/RightToolbar/index.vue'
import { queryMchGroupBuyProductList } from '@/api/mall/groupBuy'
import { getCurrentShop } from '@/utils/shop'
import Editor from '@/components/Editor/index.vue'

// 响应式数据
const loading = ref(false)
const showSearch = ref(true)
const detailDialogVisible = ref(false)
const route = useRoute()

// 查询参数
const queryParams = reactive({
  name: '',
  auditStatus: ''
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 商品列表
const productList = ref([])
const detailProduct = reactive({
  activityName: '', shopName: '', name: '', mainImage: '', originPrice: '', groupPrice: '', groupStock: 0,
  minPeople: 0, sales: 0, createTime: '', updateTime: '', auditStatus: '', detailDesc: '',
})

// 初始化
onMounted(() => {
  getList()
})

// 获取商品列表
function getList() {
  const currentShop = getCurrentShop()
  if (!currentShop) {
    productList.value = []
    pagination.total = 0
    return
  }
  loading.value = true
  queryMchGroupBuyProductList({
    current: pagination.current,
    size: pagination.size,
    activityId: route.query.activityId || undefined,
    name: queryParams.name || undefined,
    auditStatus: queryParams.auditStatus || undefined,
    shopId: currentShop.id,
  }).then((res) => {
    productList.value = res.data?.records || []
    pagination.total = Number(res.data?.total || 0)
  }).finally(() => {
    loading.value = false
  })
}

// 查询
function handleQuery() {
  pagination.current = 1
  getList()
}

// 重置
function resetQuery() {
  Object.assign(queryParams, {
    name: '',
    auditStatus: ''
  })
  handleQuery()
}

// 分页大小变化
function handleSizeChange(size) {
  pagination.size = size
  getList()
}

// 当前页码变化
function handleCurrentChange(current) {
  pagination.current = current
  getList()
}

// 获取图片预览URL
function getImagePreviewUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

function handleView(row) {
  Object.assign(detailProduct, {
    activityName: row.activityName,
    shopName: row.shopName,
    name: row.name,
    mainImage: row.mainImage,
    originPrice: formatPriceRange(row.minOriginPrice, row.maxOriginPrice),
    groupPrice: formatPriceRange(row.minGroupPrice, row.maxGroupPrice),
    groupStock: row.groupStock ?? 0,
    minPeople: row.minPeople,
    sales: row.sales,
    createTime: row.createTime,
    updateTime: row.updateTime,
    auditStatus: row.auditStatus,
    detailDesc: row.detailDesc || '',
  })
  detailDialogVisible.value = true
}

function formatPriceRange(minPrice, maxPrice) {
  const min = Number(minPrice || 0).toFixed(2)
  const max = Number(maxPrice || 0).toFixed(2)
  return min === max ? `¥${min}` : `¥${min} - ¥${max}`
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    '1': '待审核',
    '2': '已通过',
    '3': '已驳回'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
function getStatusTagType(status) {
  const typeMap = {
    '1': 'warning',
    '2': 'success',
    '3': 'danger'
  }
  return typeMap[status] || 'info'
}
</script>

<style scoped>
.app-container {
  padding: 24px;
}

.mb8 {
  margin-bottom: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background-color: #f5f7fa;
}

.detail-product-summary { display: flex; align-items: center; gap: 12px; }
.detail-product-image { width: 72px; height: 72px; border-radius: 4px; }
.detail-product-name { font-weight: 500; color: var(--el-text-color-primary); }
.detail-product-meta { margin-top: 6px; color: var(--el-text-color-secondary); font-size: 13px; }
</style>
