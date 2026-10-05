<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="入口名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入入口名称"
          clearable
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="isEnabled">
        <el-select
          v-model="queryParams.isEnabled"
          placeholder="请选择状态"
          clearable
          style="width: 120px"
        >
          <el-option label="启用" value="true" />
          <el-option label="禁用" value="false" />
        </el-select>
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
      <el-table-column prop="name" label="入口名称" align="center" />
      <el-table-column prop="icon" label="图标" align="center">
        <template #default="scope">
          <ImagePreview :src="getFullImageUrl(scope.row.icon)" :width="40" :height="40" />
        </template>
      </el-table-column>
      <el-table-column prop="target" label="链接地址" align="center" />
      <el-table-column prop="sort" label="排序" align="center" />
      <el-table-column prop="isEnabled" label="状态" align="center">
        <template #default="scope">
          <el-switch
            v-model="scope.row.isEnabled"
            :active-value="true"
            :inactive-value="false"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" align="center" />
      <el-table-column prop="updateTime" label="更新时间" align="center" />
      <el-table-column prop="remark" label="备注" align="center" />
      <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.current"
      v-model:limit="queryParams.size"
      @pagination="getList"
    />

    <el-dialog :title="'新增金刚区入口'" v-model="createDialogVisible" width="500px" append-to-body>
      <el-form ref="createFormRef" :model="createForm" :rules="createFormRules" label-width="80px">
        <el-form-item label="入口名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入入口名称" />
        </el-form-item>
        <el-form-item label="链接地址" prop="target">
          <el-input v-model="createForm.target" placeholder="请输入链接地址" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="createForm.sort" :min="0" :max="999" placeholder="请输入排序" />
        </el-form-item>
        <el-form-item label="状态" prop="isEnabled">
          <el-switch v-model="createForm.isEnabled" :active-value="true" :inactive-value="false" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <FileUpload
            v-model:modelValue="createForm.icon"
            :fileType="['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']"
            :fileSize="2"
            :limit="1"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="createForm.remark" placeholder="请输入备注信息" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleCreateConfirm">确 定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑金刚区入口" width="500px" append-to-body>
      <el-form ref="editFormRef" :model="editForm" :rules="editFormRules" label-width="80px">
        <el-form-item label="入口名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入入口名称" />
        </el-form-item>
        <el-form-item label="链接地址" prop="target">
          <el-input v-model="editForm.target" placeholder="请输入链接地址" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="editForm.sort" :min="0" :max="999" placeholder="请输入排序" />
        </el-form-item>
        <el-form-item label="状态" prop="isEnabled">
          <el-switch v-model="editForm.isEnabled" :active-value="true" :inactive-value="false" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <FileUpload
            v-model:modelValue="editForm.icon"
            :fileType="['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']"
            :fileSize="2"
            :limit="1"
          />
          <div v-if="editForm.icon" class="current-icon">
            <ImagePreview :src="getFullImageUrl(editForm.icon)" :width="60" :height="60" />
          </div>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editForm.remark" placeholder="请输入备注信息" type="textarea" />
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
import RightToolbar from '@/components/RightToolbar/index.vue'
import Pagination from '@/components/Pagination/index.vue'
import FileUpload from '@/components/FileUpload/index.vue'
import ImagePreview from '@/components/ImagePreview/index.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createQuickEntry, updateQuickEntry, deleteQuickEntry, queryQuickEntryList } from '@/api/mall/quickEntry'

const tableData = ref([])
const loading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const selectedRows = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const queryParams = ref({
  name: '',
  isEnabled: '',
  current: 1,
  size: 10
})

const createDialogVisible = ref(false)
const createForm = ref({ name: '', target: '', sort: 0, isEnabled: true, icon: '', remark: '' })
const createFormRules = {
  name: [ { required: true, message: '请输入入口名称', trigger: 'blur' } ],
  sort: [ { required: true, message: '请输入排序', trigger: 'blur' } ],
  icon: [ { required: true, message: '请输入图标文件ID', trigger: 'blur' } ]
}

const editDialogVisible = ref(false)
const editForm = ref({ id: '', name: '', target: '', sort: 0, isEnabled: true, icon: '', remark: '' })
const editFormRules = {
  name: [ { required: true, message: '请输入入口名称', trigger: 'blur' } ],
  sort: [ { required: true, message: '请输入排序', trigger: 'blur' } ],
  icon: [ { required: true, message: '请输入图标文件ID', trigger: 'blur' } ]
}

const filteredTableData = computed(() => tableData.value)

// 构造完整的图片URL
function getFullImageUrl(fileKey) {
  if (!fileKey) return ''

  // 使用真实的图片预览接口，只返回相对路径
  return `/public/storage/preview?fileKey=${fileKey}`
}

function handleQuery() {
  queryParams.value.current = 1
  getList()
}
function resetQuery() {
  queryParams.value.name = ''
  queryParams.value.isEnabled = ''
  handleQuery()
}
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  selectedRows.value = selection
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  createForm.value = { name: '', target: '', sort: 0, isEnabled: true, icon: '', remark: '' }
  createDialogVisible.value = true
}

function handleCreateConfirm() {
  // 验证表单
  if (!createForm.value.name || !createForm.value.sort || !createForm.value.icon) {
    ElMessage.warning('请填写完整的表单信息')
    return
  }

  // 使用真实API接口
  createQuickEntry(createForm.value).then(res => {
    if (res.code === 0) {
      ElMessage.success('创建成功')
      createDialogVisible.value = false
      getList()
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  }).catch(() => {
    ElMessage.error('创建失败')
  })
}

function handleUpdate(row) {
  let target = row
  if (!target) {
    if (selectedRows.value.length !== 1) {
      ElMessage.warning('请选择一个要编辑的金刚区入口')
      return
    }
    target = selectedRows.value[0]
  }
  editForm.value = { ...target }
  editDialogVisible.value = true
}

function handleEditConfirm() {
  // 检查editForm.value.id是否存在
  if (!editForm.value.id) {
    ElMessage.error('金刚区入口ID不存在')
    return
  }

  // 验证表单
  if (!editForm.value.name || !editForm.value.sort || !editForm.value.icon) {
    ElMessage.warning('请填写完整的表单信息')
    return
  }

  // 使用真实API接口
  updateQuickEntry(editForm.value).then(res => {
    if (res.code === 0) {
      ElMessage.success('修改成功')
      editDialogVisible.value = false
      getList()
    } else {
      ElMessage.error(res.message || '修改失败')
    }
  }).catch(() => {
    ElMessage.error('修改失败')
  })
}

function handleDelete(row) {
  let targets = []
  if (row && row.id) {
    targets = [row.id]
  } else {
    if (!ids.value.length) {
      ElMessage.warning('请选择要删除的金刚区入口')
      return
    }
    targets = ids.value
  }
  ElMessageBox.confirm(
    `确认要删除选中的金刚区入口吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteQuickEntry(targets).then(res => {
      if (res.code === 0) {
        ElMessage.success('删除成功')
        getList()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    }).catch(() => {
      ElMessage.error('删除失败')
    })
  }).catch(() => {})
}

function handleStatusChange(row) {
  // 使用updateQuickEntry更新状态
  updateQuickEntry(row).then(res => {
    if (res.code === 0) {
      ElMessage.success('状态更新成功')
    } else {
      ElMessage.error(res.message || '状态更新失败')
      // 恢复原状态
      row.isEnabled = !row.isEnabled
    }
  }).catch(() => {
    ElMessage.error('状态更新失败')
    // 恢复原状态
    row.isEnabled = !row.isEnabled
  })
}

function getList() {
  loading.value = true
  let conditions = []
  // 使用name字段进行搜索
  if (queryParams.value.name) {
    conditions.push(`name:like:${queryParams.value.name}`)
  }
  // 使用isEnabled字段进行搜索
  if (queryParams.value.isEnabled) {
    conditions.push(`isEnabled:eq:${queryParams.value.isEnabled}`)
  }
  // 添加按sort升序排序和createTime降序排序
  conditions.push('sort:sort:asc')
  conditions.push('createTime:sort:desc')

  const params = {
    size: queryParams.value.size,
    current: queryParams.value.current
  }

  if (conditions.length) {
    params['conditions_'] = conditions.join(';') // 使用分号分隔
  }

  // 使用真实API接口
  queryQuickEntryList(params).then(res => {
    if (res.code === 0) {
      tableData.value = res.data?.records || []
      total.value = Number(res.data?.total) || 0
    }
    loading.value = false
  }).catch(() => {
    loading.value = false
    ElMessage.error('获取数据失败')
  })
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

.current-icon {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
