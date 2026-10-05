<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="searchFormRef" :inline="true" v-show="showSearch">
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
          <el-option label="启用" value="1" />
          <el-option label="禁用" value="0" />
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
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增活动</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

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
      <el-table-column prop="startTime" label="活动开始时间" width="180" />
      <el-table-column prop="endTime" label="活动结束时间" width="180" />
      <el-table-column prop="minPeople" label="最低成团人数" width="120" />
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
      <el-table-column label="操作" width="350" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)" plain>
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="success" size="small" @click="handleProduct(scope.row)" plain>
            <el-icon><Goods /></el-icon>
            商品管理
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
            action="/dev-api/basic/storage/upload"
            :headers="{ Authorization: 'Bearer ' + getToken() }"
            :data="{ storageType: '', isPublic: true, isUsed: false }"
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
          <el-col :span="14">
            <el-form-item label="活动开始时间" prop="startTime">
              <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择活动开始时间" style="width: 220px" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="活动结束时间" prop="endTime">
              <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择活动结束时间" style="width: 220px" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="最低成团人数" prop="minPeople">
          <el-input-number v-model="form.minPeople" :min="2" style="width: 100%" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete, Goods, Upload, Picture, Check } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'
import RightToolbar from '@/components/RightToolbar/index.vue'
import { useRouter } from 'vue-router'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增活动')
const formRef = ref(null)
const router = useRouter()
const showSearch = ref(true)

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

// 表单数据
const form = reactive({
  id: '',
  name: '',
  description: '',
  coverImage: '',
  startTime: '',
  endTime: '',
  minPeople: 2,
  sort: 1,
  remark: ''
})

// 表单规则
const rules = reactive({
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入活动描述', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择活动开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择活动结束时间', trigger: 'change' }],
  minPeople: [{ required: true, message: '请输入最低成团人数', trigger: 'blur' }]
})

// 活动列表
const activityList = ref([])

// 模拟数据
const mockActivityList = [
  {
    id: 1,
    name: '春季拼团活动',
    description: '春季拼团优惠，多人成团更划算',
    coverImage: 'spring-group.jpg',
    startTime: '2026-03-01 00:00:00',
    endTime: '2026-03-31 23:59:59',
    minPeople: 3,
    sort: 1,
    remark: '春季重点活动',
    status: '1',
    isEnabled: true
  },
  {
    id: 2,
    name: '女神节拼团',
    description: '女神节特别拼团活动',
    coverImage: 'goddess.jpg',
    startTime: '2026-03-01 00:00:00',
    endTime: '2026-03-08 23:59:59',
    minPeople: 2,
    sort: 2,
    remark: '女神节特别活动',
    status: '1',
    isEnabled: true
  }
]

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

  // 模拟API调用
  setTimeout(() => {
    activityList.value = mockActivityList
    pagination.total = mockActivityList.length
    loading.value = false
  }, 500)
}

// 新增活动
function handleAdd() {
  dialogTitle.value = '新增活动'
  form.id = ''
  form.name = ''
  form.description = ''
  form.coverImage = ''
  form.startTime = ''
  form.endTime = ''
  form.minPeople = 2
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
  form.startTime = row.startTime
  form.endTime = row.endTime
  form.minPeople = row.minPeople
  form.sort = row.sort
  form.remark = row.remark
  dialogVisible.value = true
}

// 格式化日期时间
function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 提交表单
function handleSubmit() {
  formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      const submitData = {
        name: form.name,
        description: form.description,
        coverImage: form.coverImage,
        startTime: formatDateTime(form.startTime),
        endTime: formatDateTime(form.endTime),
        minPeople: form.minPeople,
        sort: form.sort,
        remark: form.remark
      }

      if (form.id) {
        // 编辑
        setTimeout(() => {
          ElMessage.success('编辑成功')
          dialogVisible.value = false
          getList()
          loading.value = false
        }, 500)
      } else {
        // 新增
        setTimeout(() => {
          ElMessage.success('新增成功')
          dialogVisible.value = false
          getList()
          loading.value = false
        }, 500)
      }
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
    // 模拟删除
    setTimeout(() => {
      ElMessage.success('删除成功')
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

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    '1': '启用',
    '0': '禁用'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
function getStatusTagType(status) {
  const typeMap = {
    '1': 'success',
    '0': 'danger'
  }
  return typeMap[status] || 'info'
}

// 是否启用变更
function handleEnabledChange(row) {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    ElMessage.success('状态更新成功')
    loading.value = false
  }, 500)
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