<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="searchFormRef" :inline="true" v-show="showSearch">
      <el-form-item label="优惠券名称">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入优惠券名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="优惠券类型">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择优惠券类型"
          clearable
          style="width: 120px"
        >
          <el-option label="满减券" value="1" />
          <el-option label="折扣券" value="2" />
          <el-option label="无门槛券" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增优惠券</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="couponList" style="width: 100%">
      <el-table-column label="序号" type="index" width="80" />
      <el-table-column prop="name" label="优惠券名称" min-width="150" />
      <el-table-column prop="type" label="优惠券类型" width="100">
        <template #default="scope">
          {{ getTypeText(scope.row.type) }}
        </template>
      </el-table-column>
      <el-table-column prop="value" label="优惠金额/折扣" width="120">
        <template #default="scope">
          {{ scope.row.type === '2' ? scope.row.value + '%' : '¥' + scope.row.value }}
        </template>
      </el-table-column>
      <el-table-column prop="minAmount" label="使用条件" width="120">
        <template #default="scope">
          {{ scope.row.minAmount > 0 ? '满¥' + scope.row.minAmount : '无门槛' }}
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" width="180" />
      <el-table-column prop="endTime" label="结束时间" width="180" />
      <el-table-column prop="totalCount" label="总数量" width="100" />
      <el-table-column prop="receivedCount" label="已领取" width="100" />
      <el-table-column prop="usedCount" label="已使用" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === '1' ? 'success' : 'danger'">
            {{ scope.row.status === '1' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="450" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)" plain>
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="success" size="small" @click="handleStatusChange(scope.row)" plain>
            <el-icon><Check /></el-icon>
            {{ scope.row.status === '1' ? '禁用' : '启用' }}
          </el-button>
          <el-button type="info" size="small" @click="navigateToReceive(scope.row.id)" plain>
            <el-icon><View /></el-icon>
            领取记录
          </el-button>
          <el-button type="warning" size="small" @click="navigateToRecord(scope.row.id)" plain>
            <el-icon><View /></el-icon>
            使用记录
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
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="800px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="优惠券名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入优惠券名称" />
        </el-form-item>
        <el-form-item label="优惠券类型" prop="type">
          <el-radio-group v-model="form.type" @change="handleTypeChange">
            <el-radio label="1">满减券</el-radio>
            <el-radio label="2">折扣券</el-radio>
            <el-radio label="3">无门槛券</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="优惠金额" prop="value" v-if="form.type === '1' || form.type === '3'">
          <el-input-number v-model="form.value" :min="0.01" :step="0.01" style="width: 100%" placeholder="请输入优惠金额" />
        </el-form-item>
        <el-form-item label="折扣比例" prop="value" v-if="form.type === '2'">
          <div style="display: flex; align-items: center; width: 100%">
            <el-input-number v-model="form.value" :min="0.1" :max="0.99" :step="0.01" style="flex: 1" placeholder="请输入折扣比例" />
            <span style="margin-left: 24px; font-size: 12px; color: #909399;">例如：0.85表示85折</span>
          </div>
        </el-form-item>
        <el-form-item label="使用门槛金额" prop="minAmount">
          <el-input-number v-model="form.minAmount" :min="0" style="width: 100%" placeholder="请输入最低消费金额，0表示无门槛" :disabled="form.type === '3'" />
        </el-form-item>
        <el-form-item label="总数量" prop="totalCount">
          <el-input-number v-model="form.totalCount" :min="1" style="width: 100%" placeholder="请输入优惠券总数量" />
        </el-form-item>
        <el-form-item label="每人限领" prop="perLimit">
          <el-input-number v-model="form.perLimit" :min="1" style="width: 100%" placeholder="请输入每人限领数量" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间" style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间" style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="使用范围" prop="useScope">
          <el-radio-group v-model="form.useScope" @change="handleUseScopeChange">
            <el-radio label="1">店铺通用</el-radio>
            <el-radio label="2">指定商品</el-radio>
            <el-radio label="3">指定分类</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="指定商品" prop="targetId" v-if="form.useScope === '2'">
          <div style="display: flex; flex-direction: column; gap: 10px; width: 100%">
            <div style="display: flex; align-items: center; gap: 10px">
              <el-input v-model="form.targetId" placeholder="请选择商品" disabled style="flex: 1" />
              <el-button type="primary" size="small" @click="openSpuSelectDialog">
                选择商品
              </el-button>
            </div>
            <div v-if="form.targetId" style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #e4e7ed; border-radius: 4px">
              <el-image
                v-if="form.targetImage"
                :src="getImagePreviewUrl(form.targetImage)"
                fit="cover"
                style="width: 60px; height: 60px"
                lazy
              />
              <div v-else style="width: 60px; height: 60px; border: 1px solid #e4e7ed; display: flex; align-items: center; justify-content: center; color: #909399">
                无图片
              </div>
              <div style="flex: 1">
                <div style="font-weight: 500; margin-bottom: 4px">{{ form.targetName }}</div>
                <div style="font-size: 12px; color: #909399">商品ID: {{ form.targetId }}</div>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="指定分类" prop="targetId" v-if="form.useScope === '3'">
          <el-tree-select
            v-model="form.targetId"
            :data="categoryTree"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="请选择商品分类"
            check-strictly
            :render-after-expand="false"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- SPU选择对话框 -->
    <el-dialog
      title="选择商品"
      v-model="spuSelectDialogVisible"
      width="800px"
    >
      <!-- SPU搜索 -->
      <div class="mb-4">
        <el-input
          v-model="spuSearchKeyword"
          placeholder="请输入商品名称搜索"
          clearable
          style="width: 100%"
          @keyup.enter="loadSpuList"
        >
          <template #append>
            <el-button @click="loadSpuList"><el-icon><Search /></el-icon></el-button>
          </template>
        </el-input>
      </div>

      <!-- SPU列表 -->
      <div v-if="spuList.length > 0" class="mb-4">
        <el-table :data="spuList" style="width: 100%" @row-click="handleSpuRowClick">
          <el-table-column type="index" label="序号" width="80" />
          <el-table-column prop="name" label="商品名称" min-width="300" />
          <el-table-column label="商品图片" width="120">
            <template #default="scope">
              <el-image
                v-if="scope.row.mainImage"
                :src="getImagePreviewUrl(scope.row.mainImage)"
                fit="cover"
                style="width: 80px; height: 80px"
                lazy
              />
              <el-empty v-else description="无图片" style="width: 80px; height: 80px" />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button
                size="small"
                type="primary"
                @click="selectSpu(scope.row)"
              >
                选择
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="暂无商品数据" class="mb-4" />

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="spuSelectDialogVisible = false">取消</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElIcon } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete, Check, View } from '@element-plus/icons-vue'
import { getMchCouponList, createMchCoupon, updateMchCoupon, deleteMchCoupon, updateMchCouponStatus, getSpuDetail } from '@/api/mall/mchCoupon'
import { queryMchSpuList } from '@/api/mall/seckill'
import { getCategoryTree } from '@/api/mall/category'
import RightToolbar from '@/components/RightToolbar/index.vue'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增优惠券')
const formRef = ref(null)
const showSearch = ref(true)

// SPU选择对话框相关
const spuSelectDialogVisible = ref(false)
const spuSearchKeyword = ref('')
const spuList = ref([])
const loadingSpu = ref(false)

// 分类选择相关
const categoryTree = ref([])

// 查询参数
const queryParams = reactive({
  name: '',
  type: '',
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
  type: '1',
  value: 0,
  minAmount: 0,
  totalCount: 100,
  perLimit: 1,
  startTime: '',
  endTime: '',
  useScope: '1',
  targetId: '',
  targetName: '',
  targetImage: '',
  status: '1'
})

// 表单规则
const rules = reactive({
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择优惠券类型', trigger: 'change' }],
  value: [{ required: true, message: '请输入优惠金额/折扣', trigger: 'blur' }],
  minAmount: [{ required: true, message: '请输入使用金额门槛', trigger: 'blur' }],
  totalCount: [{ required: true, message: '请输入总数量', trigger: 'blur' }],
  perLimit: [{ required: true, message: '请输入每人限领数量', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  useScope: [{ required: true, message: '请选择使用范围', trigger: 'change' }],
  targetId: [{
    required: true,
    message: '请选择指定商品',
    trigger: 'blur',
    validator: (rule, value, callback) => {
      if (form.useScope === '2' && !value) {
        callback(new Error('请选择指定商品'))
      } else {
        callback()
      }
    }
  }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
})

// 优惠券列表
const couponList = ref([])

// 初始化
onMounted(() => {
  getList()
})

// 获取优惠券列表
function getList() {
  loading.value = true
  const params = {
    conditions_: `createTime:sort:desc`,
    size: pagination.size,
    current: pagination.current,
    shopId: getShopId()
  }

  // 合并查询参数
  if (queryParams.name) {
    params.conditions_ += `;name:like:${queryParams.name}`
  }
  if (queryParams.type) {
    params.conditions_ += `;type:eq:${queryParams.type}`
  }
  if (queryParams.status) {
    params.conditions_ += `;isEnabled:eq:${queryParams.status === '1' ? 1 : 0}`
  }

  // 调用真实API
  getMchCouponList(params).then(res => {
    if (res.code === 0) {
      // 转换数据格式以匹配前端期望
      couponList.value = res.data.records.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type.toString(),
        value: item.type === 2 ? item.discount * 100 : item.amount,
        minAmount: item.minAmount,
        startTime: item.beginTime,
        endTime: item.endTime,
        totalCount: item.quantity,
        perLimit: item.perLimit,
        receivedCount: item.received,
        usedCount: item.used,
        status: item.isEnabled ? '1' : '0',
        useScope: item.useRange ? item.useRange.toString() : '1',
        targetId: item.targetId || ''
      }))
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.message || '获取优惠券列表失败')
    }
    loading.value = false
  }).catch(() => {
    ElMessage.error('获取优惠券列表失败')
    loading.value = false
  })
}

// 获取店铺ID
function getShopId() {
  return localStorage.getItem('shopId') || ''
}

// 获取分类树
async function fetchCategoryTree() {
  const res = await getCategoryTree({ shopId: getShopId() })
  categoryTree.value = res.data || []
}

// 新增优惠券
function handleAdd() {
  dialogTitle.value = '新增优惠券'
  form.id = ''
  form.name = ''
  form.type = '1'
  form.value = 0
  form.minAmount = 0
  form.totalCount = 100
  form.perLimit = 1
  form.startTime = ''
  form.endTime = ''
  form.useScope = '1'
  form.targetId = ''
  form.targetName = ''
  form.targetImage = ''
  form.status = '0' // 默认禁用状态
  dialogVisible.value = true
}

// 编辑优惠券
function handleEdit(row) {
  dialogTitle.value = '编辑优惠券'
  // 复制所有字段
  form.id = row.id
  form.name = row.name
  form.type = row.type
  form.value = row.value
  form.minAmount = row.minAmount
  form.totalCount = row.totalCount
  form.perLimit = row.perLimit
  form.startTime = row.startTime
  form.endTime = row.endTime
  form.useScope = row.useScope || '1'
  form.targetId = row.targetId || ''
  form.targetName = row.targetName || ''
  form.targetImage = row.targetImage || ''
  form.status = row.status

  // 如果使用范围是商品且有targetId，调用SPU详情接口获取商品信息
  if (form.useScope === '2' && form.targetId) {
    loading.value = true
    getSpuDetail(form.targetId).then(res => {
      if (res.code === 0) {
        const spu = res.data
        form.targetName = spu.name
        form.targetImage = spu.mainImage
      } else {
        ElMessage.error('获取商品信息失败')
      }
      loading.value = false
      dialogVisible.value = true
    }).catch(() => {
      ElMessage.error('获取商品信息失败')
      loading.value = false
      dialogVisible.value = true
    })
  } else if (form.useScope === '3' && form.targetId) {
    // 如果使用范围是分类且有targetId，先加载分类树数据
    loading.value = true
    fetchCategoryTree().then(() => {
      loading.value = false
      dialogVisible.value = true
    }).catch(() => {
      ElMessage.error('获取分类树失败')
      loading.value = false
      dialogVisible.value = true
    })
  } else {
    dialogVisible.value = true
  }
}

// 处理优惠券类型变更
function handleTypeChange() {
  if (form.type === '3') {
    form.minAmount = 0
  }
}

// 处理使用范围变更
function handleUseScopeChange() {
  if (form.useScope === '3') {
    fetchCategoryTree()
  }
  if (form.useScope !== '2' && form.useScope !== '3') {
    form.targetId = '0'
    form.targetName = ''
    form.targetImage = ''
  }
}

// 打开SPU选择对话框
function openSpuSelectDialog() {
  // 打开对话框前加载SPU列表
  loadSpuList()
  spuSelectDialogVisible.value = true
}

// 加载SPU列表
function loadSpuList() {
  loadingSpu.value = true
  const params = {
    shopId: getShopId(),
    size: 100,
    current: 1
  }

  // 添加搜索关键词
  if (spuSearchKeyword.value) {
    params.name = spuSearchKeyword.value
  }

  queryMchSpuList(params)
    .then(response => {
      const data = response.data
      spuList.value = data.records || []
    })
    .catch(error => {
      ElMessage.error('获取商品列表失败: ' + (error.message || '未知错误'))
      spuList.value = []
    })
    .finally(() => {
      loadingSpu.value = false
    })
}

// 选择SPU
function selectSpu(spu) {
  if (spu) {
    form.targetId = spu.id
    form.targetName = spu.name
    form.targetImage = spu.mainImage
    spuSelectDialogVisible.value = false
  }
}

// 处理表格行点击
function handleSpuRowClick(row) {
  selectSpu(row)
}

// 获取图片预览URL
function getImagePreviewUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

// 提交表单
function handleSubmit() {
  formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      // 根据使用范围设置targetId
      let targetIdValue = '0';
      if (form.useScope === '1') {
        // 店铺通用，传'0'
        targetIdValue = '0';
      } else if (form.useScope === '2') {
        // 指定商品，使用spu的id
        targetIdValue = form.targetId || '0';
      } else if (form.useScope === '3') {
        // 指定分类，使用分类ID
        targetIdValue = form.targetId || '0';
      }

      const submitData = {
        shopId: getShopId(),
        name: form.name,
        description: form.name,
        type: parseInt(form.type),
        amount: form.type === '2' ? '0' : form.value.toString(),
        discount: form.type === '2' ? form.value.toString() : '1',
        minAmount: form.minAmount.toString(),
        quantity: form.totalCount,
        received: 0,
        used: 0,
        perLimit: form.perLimit,
        useRange: parseInt(form.useScope),
        targetId: targetIdValue,
        beginTime: form.startTime,
        endTime: form.endTime,
        sort: 3,
        isEnabled: form.status === '1' ? 1 : 0,
        remark: ''
      }

      if (form.id) {
        // 编辑
        submitData.id = form.id
        updateMchCoupon(submitData).then(res => {
          if (res.code === 0) {
            ElMessage.success('编辑成功')
            dialogVisible.value = false
            getList()
          } else {
            ElMessage.error(res.message || '编辑失败')
          }
          loading.value = false
        }).catch(() => {
          ElMessage.error('编辑失败')
          loading.value = false
        })
      } else {
        // 新增
        createMchCoupon(submitData).then(res => {
          if (res.code === 0) {
            ElMessage.success('新增成功')
            dialogVisible.value = false
            getList()
          } else {
            ElMessage.error(res.message || '新增失败')
          }
          loading.value = false
        }).catch(() => {
          ElMessage.error('新增失败')
          loading.value = false
        })
      }
    }
  })
}

// 删除优惠券
function handleDelete(id) {
  ElMessageBox.confirm('确定要删除该优惠券吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    deleteMchCoupon([id]).then(res => {
      if (res.code === 0) {
        ElMessage.success('删除成功')
        getList()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
      loading.value = false
    }).catch(() => {
      ElMessage.error('删除失败')
      loading.value = false
    })
  })
}

// 状态变更
function handleStatusChange(row) {
  const newStatus = row.status === '1' ? '0' : '1'
  ElMessageBox.confirm(`确定要${newStatus === '1' ? '启用' : '禁用'}该优惠券吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    updateMchCouponStatus({
      id: row.id,
      isEnabled: newStatus === '1' ? true : false
    }).then(res => {
      if (res.code === 0) {
        ElMessage.success('状态更新成功')
        getList()
      } else {
        ElMessage.error(res.message || '状态更新失败')
      }
      loading.value = false
    }).catch(() => {
      ElMessage.error('状态更新失败')
      loading.value = false
    })
  })
}

// 跳转到领取记录
function navigateToReceive(couponId) {
  router.push({
    path: '/mall/mch-coupon/receive',
    query: { couponId }
  })
}

// 跳转到使用记录
function navigateToRecord(couponId) {
  router.push({
    path: '/mall/mch-coupon/record',
    query: { couponId }
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
    type: '',
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

// 获取优惠券类型文本
function getTypeText(type) {
  const typeMap = {
    '1': '满减券',
    '2': '折扣券',
    '3': '无门槛券'
  }
  return typeMap[type] || '未知'
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

.text-xs {
  font-size: 12px;
}

.text-gray-400 {
  color: #909399;
}

.mt-1 {
  margin-top: 4px;
}
</style>
