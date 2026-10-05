<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" @submit.prevent>
      <el-form-item label="分类名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入分类名称"
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

    <el-table
      v-loading="loading"
      :data="filteredTableData"
      @selection-change="handleSelectionChange"
      row-key="id"
      default-expand-all
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="name" label="分类名称" align="left" />
      <el-table-column prop="code" label="分类编码" align="center" />
      <el-table-column prop="sort" label="排序" align="center" />
      <el-table-column prop="level" label="层级" align="center" />
      <el-table-column prop="path" label="路径" align="center" />
      <el-table-column prop="remark" label="备注" align="center" />
      <el-table-column prop="createBy" label="创建人" align="center" />
      <el-table-column prop="createTime" label="创建时间" align="center" />
      <el-table-column prop="updateBy" label="更新人" align="center" />
      <el-table-column prop="updateTime" label="更新时间" align="center" />
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

    <el-dialog v-model="createDialogVisible" title="创建分类" width="400px" @close="createDialogVisible = false">
      <el-form :model="createForm" :rules="createFormRules" label-width="90px">
        <el-form-item label="上级分类" prop="parentId">
          <el-tree-select
            v-model="createForm.parentId"
            :data="categoryTree"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            value-key="id"
            placeholder="选择上级分类"
            check-strictly
            clearable
            style="width: 100%"
            allow-clear
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="createForm.code" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="createForm.sort" :min="1" placeholder="请输入排序" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="createForm.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleCreateConfirm">确 定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑分类" width="400px" @close="editDialogVisible = false">
      <el-form :model="editForm" :rules="editFormRules" label-width="90px">
        <el-form-item label="上级分类" prop="parentId">
          <el-tree-select
            v-model="editForm.parentId"
            :data="categoryTree"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            value-key="id"
            placeholder="选择上级分类"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="editForm.code" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="editForm.sort" :min="1" placeholder="请输入排序" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editForm.remark" placeholder="请输入备注" />
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
import { ref, computed, onMounted, watch } from 'vue'
import { getCategoryTree, createCategory, getCategoryDetail, updateCategory, deleteCategory, queryCategoryList } from '@/api/mall/category'
import { queryShopList } from '@/api/mall/shop'
import RightToolbar from '@/components/RightToolbar/index.vue'
import Pagination from '@/components/Pagination/index.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const tableData = ref([])
const categoryTree = ref([])
const loading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const selectedRows = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const queryParams = ref({
  name: '',
  current: 1,
  size: 10
})

const createDialogVisible = ref(false)
const createForm = ref({ shopId: '', parentId: null, code: '', name: '', sort: 1, remark: '' })
const createFormRules = {
  shopId: [ { required: true, message: '请选择店铺', trigger: 'blur' } ],
  parentId: [ ],
  code: [ { required: true, message: '请输入分类编码', trigger: 'blur' } ],
  name: [ { required: true, message: '请输入分类名称', trigger: 'blur' } ],
  sort: [ { required: true, message: '请输入排序', trigger: 'blur' } ],
  remark: [ ]
}

const editDialogVisible = ref(false)
const editForm = ref({ id: '', shopId: '', parentId: null, code: '', name: '', sort: 1, remark: '' })
const editFormRules = {
  shopId: [ { required: true, message: '请选择店铺', trigger: 'blur' } ],
  parentId: [ ],
  code: [ { required: true, message: '请输入分类编码', trigger: 'blur' } ],
  name: [ { required: true, message: '请输入分类名称', trigger: 'blur' } ],
  sort: [ { required: true, message: '请输入排序', trigger: 'blur' } ],
  remark: [ ]
}

const filteredTableData = computed(() => tableData.value)

function handleQuery() {
  queryParams.value.current = 1
  getList()
}
function resetQuery() {
  queryParams.value.name = ''
  handleQuery()
}
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  selectedRows.value = selection
  single.value = selection.length !== 1
  multiple.value = !selection.length
}
function handleAdd() {
  createForm.value = { shopId: localStorage.getItem('shopId'), parentId: null, code: '', name: '', sort: 1, remark: '' }
  createDialogVisible.value = true
}
function handleCreateConfirm() {
  if (!createForm.value.shopId) {
    createForm.value.shopId = localStorage.getItem('shopId')
  }
  // 只在提交参数时处理 parentId
  const payload = {
    shopId: createForm.value.shopId,
    parentId: (createForm.value.parentId === null || createForm.value.parentId === undefined || createForm.value.parentId === '') ? 0 : createForm.value.parentId,
    code: createForm.value.code,
    name: createForm.value.name,
    sort: createForm.value.sort,
    remark: createForm.value.remark
  }
  if (!payload.shopId || !payload.code || !payload.name || !payload.sort) {
    ElMessage.warning('请填写完整信息')
    return
  }
  createCategory(payload).then(res => {
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    // 重置表单，避免 parentId 残留 0
    createForm.value.parentId = null
    getList()
  }).catch(() => {
    ElMessage.error('创建失败')
  })
}
function handleUpdate(row) {
  let target = row
  if (!target) {
    if (selectedRows.value.length !== 1) {
      ElMessage.warning('请选择一个要编辑的分类')
      return
    }
    target = selectedRows.value[0]
  }
  getCategoryDetail(target.id).then(res => {
    // 自动注入 shopId，parentId 为 0 时转为 null 以便下拉框显示为空
    editForm.value = { ...res.data, shopId: localStorage.getItem('shopId'), parentId: (res.data.parentId === 0 ? null : res.data.parentId) }
    editDialogVisible.value = true
  })
}
function handleEditConfirm() {
  if (!editForm.value.shopId) {
    editForm.value.shopId = localStorage.getItem('shopId')
  }
  // 只在提交参数时处理 parentId
  const payload = {
    id: editForm.value.id,
    shopId: editForm.value.shopId,
    parentId: (editForm.value.parentId === null || editForm.value.parentId === undefined || editForm.value.parentId === '') ? 0 : editForm.value.parentId,
    code: editForm.value.code,
    name: editForm.value.name,
    sort: editForm.value.sort,
    remark: editForm.value.remark
  }
  if (!payload.shopId || !payload.code || !payload.name || !payload.sort) {
    ElMessage.warning('请填写完整信息')
    return
  }
  updateCategory(payload).then(() => {
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    // 重置 parentId，避免下次弹窗残留 0
    editForm.value.parentId = null
    getList()
  }).catch(() => ElMessage.error('修改失败'))
}
function handleDelete(row) {
  let targets = []
  if (row && row.id) {
    targets = [row.id]
  } else {
    if (!ids.value.length) {
      ElMessage.warning('请选择要删除的分类')
      return
    }
    targets = ids.value
  }
  ElMessageBox.confirm(
    `确认要删除选中的分类吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteCategory(targets).then(() => {
      ElMessage.success('删除成功')
      getList()
    }).catch(() => {})
  }).catch(() => {})
}
function getList() {
  loading.value = true
  const shopId = localStorage.getItem('shopId')
  // 判断是否有搜索条件
  if (queryParams.value.name) {
    // 有分类名称搜索时，调用 query 接口
    const conditions = `name:like:${queryParams.value.name}`
    queryCategoryList({ shopId, conditions_: conditions, current: queryParams.value.current, size: queryParams.value.size }).then(res => {
      tableData.value = res.data?.records || []
      total.value = res.data?.total || 0
      categoryTree.value = [] // 搜索时不展示树
      loading.value = false
    }).catch(() => {
      loading.value = false
    })
  } else {
    // 无搜索条件时，展示树
    getCategoryTree({ shopId }).then(res => {
      tableData.value = res.data || []
      categoryTree.value = res.data || []
      total.value = 0 // 树形结构无需分页
      loading.value = false
    }).catch(() => {
      loading.value = false
    })
  }
}
onMounted(async () => {
  let shopId = localStorage.getItem('shopId')
  if (!shopId) {
    const res = await queryShopList({})
    if (res.data && res.data.records && res.data.records.length > 0) {
      shopId = res.data.records[0].id
      localStorage.setItem('shopId', shopId)
    }
  }
  getList()
})
// 弹窗关闭时重置 parentId
watch(createDialogVisible, (val) => {
  if (!val) {
    createForm.value.parentId = null
  }
})
// 弹窗关闭时重置 parentId
watch(editDialogVisible, (val) => {
  if (!val) {
    editForm.value.parentId = null
  }
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
