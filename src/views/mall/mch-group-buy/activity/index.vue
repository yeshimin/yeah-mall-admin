<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="活动名称" prop="activityName">
        <el-input
          v-model="queryParams.activityName"
          placeholder="请输入活动名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="活动状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择活动状态"
          clearable
          style="width: 200px"
        >
          <el-option label="未开始" value="0" />
          <el-option label="进行中" value="1" />
          <el-option label="已结束" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getActivityList" />
    </el-row>

    <!-- 活动列表 -->
    <el-table
      v-loading="loading"
      :data="activityList"
      style="width: 100%"
    >
      <el-table-column type="index" label="序号" width="80" />
      <el-table-column prop="name" label="活动名称" min-width="200" />
      <el-table-column prop="startTime" label="活动开始时间" min-width="180" />
      <el-table-column prop="endTime" label="活动结束时间" min-width="180" />
      <el-table-column prop="minPeople" label="最低成团人数" width="120" />
      <el-table-column prop="status" label="活动状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="applyStatus" label="申请状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.applyStatus === 1 ? 'success' : scope.row.applyStatus === 0 ? 'warning' : 'info'">
              {{ scope.row.applyStatus === 1 ? '已申请' : scope.row.applyStatus === 2 ? '已通过' : '未申请' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="活动描述" min-width="200" />
      <el-table-column label="操作" width="400" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.applyStatus === 0"
            size="small"
            type="primary"
            icon="Edit"
            @click="handleApply(scope.row)"
          >
            申请
          </el-button>
          <el-button
            v-else-if="scope.row.applyStatus === 1"
            size="small"
            type="info"
            icon="View"
            @click="handleView(scope.row)"
          >
            查看
          </el-button>
          <el-button
            v-else
            size="small"
            type="success"
            icon="Check"
            @click="handleView(scope.row)"
          >
            已通过
          </el-button>
          <!-- 申请参加活动按钮 -->
          <el-button
            size="small"
            type="primary"
            @click="handleApply(scope.row)"
          >
            <el-icon><Edit /></el-icon>
            申请参加
          </el-button>

          <!-- 申请记录按钮 -->
          <el-button
            size="small"
            type="info"
            @click="goToApplyRecord(scope.row)"
          >
            <el-icon><Document /></el-icon>
            申请记录
          </el-button>

          <!-- 拼团商品按钮 -->
          <el-button
            size="small"
            type="success"
            @click="goToGroupBuyProduct(scope.row)"
          >
            <el-icon><Goods /></el-icon>
            拼团商品
          </el-button>

        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="Number(total)"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 活动详情对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        label-width="100px"
      >
        <el-form-item label="活动名称">
          <el-input
            v-model="form.activityName"
            placeholder="请输入活动名称"
            maxlength="50"
            readonly
          />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="请选择开始时间"
            style="width: 100%"
            readonly
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            placeholder="请选择结束时间"
            style="width: 100%"
            readonly
          />
        </el-form-item>
        <el-form-item label="最低成团人数">
          <el-input
            v-model="form.minPeople"
            placeholder="最低成团人数"
            style="width: 100%"
            disabled
          />
        </el-form-item>
        <el-form-item label="活动状态">
          <el-select
            v-model="form.status"
            placeholder="请选择活动状态"
            style="width: 100%"
            disabled
          >
            <el-option label="未开始" value="0" />
            <el-option label="进行中" value="1" />
            <el-option label="已结束" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请状态">
          <el-select
            v-model="form.applyStatus"
            placeholder="请选择申请状态"
            style="width: 100%"
            disabled
          >
            <el-option label="未申请" value="0" />
            <el-option label="已申请" value="1" />
            <el-option label="已通过" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            placeholder="请输入活动备注"
            :rows="3"
            maxlength="200"
            readonly
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 报名申请对话框 -->
    <el-dialog
      title="申请参加拼团活动"
      v-model="applyDialogVisible"
      width="800px"
    >
      <!-- 商品选择 -->
      <div class="mb-4">
        <h4>选择商品</h4>
        <el-button type="primary" size="small" @click="openSpuSelectDialog">
          <el-icon><Plus /></el-icon>
          选择商品
        </el-button>
      </div>

      <!-- 商品信息编辑 -->
      <div v-if="selectedSpu.id" class="mb-4">
        <h4>商品信息</h4>
        <el-form :model="applyForm" label-width="100px">
          <el-form-item label="商品名称">
            <el-input v-model="applyForm.name" placeholder="请输入商品名称" />
          </el-form-item>
          <el-form-item label="商品描述">
            <el-input v-model="applyForm.detailDesc" type="textarea" placeholder="请输入商品描述" rows="3" />
          </el-form-item>
          <el-form-item label="商品主图">
            <div class="image-preview-container">
              <el-image
                v-if="applyForm.mainImage"
                :src="getImagePreviewUrl(applyForm.mainImage)"
                fit="cover"
                style="width: 100px; height: 100px"
                lazy
              />
              <el-empty v-else description="无图片" style="width: 100px; height: 100px" />
              <el-upload
                class="avatar-uploader"
                action="/dev-api/mch/storage/upload"
                :show-file-list="false"
                :on-success="handleMainImageUploadSuccess"
                :before-upload="handleImageUploadBefore"
                :headers="{
                  'Authorization': 'Bearer ' + getToken()
                }"
              >
                <el-button size="small" type="primary">更换主图</el-button>
              </el-upload>
            </div>
          </el-form-item>
          <el-form-item label="拼团价格">
            <el-input v-model="applyForm.groupPrice" type="number" step="0.01" min="0.01" placeholder="请输入拼团价格" />
          </el-form-item>
          <el-form-item label="库存">
            <el-input v-model="applyForm.stock" type="number" step="1" min="1" placeholder="请输入库存" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 申请备注 -->
      <div class="mb-4">
        <h4>申请备注</h4>
        <el-form :model="applyForm" label-width="100px">
          <el-form-item label="申请备注">
            <el-input v-model="applyForm.applyRemark" type="textarea" placeholder="请输入申请备注" rows="3" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="applyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitApply">提交申请</el-button>
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
import { ElMessage, ElMessageBox, ElIcon } from 'element-plus'
import { Timer, Edit, Plus, Check, Search, Document, Goods } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { getToken } from '@/utils/auth'
import RightToolbar from '@/components/RightToolbar/index.vue'

// 路由
const router = useRouter()

// 表格数据
const loading = ref(false)
const activityList = ref([])
const total = ref(0)
const showSearch = ref(true)

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  activityName: '',
  status: ''
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)

// 报名申请相关
const applyDialogVisible = ref(false)
const spuList = ref([])
const selectedSpu = ref({})
const loadingSpu = ref(false)

// SPU选择对话框相关
const spuSelectDialogVisible = ref(false)
const spuSearchKeyword = ref('')

// 报名表单数据
const applyForm = reactive({
  activityId: '',
  spuId: '',
  name: '',
  mainImage: '',
  detailDesc: '',
  groupPrice: '',
  stock: '',
  applyRemark: ''
})

// 表单数据
const form = reactive({
  id: '',
  activityName: '',
  startTime: '',
  endTime: '',
  minPeople: 0,
  status: 0,
  applyStatus: 0,
  remark: ''
})

// 模拟数据
const mockActivityList = [
  {
    id: 1,
    name: '春季拼团活动',
    startTime: '2026-03-01 00:00:00',
    endTime: '2026-03-31 23:59:59',
    minPeople: 3,
    status: 1,
    applyStatus: 0,
    remark: '春季拼团优惠，多人成团更划算'
  },
  {
    id: 2,
    name: '女神节拼团',
    startTime: '2026-03-01 00:00:00',
    endTime: '2026-03-08 23:59:59',
    minPeople: 2,
    status: 1,
    applyStatus: 1,
    remark: '女神节特别拼团活动'
  }
]

// 加载活动列表
const getActivityList = () => {
  loading.value = true
  const params = {
    conditions_: `sort:sort:asc`,
    size: queryParams.pageSize,
    current: queryParams.pageNum
  }

  // 合并查询参数
  if (queryParams.activityName) {
    params.conditions_ += `,name:${queryParams.activityName}:like`
  }
  if (queryParams.status) {
    params.conditions_ += `,status:${queryParams.status}:eq`
  }

  // 模拟API调用
  setTimeout(() => {
    activityList.value = mockActivityList
    total.value = mockActivityList.length
    loading.value = false
  }, 500)
}

// 搜索
const handleQuery = () => {
  queryParams.pageNum = 1
  getActivityList()
}

// 重置
const resetQuery = () => {
  Object.assign(queryParams, {
    activityName: '',
    status: ''
  })
  handleQuery()
}

// 分页
const handleSizeChange = (size) => {
  queryParams.pageSize = size
  handleQuery()
}

const handleCurrentChange = (current) => {
  queryParams.pageNum = current
  handleQuery()
}

// 申请参加活动
const handleApply = (row) => {
  // 清空之前的选择
  selectedSpu.value = {}
  applyForm.activityId = row.id
  applyForm.spuId = ''
  applyForm.name = ''
  applyForm.mainImage = ''
  applyForm.detailDesc = ''
  applyForm.groupPrice = ''
  applyForm.stock = ''
  applyForm.applyRemark = ''

  // 打开报名申请对话框
  applyDialogVisible.value = true
}

// 打开SPU选择对话框
const openSpuSelectDialog = () => {
  // 打开对话框前加载SPU列表
  loadSpuList()
  spuSelectDialogVisible.value = true
}

// 加载SPU列表
const loadSpuList = () => {
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

  // 模拟API调用
  setTimeout(() => {
    spuList.value = [
      {
        id: 1,
        name: '叶牌挖掘机',
        mainImage: '2ddcc6e552cd4107a9aa3186e8241bb3',
        createTime: '2026-01-01 00:00:00'
      },
      {
        id: 2,
        name: '红米k20',
        mainImage: 'd86b9521bed1459c84b81bca3a8a2ed6',
        createTime: '2026-01-02 00:00:00'
      }
    ]
    loadingSpu.value = false
  }, 500)
}

// 选择SPU
const selectSpu = (spu) => {
  if (spu) {
    selectedSpu.value = spu
    // 填充表单数据
    applyForm.spuId = spu.id
    applyForm.name = spu.name
    applyForm.mainImage = spu.mainImage
    applyForm.detailDesc = spu.detailDesc || ''

    // 关闭SPU选择对话框
    spuSelectDialogVisible.value = false
  }
}

// 处理表格行点击
const handleSpuRowClick = (row) => {
  selectSpu(row)
}

// 获取图片预览URL
function getImagePreviewUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

// 图片上传成功处理
const handleMainImageUploadSuccess = (response) => {
  if (response.code === 0 && response.data && response.data.fileKey) {
    applyForm.mainImage = response.data.fileKey
    ElMessage.success('主图上传成功')
  } else {
    ElMessage.error('主图上传失败: ' + (response.message || '未知错误'))
  }
}

// 图片上传前处理
const handleImageUploadBefore = (file) => {
  const isImage = file.type.indexOf('image/') === 0
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
    return false
  }

  return true
}

// 提交报名申请
const submitApply = () => {
  if (!applyForm.spuId) {
    ElMessage.warning('请选择商品')
    return
  }

  if (!applyForm.groupPrice) {
    ElMessage.warning('请输入拼团价格')
    return
  }

  if (!applyForm.stock) {
    ElMessage.warning('请输入库存')
    return
  }

  ElMessageBox.confirm('确定要提交报名申请吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    // 模拟API调用
    setTimeout(() => {
      ElMessage.success('申请提交成功，请等待管理员审核')
      applyDialogVisible.value = false
      getActivityList()
      loading.value = false
    }, 500)
  }).catch(() => {
    // 取消提交
  })
}

// 查看活动详情
const handleView = (row) => {
  dialogTitle.value = '活动详情'
  Object.assign(form, {
    id: row.id,
    activityName: row.name,
    startTime: row.startTime,
    endTime: row.endTime,
    minPeople: row.minPeople,
    status: row.status,
    applyStatus: row.applyStatus,
    remark: row.remark
  })
  dialogVisible.value = true
}

// 跳转到申请记录页面
const goToApplyRecord = (activity) => {
  router.push({
    path: '/mall/mch-group-buy/apply',
    query: {
      activityId: activity.id,
      activityName: activity.name
    }
  })
}

// 跳转到拼团商品页面
const goToGroupBuyProduct = (activity) => {
  router.push({
    path: '/mall/mch-group-buy/product',
    query: {
      activityId: activity.id,
      activityName: activity.name
    }
  })
}

// 获取店铺ID
function getShopId() {
  return localStorage.getItem('shopId') || ''
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    '0': '未开始',
    '1': '进行中',
    '2': '已结束'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
function getStatusTagType(status) {
  const typeMap = {
    '0': 'info',
    '1': 'success',
    '2': 'default'
  }
  return typeMap[status] || 'info'
}

// 初始化
onMounted(() => {
  getActivityList()
})
</script>

<style scoped>
.app-container {
  padding: 24px;
}

.mb8 {
  margin-bottom: 8px;
}

.dialog-footer {
  text-align: right;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.mb-4 {
  margin-bottom: 16px;
}

.image-preview-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}
</style>