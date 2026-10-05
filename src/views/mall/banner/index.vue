<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="图片链接" prop="imageUrl">
        <el-input
          v-model="queryParams.imageUrl"
          placeholder="请输入图片链接"
          clearable
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="filteredTableData" @selection-change="handleSelectionChange" row-key="id">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="id" label="ID" align="center" />
      <el-table-column prop="imageUrl" label="图片" align="center">
        <template #default="scope">
          <ImagePreview :src="getFullImageUrl(scope.row.imageUrl)" :width="40" :height="40" />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" align="center" />
      <el-table-column prop="createBy" label="创建人" align="center" />
      <el-table-column prop="updateTime" label="更新时间" align="center" />
      <el-table-column prop="updateBy" label="更新人" align="center" />
      <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="Number(total)"
      v-model:page="queryParams.current"
      v-model:limit="queryParams.size"
      @pagination="getList"
    />

    <el-dialog :title="'添加Banner'" v-model="createDialogVisible" width="500px" append-to-body>
      <el-form ref="createFormRef" :model="createForm" :rules="createFormRules" label-width="80px">
        <el-form-item label="图片" prop="imageUrl">
          <input type="file" ref="fileInputRef" @change="handleFileSelect" accept="image/*" />
          <div class="el-upload__tip">
            只能上传jpg/png文件，且不超过5MB
          </div>
          <div v-if="fileList.length > 0" class="file-list">
            <span>{{ fileList[0].name }}</span>
            <el-button type="danger" link @click="handleFileRemove">删除</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleCreateConfirm">确 定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑Banner" width="500px" append-to-body>
      <el-form ref="editFormRef" :model="editForm" :rules="editFormRules" label-width="80px">
        <el-form-item label="图片" prop="imageUrl">
          <input type="file" ref="editFileInputRef" @change="handleEditFileSelect" accept="image/*" />
          <div class="el-upload__tip">
            只能上传jpg/png文件，且不超过5MB
          </div>
          <div v-if="editFileList.length > 0" class="file-list">
            <span>{{ editFileList[0].name }}</span>
            <el-button type="danger" link @click="handleEditFileRemove">删除</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleEditConfirm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { getBannerDetail, deleteBanner, queryBannerList, createBannerWithFile, updateBannerWithFile } from '@/api/mall/banner'
import RightToolbar from '@/components/RightToolbar/index.vue'
import Pagination from '@/components/Pagination/index.vue'
import ImagePreview from '@/components/ImagePreview/index.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const tableData = ref([])
const loading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const selectedRows = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const queryParams = ref({
  imageUrl: '',
  current: 1,
  size: 10
})

const createDialogVisible = ref(false)
const createForm = ref({ imageUrl: '' })
const createFormRules = {
  imageUrl: [ { required: true, message: '请输入图片文件key', trigger: 'blur' } ]
}

// 文件上传相关
const fileInputRef = ref()
const fileList = ref([])

const editDialogVisible = ref(false)
const editForm = ref({ id: '', imageUrl: '' })
const editFormRules = {
  imageUrl: [ { required: false, message: '请上传图片', trigger: 'blur' } ]
}

// 编辑文件上传相关
const editFileInputRef = ref()
const editFileList = ref([])

const filteredTableData = computed(() => tableData.value)

// 构造完整的图片URL
function getFullImageUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

function handleQuery() {
  queryParams.value.current = 1
  getList()
}
function resetQuery() {
  queryParams.value.imageUrl = ''
  handleQuery()
}
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  selectedRows.value = selection
  single.value = selection.length !== 1
  multiple.value = !selection.length
}
// 文件上传处理函数
function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型和大小
  const isImage = file.type.startsWith('image/')
  // 支持的图片格式扩展名
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const fileExtension = file.name.split('.').pop().toLowerCase()
  const isAllowedExtension = allowedExtensions.includes(fileExtension)
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage && !isAllowedExtension) {
    ElMessage.error('只能上传图片文件(JPG, JPEG, PNG, GIF, BMP, WebP, SVG)!')
    return false
  }

  if (!isLt5M) {
    ElMessage.error('上传图片大小不能超过 5MB!')
    return false
  }

  // 保存文件到列表
  fileList.value = [file]

  // 同时更新表单字段以通过验证
  createForm.value.imageUrl = file.name
}

function handleFileRemove() {
  fileList.value = []
  createForm.value.imageUrl = ''
  // 清空文件输入框
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// 编辑文件上传处理函数
function handleEditFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型和大小
  const isImage = file.type.startsWith('image/')
  // 支持的图片格式扩展名
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const fileExtension = file.name.split('.').pop().toLowerCase()
  const isAllowedExtension = allowedExtensions.includes(fileExtension)
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage && !isAllowedExtension) {
    ElMessage.error('只能上传图片文件(JPG, JPEG, PNG, GIF, BMP, WebP, SVG)!')
    return false
  }

  if (!isLt5M) {
    ElMessage.error('上传图片大小不能超过 5MB!')
    return false
  }

  // 保存文件到列表
  editFileList.value = [file]

  // 同时更新表单字段以通过验证
  editForm.value.imageUrl = file.name
}

function handleEditFileRemove() {
  editFileList.value = []
  editForm.value.imageUrl = ''
  // 清空文件输入框
  if (editFileInputRef.value) {
    editFileInputRef.value.value = ''
  }
}

function handleAdd() {
  createForm.value = { imageUrl: '' }
  fileList.value = []
  // 清空文件输入框
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  createDialogVisible.value = true
}
function handleCreateConfirm() {
  if (fileList.value.length === 0) {
    ElMessage.warning('请上传图片')
    return
  }

  // 使用文件上传接口
  const file = fileList.value[0]
  createBannerWithFile(getShopId(), file).then(res => {
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    getList()
  }).catch(() => {
    ElMessage.error('创建失败')
  })
}
function handleUpdate(row) {
  let target = row
  if (!target) {
    if (selectedRows.value.length !== 1) {
      ElMessage.warning('请选择一个要编辑的Banner')
      return
    }
    target = selectedRows.value[0]
  }
  getBannerDetail(target.id).then(res => {
    editForm.value = { ...res.data }
    // 清空编辑文件列表
    editFileList.value = []
    // 清空文件输入框
    if (editFileInputRef.value) {
      editFileInputRef.value.value = ''
    }
    editDialogVisible.value = true
  })
}
function handleEditConfirm() {
  if (editFileList.value.length === 0) {
    ElMessage.warning('请上传图片')
    return
  }

  // 检查editForm.value.id是否存在
  if (!editForm.value.id) {
    ElMessage.error('Banner ID不存在')
    return
  }

  // 使用文件上传接口
  const file = editFileList.value[0]
  updateBannerWithFile(editForm.value.id.toString(), getShopId(), file).then(() => {
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    getList()
  }).catch(() => ElMessage.error('修改失败'))
}
function handleDelete(row) {
  let targets = []
  if (row && row.id) {
    targets = [row.id]
  } else {
    if (!ids.value.length) {
      ElMessage.warning('请选择要删除的Banner')
      return
    }
    targets = ids.value
  }
  ElMessageBox.confirm(
    `确认要删除选中的Banner吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteBanner(targets).then(() => {
      ElMessage.success('删除成功')
      getList()
    }).catch(() => {})
  }).catch(() => {})
}
function getList() {
  loading.value = true
  let conditions = []
  // 使用imageUrl字段进行搜索
  if (queryParams.value.imageUrl) {
    conditions.push(`imageUrl:like:${queryParams.value.imageUrl}`)
  }
  // 添加按ID降序排序
  conditions.push('id:sort:desc')

  const params = {
    size: queryParams.value.size,
    current: queryParams.value.current,
    shopId: getShopId() // 添加shopId参数
  }

  if (conditions.length) {
    params['conditions_'] = conditions.join(';') // 使用分号分隔
  }

  // 使用新的接口方法
  queryBannerList(params).then(res => {
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}
// 获取当前商户ID
function getShopId() {
  return localStorage.getItem('shopId') || ''
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 24px;
}
.mb8 {
  margin-bottom: 8px;
}

.file-list {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}
</style>
