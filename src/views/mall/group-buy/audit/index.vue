<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="searchFormRef" :inline="true" v-show="showSearch">
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

    <el-table v-loading="loading" :data="applyList" style="width: 100%">
      <el-table-column label="序号" type="index" width="80" />
      <el-table-column prop="activityName" label="活动名称" min-width="200" />
      <el-table-column prop="mchName" label="商家名称" width="150" />
      <el-table-column prop="productName" label="商品名称" min-width="200" />
      <el-table-column prop="groupPrice" label="拼团价" width="100">
        <template #default="scope">
          ¥{{ scope.row.groupPrice }}
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="100" />
      <el-table-column prop="auditStatus" label="审核状态" width="120">
        <template #default="scope">
          <el-tag :type="getAuditStatusTagType(scope.row.auditStatus)">
            {{ getAuditStatusText(scope.row.auditStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="applyTime" label="申请时间" width="180" />
      <el-table-column prop="auditTime" label="审核时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleView(scope.row)" plain>
            <el-icon><View /></el-icon>
            查看
          </el-button>
          <el-button
            v-if="scope.row.auditStatus === '1'"
            type="success"
            size="small"
            @click="handleAudit(scope.row)"
            plain
          >
            <el-icon><Check /></el-icon>
            审核
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

    <!-- 审核对话框 -->
    <el-dialog title="审核申请" v-model="auditDialogVisible" width="600px">
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="活动名称">
          <el-input v-model="auditForm.activityName" readonly />
        </el-form-item>
        <el-form-item label="商家名称">
          <el-input v-model="auditForm.mchName" readonly />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="auditForm.productName" readonly />
        </el-form-item>
        <el-form-item label="拼团价">
          <el-input v-model="auditForm.groupPrice" readonly />
        </el-form-item>
        <el-form-item label="库存">
          <el-input v-model="auditForm.stock" readonly />
        </el-form-item>
        <el-form-item label="申请备注">
          <el-input v-model="auditForm.applyRemark" type="textarea" rows="3" readonly />
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio label="2">通过</el-radio>
            <el-radio label="3">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input v-model="auditForm.auditRemark" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="auditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAudit">提交审核</el-button>
        </span>
      </template>
    </el-dialog>
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
const auditDialogVisible = ref(false)

// 查询参数
const queryParams = reactive({
  activityId: '',
  mchName: '',
  auditStatus: ''
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 活动列表
const activityList = ref([
  { id: 1, name: '春季拼团活动' },
  { id: 2, name: '女神节拼团' }
])

// 申请列表
const applyList = ref([])

// 审核表单
const auditForm = reactive({
  id: '',
  activityName: '',
  mchName: '',
  productName: '',
  groupPrice: '',
  stock: '',
  applyRemark: '',
  auditStatus: '',
  auditRemark: ''
})

// 模拟数据
const mockApplyList = [
  {
    id: 1,
    activityId: 1,
    activityName: '春季拼团活动',
    mchId: 1,
    mchName: '测试商家',
    productId: 1,
    productName: '春季拼团商品1',
    groupPrice: 99,
    stock: 100,
    applyRemark: '申请参加拼团活动',
    auditStatus: '1',
    applyTime: '2026-03-01 10:00:00',
    auditTime: ''
  },
  {
    id: 2,
    activityId: 2,
    activityName: '女神节拼团',
    mchId: 2,
    mchName: '女神商家',
    productId: 2,
    productName: '女神节专属商品',
    groupPrice: 199,
    stock: 50,
    applyRemark: '女神节特别申请',
    auditStatus: '1',
    applyTime: '2026-03-02 11:00:00',
    auditTime: ''
  }
]

// 初始化
onMounted(() => {
  getList()
})

// 获取申请列表
function getList() {
  loading.value = true
  const params = {
    conditions_: `sort:applyTime:desc`,
    size: pagination.size,
    current: pagination.current
  }

  // 合并查询参数
  if (queryParams.activityId) {
    params.conditions_ += `,activityId:${queryParams.activityId}:eq`
  }
  if (queryParams.mchName) {
    params.conditions_ += `,mchName:${queryParams.mchName}:like`
  }
  if (queryParams.auditStatus) {
    params.conditions_ += `,auditStatus:${queryParams.auditStatus}:eq`
  }

  // 模拟API调用
  setTimeout(() => {
    applyList.value = mockApplyList
    pagination.total = mockApplyList.length
    loading.value = false
  }, 500)
}

// 查看申请
function handleView(row) {
  // 查看逻辑
  ElMessage.info('查看申请详情功能开发中')
}

// 审核申请
function handleAudit(row) {
  // 填充审核表单
  auditForm.id = row.id
  auditForm.activityName = row.activityName
  auditForm.mchName = row.mchName
  auditForm.productName = row.productName
  auditForm.groupPrice = row.groupPrice
  auditForm.stock = row.stock
  auditForm.applyRemark = row.applyRemark
  auditForm.auditStatus = '2' // 默认通过
  auditForm.auditRemark = ''

  // 打开审核对话框
  auditDialogVisible.value = true
}

// 提交审核
function submitAudit() {
  if (!auditForm.auditStatus) {
    ElMessage.warning('请选择审核结果')
    return
  }

  ElMessageBox.confirm('确定要提交审核结果吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    // 模拟API调用
    setTimeout(() => {
      ElMessage.success('审核成功')
      auditDialogVisible.value = false
      getList()
      loading.value = false
    }, 500)
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

.dialog-footer {
  text-align: right;
}
</style>