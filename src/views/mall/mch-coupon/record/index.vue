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
          <el-option label="已使用" value="1" />
          <el-option label="已过期" value="2" />
          <el-option label="已作废" value="3" />
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
          {{ scope.row.couponType === '2' ? scope.row.couponValue + '折' : '¥' + scope.row.couponValue }}
        </template>
      </el-table-column>
      <el-table-column prop="minAmount" label="使用条件" width="120">
        <template #default="scope">
          {{ scope.row.minAmount > 0 ? '满¥' + scope.row.minAmount : '无门槛' }}
        </template>
      </el-table-column>
      <el-table-column prop="userName" label="使用用户" width="120" />
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

// 模拟优惠券列表数据
const mockCouponList = [
  { id: 1, name: '满100减20优惠券' },
  { id: 2, name: '全场8折优惠券' },
  { id: 3, name: '无门槛10元优惠券' }
]

// 模拟数据
const mockRecordList = [
  {
    id: 1,
    couponName: '满100减20优惠券',
    couponType: '1',
    couponValue: 20,
    minAmount: 100,
    userName: '张三',
    orderNo: '2026031612345678',
    orderAmount: 150,
    discountAmount: 20,
    useTime: '2026-03-16 10:30:00',
    status: '1'
  },
  {
    id: 2,
    couponName: '全场8折优惠券',
    couponType: '2',
    couponValue: 8,
    minAmount: 0,
    userName: '李四',
    orderNo: '2026031687654321',
    orderAmount: 200,
    discountAmount: 40,
    useTime: '2026-03-16 11:15:00',
    status: '1'
  },
  {
    id: 3,
    couponName: '无门槛10元优惠券',
    couponType: '3',
    couponValue: 10,
    minAmount: 0,
    userName: '王五',
    orderNo: '2026031613579246',
    orderAmount: 50,
    discountAmount: 10,
    useTime: '2026-03-16 12:45:00',
    status: '1'
  },
  {
    id: 4,
    couponName: '满100减20优惠券',
    couponType: '1',
    couponValue: 20,
    minAmount: 100,
    userName: '赵六',
    orderNo: '',
    orderAmount: 0,
    discountAmount: 0,
    useTime: '',
    status: '2'
  }
]

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
  // 模拟API调用
  setTimeout(() => {
    couponList.value = mockCouponList
  }, 300)
}

// 获取使用记录
function getList() {
  loading.value = true
  const params = {
    conditions_: `sort:useTime:desc`,
    size: pagination.size,
    current: pagination.current
  }

  // 合并查询参数
  if (queryParams.couponId) {
    params.conditions_ += `,couponId:${queryParams.couponId}:eq`
  }
  if (queryParams.userInfo) {
    params.conditions_ += `,userInfo:${queryParams.userInfo}:like`
  }
  if (queryParams.status) {
    params.conditions_ += `,status:${queryParams.status}:eq`
  }

  // 模拟API调用
  setTimeout(() => {
    let filteredList = mockRecordList
    if (queryParams.couponId) {
      // 根据优惠券ID过滤
      const coupon = couponList.value.find(c => c.id == queryParams.couponId)
      if (coupon) {
        filteredList = mockRecordList.filter(item => item.couponName === coupon.name)
      }
    }
    recordList.value = filteredList
    pagination.total = filteredList.length
    loading.value = false
  }, 500)
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
    '1': '已使用',
    '2': '已过期',
    '3': '已作废'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
function getStatusTagType(status) {
  const typeMap = {
    '1': 'success',
    '2': 'warning',
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
</style>
