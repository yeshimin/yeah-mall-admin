<template>
  <div class="mall-page">
    <section class="mall-filter-panel">
    <el-form :model="queryParams" ref="searchFormRef" :inline="true" v-show="showSearch" class="mall-query-form">
      <el-form-item label="活动名称">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入活动名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="活动状态">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择活动状态"
          clearable
          style="width: 120px"
        >
          <el-option label="新建" value="1" />
          <el-option label="发布" value="2" />
          <el-option label="报名中" value="3" />
          <el-option label="报名结束" value="4" />
          <el-option label="活动中" value="5" />
          <el-option label="活动结束" value="6" />
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
      <el-button type="primary" icon="Plus" @click="handleAdd">新增活动</el-button>
      <MallListTools v-model:showSearch="showSearch" @refresh="getList" />
    </div>
    </section>

    <section class="mall-table-panel">
    <el-table v-loading="loading" :data="activityList" style="width: 100%">
      <el-table-column label="序号" type="index" width="80" />
      <el-table-column prop="name" label="活动名称" width="200" />
      <el-table-column label="封面图片" width="120">
        <template #default="scope">
          <el-image
            v-if="scope.row.coverImage"
            :src="getImagePreviewUrl(scope.row.coverImage)"
            fit="cover"
            style="width: 80px; height: 40px"
          >
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <el-empty v-else description="" style="width: 80px; height: 40px" />
        </template>
      </el-table-column>
      <el-table-column prop="applyBeginTime" label="报名开始时间" width="180" />
      <el-table-column prop="applyEndTime" label="报名结束时间" width="180" />
      <el-table-column prop="activityBeginTime" label="活动开始时间" width="180" />
      <el-table-column prop="activityEndTime" label="活动结束时间" width="180" />
      <el-table-column prop="minPeople" label="每团人数" width="120" />
      <el-table-column label="最大开团数" width="120">
        <template #default="scope">
          {{ formatGroupLimit(scope.row.groupLimit) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column prop="isEnabled" label="是否启用" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.isEnabled"
            @change="handleEnabledChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="description" label="活动描述" />
      <el-table-column label="操作" width="440" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)" plain>
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button v-if="getNextStatus(scope.row.status)" type="warning" size="small" @click="handleStatusChange(scope.row)" plain>
            {{ getNextStatusText(scope.row.status) }}
          </el-button>
          <el-button type="success" size="small" @click="handleProduct(scope.row)" plain>
            <el-icon><Goods /></el-icon>
            商品管理
          </el-button>
          <el-button type="primary" size="small" @click="handleGroupOverview(scope.row)" plain>
            <el-icon><View /></el-icon>
            查看拼团
          </el-button>
          <el-button type="info" size="small" @click="handleAudit(scope.row)" plain>
            <el-icon><Check /></el-icon>
            申请审核
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row.id)" plain>
            <el-icon><Delete /></el-icon>
            删除
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

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入活动描述" rows="3" />
        </el-form-item>
        <el-form-item label="封面图片" prop="coverImage">
          <el-upload
            class="upload-demo"
            :action="storageUploadUrl"
            :headers="{ Authorization: 'Bearer ' + getToken() }"
            :data="{ isPublic: true, isUsed: false }"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :auto-upload="true"
            :show-file-list="false"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              上传图片
            </el-button>
          </el-upload>
          <div v-if="form.coverImage" class="mt-2">
            <div>
              <el-image
                :src="getImagePreviewUrl(form.coverImage)"
                fit="cover"
                style="width: 200px; height: 100px"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
          </div>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报名开始时间" prop="applyBeginTime">
              <el-date-picker v-model="form.applyBeginTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择报名开始时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报名结束时间" prop="applyEndTime">
              <el-date-picker v-model="form.applyEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择报名结束时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动开始时间" prop="activityBeginTime">
              <el-date-picker v-model="form.activityBeginTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择活动开始时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动结束时间" prop="activityEndTime">
              <el-date-picker v-model="form.activityEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择活动结束时间" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="每团成团人数" prop="minPeople">
          <el-input-number v-model="form.minPeople" :min="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最大开团数" prop="groupLimit">
          <el-radio-group v-model="groupLimitMode" @change="handleGroupLimitModeChange">
            <el-radio label="limited">限制团数</el-radio>
            <el-radio label="unlimited">不限制</el-radio>
          </el-radio-group>
          <el-input-number
            v-if="groupLimitMode === 'limited'"
            v-model="form.groupLimit"
            :min="1"
            :precision="0"
            placeholder="请输入 1 到 N 的整数"
            style="width: 100%; margin-top: 8px"
          />
          <div class="form-tip">限制时填写活动期间最多可创建的团数；选择“不限制”将保存为 -1。</div>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注信息" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="groupOverviewVisible"
      :title="`拼团情况 - ${currentGroupActivity.name || ''}`"
      width="1050px"
      destroy-on-close
    >
      <el-table v-loading="groupOverviewLoading" :data="groupOverviewList" style="width: 100%">
        <el-table-column prop="groupNo" label="团编号" min-width="150" />
        <el-table-column label="拼团商品" min-width="220">
          <template #default="scope">
            <div class="group-product-cell">
              <el-image
                v-if="scope.row.productImage"
                :src="getImagePreviewUrl(scope.row.productImage)"
                fit="cover"
                class="group-product-image"
              />
              <span>{{ scope.row.productName || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="leaderMemberName" label="团长" width="120" />
        <el-table-column label="成员" width="130">
          <template #default="scope">
            {{ scope.row.memberCount || 0 }}/{{ scope.row.minPeople || '-' }}
            <span class="reserved-count">占席 {{ scope.row.reservedMemberCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="团状态" width="120">
          <template #default="scope">
            <el-tag :type="getGroupStatusType(scope.row.status)">
              {{ getGroupStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="开团时间" width="180" />
        <el-table-column label="完成/失败时间" width="180">
          <template #default="scope">{{ scope.row.successTime || scope.row.failedTime || '-' }}</template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="groupOverviewPagination.current"
          v-model:page-size="groupOverviewPagination.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="Number(groupOverviewPagination.total)"
          @size-change="handleGroupOverviewSizeChange"
          @current-change="handleGroupOverviewCurrentChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete, Goods, Upload, Picture, Check, View } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'
import { resolveApiUrl } from '@/utils/download'
import MallListTools from '@/components/mall/MallListTools.vue'
import { useRouter } from 'vue-router'
import { createGroupBuyActivity, deleteGroupBuyActivity, queryGroupBuyActivityList, queryGroupBuyGroupList, updateGroupBuyActivity, updateGroupBuyActivityEnabled, updateGroupBuyActivityStatus } from '@/api/mall/groupBuy'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增活动')
const formRef = ref(null)
const groupLimitMode = ref('limited')
const groupOverviewVisible = ref(false)
const groupOverviewLoading = ref(false)
const currentGroupActivity = ref({})
const groupOverviewList = ref([])
const router = useRouter()
const showSearch = ref(true)
const storageUploadUrl = resolveApiUrl('/basic/storage/upload')

// 上传成功处理
function handleUploadSuccess(response) {
  if (response.code === 0 && response.data) {
    form.coverImage = response.data.fileKey
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('图片上传失败: ' + (response.message || '未知错误'))
  }
}

// 上传失败处理
function handleUploadError(error) {
  ElMessage.error('图片上传失败: ' + (error.message || '网络错误'))
}

// 获取图片预览URL
function getImagePreviewUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

// 查询参数
const queryParams = reactive({
  name: '',
  status: ''
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

const groupOverviewPagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 表单数据
const form = reactive({
  id: '',
  name: '',
  description: '',
  coverImage: '',
  applyBeginTime: '',
  applyEndTime: '',
  activityBeginTime: '',
  activityEndTime: '',
  minPeople: 2,
  groupLimit: 0,
  sort: 1,
  remark: ''
})

// 表单规则
const rules = reactive({
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入活动描述', trigger: 'blur' }],
  applyBeginTime: [{ required: true, message: '请选择报名开始时间', trigger: 'change' }],
  applyEndTime: [{ required: true, message: '请选择报名结束时间', trigger: 'change' }],
  activityBeginTime: [{ required: true, message: '请选择活动开始时间', trigger: 'change' }],
  activityEndTime: [{ required: true, message: '请选择活动结束时间', trigger: 'change' }],
  minPeople: [{ required: true, message: '请输入每团成团人数', trigger: 'blur' }],
  groupLimit: [{ required: true, message: '请输入最大开团数', trigger: 'blur' }]
})

// 活动列表
const activityList = ref([])

// 初始化
onMounted(() => {
  getList()
})

// 获取活动列表
function getList() {
  loading.value = true
  const params = {
    conditions_: `sort:sort:asc`,
    size: pagination.size,
    current: pagination.current
  }

  // 合并查询参数
  if (queryParams.name) {
    params.conditions_ += `,name:${queryParams.name}:like`
  }
  if (queryParams.status) {
    params.conditions_ += `,status:${queryParams.status}:eq`
  }

  queryGroupBuyActivityList(params)
    .then((response) => {
      const data = response.data || {}
      activityList.value = data.records || []
      pagination.total = Number(data.total) || 0
    })
    .catch((error) => {
      ElMessage.error(error.message || '获取拼团活动失败')
      activityList.value = []
      pagination.total = 0
    })
    .finally(() => {
      loading.value = false
    })
}

// 新增活动
function handleAdd() {
  dialogTitle.value = '新增活动'
  form.id = ''
  form.name = ''
  form.description = ''
  form.coverImage = ''
  form.applyBeginTime = ''
  form.applyEndTime = ''
  form.activityBeginTime = ''
  form.activityEndTime = ''
  form.minPeople = 2
  form.groupLimit = 0
  groupLimitMode.value = 'limited'
  form.sort = 1
  form.remark = ''
  dialogVisible.value = true
}

// 编辑活动
function handleEdit(row) {
  dialogTitle.value = '编辑活动'
  // 复制所有字段
  form.id = row.id
  form.name = row.name
  form.description = row.description
  form.coverImage = row.coverImage
  form.applyBeginTime = row.applyBeginTime
  form.applyEndTime = row.applyEndTime
  form.activityBeginTime = row.activityBeginTime
  form.activityEndTime = row.activityEndTime
  form.minPeople = row.minPeople
  form.groupLimit = row.groupLimit ?? 0
  groupLimitMode.value = form.groupLimit === -1 ? 'unlimited' : 'limited'
  form.sort = row.sort
  form.remark = row.remark
  dialogVisible.value = true
}

// 格式化日期时间
function validateTimeRanges() {
  const applyBegin = new Date(form.applyBeginTime.replace(/-/g, '/'))
  const applyEnd = new Date(form.applyEndTime.replace(/-/g, '/'))
  const activityBegin = new Date(form.activityBeginTime.replace(/-/g, '/'))
  const activityEnd = new Date(form.activityEndTime.replace(/-/g, '/'))

  if ([applyBegin, applyEnd, activityBegin, activityEnd].some((time) => Number.isNaN(time.getTime()))) {
    ElMessage.error('活动时间格式不正确')
    return false
  }
  if (applyBegin >= applyEnd) {
    ElMessage.error('报名开始时间必须早于报名结束时间')
    return false
  }
  if (activityBegin >= activityEnd) {
    ElMessage.error('活动开始时间必须早于活动结束时间')
    return false
  }
  return true
}

function formatGroupLimit(groupLimit) {
  if (Number(groupLimit) === -1) {
    return '不限'
  }
  return Number(groupLimit) > 0 ? groupLimit : '未设置'
}

function handleGroupLimitModeChange(mode) {
  if (mode === 'unlimited') {
    form.groupLimit = -1
  } else if (form.groupLimit < 1) {
    form.groupLimit = 1
  }
}

// 提交表单
function handleSubmit() {
  formRef.value.validate((valid) => {
    if (valid) {
      if (!validateTimeRanges()) {
        return
      }
      if (groupLimitMode.value === 'limited' && form.groupLimit < 1) {
        ElMessage.error('最大开团数必须为 1 到 N 的整数')
        return
      }
      loading.value = true
      const submitData = {
        name: form.name,
        description: form.description,
        coverImage: form.coverImage,
        applyBeginTime: form.applyBeginTime,
        applyEndTime: form.applyEndTime,
        activityBeginTime: form.activityBeginTime,
        activityEndTime: form.activityEndTime,
        minPeople: form.minPeople,
        groupLimit: groupLimitMode.value === 'unlimited' ? -1 : form.groupLimit,
        sort: form.sort,
        remark: form.remark
      }

      const request = form.id
        ? updateGroupBuyActivity({ ...submitData, id: form.id })
        : createGroupBuyActivity(submitData)
      request
        .then(() => {
          ElMessage.success(form.id ? '编辑成功' : '新增成功')
          dialogVisible.value = false
          getList()
        })
        // request 已统一展示后端业务错误，避免同一错误重复弹窗。
        .catch(() => {})
        .finally(() => {
          loading.value = false
        })
    }
  })
}

// 删除活动
function handleDelete(id) {
  ElMessageBox.confirm('确定要删除该活动吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    deleteGroupBuyActivity([id])
      .then(() => {
        ElMessage.success('删除成功')
        getList()
      })
      .catch((error) => ElMessage.error(error.message || '删除失败'))
      .finally(() => {
        loading.value = false
      })
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
    name: '',
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

// 商品管理
function handleProduct(row) {
  router.push(`/mall/group-buy/product?activityId=${row.id}&activityName=${encodeURIComponent(row.name)}`)
}

// 申请审核
function handleAudit(row) {
  router.push(`/mall/group-buy/audit?activityId=${row.id}`)
}

/**
 * 查看活动下当前所有团的状态。
 */
function handleGroupOverview(row) {
  currentGroupActivity.value = row
  groupOverviewPagination.current = 1
  groupOverviewVisible.value = true
  getGroupOverviewList()
}

/**
 * 查询活动下的团概览。
 */
function getGroupOverviewList() {
  if (!currentGroupActivity.value.id) {
    return
  }
  groupOverviewLoading.value = true
  queryGroupBuyGroupList({
    activityId: currentGroupActivity.value.id,
    current: groupOverviewPagination.current,
    size: groupOverviewPagination.size
  }).then((response) => {
    const data = response.data || {}
    groupOverviewList.value = data.records || []
    groupOverviewPagination.total = Number(data.total) || 0
  }).finally(() => {
    groupOverviewLoading.value = false
  })
}

function handleGroupOverviewSizeChange(size) {
  groupOverviewPagination.size = size
  groupOverviewPagination.current = 1
  getGroupOverviewList()
}

function handleGroupOverviewCurrentChange(current) {
  groupOverviewPagination.current = current
  getGroupOverviewList()
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    '1': '新建',
    '2': '发布',
    '3': '报名中',
    '4': '报名结束',
    '5': '活动中',
    '6': '活动结束',
    '7': '活动下架'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
function getStatusTagType(status) {
  const typeMap = {
    '1': 'info',
    '2': 'primary',
    '3': 'success',
    '4': 'warning',
    '5': 'danger',
    '6': 'info',
    '7': 'danger'
  }
  return typeMap[status] || 'info'
}

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

function getGroupStatusType(status) {
  const typeMap = {
    '1': 'warning',
    '2': 'primary',
    '3': 'success',
    '4': 'danger',
    '5': 'info'
  }
  return typeMap[status] || 'info'
}

function getNextStatus(status) {
  const nextStatusMap = {
    '1': '2',
    '2': '3',
    '3': '4',
    '4': '5',
    '5': '6',
    '6': '7'
  }
  return nextStatusMap[String(status)]
}

function getNextStatusText(status) {
  const textMap = {
    '1': '发布',
    '2': '开始报名',
    '3': '结束报名',
    '4': '开始活动',
    '5': '结束活动',
    '6': '下架'
  }
  return textMap[String(status)] || ''
}

async function handleStatusChange(row) {
  const status = getNextStatus(row.status)
  if (!status) {
    return
  }
  if (status === '6' && isBeforeActivityEnd(row.activityEndTime)) {
    try {
      await ElMessageBox.confirm(
        '提前结束将统一结算活动：满团订单转为待发货，未满团订单将关闭或退款。',
        '提前结束活动',
        { confirmButtonText: '继续', cancelButtonText: '取消', type: 'warning' }
      )
      await ElMessageBox.confirm(
        '该操作不可撤销，确认结束当前拼团活动？',
        '二次确认',
        { confirmButtonText: '确认结束', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
  }
  loading.value = true
  updateGroupBuyActivityStatus({ id: row.id, status })
    .then(() => {
      ElMessage.success('活动状态更新成功')
      getList()
    })
    .catch((error) => ElMessage.error(error.message || '活动状态更新失败'))
    .finally(() => {
      loading.value = false
    })
}

function isBeforeActivityEnd(activityEndTime) {
  if (!activityEndTime) {
    return false
  }
  const endTime = new Date(String(activityEndTime).replace(/-/g, '/')).getTime()
  return !Number.isNaN(endTime) && Date.now() < endTime
}

// 是否启用变更
function handleEnabledChange(row) {
  loading.value = true
  updateGroupBuyActivityEnabled({ id: row.id, isEnabled: row.isEnabled })
    .then(() => ElMessage.success('启用状态更新成功'))
    .catch((error) => {
      row.isEnabled = !row.isEnabled
      ElMessage.error(error.message || '启用状态更新失败')
    })
    .finally(() => {
      loading.value = false
    })
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

.form-tip {
  width: 100%;
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

.group-product-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-product-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
}

.reserved-count {
  display: block;
  margin-top: 2px;
  color: #909399;
  font-size: 12px;
}
</style>
