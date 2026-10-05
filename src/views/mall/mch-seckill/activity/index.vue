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
      <el-table-column prop="applyBeginTime" label="报名开始时间" min-width="180" />
      <el-table-column prop="applyEndTime" label="报名截止时间" min-width="180" />
      <el-table-column prop="activityBeginTime" label="活动开始时间" min-width="180" />
      <el-table-column prop="activityEndTime" label="活动结束时间" min-width="180" />
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
        <el-table-column prop="hasSession" label="场次设置" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.hasSession === 1 ? 'success' : 'info'">
              {{ scope.row.hasSession === 1 ? '多场次' : '单场次' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sessionCount" label="场次数量" width="100">
          <template #default="scope">
            {{ scope.row.sessionCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="活动描述" min-width="200" />
      <el-table-column label="操作" width="500" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.applyStatus === 0"
            size="small"
            type="primary"
            icon="Edit"
            @click="handleApply(scope.row)"
            v-hasPermi="['mall:seckill:apply']"
          >
            申请
          </el-button>
          <el-button
            v-else-if="scope.row.applyStatus === 1"
            size="small"
            type="info"
            icon="View"
            @click="handleView(scope.row)"
            v-hasPermi="['mall:seckill:view']"
          >
            查看
          </el-button>
          <el-button
            v-else
            size="small"
            type="success"
            icon="Check"
            @click="handleView(scope.row)"
            v-hasPermi="['mall:seckill:view']"
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

          <!-- 秒杀商品按钮 -->
          <el-button
            size="small"
            type="success"
            @click="goToSeckillProduct(scope.row)"
          >
            <el-icon><Goods /></el-icon>
            秒杀商品
          </el-button>

        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="queryParams.pageNum"
      v-model:page-size="queryParams.pageSize"
      :page-sizes="[10, 20, 30, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="Number(total)"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

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
        <el-form-item label="场次设置">
          <el-select
            v-model="form.hasSession"
            placeholder="请选择场次设置"
            style="width: 100%"
            disabled
          >
            <el-option label="单场次" value="0" />
            <el-option label="多场次" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="场次数量">
          <el-input
            v-model="form.sessionCount"
            placeholder="场次数量"
            style="width: 100%"
            disabled
          />
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
      title="申请参加秒杀活动"
      v-model="applyDialogVisible"
      width="800px"
    >
      <!-- 场次选择 -->
      <div class="mb-4">
        <h4>选择场次</h4>
        <el-select v-model="selectedSessionId" placeholder="请选择秒杀场次" style="width: 100%">
          <el-option
            v-for="session in sessionList"
            :key="session.id"
            :label="`${session.name} (${session.startTime} 至 ${session.endTime})`"
            :value="session.id"
          >
            <div class="session-option">
              <div class="session-option-name">{{ session.name }}</div>
              <div class="session-option-time">{{ session.startTime }} 至 {{ session.endTime }}</div>
              <div class="session-option-status">
                <el-tag :type="session.status === 1 ? 'success' : 'danger'" size="small">
                  {{ session.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </div>
            </div>
          </el-option>
        </el-select>
      </div>

      <!-- SPU选择 -->
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
          <el-form-item label="轮播图">
            <div class="carousel-images-container">
              <div v-if="applyForm.images && applyForm.images.length > 0" class="carousel-images-list">
                <div v-for="(image, index) in applyForm.images" :key="index" class="carousel-image-item">
                  <el-image
                    :src="getImagePreviewUrl(image)"
                    fit="cover"
                    style="width: 100px; height: 100px"
                    lazy
                  />
                  <el-button
                    size="small"
                    type="danger"
                    @click="removeCarouselImage(index)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
              <el-empty v-else description="无轮播图" class="carousel-empty" />
              <el-upload
                class="carousel-uploader"
                action="/dev-api/mch/storage/upload"
                :show-file-list="false"
                :on-success="handleCarouselImageUploadSuccess"
                :before-upload="handleImageUploadBefore"
                :headers="{
                  'Authorization': 'Bearer ' + getToken()
                }"
                multiple
              >
                <el-button size="small" type="primary">添加轮播图</el-button>
              </el-upload>
            </div>
          </el-form-item>

        </el-form>
      </div>

      <!-- SKU选择 -->
      <div v-if="selectedSpu.id && selectedSpu.skuList" class="mb-4">
        <h4>选择SKU</h4>
        <el-checkbox v-model="selectAllSku" @change="handleSelectAllSku">全选所有SKU</el-checkbox>
        <el-divider />
        <div v-if="selectedSpu.skuList.length > 0" class="sku-list">
          <el-card
            v-for="sku in selectedSpu.skuList"
            :key="sku.id"
            shadow="hover"
            class="mb-3"
          >
            <div class="sku-header">
              <el-checkbox
                  v-model="skuCheckedMap[sku.id]"
                  @change="handleSkuCheck(sku.id, $event)"
                >
                <span class="sku-name">{{ sku.name }}</span>
              </el-checkbox>
            </div>
            <div class="sku-content">
              <div class="sku-info-wrapper">
                <div class="sku-form">
                  <el-form :model="sku" label-width="100px" size="small">
                    <el-form-item label="原价">
                  <el-input v-model="sku.originPrice" type="number" step="0.01" min="0.01" style="width: 120px" />
                  <span class="unit">元</span>
                </el-form-item>
                    <el-form-item label="秒杀价格">
                      <el-input v-model="sku.seckillPrice" type="number" step="0.01" min="0.01" style="width: 120px" />
                      <span class="unit">元</span>
                    </el-form-item>
                    <el-form-item label="库存">
                  <el-input v-model="sku.stock" type="number" step="1" min="1" style="width: 120px" />
                  <span class="unit">件</span>
                </el-form-item>
                <el-form-item label="规格编码">
                  <el-input v-model="sku.specCode" style="width: 200px" />
                </el-form-item>
                  </el-form>
                </div>
                <div class="sku-image-container">
                  <div class="image-preview">
                    <el-image
                      v-if="sku.mainImage"
                      :src="getImagePreviewUrl(sku.mainImage)"
                      fit="cover"
                      style="width: 100px; height: 100px"
                      lazy
                    />
                    <el-empty v-else description="无图片" style="width: 100px; height: 100px" />
                  </div>
                  <div class="image-upload">
                    <el-upload
                      class="avatar-uploader"
                      action="/dev-api/mch/storage/upload"
                      :show-file-list="false"
                      :on-success="(response) => handleImageUploadSuccess(response, sku)"
                      :before-upload="handleImageUploadBefore"
                      :headers="{
                        'Authorization': 'Bearer ' + getToken()
                      }"
                    >
                      <el-button size="small" type="primary">更换图片</el-button>
                    </el-upload>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="暂无SKU数据" class="mt-2" />
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { ElMessage, ElMessageBox, ElIcon } from 'element-plus'
import { Timer, Edit, Plus, Check, Delete, Search, Document, Goods } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import { getToken } from '@/utils/auth'
import RightToolbar from '@/components/RightToolbar/index.vue'
import { queryMchSeckillActivityList, queryMchSeckillSessionList, submitSeckillApply, queryMchSpuList } from '@/api/mall/seckill'

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

// 场次选择相关
const selectedActivity = ref({})
const sessionList = ref([])
const selectedSessions = ref([])
const selectAllSessions = ref(false)

// 报名申请相关
const applyDialogVisible = ref(false)
const spuList = ref([])
const selectedSpu = ref({})
const selectedSessionId = ref('')
const loadingSpu = ref(false)
const selectAllSku = ref(false)
const selectedSkuIds = ref([])
const skuCheckedMap = ref({}) // 用于跟踪每个SKU的选中状态

// SPU选择对话框相关
const spuSelectDialogVisible = ref(false)
const spuSearchKeyword = ref('')

// 监听selectedSessionId变化，自动更新applyForm.sessionId
watch(selectedSessionId, (newVal) => {
  applyForm.sessionId = newVal
})

// 报名表单数据
const applyForm = reactive({
  sessionId: '',
  spuId: '',
  name: '',
  mainImage: '',
  detailDesc: '',
  images: [],
  skuList: [],
  applyRemark: ''
})

// 表单数据
const form = reactive({
  id: '',
  activityName: '',
  startTime: '',
  endTime: '',
  status: 0,
  applyStatus: 0,
  hasSession: 0,
  sessionCount: 0,
  remark: ''
})

// 表单验证规则
const rules = reactive({
  activityName: [
    { required: true, message: '请输入活动名称', trigger: 'blur' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'blur' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择活动状态', trigger: 'blur' }
  ]
})

// 模拟数据
const mockActivityList = [
  {
    id: 1,
    activityName: '春季秒杀活动',
    startTime: '2026-02-10 10:00:00',
    endTime: '2026-02-15 23:59:59',
    status: 0,
    applyStatus: 0,
    hasSession: 1,
    sessionCount: 3,
    remark: '春季限时秒杀，全场商品低至5折'
  },
  {
    id: 2,
    activityName: '情人节秒杀',
    startTime: '2026-02-14 00:00:00',
    endTime: '2026-02-14 23:59:59',
    status: 1,
    applyStatus: 1,
    hasSession: 1,
    sessionCount: 2,
    remark: '情人节特别秒杀活动'
  },
  {
    id: 3,
    activityName: '春节秒杀',
    startTime: '2026-02-01 00:00:00',
    endTime: '2026-02-07 23:59:59',
    status: 2,
    applyStatus: 2,
    hasSession: 0,
    sessionCount: 0,
    remark: '春节期间限时秒杀'
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

  queryMchSeckillActivityList(params)
    .then(response => {
      const data = response.data
      // 为每个活动添加默认的申请状态、场次设置和场次数量
      const records = (data.records || []).map(activity => ({
        ...activity,
        applyStatus: 0, // 默认未申请
        hasSession: 1, // 默认多场次
        sessionCount: 2 // 默认2个场次
      }))
      activityList.value = records
      total.value = Number(data.total) || 0
    })
    .catch(error => {
      ElMessage.error('获取活动列表失败: ' + (error.message || '未知错误'))
      activityList.value = []
      total.value = 0
    })
    .finally(() => {
      loading.value = false
    })
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
  selectedActivity.value = row

  // 加载该活动的所有场次
  loadSessionList(row.id)
    .then(() => {
      // 清空之前的选择
      selectedSessionId.value = ''
      applyForm.sessionId = ''
      selectedSpu.value = {}
      selectedSkuIds.value = []
      selectAllSku.value = false

      // 打开报名申请对话框
      applyDialogVisible.value = true
    })
    .catch(error => {
      ElMessage.error('加载场次列表失败: ' + (error.message || '未知错误'))
    })
}

// 加载场次列表
const loadSessionList = (activityId) => {
  return new Promise((resolve, reject) => {
    loading.value = true
    const params = {
      conditions_: `sort:sort:asc`,
      activityId: activityId
    }

    queryMchSeckillSessionList(params)
      .then(response => {
        const data = response.data || []
        // 转换API返回的数据格式，确保与前端组件兼容
        sessionList.value = data.map(session => ({
          ...session,
          startTime: session.beginTime, // 转换为前端使用的字段名
          endTime: session.endTime,
          status: session.isEnabled ? 1 : 0 // 转换为前端使用的状态值
        }))
        resolve()
      })
      .catch(error => {
        ElMessage.error('获取场次列表失败: ' + (error.message || '未知错误'))
        sessionList.value = []
        reject(error)
      })
      .finally(() => {
        loading.value = false
      })
  })
}



// 获取店铺ID
function getShopId() {
  return localStorage.getItem('shopId') || ''
}

// 获取图片预览URL
function getImagePreviewUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}



// 图片上传成功处理
const handleImageUploadSuccess = (response, sku) => {
  if (response.code === 0 && response.data && response.data.fileKey) {
    sku.mainImage = response.data.fileKey
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('图片上传失败: ' + (response.message || '未知错误'))
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
const selectSpu = (spu) => {
  if (spu) {
    selectedSpu.value = spu
    // 填充表单数据
    applyForm.spuId = spu.id
    applyForm.name = spu.name
    applyForm.mainImage = spu.mainImage
    applyForm.detailDesc = spu.detailDesc
    applyForm.images = [] // 初始化为空，稍后从接口加载
    applyForm.skuList = []
    selectedSkuIds.value = []
    selectAllSku.value = false
    skuCheckedMap.value = {} // 重置SKU选中状态

    // 加载该SPU的SKU列表
    loadSkuList(spu.id)

    // 加载该SPU的轮播图
    loadSpuImages(spu.id)

    // 关闭SPU选择对话框
    spuSelectDialogVisible.value = false
  }
}

// 加载SPU轮播图
const loadSpuImages = (spuId) => {
  loadingSpu.value = true
  const params = {
    shopId: getShopId(),
    spuId: spuId,
    conditions_: 'id:sort:asc',
    size: 10,
    current: 1
  }

  request({
    url: '/mch/productSpuImage/crud/query',
    method: 'get',
    params
  })
    .then(response => {
      const data = response.data
      if (data.records) {
        // 提取轮播图的imageUrl
        applyForm.images = data.records.map(image => image.imageUrl)
      }
    })
    .catch(error => {
      ElMessage.error('获取轮播图失败: ' + (error.message || '未知错误'))
      applyForm.images = []
    })
    .finally(() => {
      loadingSpu.value = false
    })
}

// 主图上传成功处理
const handleMainImageUploadSuccess = (response) => {
  if (response.code === 0 && response.data && response.data.fileKey) {
    applyForm.mainImage = response.data.fileKey
    ElMessage.success('主图上传成功')
  } else {
    ElMessage.error('主图上传失败: ' + (response.message || '未知错误'))
  }
}

// 轮播图上传成功处理
const handleCarouselImageUploadSuccess = (response) => {
  if (response.code === 0 && response.data && response.data.fileKey) {
    applyForm.images.push(response.data.fileKey)
    ElMessage.success('轮播图上传成功')
  } else {
    ElMessage.error('轮播图上传失败: ' + (response.message || '未知错误'))
  }
}

// 移除轮播图
const removeCarouselImage = (index) => {
  applyForm.images.splice(index, 1)
  ElMessage.success('轮播图已删除')
}

// 加载SKU列表
const loadSkuList = (spuId) => {
  loadingSpu.value = true
  const params = {
    shopId: getShopId(),
    spuId: spuId,
    size: 100,
    current: 1
  }

  // 使用正确的SKU列表接口
  request({
    url: '/mch/productSku/crud/query',
    method: 'get',
    params
  })
    .then(response => {
      const data = response.data
      if (data.records) {
        // 更新selectedSpu的skuList
        selectedSpu.value.skuList = data.records.map(sku => ({
          ...sku,
          // 映射API返回的字段名
          originPrice: sku.price, // API返回的是price字段
          // 秒杀价格默认与原价相同
          seckillPrice: sku.seckillPrice || sku.price
        }))
      }
    })
    .catch(error => {
      ElMessage.error('获取SKU列表失败: ' + (error.message || '未知错误'))
      selectedSpu.value.skuList = []
    })
    .finally(() => {
      loadingSpu.value = false
    })
}

// 处理表格行点击
const handleSpuRowClick = (row) => {
  selectSpu(row)
}

// 获取SKU的选中状态
const getSkuChecked = (skuId) => {
  return selectedSkuIds.value.includes(skuId)
}

// 处理SKU选择
const handleSkuCheck = (skuId, checked) => {
  // 更新skuCheckedMap
  skuCheckedMap.value[skuId] = checked

  // 更新selectedSkuIds
  if (checked) {
    // 添加到选中列表
    if (!selectedSkuIds.value.includes(skuId)) {
      selectedSkuIds.value.push(skuId)
    }
  } else {
    // 从选中列表移除
    const index = selectedSkuIds.value.indexOf(skuId)
    if (index > -1) {
      selectedSkuIds.value.splice(index, 1)
    }
  }

  // 更新全选状态
  if (selectedSpu.value.skuList) {
    selectAllSku.value = selectedSkuIds.value.length === selectedSpu.value.skuList.length
  }
}

// 全选SKU
const handleSelectAllSku = (value) => {
  if (selectedSpu.value.skuList) {
    // 清空之前的选中状态
    selectedSkuIds.value = []
    // 重置skuCheckedMap
    skuCheckedMap.value = {}

    if (value) {
      // 全选
      selectedSpu.value.skuList.forEach(sku => {
        skuCheckedMap.value[sku.id] = true
        selectedSkuIds.value.push(sku.id)
      })
    } else {
      // 全不选
      selectedSpu.value.skuList.forEach(sku => {
        skuCheckedMap.value[sku.id] = false
      })
    }
  }
}



// 提交报名申请
const submitApply = () => {
  if (!applyForm.sessionId) {
    ElMessage.warning('请选择场次')
    return
  }

  if (!applyForm.spuId) {
    ElMessage.warning('请选择商品')
    return
  }

  if (selectedSkuIds.value.length === 0) {
    ElMessage.warning('请至少选择一个SKU')
    return
  }

  // 构建SKU列表
  const selectedSkus = selectedSpu.value.skuList.filter(sku => selectedSkuIds.value.includes(sku.id))
  applyForm.skuList = selectedSkus.map(sku => ({
    skuId: sku.id,
    name: sku.name,
    specCode: sku.specCode, // 使用用户编辑的规格编码
    originPrice: sku.originPrice, // 使用用户编辑的原价
    seckillPrice: sku.seckillPrice, // 使用用户编辑的秒杀价格
    stock: sku.stock, // 使用用户编辑的库存
    mainImage: sku.mainImage // 使用用户上传的图片
  }))

  ElMessageBox.confirm('确定要提交报名申请吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    submitSeckillApply(applyForm)
      .then(() => {
        ElMessage.success('申请提交成功，请等待管理员审核')
        applyDialogVisible.value = false
        getActivityList()
      })
      .catch(error => {
        ElMessage.error('申请提交失败: ' + (error.message || '未知错误'))
      })
      .finally(() => {
        loading.value = false
      })
  }).catch(() => {
    // 取消提交
  })
}

// 确认申请
const confirmApply = (row, selectedSessionIds = []) => {
  // 保留原函数，以备其他地方调用
  if (selectedSessionIds.length > 0) {
    selectedSessionId.value = selectedSessionIds[0]
    applyForm.sessionId = selectedSessionId.value
    applyDialogVisible.value = true
    loadSpuList()
  }
}

// 查看活动详情
const handleView = (row) => {
  dialogTitle.value = '活动详情'
  Object.assign(form, row)
  dialogVisible.value = true
}



// 提交
const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success('操作成功')
      dialogVisible.value = false
      getActivityList()
    }
  })
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    '1': '新建',
    '2': '发布',
    '3': '开始报名',
    '4': '结束报名',
    '5': '开始活动',
    '6': '结束活动',
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
    '6': 'default',
    '7': 'danger'
  }
  return typeMap[status] || 'info'
}

// 跳转到申请记录页面
const goToApplyRecord = (activity) => {
  router.push({
    path: '/mall/mch-seckill/apply',
    query: {
      activityId: activity.id,
      activityName: activity.name
    }
  })
}

// 跳转到秒杀商品页面
const goToSeckillProduct = (activity) => {
  router.push({
    path: '/mall/mch-seckill/product',
    query: {
      activityId: activity.id,
      activityName: activity.name
    }
  })
}

// 初始化
onMounted(() => {
  getActivityList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.mb8 {
  margin-bottom: 8px;
}

.dialog-footer {
  text-align: right;
}

.session-list {
  margin-top: 10px;
}

.session-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-left: 20px;
}

.session-name {
  font-weight: bold;
  color: #333;
}

.session-time {
  font-size: 12px;
  color: #666;
}

.session-status {
  margin-top: 4px;
}

.no-session {
  padding: 40px 0;
  text-align: center;
}

.spu-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.spu-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.spu-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.spu-name {
  flex: 1;
  font-weight: 500;
}

.spu-image img {
  border-radius: 4px;
}

.sku-list {
  margin-top: 10px;
}

.sku-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.sku-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.sku-header {
  margin-bottom: 10px;
}

.sku-content {
  margin-top: 10px;
}

.sku-info-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.sku-form {
  flex: 1;
  margin-right: 20px;
}

.sku-image-container {
  flex-shrink: 0;
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.image-preview {
  margin-bottom: 10px;
}

.image-upload {
  margin-top: 10px;
}

.sku-name {
  font-weight: 500;
  margin-right: 10px;
}

.sku-price {
  color: #606266;
}

.sku-stock {
  color: #909399;
}

.unit {
  margin-left: 5px;
  color: #909399;
}

/* 确保表单行不会因为图片而被挤压 */
.sku-form .el-form-item {
  margin-bottom: 12px;
}

/* 确保输入框有足够的宽度 */
.sku-form .el-input {
  min-width: 120px;
}

/* 图片预览容器样式 */
.image-preview-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

/* 轮播图容器样式 */
.carousel-images-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 轮播图列表样式 */
.carousel-images-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 10px;
}

/* 轮播图项样式 */
.carousel-image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

/* 轮播图空状态样式 */
.carousel-empty {
  margin: 20px 0;
}

/* 轮播图上传按钮样式 */
.carousel-uploader {
  margin-top: 10px;
}

/* SKU卡片样式 */
.mb-3 {
  margin-bottom: 12px;
}

/* 表单行样式 */
.el-form-item {
  margin-bottom: 12px;
}

/* 表格行悬停效果 */
.el-table__row:hover {
  background-color: #ecf5ff;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 8px;
}

/* 已选择商品样式 */
.spu-selected {
  transition: all 0.3s;
}

.spu-selected:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* SPU选择对话框样式 */
.spu-select-dialog .el-dialog__body {
  padding: 20px;
}

.spu-select-dialog .el-table {
  margin-bottom: 20px;
}

.spu-select-dialog .el-table__row:hover {
  background-color: #ecf5ff;
}

.spu-select-dialog .el-image {
  border-radius: 4px;
}

/* 场次选择下拉菜单样式 */
.session-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
}

.session-option-name {
  font-weight: 500;
}

.session-option-time {
  font-size: 12px;
  color: #606266;
}

.session-option-status {
  margin-top: 4px;
}
</style>