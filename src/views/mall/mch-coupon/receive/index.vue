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
      <el-form-item label="优惠券类型">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择类型"
          clearable
          style="width: 150px"
        >
          <el-option label="满减券" value="1" />
          <el-option label="折扣券" value="2" />
          <el-option label="无门槛券" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="优惠券名称">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入优惠券名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="使用范围">
        <el-select
          v-model="queryParams.useRange"
          placeholder="请选择使用范围"
          clearable
          style="width: 150px"
        >
          <el-option label="店铺通用" value="1" />
          <el-option label="指定商品" value="2" />
          <el-option label="指定分类" value="3" />
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

    <el-table v-loading="loading" :data="receiveList" style="width: 100%">
      <el-table-column label="序号" type="index" width="80" />
      <el-table-column prop="couponName" label="优惠券名称" min-width="150" />
      <el-table-column prop="couponType" label="优惠券类型" width="100">
        <template #default="scope">
          {{ getTypeText(scope.row.couponType) }}
        </template>
      </el-table-column>
      <el-table-column prop="couponValue" label="优惠金额/折扣" width="120">
        <template #default="scope">
          {{ scope.row.couponType === '2' ? scope.row.couponValue + '%' : '¥' + scope.row.couponValue }}
        </template>
      </el-table-column>
      <el-table-column prop="minAmount" label="使用条件" width="120">
        <template #default="scope">
          {{ scope.row.minAmount > 0 ? '满¥' + scope.row.minAmount : '无门槛' }}
        </template>
      </el-table-column>
      <el-table-column prop="receiveTime" label="领取时间" width="180" />
      <el-table-column prop="useRange" label="使用范围" width="120">
        <template #default="scope">
          {{ getUseRangeText(scope.row.useRange) }}
        </template>
      </el-table-column>
      <el-table-column prop="beginTime" label="有效期开始" width="180" />
      <el-table-column prop="endTime" label="有效期结束" width="180" />
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
import { getMemberCouponList, getCouponList } from '@/api/mall/memberCoupon'

// 路由
const route = useRoute()

// 响应式数据
const loading = ref(false)
const showSearch = ref(true)

// 查询参数
const queryParams = reactive({
  couponId: '',
  type: '',
  name: '',
  useRange: ''
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 领取记录列表
const receiveList = ref([])

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
  const params = {
    conditions_: 'createTime:sort:desc',
    size: 999999 // 一次性获取商家所有优惠券
  }
  getCouponList(params).then(response => {
    if (response.code === 0) {
      couponList.value = response.data.records.map(coupon => ({
        id: coupon.id,
        name: coupon.name
      }))
    } else {
      ElMessage.error('获取优惠券列表失败')
    }
  }).catch(error => {
    ElMessage.error('获取优惠券列表失败')
    console.error('获取优惠券列表失败:', error)
  })
}

// 获取领取记录
function getList() {
  loading.value = true
  const params = {
    conditions_: `createTime:sort:desc`,
    size: pagination.size,
    current: pagination.current
  }

  // 合并查询参数
  if (queryParams.couponId) {
    params.conditions_ += `;couponId:eq:${queryParams.couponId}`
  }
  if (queryParams.type) {
    params.conditions_ += `;type:eq:${queryParams.type}`
  }
  if (queryParams.name) {
    params.conditions_ += `;name:like:${queryParams.name}`
  }
  if (queryParams.useRange) {
    params.conditions_ += `;useRange:eq:${queryParams.useRange}`
  }

  getMemberCouponList(params).then(response => {
    if (response.code === 0) {
      // 映射响应数据到前端需要的格式
      receiveList.value = response.data.records.map(item => ({
        id: item.id,
        couponName: item.name,
        couponType: item.type.toString(),
        couponValue: item.type === 2 ? item.discount * 100 : item.amount,
        minAmount: item.minAmount,
        receiveTime: item.createTime,
        useRange: item.useRange.toString(),
        beginTime: item.beginTime,
        endTime: item.endTime
      }))
      pagination.total = Number(response.data.total)
    } else {
      ElMessage.error('获取领取记录失败')
    }
  }).catch(error => {
    ElMessage.error('获取领取记录失败')
    console.error('获取领取记录失败:', error)
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
    type: '',
    name: '',
    useRange: ''
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

// 获取使用范围文本
function getUseRangeText(useRange) {
  const useRangeMap = {
    '1': '店铺通用',
    '2': '指定商品',
    '3': '指定分类'
  }
  return useRangeMap[useRange] || '未知'
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
