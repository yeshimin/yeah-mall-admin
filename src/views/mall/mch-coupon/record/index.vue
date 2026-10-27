<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="searchFormRef" :inline="true" v-show="showSearch">
      <el-form-item label="优惠券">
        <el-select
          v-model="queryParams.couponId"
          placeholder="请选择优惠券"
          clearable
          style="width: 200px"
        >
          <el-option
            v-for="coupon in couponList"
            :key="coupon.id"
            :label="coupon.name"
            :value="coupon.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用户信息">
        <el-input
          v-model="queryParams.userInfo"
          placeholder="请输入用户名/手机号"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="使用状态">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择使用状态"
          clearable
          style="width: 120px"
        >
          <el-option label="未使用" value="0" />
          <el-option label="已使用" value="1" />
          <el-option label="已过期" value="2" />
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

    <el-table v-loading="loading" :data="recordList" style="width: 100%">
      <el-table-column label="序号" type="index" width="80" />
      <el-table-column prop="couponName" label="优惠券名称" min-width="150" />
      <el-table-column prop="couponType" label="优惠券类型" width="100">
        <template #default="scope">
          {{ getTypeText(scope.row.couponType) }}
        </template>
      </el-table-column>
      <el-table-column prop="couponValue" label="优惠金额/折扣" width="120">
        <template #default="scope">
          {{ Number(scope.row.couponType) === 2 ? scope.row.couponValue + '折' : '¥' + scope.row.couponValue }}
        </template>
      </el-table-column>
      <el-table-column prop="minAmount" label="使用条件" width="120">
        <template #default="scope">
          {{ scope.row.minAmount > 0 ? '满¥' + scope.row.minAmount : '无门槛' }}
        </template>
      </el-table-column>
      <el-table-column prop="memberName" label="使用用户" width="120" />
      <el-table-column label="领取渠道" width="110">
        <template #default="scope">
          <el-tag type="info">
            {{ scope.row.receiveChannelName || '-' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sourcePointsOrderNo" label="积分订单号" min-width="160">
        <template #default="scope">{{ scope.row.sourcePointsOrderNo || '-' }}</template>
      </el-table-column>
      <el-table-column prop="orderNo" label="订单号" min-width="180" />
      <el-table-column prop="orderAmount" label="订单金额" width="120">
        <template #default="scope">
          ¥{{ scope.row.orderAmount }}
        </template>
      </el-table-column>
      <el-table-column prop="discountAmount" label="优惠金额" width="120">
        <template #default="scope">
          ¥{{ scope.row.discountAmount }}
        </template>
      </el-table-column>
      <el-table-column prop="useTime" label="使用时间" width="180" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import RightToolbar from '@/components/RightToolbar/index.vue'
import { getMchCouponList, queryMchCouponRecord } from '@/api/mall/mchCoupon'
import { getCurrentShop } from '@/utils/shop'

// 路由
const route = useRoute()

// 响应式数据
const loading = ref(false)
const showSearch = ref(true)

// 查询参数
const queryParams = reactive({
  couponId: '',
  userInfo: '',
  status: ''
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 记录列表
const recordList = ref([])

// 优惠券列表
const couponList = ref([])

// 初始化
onMounted(() => {
  // 获取优惠券列表
  getCouponListData()

  // 处理路由参数
  const couponId = route.query.couponId
  if (couponId) {
    queryParams.couponId = couponId
  }

  getList()
})

// 获取优惠券列表
function getCouponListData() {
  const shopId = getCurrentShop()?.id
  if (!shopId) {
    ElMessage.warning('请先选择店铺')
    return
  }
  getMchCouponList({ shopId, current: 1, size: 100 }).then((res) => {
    couponList.value = res.data?.records || []
  })
}

// 获取使用记录
function getList() {
  loading.value = true
  const shopId = getCurrentShop()?.id
  if (!shopId) {
    loading.value = false
    ElMessage.warning('请先选择店铺')
    return
  }
  queryMchCouponRecord({
    shopId,
    current: pagination.current,
    size: pagination.size,
    couponId: queryParams.couponId || undefined,
    memberKeyword: queryParams.userInfo || undefined,
    status: queryParams.status === '' ? undefined : queryParams.status
  }).then((res) => {
    recordList.value = res.data?.records || []
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
    couponId: '',
    userInfo: '',
    status: ''
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

// 获取优惠券类型文本
function getTypeText(type) {
  const typeMap = {
    '1': '满减券',
    '2': '折扣券',
    '3': '无门槛券'
  }
  return typeMap[type] || '未知'
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    '0': '未使用',
    '1': '已使用',
    '2': '已过期'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
function getStatusTagType(status) {
  const typeMap = {
    '0': 'info',
    '1': 'success',
    '2': 'warning'
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
</style>
