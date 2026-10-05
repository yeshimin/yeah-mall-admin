<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" @submit.prevent>
      <el-form-item label="名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入名称" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="规格编码" prop="specCode">
        <el-input v-model="queryParams.specCode" placeholder="请输入规格编码" clearable style="width: 200px" />
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
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="tableData" @selection-change="handleSelectionChange" row-key="id">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="id" label="ID" align="center" />
      <el-table-column prop="name" label="名称" align="center" />
      <el-table-column prop="specCode" label="规格编码" align="center" />
      <el-table-column prop="price" label="销售价格" align="center" />
      <el-table-column prop="stock" label="库存数量" align="center" />
      <el-table-column label="操作" width="200" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.current" v-model:limit="queryParams.size" @pagination="getList" />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="handleClose">
      <el-form :model="skuForm" :rules="formRules" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="skuForm.name" placeholder="请输入名称" />
        </el-form-item>
        <!-- 移除规格编码字段 -->
        <!-- 新增规格选择区域 -->
        <el-form-item label="规格" prop="optIds">
          <div v-if="loadingSpec" class="spec-loading">加载规格中...</div>
          <div v-else-if="specOptions.length === 0" class="spec-empty">暂无规格数据</div>
          <div v-else v-for="(spec, index) in specOptions" :key="index" class="spec-item">
            <span class="spec-label">{{ spec.specName }}:</span>
            <el-select v-model="skuForm.optIds[index]" placeholder="请选择{{ spec.specName }}" class="spec-select" :disabled="loadingSpec">
              <el-option v-for="opt in spec.opts" :key="opt.optId" :label="opt.optName" :value="opt.optId" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="销售价格" prop="price">
          <el-input v-model="skuForm.price" type="number" placeholder="请输入销售价格" />
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input v-model="skuForm.stock" type="number" placeholder="请输入库存数量" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import RightToolbar from '@/components/RightToolbar/index.vue'
import Pagination from '@/components/Pagination/index.vue'
import { getSkuList, saveSku, updateSku, deleteSku, getSkuDetail } from '@/api/mall/sku'
import { querySpec } from '@/api/mall/spu'

const route = useRoute()
const router = useRouter()
const tableData = ref([])
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const queryParams = ref({
  current: 1,
  size: 10,
  name: '',
  specCode: '',
  spuId: ''
})
const dialogVisible = ref(false)
const dialogTitle = ref('')
const skuForm = ref({
  skuId: '',
  spuId: '',
  name: '',
  price: 0,
  stock: 0,
  optIds: [] // 存储选择的规格选项ID
})
const specOptions = ref([]) // 存储从API获取的规格数据
const loadingSpec = ref(false)
const formRules = {
  name: [{ required: false, message: '请输入名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入销售价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存数量', trigger: 'blur' }],
  optIds: [{
    required: true,
    type: 'array',
    validator: (rule, value, callback) => {
      if (specOptions.value.length === 0) {
        return callback() // 无规格时不验证
      }
      if (!value || value.length !== specOptions.value.length) {
        return callback(new Error('请选择所有规格选项'))
      }
      // 检查是否所有选项都已选择
      const allSelected = value.every(id => id !== undefined && id !== null && id !== '')
      if (!allSelected) {
        return callback(new Error('请选择所有规格选项'))
      }
      callback()
    },
    trigger: 'change'
  }]
}
const ids = ref([])
const selectedRows = ref([])
const queryRef = ref(null)

onMounted(() => {
  const spuId = route.query.spuId
  if (spuId) {
    queryParams.value.spuId = spuId
    skuForm.value.spuId = spuId
    getList()
  }
})

const getList = () => {
  loading.value = true
  // 构造conditions_参数支持模糊搜索
  const params = { ...queryParams.value, shopId: getShopId() }
  const conditions = []
  if (params.name) {
    conditions.push(`name:like:${params.name}`)
  }
  if (params.specCode) {
    conditions.push(`specCode:like:${params.specCode}`)
  }
  // 如果有条件查询，则使用conditions_参数
  if (conditions.length > 0) {
    params.conditions_ = conditions.join(';')
    // 删除原有的查询参数
    delete params.name
    delete params.specCode
  }
  getSkuList(params).then(res => {
    tableData.value = res.data.records
    total.value = res.data.total
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

const handleQuery = () => {
  queryParams.value.current = 1
  getList()
}

const resetQuery = () => {
  queryRef.value.resetFields()
  handleQuery()
}

const handleAdd = () => {
  dialogTitle.value = '新增SKU'
  skuForm.value = { skuId: '', spuId: queryParams.value.spuId, name: '', price: 0, stock: 0, optIds: [] }
  specOptions.value = []
  loadingSpec.value = true
  // 获取规格选项
  querySpec({ shopId: getShopId(), spuId: queryParams.value.spuId })
    .then(res => {
      specOptions.value = res.data
      // 初始化optIds数组长度与规格数量一致
      skuForm.value.optIds = specOptions.value.map(spec => spec.opts && spec.opts.length > 0 ? spec.opts[0].optId : '')
      loadingSpec.value = false
    })
    .catch(() => {
      ElMessage.error('获取规格失败，请重试')
      loadingSpec.value = false
    })
  dialogVisible.value = true
}
const handleUpdate = (row) => {
  dialogTitle.value = '编辑SKU'
  skuForm.value = { ...row, skuId: row.id, optIds: row.optIds ? row.optIds.split(',').map(Number) : [] }
  specOptions.value = []
  loadingSpec.value = true
  // 获取SKU详情
  getSkuDetail(row.id).then(detailRes => {
    // 获取规格选项
    querySpec({ shopId: getShopId(), spuId: row.spuId })
      .then(res => {
        specOptions.value = res.data
        // 根据SKU详情设置optIds的默认值
        if (detailRes.data && detailRes.data.specs) {
          skuForm.value.optIds = detailRes.data.specs.map(spec => spec.optId)
        } else {
          // 如果没有规格信息，则默认选中每个规格的第一个选项
          skuForm.value.optIds = specOptions.value.map(spec => spec.opts && spec.opts.length > 0 ? spec.opts[0].optId : '')
        }
        loadingSpec.value = false
      })
      .catch(() => {
        ElMessage.error('获取规格失败，请重试')
        loadingSpec.value = false
      })
  }).catch(() => {
    ElMessage.error('获取SKU详情失败，请重试')
    loadingSpec.value = false
  })
  dialogVisible.value = true
}

const handleSubmit = () => {
  const submitFunc = skuForm.value.id ? updateSku : saveSku;
submitFunc({ ...skuForm.value, shopId: getShopId() }).then(() => {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    getList()
  }).catch(() => {
    ElMessage.error('保存失败')
  })
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
  ids.value = selection.map(item => item.id)
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该SKU吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteSku([row.id]).then(() => {
      ElMessage.success('删除成功')
      getList()
    }).catch(() => {
      ElMessage.error('删除失败')
    })
  })
}

// Replace any watch(fn) with watchEffect if present
// Example fix if there was a watch like:
// watch(() => queryParams.value, handleQuery)
// Changed to:
// watchEffect(() => {
//   if (queryParams.value.spuId) {
//     getList()
//   }
// })

function getShopId() {
  return localStorage.getItem('shopId') || ''
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
/* 新增规格样式 */
.spec-loading,
.spec-empty {
  padding: 10px;
  color: #606266;
  text-align: center;
}
.spec-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}
.spec-label {
  width: 80px;
  text-align: right;
  margin-right: 10px;
}
.spec-select {
  width: 220px;
}
</style>