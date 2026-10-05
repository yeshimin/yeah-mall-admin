<template>
  <div class="seckill-manage">
    <!-- 查询条件 -->
    <el-form :inline="true" :model="queryParams" class="mb8">
        <el-form-item label="申请商家" prop="merchantName">
          <el-input v-model="queryParams.merchantName" placeholder="请输入商家名称" clearable style="width: 200px" />
        </el-form-item>
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

      <!-- 审核列表 -->
      <el-table v-loading="loading" :data="auditList" style="width: 100%">
        <el-table-column label="序号" type="index" width="80" />
        <el-table-column prop="mchName" label="商家名称" width="150" />
        <el-table-column prop="shopName" label="店铺名称" width="150" />
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <template v-if="scope.row.auditStatus === 1">
              <el-button type="primary" size="small" @click="handleAudit(scope.row)" plain>
                <el-icon><Check /></el-icon>
                审核
              </el-button>
            </template>
            <template v-else>
              <el-button type="primary" size="small" @click="handleView(scope.row)" plain>
                <el-icon><View /></el-icon>
                查看
              </el-button>
            </template>
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

    <!-- 审核对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="800px">
      <!-- SPU信息 -->
      <div class="mb-4">
        <h4>商品信息</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商品名称">{{ form.spuName }}</el-descriptions-item>
          <el-descriptions-item label="活动名称">{{ form.activityName }}</el-descriptions-item>
          <el-descriptions-item label="场次名称">{{ form.sessionName }}</el-descriptions-item>
          <el-descriptions-item label="商家名称">{{ form.mchName }}</el-descriptions-item>
          <el-descriptions-item label="店铺名称">{{ form.shopName }}</el-descriptions-item>
          <el-descriptions-item label="申请备注">{{ form.applyRemark || '无' }}</el-descriptions-item>
          <el-descriptions-item label="审核备注">{{ form.auditRemark || '无' }}</el-descriptions-item>
          <el-descriptions-item label="主图">
            <el-image
              v-if="form.mainImage"
              :src="getImagePreviewUrl(form.mainImage)"
              fit="cover"
              style="width: 100px; height: 100px"
              lazy
            />
            <span v-else>无图片</span>
          </el-descriptions-item>
          <el-descriptions-item label="商品描述" :span="2">{{ form.detailDesc }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- SKU信息 -->
      <div class="mb-4" v-if="form.skuList && form.skuList.length > 0">
        <h4>SKU信息</h4>
        <el-table :data="form.skuList" style="width: 100%">
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

      <!-- 审核表单 -->
      <div class="mt-4">
        <h4>审核操作</h4>
        <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
          <el-form-item label="审核结果" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio label="2">通过</el-radio>
              <el-radio label="3">驳回</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="审核意见">
            <el-input v-model="form.auditRemark" type="textarea" placeholder="请输入审核意见（可选）" rows="3" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAuditSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

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
import { ref, reactive, onMounted, watch } from 'vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Check, Close, View } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { querySeckillActivityList } from '@/api/mall/seckill'
import { useRoute } from 'vue-router'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const dialogTitle = ref('审核')
const formRef = ref(null)
const route = useRoute()

// 查询参数
const queryParams = reactive({
  merchantName: '',
  status: '',
  activityId: ''
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 表单数据
const form = reactive({
  id: '',
  status: '',
  auditRemark: ''
})

// 查看表单数据
const viewForm = reactive({})

// 表单规则
const rules = reactive({
  status: [{ required: true, message: '请选择审核结果', trigger: 'change' }]
})

// 活动列表
const activityList = ref([])

// 场次列表
const sessionList = ref([])

// 审核列表
const auditList = ref([])

// 模拟数据
const mockAuditList = [
  {
    id: 1,
    merchantName: '苹果官方旗舰店',
    merchantContact: '张三',
    merchantPhone: '13800138001',
    productName: 'iPhone 15 Pro',
    productPrice: '9999',
    applyCount: 50,
    activityId: 1,
    activityName: '春节秒杀活动',
    applyTime: '2026-02-01 10:00:00',
    status: 0,
    remark: '申请参加春节秒杀活动'
  },
  {
    id: 2,
    merchantName: '华为官方旗舰店',
    merchantContact: '李四',
    merchantPhone: '13900139002',
    productName: '华为 Mate 60 Pro',
    productPrice: '8999',
    applyCount: 30,
    activityId: 1,
    activityName: '春节秒杀活动',
    applyTime: '2026-02-01 11:00:00',
    status: 1,
    auditTime: '2026-02-02 09:00:00',
    auditRemark: '审核通过',
    remark: '申请参加春节秒杀活动'
  },
  {
    id: 3,
    merchantName: '小米官方旗舰店',
    merchantContact: '王五',
    merchantPhone: '13700137003',
    productName: '小米 14 Pro',
    productPrice: '4999',
    applyCount: 100,
    activityId: 2,
    activityName: '情人节秒杀',
    applyTime: '2026-02-05 14:00:00',
    status: 2,
    auditTime: '2026-02-06 10:00:00',
    auditRemark: '库存过多，建议减少申请数量',
    remark: '申请参加情人节秒杀活动'
  },
  {
    id: 4,
    merchantName: 'OPPO官方旗舰店',
    merchantContact: '赵六',
    merchantPhone: '13600136004',
    productName: 'OPPO Find X7',
    productPrice: '5999',
    applyCount: 40,
    activityId: 2,
    activityName: '情人节秒杀',
    applyTime: '2026-02-05 15:00:00',
    status: 0,
    remark: '申请参加情人节秒杀活动'
  }
]

// 初始化
onMounted(() => {
  loadActivityList()
  // 检查URL参数中是否有activityId
  const activityId = route.query.activityId
  if (activityId) {
    // 延迟执行，确保活动列表已加载
    setTimeout(() => {
      queryParams.activityId = activityId
      handleActivityChange(activityId)
      // 自动执行查询
      handleQuery()
    }, 100)
  }
  // 不自动加载审核列表，需要先选择活动
})

// 加载活动列表
function loadActivityList() {
  const params = {
    conditions_: 'sort:sort:asc',
    size: 100,
    current: 1
  }

  querySeckillActivityList(params)
    .then(response => {
      const data = response.data
      if (data.records) {
        activityList.value = data.records
      }
    })
    .catch(error => {
      ElMessage.error('获取活动列表失败: ' + (error.message || '未知错误'))
      activityList.value = []
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
    url: '/admin/seckillSession/crud/query',
    method: 'get',
    params
  })
    .then(response => {
      const data = response.data
      if (data.records) {
        sessionList.value = data.records
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

// 获取审核列表
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
  if (queryParams.merchantName) {
    params.mchName = queryParams.merchantName
  }

  request({
    url: '/admin/seckillActivityApply/query',
    method: 'get',
    params
  })
    .then(response => {
      const data = response.data
      if (data.records) {
        auditList.value = data.records
        pagination.total = Number(data.total) || 0
      }
    })
    .catch(error => {
      ElMessage.error('获取审核列表失败: ' + (error.message || '未知错误'))
      auditList.value = []
      pagination.total = 0
    })
    .finally(() => {
      loading.value = false
    })
}

// 审核
function handleAudit(row) {
  dialogTitle.value = '审核'
  // 先获取申请详情
  loading.value = true
  request({
    url: '/admin/seckillActivityApply/detail',
    method: 'get',
    params: {
      id: row.applyId
    }
  })
  .then(response => {
    const data = response.data
    if (data) {
      // 填充表单数据
      form.applyId = data.apply.id
      form.spuName = data.spu.name
      form.activityName = row.activityName
      form.sessionName = row.sessionName
      form.mchName = row.mchName
      form.shopName = row.shopName
      form.mainImage = data.spu.mainImage
      form.detailDesc = data.spu.detailDesc
      form.applyRemark = data.apply.applyRemark
      form.skuList = data.skuList || []
      form.status = '' // 清空审核结果
      form.auditRemark = '' // 清空审核意见
      dialogVisible.value = true
    }
  })
  .catch(error => {
    ElMessage.error('获取申请详情失败: ' + (error.message || '未知错误'))
  })
  .finally(() => {
    loading.value = false
  })
}

// 提交审核
function handleAuditSubmit() {
  formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true

      const data = {
        applyId: form.applyId,
        auditStatus: parseInt(form.status),
        auditRemark: form.auditRemark
      }

      request({
        url: '/admin/seckillActivityApply/audit',
        method: 'post',
        data
      })
        .then(() => {
          ElMessage.success('审核成功')
          dialogVisible.value = false
          getList()
        })
        .catch(error => {
          ElMessage.error('审核失败: ' + (error.message || '未知错误'))
        })
        .finally(() => {
          loading.value = false
        })
    }
  })
}

// 查看详情
function handleView(row) {
  // 先获取申请详情
  loading.value = true
  request({
    url: '/admin/seckillActivityApply/detail',
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
  if (!queryParams.activityId) {
    ElMessage.warning('请选择活动')
    return
  }
  pagination.current = 1
  getList()
}

// 重置
function resetQuery() {
  Object.assign(queryParams, {
    merchantName: '',
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

<style lang="scss" scoped>
.seckill-manage {
  padding: 20px;
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

.mt-4 {
  margin-top: 16px;
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