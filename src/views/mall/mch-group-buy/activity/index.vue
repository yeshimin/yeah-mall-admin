<template>
  <div class="mall-page">
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
          <el-option label="已发布" value="2" />
          <el-option label="报名中" value="3" />
          <el-option label="报名结束" value="4" />
          <el-option label="进行中" value="5" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mall-action-row">
      <MallListTools v-model:showSearch="showSearch" @refresh="getActivityList" />
    </el-row>

    <!-- 活动列表 -->
    <el-table
      v-loading="loading"
      :data="activityList"
      style="width: 100%"
    >
      <el-table-column type="index" label="序号" width="80" />
      <el-table-column prop="name" label="活动名称" min-width="200" />
      <el-table-column prop="activityBeginTime" label="活动开始时间" min-width="180" />
      <el-table-column prop="activityEndTime" label="活动结束时间" min-width="180" />
      <el-table-column prop="minPeople" label="每团人数" width="120" />
      <el-table-column prop="status" label="活动状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="活动描述" min-width="200" />
      <el-table-column label="操作" width="440" fixed="right">
        <template #default="scope">
          <div class="activity-actions">
            <el-tooltip :content="getApplyDisabledReason(scope.row)" :disabled="canApply(scope.row)">
              <span class="apply-button-wrapper">
                <el-button
                  size="small"
                  type="primary"
                  :disabled="!canApply(scope.row)"
                  @click="handleApply(scope.row)"
                >
                  <el-icon><Edit /></el-icon>
                  {{ canApply(scope.row) ? '申请参加' : '不可报名' }}
                </el-button>
              </span>
            </el-tooltip>

            <el-button
              size="small"
              type="info"
              @click="goToApplyRecord(scope.row)"
            >
              <el-icon><Document /></el-icon>
              申请记录
            </el-button>

            <el-button
              size="small"
              type="success"
              @click="goToGroupBuyProduct(scope.row)"
            >
              <el-icon><Goods /></el-icon>
              拼团商品
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="handleGroupOverview(scope.row)"
            >
              <el-icon><View /></el-icon>
              查看拼团
            </el-button>
          </div>
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
            disabled
          />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="请选择开始时间"
            style="width: 100%"
            disabled
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            placeholder="请选择结束时间"
            style="width: 100%"
            disabled
          />
        </el-form-item>
        <el-form-item label="每团人数">
          <el-input
            v-model="form.minPeople"
            placeholder="每团人数"
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
            <el-option label="新建" value="1" />
            <el-option label="已发布" value="2" />
            <el-option label="报名中" value="3" />
            <el-option label="报名结束" value="4" />
            <el-option label="进行中" value="5" />
            <el-option label="已结束" value="6" />
            <el-option label="已下架" value="7" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            placeholder="请输入活动备注"
            :rows="3"
            maxlength="200"
            disabled
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
      width="1100px"
      append-to-body
      class="group-buy-apply-dialog"
    >
      <div class="apply-context">当前店铺：{{ getCurrentShopName() }}</div>
      <el-form :model="applyForm" label-position="top" class="apply-form">
        <el-form-item label="参与商品" required>
          <div class="selected-product">
            <template v-if="selectedSpu.id">
              <el-image :src="getImagePreviewUrl(getApplyMainImage())" fit="cover" class="product-cover" />
              <div class="selected-product-info">
                <strong>{{ applyForm.name }}</strong>
                <span>{{ applySkuList.length }} 个 SKU 可参与拼团</span>
              </div>
              <el-button @click="openSpuSelectDialog">重新选择</el-button>
            </template>
            <el-button v-else type="primary" @click="openSpuSelectDialog">
              <el-icon><Plus /></el-icon>
              选择商品
            </el-button>
          </div>
        </el-form-item>

        <template v-if="selectedSpu.id">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="商品名称" required>
                <el-input v-model="applyForm.name" placeholder="请输入商品名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="商品主图（可选覆盖）">
                <div class="image-preview-container">
                  <el-image v-if="getApplyMainImage()" :src="getImagePreviewUrl(getApplyMainImage())" fit="cover" class="main-image" />
                  <el-upload
                    :action="merchantStorageUploadUrl"
                    :show-file-list="false"
                    :on-success="handleMainImageUploadSuccess"
                    :before-upload="handleImageUploadBefore"
                    :headers="{ Authorization: 'Bearer ' + getToken() }"
                  >
                    <el-button size="small">{{ applyForm.mainImage ? '更换覆盖图' : '上传覆盖图' }}</el-button>
                  </el-upload>
                  <el-button v-if="applyForm.mainImage" link type="primary" @click="clearCustomMainImage">恢复源商品主图</el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="自定义轮播图（可选覆盖）">
            <div class="carousel-images-container">
              <div v-if="displayCarouselImages.length" class="carousel-images-list">
                <div v-for="(image, index) in displayCarouselImages" :key="image + index" class="carousel-image-item">
                  <el-image :src="getImagePreviewUrl(image)" fit="cover" class="carousel-image" />
                  <el-button v-if="applyForm.images.length" link type="danger" @click="removeCarouselImage(index)">删除</el-button>
                </div>
              </div>
              <el-empty v-else description="源商品暂无轮播图" class="carousel-empty" />
              <div class="carousel-actions">
                <el-upload
                  :action="merchantStorageUploadUrl"
                  :show-file-list="false"
                  :on-success="handleCarouselImageUploadSuccess"
                  :before-upload="handleImageUploadBefore"
                  :headers="{ Authorization: 'Bearer ' + getToken() }"
                  multiple
                >
                  <el-button size="small">上传覆盖轮播图</el-button>
                </el-upload>
                <el-button v-if="applyForm.images.length" link type="primary" @click="clearCustomCarouselImages">恢复源商品轮播图</el-button>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="商品描述" required>
            <RichTextEditor v-model="applyForm.detailDesc" :height="300" upload-scope="merchant" />
          </el-form-item>

          <el-form-item label="SKU 拼团设置" required>
            <div class="stock-reservation-tip">审核通过后，填写的拼团库存会从对应源 SKU 中预留；活动结束时，未售库存将自动回补。</div>
            <el-table v-loading="loadingApplySku" :data="applySkuList" border class="apply-sku-table" empty-text="该商品暂无可报名的 SKU">
              <el-table-column label="SKU 图片" width="170">
                <template #default="scope">
                  <div class="sku-image-cell">
                    <el-image v-if="getSkuMainImage(scope.row)" :src="getImagePreviewUrl(getSkuMainImage(scope.row))" fit="cover" class="sku-image" />
                    <el-empty v-else description="无图片" class="sku-image" />
                    <div class="sku-image-actions">
                      <el-upload
                        :action="merchantStorageUploadUrl"
                        :show-file-list="false"
                        :on-success="(response) => handleSkuImageUploadSuccess(response, scope.row)"
                        :before-upload="handleImageUploadBefore"
                        :headers="{ Authorization: 'Bearer ' + getToken() }"
                      >
                        <el-button link type="primary">{{ scope.row.mainImage ? '更换覆盖图' : '上传覆盖图' }}</el-button>
                      </el-upload>
                      <el-button v-if="scope.row.mainImage" link type="primary" @click="clearCustomSkuImage(scope.row)">恢复默认</el-button>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="SKU" min-width="160" />
              <el-table-column prop="specCode" label="规格编码" min-width="150" />
              <el-table-column label="原价" width="120"><template #default="scope">¥{{ formatAmount(scope.row.originPrice) }}</template></el-table-column>
              <el-table-column prop="sourceStock" label="可预留源库存" width="130" />
              <el-table-column label="拼团价" width="180">
                <template #default="scope"><el-input-number v-model="applySkuSettings[scope.row.skuId].groupPrice" :step="0.01" :precision="2" controls-position="right" /></template>
              </el-table-column>
              <el-table-column label="拼团库存" width="180">
                <template #default="scope"><el-input-number v-model="applySkuSettings[scope.row.skuId].stock" :step="1" :precision="0" controls-position="right" /></template>
              </el-table-column>
            </el-table>
          </el-form-item>
        </template>

        <el-form-item label="申请备注">
          <el-input v-model="applyForm.applyRemark" type="textarea" placeholder="可选，填写后方便平台审核" :rows="3" />
        </el-form-item>
      </el-form>

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

    <el-dialog
      v-model="groupOverviewVisible"
      :title="`拼团情况 - ${currentGroupActivity?.name || ''}`"
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
import { computed, ref, reactive, onMounted } from 'vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Plus, Search, Document, Goods, View } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { getToken } from '@/utils/auth'
import { resolveApiUrl } from '@/utils/download'
import { getCurrentShop } from '@/utils/shop'
import request from '@/utils/request'
import { queryMchGroupBuyActivityList, queryMchGroupBuyGroupList, submitGroupBuyApply } from '@/api/mall/groupBuy'
import MallListTools from '@/components/mall/MallListTools.vue'
import RichTextEditor from '@/components/mall/RichTextEditor.vue'

// 路由
const router = useRouter()

// 表格数据
const loading = ref(false)
const activityList = ref([])
const total = ref(0)
const showSearch = ref(true)
const merchantStorageUploadUrl = resolveApiUrl('/mch/storage/upload')

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
const groupOverviewVisible = ref(false)
const groupOverviewLoading = ref(false)
const currentGroupActivity = ref(null)
const groupOverviewList = ref([])
const groupOverviewPagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 报名申请相关
const applyDialogVisible = ref(false)
const currentApplyActivity = ref(null)
const spuList = ref([])
const selectedSpu = ref({})
const loadingSpu = ref(false)
const applySkuList = ref([])
// 源 SKU 数据与商家填写的拼团配置分离，重新加载源数据时不覆盖编辑值。
const applySkuSettings = reactive({})
const loadingApplySku = ref(false)
const sourceCarouselImages = ref([])
const sourceDetailDesc = ref('')
const displayCarouselImages = computed(() => applyForm.images.length ? applyForm.images : sourceCarouselImages.value)

// SPU选择对话框相关
const spuSelectDialogVisible = ref(false)
const spuSearchKeyword = ref('')

// 报名表单数据
const applyForm = reactive({
  activityId: '',
  spuId: '',
  name: '',
  mainImage: '',
  images: [],
  detailDesc: '',
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
  remark: ''
})

// 加载活动列表
const getActivityList = () => {
  loading.value = true
  queryMchGroupBuyActivityList({
    current: queryParams.pageNum,
    size: queryParams.pageSize,
    name: queryParams.activityName || undefined,
    status: queryParams.status || undefined
  }).then((res) => {
    activityList.value = res.data?.records || []
    total.value = Number(res.data?.total || 0)
  }).finally(() => {
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

/**
 * 查看当前店铺在活动下的拼团情况。
 */
const handleGroupOverview = (row) => {
  const shopId = getCurrentShopId()
  if (!shopId) {
    ElMessage.warning('当前店铺信息已失效，请重新登录')
    return
  }
  currentGroupActivity.value = row
  groupOverviewPagination.current = 1
  groupOverviewVisible.value = true
  getGroupOverviewList()
}

/**
 * 查询当前活动下的团概览。
 */
const getGroupOverviewList = () => {
  const shopId = getCurrentShopId()
  if (!shopId || !currentGroupActivity.value?.id) {
    return
  }
  groupOverviewLoading.value = true
  queryMchGroupBuyGroupList({
    shopId,
    activityId: currentGroupActivity.value.id,
    current: groupOverviewPagination.current,
    size: groupOverviewPagination.size
  }).then((res) => {
    const data = res.data || {}
    groupOverviewList.value = data.records || []
    groupOverviewPagination.total = Number(data.total) || 0
  }).finally(() => {
    groupOverviewLoading.value = false
  })
}

const handleGroupOverviewSizeChange = (size) => {
  groupOverviewPagination.size = size
  groupOverviewPagination.current = 1
  getGroupOverviewList()
}

const handleGroupOverviewCurrentChange = (current) => {
  groupOverviewPagination.current = current
  getGroupOverviewList()
}

// 申请参加活动
const handleApply = (row) => {
  if (!canApply(row)) {
    ElMessage.warning(getApplyDisabledReason(row))
    return
  }
  // 清空之前的选择
  currentApplyActivity.value = row
  selectedSpu.value = {}
  applySkuList.value = []
  resetApplySkuSettings()
  sourceCarouselImages.value = []
  sourceDetailDesc.value = ''
  applyForm.activityId = row.id
  applyForm.spuId = ''
  applyForm.name = ''
  applyForm.mainImage = ''
  applyForm.images = []
  applyForm.detailDesc = ''
  applyForm.applyRemark = ''

  // 打开报名申请对话框
  applyDialogVisible.value = true
}

// 仅“报名中”且处于报名时间段内的活动可提交报名申请。
function canApply(activity) {
  if (String(activity?.status) !== '3') {
    return false
  }
  const applyBeginTime = parseActivityTime(activity.applyBeginTime)
  const applyEndTime = parseActivityTime(activity.applyEndTime)
  if (!applyBeginTime || !applyEndTime) {
    return false
  }
  const now = Date.now()
  return now >= applyBeginTime && now <= applyEndTime
}

function getApplyDisabledReason(activity) {
  const status = String(activity?.status)
  if (status === '5') {
    return '活动已开始，报名已结束'
  }
  if (status === '4' || status === '6' || status === '7') {
    return '报名已结束'
  }
  if (status !== '3') {
    return '当前活动暂未开放报名'
  }
  const applyBeginTime = parseActivityTime(activity.applyBeginTime)
  const applyEndTime = parseActivityTime(activity.applyEndTime)
  if (!applyBeginTime || !applyEndTime) {
    return '报名时间未配置'
  }
  if (Date.now() < applyBeginTime) {
    return '报名尚未开始'
  }
  return '报名已结束'
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

function parseActivityTime(value) {
  if (!value) {
    return null
  }
  const time = new Date(String(value).replace(' ', 'T')).getTime()
  return Number.isNaN(time) ? null : time
}

// 打开SPU选择对话框
const openSpuSelectDialog = () => {
  if (!getCurrentShopId()) {
    ElMessage.warning('当前店铺信息已失效，请重新登录')
    return
  }
  // 打开对话框前加载SPU列表
  loadSpuList()
  spuSelectDialogVisible.value = true
}

// 加载SPU列表
const loadSpuList = () => {
  loadingSpu.value = true
  const params = {
    shopId: getCurrentShopId(),
    size: 100,
    current: 1
  }

  // 添加搜索关键词
  if (spuSearchKeyword.value) {
    params.name = spuSearchKeyword.value
  }

  request({ url: '/mch/productSpu/query', method: 'get', params }).then((res) => {
    spuList.value = res.data?.records || []
  }).finally(() => {
    loadingSpu.value = false
  })
}

// 选择SPU
const selectSpu = async (spu) => {
  if (!spu) {
    return
  }
  selectedSpu.value = spu
  applyForm.spuId = spu.id
  applyForm.name = spu.name
  applyForm.mainImage = ''
  applyForm.images = []
  applyForm.detailDesc = spu.detailDesc || ''
  sourceDetailDesc.value = spu.detailDesc || ''
  spuSelectDialogVisible.value = false
  await Promise.all([loadApplySkuList(spu.id), loadSourceCarouselImages(spu.id)])
}

// 处理表格行点击
const handleSpuRowClick = (row) => {
  selectSpu(row)
}

// 业务页面统一使用登录阶段选择的店铺。
function getCurrentShopId() {
  return getCurrentShop()?.id || null
}

// 显示登录时选择的店铺，业务页面不再重复选择店铺。
function getCurrentShopName() {
  return getCurrentShop()?.name || '未选择店铺'
}

// 选择商品后加载 SKU，仅用于展示和填写报名配置，不作为提交时的商品数据来源。
async function loadApplySkuList(spuId) {
  loadingApplySku.value = true
  try {
    const response = await request({
      url: '/mch/productSku/crud/query',
      method: 'get',
      params: { shopId: getCurrentShopId(), spuId, current: 1, size: 100 }
    })
    // 用户切换商品时，忽略较早请求返回的数据，避免覆盖当前商品的配置。
    if (String(applyForm.spuId) !== String(spuId)) {
      return
    }
    const sourceSkuList = (response.data?.records || []).map((sku) => {
      const sourceStock = Number(sku.stock || 0)
      return {
        skuId: sku.id,
        name: sku.name,
        specCode: sku.specCode || '-',
        sourceMainImage: sku.mainImage || '',
        mainImage: '',
        originPrice: Number(sku.price || 0),
        sourceStock
      }
    })
    resetApplySkuSettings()
    sourceSkuList.forEach((sku) => {
      applySkuSettings[sku.skuId] = {
        groupPrice: sku.originPrice,
        stock: sku.sourceStock
      }
    })
    applySkuList.value = sourceSkuList
  } finally {
    loadingApplySku.value = false
  }
}

function resetApplySkuSettings() {
  Object.keys(applySkuSettings).forEach((skuId) => {
    delete applySkuSettings[skuId]
  })
}

// 仅用于展示默认轮播图；提交时为空即由后端回退到这些源商品轮播图。
async function loadSourceCarouselImages(spuId) {
  const response = await request({
    url: '/mch/productSpuImage/crud/query',
    method: 'get',
    params: { shopId: getCurrentShopId(), spuId, current: 1, size: 100 }
  })
  sourceCarouselImages.value = (response.data?.records || []).map((image) => image.imageUrl)
}

// 获取图片预览URL
function getImagePreviewUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

// 自定义主图为空时，始终展示已选原商品的实时主图。
function getApplyMainImage() {
  return applyForm.mainImage || selectedSpu.value.mainImage || ''
}

// SKU自定义图为空时，回退到原始SKU主图，再回退到SPU主图。
function getSkuMainImage(sku) {
  return sku.mainImage || sku.sourceMainImage || selectedSpu.value.mainImage || ''
}

// 更新活动展示主图。
const handleMainImageUploadSuccess = (response) => {
  if (response.code === 0 && response.data && response.data.fileKey) {
    applyForm.mainImage = response.data.fileKey
    ElMessage.success('主图上传成功')
  } else {
    ElMessage.error('主图上传失败: ' + (response.message || '未知错误'))
  }
}

function clearCustomMainImage() {
  applyForm.mainImage = ''
}

function handleCarouselImageUploadSuccess(response) {
  if (response.code === 0 && response.data?.fileKey) {
    applyForm.images.push(response.data.fileKey)
    ElMessage.success('轮播图上传成功')
  } else {
    ElMessage.error('轮播图上传失败: ' + (response.message || '未知错误'))
  }
}

function removeCarouselImage(index) {
  applyForm.images.splice(index, 1)
}

function clearCustomCarouselImages() {
  applyForm.images = []
}

function handleSkuImageUploadSuccess(response, sku) {
  if (response.code === 0 && response.data?.fileKey) {
    sku.mainImage = response.data.fileKey
    ElMessage.success('SKU覆盖图上传成功')
  } else {
    ElMessage.error('SKU覆盖图上传失败: ' + (response.message || '未知错误'))
  }
}

function clearCustomSkuImage(sku) {
  sku.mainImage = ''
}

// 限制活动展示主图的格式与大小。
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

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

// 仅标记本次新增到富文本中的图片，源商品已有图片继续由源商品持有。
function extractImagesFromRichText(content) {
  const fileKeys = new Set()
  const regex = /[?&]fileKey=([^"'&\s>]+)/g
  let match
  while ((match = regex.exec(content || '')) !== null) {
    fileKeys.add(decodeURIComponent(match[1]))
  }
  return [...fileKeys]
}

function getCustomDetailImages() {
  const sourceImages = new Set(extractImagesFromRichText(sourceDetailDesc.value))
  return extractImagesFromRichText(applyForm.detailDesc).filter((fileKey) => !sourceImages.has(fileKey))
}

// 提交报名申请
const submitApply = async () => {
  if (!canApply(currentApplyActivity.value)) {
    ElMessage.warning(getApplyDisabledReason(currentApplyActivity.value))
    applyDialogVisible.value = false
    return
  }
  if (!getCurrentShopId()) {
    ElMessage.warning('当前店铺信息已失效，请重新登录')
    return
  }
  if (!applyForm.spuId) {
    ElMessage.warning('请选择商品')
    return
  }
  if (!applyForm.name || !applyForm.detailDesc) {
    ElMessage.warning('请完善商品名称和描述')
    return
  }
  if (!applySkuList.value.length) {
    ElMessage.warning('该商品暂无可报名的 SKU')
    return
  }
  const invalidSku = applySkuList.value.find((sku) => getSkuSettingError(sku))
  if (invalidSku) {
    ElMessage.warning(`SKU「${invalidSku.name}」${getSkuSettingError(invalidSku)}`)
    return
  }

  try {
    await ElMessageBox.confirm('确定要提交报名申请吗？', '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    loading.value = true
    await submitGroupBuyApply({
      activityId: applyForm.activityId,
      shopId: getCurrentShopId(),
      spuId: applyForm.spuId,
      name: applyForm.name,
      mainImage: applyForm.mainImage || undefined,
      detailDesc: applyForm.detailDesc,
      detailImages: getCustomDetailImages(),
      images: applyForm.images,
      applyRemark: applyForm.applyRemark,
      skuList: applySkuList.value.map((sku) => {
        const setting = applySkuSettings[sku.skuId]
        return {
          skuId: sku.skuId,
          groupPrice: Number(setting.groupPrice),
          stock: Number(setting.stock),
          mainImage: sku.mainImage || undefined
        }
      })
    })
    ElMessage.success('申请提交成功，请等待管理员审核')
    applyDialogVisible.value = false
    getActivityList()
  } catch {
    // request 已展示后端业务错误；此处仅避免提交事件留下未处理的 Promise。
  } finally {
    loading.value = false
  }
}

function getSkuSettingError(sku) {
  const setting = applySkuSettings[sku.skuId]
  if (!setting) {
    return '缺少拼团配置'
  }
  const priceText = String(setting.groupPrice ?? '').trim()
  if (!/^\d+(?:\.\d{1,2})?$/.test(priceText) || Number(priceText) <= 0) {
    return '的拼团价必须大于 0，且最多两位小数'
  }
  if (Number(priceText) > Number(sku.originPrice)) {
    return `的拼团价不能高于原价 ¥${formatAmount(sku.originPrice)}`
  }
  const stockText = String(setting.stock ?? '').trim()
  if (!/^\d+$/.test(stockText) || Number(stockText) <= 0) {
    return '的拼团库存必须为正整数'
  }
  if (Number(stockText) > Number(sku.sourceStock)) {
    return `的拼团库存不能高于可预留源库存 ${sku.sourceStock}`
  }
  return ''
}

// 查看活动详情
const handleView = (row) => {
  dialogTitle.value = '活动详情'
  Object.assign(form, {
    id: row.id,
    activityName: row.name,
    startTime: row.activityBeginTime,
    endTime: row.activityEndTime,
    minPeople: row.minPeople,
    status: row.status,
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

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    '1': '新建',
    '2': '已发布',
    '3': '报名中',
    '4': '报名结束',
    '5': '进行中',
    '6': '已结束',
    '7': '已下架'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
function getStatusTagType(status) {
  const typeMap = {
    '1': 'info',
    '2': 'info',
    '3': 'warning',
    '4': 'warning',
    '5': 'success',
    '6': 'info',
    '7': 'danger'
  }
  return typeMap[status] || 'info'
}

// 初始化
onMounted(() => {
  getActivityList()
})
</script>

<style scoped>
.mall-page {
  padding: 24px;
}

.mall-action-row {
  margin-bottom: 8px;
}

.dialog-footer {
  text-align: right;
}

.apply-button-wrapper {
  display: inline-flex;
  vertical-align: middle;
}

.activity-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.activity-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.stock-reservation-tip {
  margin-bottom: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.mb-4 {
  margin-bottom: 16px;
}

.apply-context {
  margin-bottom: 18px;
  padding: 10px 14px;
  color: var(--el-color-primary-dark-2);
  background: var(--el-color-primary-light-9);
  border-radius: 6px;
}

.apply-form {
  max-width: 100%;
}

.selected-product {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 72px;
  width: 100%;
  padding: 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
}

.product-cover {
  flex: 0 0 auto;
  width: 56px;
  height: 56px;
  border-radius: 4px;
}

.selected-product-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.selected-product-info strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-product-info span {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.image-preview-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.carousel-images-container {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}

.carousel-images-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.carousel-image-item,
.sku-image-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.carousel-image,
.sku-image {
  width: 72px;
  height: 72px;
  border-radius: 4px;
}

.carousel-actions,
.sku-image-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.carousel-empty {
  width: 100px;
  height: 72px;
}

.apply-sku-table :deep(.el-input-number) {
  width: 140px;
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
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
