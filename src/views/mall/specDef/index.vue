<template>
  <div class="app-container">
    <!-- 查询表单 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" @submit.prevent>
      <el-form-item label="规格名称" prop="name">
        <el-input
          v-model="queryParams.specName"
          placeholder="请输入规格名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增规格</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleEdit">编辑</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>
    <el-table v-loading="loading" :data="tableData" @selection-change="handleSelectionChange" row-key="id">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="specName" label="规格名称" align="center" />
      <el-table-column prop="createBy" label="创建人" align="center" />
      <el-table-column prop="createTime" label="创建时间" align="center" />
      <el-table-column prop="updateBy" label="更新人" align="center" />
      <el-table-column prop="updateTime" label="更新时间" align="center" />
      <el-table-column label="操作" width="180" align="center">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
      <el-table-column label="规格选项" width="120" align="center">
        <template #default="scope">
          <el-button link type="primary" icon="List" @click="openOptionDialog(scope.row)">规格选项</el-button>
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400px" @close="dialogVisible = false">
      <el-form :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="规格名称" prop="name">
          <el-input v-model="form.specName" placeholder="请输入规格名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleConfirm">确 定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="optionDialogVisible" :title="optionDialogTitle" width="700px" @close="optionDialogVisible = false">
      <el-table v-loading="optionLoading" :data="optionList" row-key="id">
        <el-table-column prop="optName" label="选项名称" align="center" />
        <el-table-column prop="createBy" label="创建人" align="center" />
        <el-table-column prop="createTime" label="创建时间" align="center" />
        <el-table-column prop="updateBy" label="更新人" align="center" />
        <el-table-column prop="updateTime" label="更新时间" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleEditOption(scope.row)">编辑</el-button>
            <el-button link type="primary" icon="Delete" @click="handleDeleteOption(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="optionDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleAddOption">新增选项</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="optionFormVisible" :title="optionDialogTitle" width="400px" @close="optionFormVisible = false">
      <el-form :model="optionForm" :rules="optionFormRules" label-width="90px">
        <el-form-item label="选项名称" prop="optName">
          <el-input v-model="optionForm.optName" placeholder="请输入选项名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="optionFormVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSaveOption">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import RightToolbar from '@/components/RightToolbar/index.vue'
import Pagination from '@/components/Pagination/index.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listSpecDef, createSpecDef, updateSpecDef, deleteSpecDef, listSpecOptDef, createSpecOptDef, deleteSpecOptDef, updateSpecOptDef } from '@/api/mall/specDef'

const tableData = ref([])
const loading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const selectedRows = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const queryParams = ref({ specName: '', current: 1, size: 10 })
const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = ref({ id: '', specName: '' })
const formRules = {
  specName: [ { required: true, message: '请输入规格名称', trigger: 'blur' } ]
}

const filteredTableData = computed(() => tableData.value)

function getShopId() {
  return localStorage.getItem('shopId') || ''
}

function handleQuery() {
  queryParams.value.current = 1
  getList()
}
function resetQuery() {
  queryParams.value.specName = ''
  handleQuery()
}
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  selectedRows.value = selection
  single.value = selection.length !== 1
  multiple.value = !selection.length
}
function handleAdd() {
  dialogTitle.value = '新增规格'
  form.value = { id: '', specName: '' }
  dialogVisible.value = true
}
function handleEdit(row) {
  let target = row
  if (!target) {
    if (selectedRows.value.length !== 1) {
      ElMessage.warning('请选择一个要编辑的规格')
      return
    }
    target = selectedRows.value[0]
  }
  form.value = { ...target }
  dialogTitle.value = '编辑规格'
  dialogVisible.value = true
}
async function handleConfirm() {
  if (!form.value.specName) {
    ElMessage.warning('请填写完整信息')
    return
  }
  loading.value = true
  try {
    if (form.value.id) {
      await updateSpecDef({
        id: form.value.id,
        specName: form.value.specName
      })
      ElMessage.success('编辑成功')
    } else {
      await createSpecDef({
        shopId: getShopId(),
        specName: form.value.specName
      })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
  } catch (e) {
    ElMessage.error(form.value.id ? '编辑失败' : '新增失败')
  } finally {
    loading.value = false
  }
}
async function handleDelete(row) {
  let targets = []
  if (row && row.id) {
    targets = [row.id]
  } else {
    if (!ids.value.length) {
      ElMessage.warning('请选择要删除的规格')
      return
    }
    targets = ids.value
  }
  ElMessageBox.confirm(
    `确认要删除选中的规格吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    loading.value = true
    try {
      await deleteSpecDef(targets)
      ElMessage.success('删除成功')
      getList()
    } catch (e) {
      ElMessage.error('删除失败')
    } finally {
      loading.value = false
    }
  }).catch(() => {})
}
async function getList() {
  loading.value = true
  try {
    const params = {
      shopId: getShopId(),
      size: queryParams.value.size,
      current: queryParams.value.current
    }
    if (queryParams.value.specName) {
      params['conditions_'] = `specName:like:${queryParams.value.specName}`
    }
    const res = await listSpecDef(params)
    tableData.value = res.data?.records || []
    total.value = Number(res.data?.total || 0)
  } catch (e) {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const optionDialogVisible = ref(false)
const optionDialogTitle = ref('')
const optionList = ref([])
const optionLoading = ref(false)
const optionForm = ref({ id: '', optName: '' })
const optionFormVisible = ref(false)
const optionFormRules = {
  optName: [ { required: true, message: '请输入选项名称', trigger: 'blur' } ]
}
const currentSpec = ref(null)

function openOptionDialog(row) {
  currentSpec.value = row
  optionDialogTitle.value = `规格选项 - ${row.specName}`
  optionDialogVisible.value = true
  getOptionList(row.id)
}
async function getOptionList(specId) {
  optionLoading.value = true
  try {
    const params = {
      shopId: getShopId(),
      specId
    }
    const res = await listSpecOptDef(params)
    optionList.value = res.data || []
  } catch (e) {
    optionList.value = []
  } finally {
    optionLoading.value = false
  }
}
function handleAddOption() {
  optionForm.value = { id: '', optName: '' }
  optionDialogTitle.value = `新增选项 - ${currentSpec.value.specName}`
  optionFormVisible.value = true
}
function handleEditOption(row) {
  optionForm.value = { ...row }
  optionDialogTitle.value = `编辑选项 - ${currentSpec.value.specName}`
  optionFormVisible.value = true
}
async function handleSaveOption() {
  if (!optionForm.value.optName) {
    ElMessage.warning('请输入选项名称')
    return
  }
  optionLoading.value = true
  try {
    if (optionForm.value.id) {
      await updateSpecOptDef({
        shopId: getShopId(),
        id: optionForm.value.id,
        optName: optionForm.value.optName
      })
      ElMessage.success('编辑成功')
    } else {
      await createSpecOptDef({
        shopId: getShopId(),
        specId: currentSpec.value.id,
        optName: optionForm.value.optName
      })
      ElMessage.success('新增成功')
    }
    optionFormVisible.value = false
    getOptionList(currentSpec.value.id)
  } catch (e) {
    ElMessage.error(optionForm.value.id ? '编辑失败' : '新增失败')
  } finally {
    optionLoading.value = false
  }
}
async function handleDeleteOption(row) {
  ElMessageBox.confirm('确认要删除该选项吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    optionLoading.value = true
    try {
      await deleteSpecOptDef([row.id])
      ElMessage.success('删除成功')
      getOptionList(currentSpec.value.id)
    } catch (e) {
      ElMessage.error('删除失败')
    } finally {
      optionLoading.value = false
    }
  }).catch(() => {})
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
</style>
