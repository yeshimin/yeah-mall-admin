<template>
  <div class="mall-page">
    <section class="mall-filter-panel">
    <el-form :model="queryParams" ref="searchFormRef" :inline="true" v-show="showSearch" class="mall-query-form">
      <el-form-item label="活动名称">
        <el-select
          v-model="queryParams.activityId"
          placeholder="请选择活动"
          clearable
          style="width: 200px"
        >
          <el-option
            v-for="activity in activityList"
            :key="activity.id"
            :label="activity.name"
            :value="activity.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="商家名称">
        <el-input
          v-model="queryParams.mchName"
          placeholder="请输入商家名称"
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
      <el-form-item class="mall-query-actions">
        <el-button @click="resetQuery">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button type="primary" @click="handleQuery">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
      </el-form-item>
    </el-form>

    <div class="mall-business-actions">
      <MallListTools v-model:showSearch="showSearch" @refresh="getList" />
    </div>
    </section>

    <section class="mall-table-panel">
    <el-table v-loading="loading" :data="applyList" style="width: 100%">
      <el-table-column label="序号" type="index" width="70" />
      <el-table-column prop="activityName" label="活动名称" min-width="160" show-overflow-tooltip />
      <el-table-column label="报名商品" min-width="240">
        <template #default="scope">
          <div class="product-cell">
            <el-image v-if="scope.row.mainImage" :src="getImagePreviewUrl(scope.row.mainImage)" fit="cover" class="product-image" />
            <div v-else class="product-image product-image-placeholder">暂无图片</div>
            <span class="product-name">{{ scope.row.spuName || '-' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="商家 / 店铺" min-width="180" show-overflow-tooltip>
        <template #default="scope">
          <div>{{ scope.row.mchName || '-' }}</div>
          <div class="table-secondary">{{ scope.row.shopName || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="拼团价格" width="150">
        <template #default="scope">{{ formatPriceRange(scope.row.minGroupPrice, scope.row.maxGroupPrice) }}</template>
      </el-table-column>
      <el-table-column prop="groupStock" label="报名库存" width="100" />
      <el-table-column prop="auditStatus" label="审核状态" width="120">
        <template #default="scope">
          <el-tag :type="getAuditStatusTagType(scope.row.auditStatus)">
            {{ getAuditStatusText(scope.row.auditStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="申请时间" width="180" />
      <el-table-column label="审核时间" width="180">
        <template #default="scope">{{ getAuditTime(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleView(scope.row)" plain>
            <el-icon><View /></el-icon>
            {{ isPendingAudit(scope.row.auditStatus) ? '审核' : '查看' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        layout="sizes, prev, pager, next, jumper"
        :total="Number(pagination.total)"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    </section>

    <!-- 申请详情与审核对话框 -->
    <el-dialog :title="canAudit ? '查看并审核申请' : '申请详情'" v-model="auditDialogVisible" width="760px">
      <el-form :model="auditForm" label-width="100px" class="apply-detail-form">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="活动名称"><el-input v-model="auditForm.activityName" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="商家 / 店铺"><el-input :model-value="formatMerchantShop()" disabled /></el-form-item></el-col>
        </el-row>
        <el-form-item label="报名商品">
          <div class="detail-product">
            <el-image v-if="auditForm.mainImage" :src="getImagePreviewUrl(auditForm.mainImage)" fit="cover" class="detail-product-image" />
            <div>
              <div class="detail-product-name">{{ auditForm.productName || '-' }}</div>
              <div class="table-secondary">拼团价格：{{ auditForm.groupPrice }}，报名库存：{{ auditForm.stock }}</div>
            </div>
          </div>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="申请时间"><el-input v-model="auditForm.createTime" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="审核时间"><el-input :model-value="auditForm.updateTime || '-'" disabled /></el-form-item></el-col>
        </el-row>
        <el-form-item label="申请备注"><el-input v-model="auditForm.applyRemark" type="textarea" :rows="3" disabled /></el-form-item>
        <el-form-item label="审核状态">
          <el-radio-group v-if="canAudit" v-model="auditForm.reviewStatus">
            <el-radio label="2">通过</el-radio>
            <el-radio label="3">驳回</el-radio>
          </el-radio-group>
          <el-tag v-else :type="getAuditStatusTagType(auditForm.auditStatus)">{{ getAuditStatusText(auditForm.auditStatus) }}</el-tag>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input v-model="auditForm.auditRemark" type="textarea" :rows="3" :disabled="!canAudit" :placeholder="canAudit ? '审核通过或驳回原因' : ''" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="auditDialogVisible = false">{{ canAudit ? '取消' : '关闭' }}</el-button>
          <el-button v-if="canAudit" type="primary" @click="submitAudit">提交审核</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, View } from '@element-plus/icons-vue'
import MallListTools from '@/components/mall/MallListTools.vue'
import { auditGroupBuyApply, queryGroupBuyActivityList, queryGroupBuyApplyList } from '@/api/mall/groupBuy'
import { getStoragePreviewUrl } from '@/utils/storage'
import { useRoute } from 'vue-router'

// 响应式数据
const loading = ref(false)
const showSearch = ref(true)
const auditDialogVisible = ref(false)
const activityList = ref([])
const route = useRoute()
const canAudit = computed(() => isPendingAudit(auditForm.auditStatus))

// 查询参数
const queryParams = reactive({
  // 从活动列表进入时默认筛选该活动，重置后可查看全部报名申请。
  activityId: route.query.activityId || '',
  mchName: '',
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

// 审核表单
const auditForm = reactive({
  id: '',
  activityName: '',
  mchName: '',
  productName: '',
  mainImage: '',
  shopName: '',
  groupPrice: '',
  stock: '',
  createTime: '',
  updateTime: '',
  applyRemark: '',
  auditStatus: '',
  reviewStatus: '2',
  auditRemark: ''
})

// 初始化
onMounted(() => {
  queryGroupBuyActivityList({ current: 1, size: 100 }).then((res) => {
    activityList.value = res.data?.records || []
  })
  getList()
})

watch(() => route.query.activityId, (activityId) => {
  const nextActivityId = Array.isArray(activityId) ? activityId[0] : (activityId || '')
  if (!nextActivityId || queryParams.activityId === nextActivityId) {
    return
  }
  queryParams.activityId = nextActivityId
  pagination.current = 1
  getList()
})

// 获取申请列表
function getList() {
  loading.value = true
  queryGroupBuyApplyList({
    current: pagination.current,
    size: pagination.size,
    activityId: queryParams.activityId || undefined,
    mchName: queryParams.mchName || undefined,
    auditStatus: queryParams.auditStatus || undefined
  }).then((res) => {
    applyList.value = res.data?.records || []
    pagination.total = Number(res.data?.total || 0)
  }).finally(() => {
    loading.value = false
  })
}

// 打开申请详情；待审核记录可直接在窗口内完成审核。
function handleView(row) {
  auditForm.id = row.id
  auditForm.activityName = row.activityName
  auditForm.mchName = row.mchName
  auditForm.shopName = row.shopName
  auditForm.productName = row.spuName
  auditForm.mainImage = row.mainImage
  auditForm.groupPrice = formatPriceRange(row.minGroupPrice, row.maxGroupPrice)
  auditForm.stock = row.groupStock ?? 0
  auditForm.createTime = row.createTime || '-'
  auditForm.updateTime = isPendingAudit(row.auditStatus) ? '' : (row.updateTime || '-')
  auditForm.applyRemark = row.applyRemark
  auditForm.auditStatus = String(row.auditStatus)
  auditForm.reviewStatus = '2'
  auditForm.auditRemark = row.auditRemark || ''
  auditDialogVisible.value = true
}

// 提交审核
async function submitAudit() {
  if (!canAudit.value || !auditForm.reviewStatus) {
    ElMessage.warning('请选择审核结果')
    return
  }

  try {
    await ElMessageBox.confirm('确定要提交审核结果吗？', '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    await auditGroupBuyApply({
      applyId: auditForm.id,
      auditStatus: Number(auditForm.reviewStatus),
      auditRemark: auditForm.auditRemark
    })
    ElMessage.success('审核成功')
    auditDialogVisible.value = false
    getList()
  } catch {
    // 请求层会展示业务错误，此处仅避免对话框操作留下未处理 Promise。
  }
}

// 查询
function handleQuery() {
  pagination.current = 1
  getList()
}

// 重置
function resetQuery() {
  Object.assign(queryParams, {
    activityId: '',
    mchName: '',
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

function isPendingAudit(status) {
  return Number(status) === 1
}

function getAuditTime(row) {
  return isPendingAudit(row.auditStatus) ? '-' : (row.updateTime || '-')
}

function formatMerchantShop() {
  return [auditForm.mchName, auditForm.shopName].filter(Boolean).join(' / ') || '-'
}

function getImagePreviewUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

function formatPriceRange(minPrice, maxPrice) {
  const min = Number(minPrice || 0).toFixed(2)
  const max = Number(maxPrice || 0).toFixed(2)
  return min === max ? `¥${min}` : `¥${min} - ¥${max}`
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

.product-cell,
.detail-product {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-image {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 4px;
}

.product-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
  font-size: 12px;
}

.product-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-secondary {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.detail-product {
  min-height: 64px;
}

.detail-product-image {
  width: 64px;
  height: 64px;
  border-radius: 4px;
}

.detail-product-name {
  color: var(--el-text-color-primary);
  font-weight: 500;
}
</style>
