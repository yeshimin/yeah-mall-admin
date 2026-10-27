<template>
  <div class="mall-page">
    <el-form :model="queryParams" ref="searchFormRef" :inline="true" v-show="showSearch">
      <el-form-item label="活动名称">
        <el-input
          v-model="queryParams.activityName"
          placeholder="请输入活动名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="商品名称">
        <el-input
          v-model="queryParams.productName"
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
          <el-option label="审核通过" value="2" />
          <el-option label="审核驳回" value="3" />
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

    <el-row :gutter="10" class="mall-action-row">
      <MallListTools v-model:showSearch="showSearch" @refresh="getList" />
    </el-row>

    <el-table v-loading="loading" :data="applyList" style="width: 100%">
      <el-table-column label="序号" type="index" width="80" />
      <el-table-column prop="activityName" label="活动名称" min-width="200" />
      <el-table-column label="报名商品" min-width="220">
        <template #default="scope">
          <div class="product-cell">
            <el-image v-if="scope.row.mainImage" :src="getImagePreviewUrl(scope.row.mainImage)" fit="cover" class="product-image" />
            <div v-else class="product-image product-image-placeholder">暂无图片</div>
            <span class="product-name">{{ scope.row.spuName || '-' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="auditStatus" label="审核状态" width="120">
        <template #default="scope">
          <el-tag :type="getAuditStatusTagType(scope.row.auditStatus)">
            {{ getAuditStatusText(scope.row.auditStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="申请时间" width="180" />
      <el-table-column label="审核时间" width="180">
        <template #default="scope">{{ Number(scope.row.auditStatus) === 1 ? '-' : (scope.row.updateTime || '-') }}</template>
      </el-table-column>
      <el-table-column prop="auditRemark" label="审核备注" min-width="200" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleView(scope.row)" plain>
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

    <!-- 申请详情对话框 -->
    <el-dialog title="申请详情" v-model="detailDialogVisible" width="600px">
      <el-form :model="detailForm" label-width="100px">
        <el-form-item label="活动名称">
          <el-input v-model="detailForm.activityName" disabled />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="detailForm.productName" disabled />
        </el-form-item>
        <el-form-item label="商品图片">
          <el-image v-if="detailForm.mainImage" :src="getImagePreviewUrl(detailForm.mainImage)" fit="cover" class="detail-product-image" />
          <span v-else class="table-secondary">暂无图片</span>
        </el-form-item>
        <el-form-item label="拼团价格">
          <el-input v-model="detailForm.groupPrice" disabled />
        </el-form-item>
        <el-form-item label="报名库存">
          <el-input v-model="detailForm.stock" disabled />
        </el-form-item>
        <el-form-item label="申请备注">
          <el-input v-model="detailForm.applyRemark" type="textarea" rows="3" disabled />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-tag :type="getAuditStatusTagType(detailForm.auditStatus)">
            {{ getAuditStatusText(detailForm.auditStatus) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input v-model="detailForm.auditRemark" type="textarea" rows="3" disabled />
        </el-form-item>
        <el-form-item label="申请时间">
          <el-input v-model="detailForm.applyTime" disabled />
        </el-form-item>
        <el-form-item label="审核时间">
          <el-input :model-value="detailForm.auditTime || '-'" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, View } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { queryMchGroupBuyApplyList } from '@/api/mall/groupBuy'
import MallListTools from '@/components/mall/MallListTools.vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { getCurrentShop } from '@/utils/shop'

// 响应式数据
const loading = ref(false)
const showSearch = ref(true)
const detailDialogVisible = ref(false)
const route = useRoute()

// 查询参数
const queryParams = reactive({
  activityName: '',
  productName: '',
  mainImage: '',
  auditStatus: ''
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 申请列表
const applyList = ref([])

// 详情表单
const detailForm = reactive({
  id: '',
  activityName: '',
  productName: '',
  groupPrice: '',
  stock: '',
  applyRemark: '',
  auditStatus: '',
  auditRemark: '',
  applyTime: '',
  auditTime: ''
})

// 初始化
onMounted(() => {
  getList()
})

// 获取申请列表
function getList() {
  const currentShop = getCurrentShop()
  if (!currentShop) {
    applyList.value = []
    pagination.total = 0
    return
  }
  loading.value = true
  queryMchGroupBuyApplyList({
    current: pagination.current,
    size: pagination.size,
    activityId: route.query.activityId || undefined,
    activityName: queryParams.activityName || undefined,
    productName: queryParams.productName || undefined,
    auditStatus: queryParams.auditStatus || undefined,
    shopId: currentShop.id
  }).then((res) => {
    applyList.value = res.data?.records || []
    pagination.total = Number(res.data?.total || 0)
  }).finally(() => {
    loading.value = false
  })
}

// 查看申请详情
function handleView(row) {
  // 填充详情表单
  detailForm.id = row.id
  detailForm.activityName = row.activityName
  detailForm.productName = row.spuName
  detailForm.mainImage = row.mainImage
  detailForm.groupPrice = formatPriceRange(row.minGroupPrice, row.maxGroupPrice)
  detailForm.stock = row.groupStock ?? 0
  detailForm.applyRemark = row.applyRemark
  detailForm.auditStatus = row.auditStatus
  detailForm.auditRemark = row.auditRemark
  detailForm.applyTime = row.createTime
  detailForm.auditTime = Number(row.auditStatus) === 1 ? '' : row.updateTime

  // 打开详情对话框
  detailDialogVisible.value = true
}

// 查询
function handleQuery() {
  pagination.current = 1
  getList()
}

// 重置
function resetQuery() {
  Object.assign(queryParams, {
    activityName: '',
    productName: '',
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

// 获取审核状态文本
function getAuditStatusText(status) {
  const statusMap = {
    '1': '待审核',
    '2': '审核通过',
    '3': '审核驳回'
  }
  return statusMap[status] || '未知'
}

// 获取审核状态标签类型
function getAuditStatusTagType(status) {
  const typeMap = {
    '1': 'warning',
    '2': 'success',
    '3': 'danger'
  }
  return typeMap[status] || 'info'
}

function formatPriceRange(minPrice, maxPrice) {
  const min = Number(minPrice || 0).toFixed(2)
  const max = Number(maxPrice || 0).toFixed(2)
  return min === max ? `¥${min}` : `¥${min} - ¥${max}`
}

function getImagePreviewUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}
</script>

<style scoped>
.mall-page {
  padding: 24px;
}

.mall-action-row {
  margin-bottom: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  text-align: right;
}

.product-cell { display: flex; align-items: center; gap: 10px; }
.product-image { flex: 0 0 auto; width: 44px; height: 44px; border-radius: 4px; }
.product-image-placeholder { display: flex; align-items: center; justify-content: center; color: var(--el-text-color-placeholder); background: var(--el-fill-color-light); font-size: 12px; }
.product-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.detail-product-image { width: 72px; height: 72px; border-radius: 4px; }
.table-secondary { color: var(--el-text-color-secondary); font-size: 13px; }
</style>
