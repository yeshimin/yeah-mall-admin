<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="审核状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择审核状态" clearable style="width: 120px">
          <el-option label="待审核" value="1" />
          <el-option label="审核通过" value="2" />
          <el-option label="审核驳回" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="活动名称" prop="activityId">
        <el-select v-model="queryParams.activityId" placeholder="请选择活动" clearable style="width: 180px" @change="handleActivityChange">
          <el-option v-for="activity in activityList" :key="activity.id" :label="activity.name" :value="activity.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="场次名称" prop="sessionId">
        <el-select v-model="queryParams.sessionId" placeholder="请选择场次" clearable style="width: 180px">
          <el-option v-for="session in sessionList" :key="session.id" :label="session.name" :value="session.id" />
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

      <!-- 申请记录列表 -->
      <el-table v-loading="loading" :data="recordList" style="width: 100%">
        <el-table-column label="序号" type="index" width="80" />
        <el-table-column prop="spuName" label="商品名称" width="200" />
        <el-table-column prop="activityName" label="活动名称" width="150" />
        <el-table-column prop="sessionName" label="场次名称" width="150" />
        <el-table-column prop="auditStatus" label="审核状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.auditStatus)">
              {{ getStatusText(scope.row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detailDesc" label="商品描述" min-width="200" />
        <el-table-column prop="applyRemark" label="申请备注" min-width="150" />
        <el-table-column prop="auditRemark" label="审核备注" min-width="150" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleView(scope.row)" plain>
              <el-icon><View /></el-icon>
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
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

    <!-- 查看详情对话框 -->
    <el-dialog title="申请详情" v-model="viewDialogVisible" width="800px">
      <!-- SPU信息 -->
      <div class="mb-4">
        <h4>商品信息</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商品名称">{{ viewForm.spuName }}</el-descriptions-item>
          <el-descriptions-item label="活动名称">{{ viewForm.activityName }}</el-descriptions-item>
          <el-descriptions-item label="场次名称">{{ viewForm.sessionName }}</el-descriptions-item>
          <el-descriptions-item label="商家名称">{{ viewForm.mchName }}</el-descriptions-item>
          <el-descriptions-item label="店铺名称">{{ viewForm.shopName }}</el-descriptions-item>
          <el-descriptions-item label="审核状态">{{ getStatusText(viewForm.auditStatus) }}</el-descriptions-item>
          <el-descriptions-item label="申请备注">{{ viewForm.applyRemark || '无' }}</el-descriptions-item>
          <el-descriptions-item label="审核备注">{{ viewForm.auditRemark || '无' }}</el-descriptions-item>
          <el-descriptions-item label="主图">
            <el-image
              v-if="viewForm.mainImage"
              :src="getImagePreviewUrl(viewForm.mainImage)"
              fit="cover"
              style="width: 100px; height: 100px"
              lazy
            />
            <span v-else>无图片</span>
          </el-descriptions-item>
          <el-descriptions-item label="商品描述" :span="2">{{ viewForm.detailDesc }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- SKU信息 -->
      <div class="mb-4" v-if="viewForm.skuList && viewForm.skuList.length > 0">
        <h4>SKU信息</h4>
        <el-table :data="viewForm.skuList" style="width: 100%">
          <el-table-column prop="name" label="SKU名称" min-width="200" />
          <el-table-column prop="specCode" label="规格编码" width="150" />
          <el-table-column prop="originPrice" label="原价" width="100" />
          <el-table-column prop="seckillPrice" label="秒杀价格" width="100" />
          <el-table-column prop="stock" label="库存" width="80" />
          <el-table-column label="SKU图片" width="120">
            <template #default="scope">
              <el-image
                v-if="scope.row.mainImage"
                :src="getImagePreviewUrl(scope.row.mainImage)"
                fit="cover"
                style="width: 80px; height: 80px"
                lazy
              />
              <span v-else>无图片</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { ElMessage } from 'element-plus'
import { Search, Refresh, View } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import request from '@/utils/request'
import RightToolbar from '@/components/RightToolbar/index.vue'
import { querySeckillActivityList } from '@/api/mall/seckill'

// 路由
const route = useRoute()

// 响应式数据
const loading = ref(false)
const viewDialogVisible = ref(false)
const showSearch = ref(true)

// 查询参数
const queryParams = reactive({
  status: '',
  activityId: '',
  sessionId: ''
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 查看表单数据
const viewForm = reactive({})

// 活动列表
const activityList = ref([])

// 场次列表
const sessionList = ref([])

// 申请记录列表
const recordList = ref([])

// 初始化
onMounted(() => {
  loadActivityList().then(() => {
    // 检查URL中是否有活动ID参数
    const activityId = route.query.activityId
    if (activityId) {
      // 设置活动ID到查询参数
      queryParams.activityId = activityId
      // 加载对应的场次列表
      loadSessionList(activityId)
    }
    // 页面加载时自动获取一次申请记录
    getList()
  })
})

// 加载活动列表
function loadActivityList() {
  return new Promise((resolve, reject) => {
    request({
      url: '/mch/seckillActivity/queryApplyActivity',
      method: 'get'
    })
      .then(response => {
        const data = response.data
        if (data) {
          activityList.value = data
        }
        resolve()
      })
      .catch(error => {
        ElMessage.error('获取活动列表失败: ' + (error.message || '未知错误'))
        activityList.value = []
        resolve() // 即使失败也 resolve，确保初始化流程继续
      })
  })
}

// 加载场次列表
function loadSessionList(activityId) {
  if (!activityId) {
    sessionList.value = []
    return
  }

  const params = {
    conditions_: 'sort:sort:asc',
    activityId: activityId,
    size: 100,
    current: 1
  }

  request({
    url: '/mch/seckillActivity/querySession',
    method: 'get',
    params
  })
    .then(response => {
      const data = response.data
      if (data) {
        sessionList.value = data
      }
    })
    .catch(error => {
      ElMessage.error('获取场次列表失败: ' + (error.message || '未知错误'))
      sessionList.value = []
    })
}

// 处理活动选择变化
function handleActivityChange(activityId) {
  // 清空场次选择
  queryParams.sessionId = ''
  // 加载对应的场次列表
  loadSessionList(activityId)
}

// 获取申请记录列表
function getList() {
  loading.value = true
  const params = {
    conditions_: 'sort:sort:asc',
    size: pagination.size,
    current: pagination.current
  }

  // 添加查询参数
  if (queryParams.activityId) {
    params.activityId = queryParams.activityId
  }
  if (queryParams.sessionId) {
    params.sessionId = queryParams.sessionId
  }
  if (queryParams.status) {
    params.auditStatus = queryParams.status
  }

  request({
    url: '/mch/seckillActivityApply/query',
    method: 'get',
    params
  })
    .then(response => {
      const data = response.data
      if (data.records) {
        recordList.value = data.records
        pagination.total = Number(data.total) || 0
      }
    })
    .catch(error => {
      ElMessage.error('获取申请记录失败: ' + (error.message || '未知错误'))
      recordList.value = []
      pagination.total = 0
    })
    .finally(() => {
      loading.value = false
    })
}

// 查看详情
function handleView(row) {
  // 先获取申请详情
  loading.value = true
  request({
    url: '/mch/seckillActivityApply/detail',
    method: 'get',
    params: {
      id: row.applyId
    }
  })
  .then(response => {
    const data = response.data
    if (data) {
      // 填充查看表单数据
      Object.assign(viewForm, {
        mchName: row.mchName,
        shopName: row.shopName,
        spuName: data.spu.name,
        activityName: row.activityName,
        sessionName: row.sessionName,
        auditStatus: data.apply.auditStatus,
        detailDesc: data.spu.detailDesc,
        mainImage: data.spu.mainImage,
        applyRemark: data.apply.applyRemark,
        auditRemark: data.apply.auditRemark,
        skuList: data.skuList || []
      })
      viewDialogVisible.value = true
    }
  })
  .catch(error => {
    ElMessage.error('获取申请详情失败: ' + (error.message || '未知错误'))
  })
  .finally(() => {
    loading.value = false
  })
}

// 获取图片预览URL
function getImagePreviewUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    1: '待审核',
    2: '审核通过',
    3: '审核驳回'
  }
  return statusMap[status] || ''
}

// 获取状态标签类型
function getStatusTagType(status) {
  const typeMap = {
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return typeMap[status] || ''
}

// 查询
function handleQuery() {
  pagination.current = 1
  getList()
}

// 重置
function resetQuery() {
  Object.assign(queryParams, {
    status: '',
    activityId: '',
    sessionId: ''
  })
  // 清空场次列表
  sessionList.value = []
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

.mb-4 {
  margin-bottom: 16px;
}

/* 审核对话框样式 */
h4 {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

/* 表格样式 */
.el-table {
  margin-top: 8px;
}

/* 描述列表样式 */
.el-descriptions {
  margin-top: 8px;
}
</style>