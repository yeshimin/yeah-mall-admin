<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="searchFormRef" :inline="true" v-show="showSearch">
      <el-form-item label="订单号">
        <el-input
          v-model="queryParams.orderNo"
          placeholder="请输入订单号"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
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
      <el-form-item label="订单状态">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择订单状态"
          clearable
          style="width: 120px"
        >
          <el-option label="待付款" value="1" />
          <el-option label="待成团" value="2" />
          <el-option label="已成团" value="3" />
          <el-option label="已完成" value="4" />
          <el-option label="已取消" value="5" />
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

    <el-table v-loading="loading" :data="orderList" style="width: 100%">
      <el-table-column label="序号" type="index" width="80" />
      <el-table-column prop="orderNo" label="订单号" min-width="180" />
      <el-table-column prop="userName" label="用户" width="120" />
      <el-table-column prop="productName" label="商品" min-width="200" />
      <el-table-column prop="groupPrice" label="拼团价" width="100">
        <template #default="scope">
          ¥{{ scope.row.groupPrice }}
        </template>
      </el-table-column>
      <el-table-column prop="actualAmount" label="实付金额" width="100">
        <template #default="scope">
          ¥{{ scope.row.actualAmount }}
        </template>
      </el-table-column>
      <el-table-column prop="groupStatus" label="拼团状态" width="120">
        <template #default="scope">
          <el-tag :type="getGroupStatusTagType(scope.row.groupStatus)">
            {{ getGroupStatusText(scope.row.groupStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="orderStatus" label="订单状态" width="120">
        <template #default="scope">
          <el-tag :type="getOrderStatusTagType(scope.row.orderStatus)">
            {{ getOrderStatusText(scope.row.orderStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleView(scope.row)" plain>
            <el-icon><View /></el-icon>
            查看
          </el-button>
          <el-button type="success" size="small" @click="handleProcess(scope.row)" plain>
            <el-icon><Check /></el-icon>
            处理
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, View, Check } from '@element-plus/icons-vue'
import RightToolbar from '@/components/RightToolbar/index.vue'

// 响应式数据
const loading = ref(false)
const showSearch = ref(true)

// 查询参数
const queryParams = reactive({
  orderNo: '',
  userInfo: '',
  status: ''
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 订单列表
const orderList = ref([])

// 模拟数据
const mockOrderList = [
  {
    id: 1,
    orderNo: 'GP202603010001',
    userName: '张三',
    productName: '春季拼团商品1',
    groupPrice: 99,
    actualAmount: 99,
    groupStatus: '2',
    orderStatus: '2',
    createTime: '2026-03-01 10:00:00'
  },
  {
    id: 2,
    orderNo: 'GP202603010002',
    userName: '李四',
    productName: '春季拼团商品2',
    groupPrice: 149,
    actualAmount: 149,
    groupStatus: '3',
    orderStatus: '3',
    createTime: '2026-03-01 11:00:00'
  },
  {
    id: 3,
    orderNo: 'GP202603010003',
    userName: '王五',
    productName: '春季拼团商品1',
    groupPrice: 99,
    actualAmount: 99,
    groupStatus: '1',
    orderStatus: '1',
    createTime: '2026-03-01 12:00:00'
  }
]

// 初始化
onMounted(() => {
  getList()
})

// 获取订单列表
function getList() {
  loading.value = true
  const params = {
    conditions_: `sort:createTime:desc`,
    size: pagination.size,
    current: pagination.current
  }

  // 合并查询参数
  if (queryParams.orderNo) {
    params.conditions_ += `,orderNo:${queryParams.orderNo}:like`
  }
  if (queryParams.userInfo) {
    params.conditions_ += `,userInfo:${queryParams.userInfo}:like`
  }
  if (queryParams.status) {
    params.conditions_ += `,status:${queryParams.status}:eq`
  }

  // 模拟API调用
  setTimeout(() => {
    orderList.value = mockOrderList
    pagination.total = mockOrderList.length
    loading.value = false
  }, 500)
}

// 查看订单
function handleView(row) {
  // 查看逻辑
  ElMessage.info('查看订单详情功能开发中')
}

// 处理订单
function handleProcess(row) {
  // 处理逻辑
  ElMessage.info('处理订单功能开发中')
}

// 查询
function handleQuery() {
  pagination.current = 1
  getList()
}

// 重置
function resetQuery() {
  Object.assign(queryParams, {
    orderNo: '',
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

// 获取拼团状态文本
function getGroupStatusText(status) {
  const statusMap = {
    '1': '拼团中',
    '2': '待成团',
    '3': '已成团',
    '4': '拼团失败'
  }
  return statusMap[status] || '未知'
}

// 获取拼团状态标签类型
function getGroupStatusTagType(status) {
  const typeMap = {
    '1': 'info',
    '2': 'warning',
    '3': 'success',
    '4': 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取订单状态文本
function getOrderStatusText(status) {
  const statusMap = {
    '1': '待付款',
    '2': '待成团',
    '3': '已成团',
    '4': '已完成',
    '5': '已取消'
  }
  return statusMap[status] || '未知'
}

// 获取订单状态标签类型
function getOrderStatusTagType(status) {
  const typeMap = {
    '1': 'warning',
    '2': 'info',
    '3': 'success',
    '4': 'success',
    '5': 'danger'
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