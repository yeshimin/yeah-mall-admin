<template>
  <div class="mall-page">
    <section class="mall-filter-panel">
    <el-form :model="queryParams" ref="searchFormRef" :inline="true" v-show="showSearch" class="mall-query-form">
      <el-form-item label="订单号">
        <el-input
          v-model="queryParams.orderNo"
          placeholder="请输入订单号"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="拼团状态">
        <el-select
          v-model="queryParams.groupStatus"
          placeholder="请选择拼团状态"
          clearable
          style="width: 120px"
        >
          <el-option label="待团长支付" value="1" />
          <el-option label="拼团中" value="2" />
          <el-option label="已成团" value="3" />
          <el-option label="拼团失败" value="4" />
          <el-option label="已关闭" value="5" />
        </el-select>
      </el-form-item>
      <el-form-item label="参与状态">
        <el-select v-model="queryParams.status" placeholder="请选择参与状态" clearable style="width: 120px">
          <el-option label="待支付" value="1" />
          <el-option label="已支付" value="2" />
          <el-option label="已关闭" value="3" />
          <el-option label="退款中" value="4" />
          <el-option label="已退款" value="5" />
          <el-option label="退款失败" value="6" />
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
    <el-table v-loading="loading" :data="orderList" style="width: 100%">
      <el-table-column label="序号" type="index" width="80" />
      <el-table-column prop="orderNo" label="订单号" min-width="180" />
      <el-table-column prop="memberName" label="用户" width="120" />
      <el-table-column prop="activityName" label="拼团活动" min-width="160" />
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
      <el-table-column prop="orderStatus" label="参与状态" width="120">
        <template #default="scope">
          <el-tag :type="getOrderStatusTagType(scope.row.orderStatus)">
            {{ getOrderStatusText(scope.row.orderStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import MallListTools from '@/components/mall/MallListTools.vue'
import { queryGroupBuyOrderList } from '@/api/mall/groupBuy'

// 响应式数据
const loading = ref(false)
const showSearch = ref(true)

// 查询参数
const queryParams = reactive({
  orderNo: '',
  status: '',
  groupStatus: ''
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 订单列表
const orderList = ref([])

// 初始化
onMounted(() => {
  getList()
})

// 获取订单列表
function getList() {
  loading.value = true
  queryGroupBuyOrderList({
    current: pagination.current,
    size: pagination.size,
    orderNo: queryParams.orderNo || undefined,
    status: queryParams.status || undefined,
    groupStatus: queryParams.groupStatus || undefined,
  }).then((res) => {
    orderList.value = res.data?.records || []
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
    orderNo: '',
    status: '',
    groupStatus: ''
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
    '1': '待团长支付',
    '2': '拼团中',
    '3': '已成团',
    '4': '拼团失败',
    '5': '已关闭'
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
    '1': '待支付',
    '2': '已支付',
    '3': '已关闭',
    '4': '退款中',
    '5': '已退款',
    '6': '退款失败'
  }
  return statusMap[status] || '未知'
}

// 获取订单状态标签类型
function getOrderStatusTagType(status) {
  const typeMap = {
    '1': 'warning',
    '2': 'info',
    '3': 'info',
    '4': 'warning',
    '5': 'success',
    '6': 'danger'
  }
  return typeMap[status] || 'info'
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
</style>
