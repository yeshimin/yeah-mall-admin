<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="活动名称" prop="activityId">
        <el-select
          v-model="queryParams.activityId"
          placeholder="请选择活动"
          clearable
          style="width: 180px"
          @change="handleActivityChange"
        >
          <el-option v-for="activity in activityList" :key="activity.id" :label="activity.name" :value="activity.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="场次名称" prop="sessionId">
        <el-select
          v-model="queryParams.sessionId"
          placeholder="请选择场次"
          clearable
          style="width: 180px"
        >
          <el-option v-for="session in sessionList" :key="session.id" :label="session.name" :value="session.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态" prop="auditStatus">
        <el-select
          v-model="queryParams.auditStatus"
          placeholder="请选择审核状态"
          clearable
          style="width: 120px"
        >
          <el-option label="待审核" value="1" />
          <el-option label="审核通过" value="2" />
          <el-option label="审核驳回" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="商家名称" prop="mchName">
        <el-input
          v-model="queryParams.mchName"
          placeholder="请输入商家名称"
          clearable
          style="width: 150px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="店铺名称" prop="shopName">
        <el-input
          v-model="queryParams.shopName"
          placeholder="请输入店铺名称"
          clearable
          style="width: 150px"
        />
      </el-form-item>
      <el-form-item label="商品名称" prop="spuName">
        <el-input
          v-model="queryParams.spuName"
          placeholder="请输入商品名称"
          clearable
          style="width: 180px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getProductList" />
    </el-row>

    <!-- 商品列表 -->
    <el-table
      v-loading="loading"
      :data="productList"
      style="width: 100%"
    >
      <el-table-column type="index" label="序号" width="80" />
      <el-table-column label="商品图片" min-width="100">
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
      <el-table-column prop="name" label="商品名称" min-width="200" />
      <el-table-column prop="activityName" label="活动名称" min-width="150" />
      <el-table-column prop="sessionName" label="场次名称" min-width="150" />
      <el-table-column prop="mchName" label="商家名称" min-width="120" />
      <el-table-column prop="shopName" label="店铺名称" min-width="120" />
      <el-table-column prop="sales" label="销量" width="100" />
      <el-table-column prop="auditStatus" label="审核状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.auditStatus)">
            {{ getStatusText(scope.row.auditStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button
            size="small"
            type="primary"
            icon="View"
            @click="handleView(scope.row)"
          >
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="queryParams.current"
      v-model:page-size="queryParams.size"
      :page-sizes="[10, 20, 30, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="Number(total)"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <!-- 查看详情对话框 -->
    <el-dialog title="商品详情" v-model="viewDialogVisible" width="800px">
      <!-- 商品基本信息 -->
      <div class="mb-4">
        <h4>基本信息</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商品名称">{{ viewForm.name }}</el-descriptions-item>
          <el-descriptions-item label="活动名称">{{ viewForm.activityName }}</el-descriptions-item>
          <el-descriptions-item label="场次名称">{{ viewForm.sessionName }}</el-descriptions-item>
          <el-descriptions-item label="销量">{{ viewForm.sales }}</el-descriptions-item>
          <el-descriptions-item label="审核状态">{{ getStatusText(viewForm.auditStatus) }}</el-descriptions-item>
          <el-descriptions-item label="商家名称">{{ viewForm.mchName }}</el-descriptions-item>
          <el-descriptions-item label="店铺名称">{{ viewForm.shopName }}</el-descriptions-item>
          <el-descriptions-item label="主图">
            <el-image
              v-if="viewForm.mainImage"
              :src="getImagePreviewUrl(viewForm.mainImage)"
              fit="cover"
              style="width: 100px; height: 100px"
              lazy
            />
            <span v-else>无图片</span>
          </el-descriptions-item>
          <el-descriptions-item label="商品描述" :span="2">{{ viewForm.detailDesc }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 轮播图 -->
      <div class="mb-4" v-if="viewForm.images && viewForm.images.length > 0">
        <h4>轮播图</h4>
        <div class="carousel-images">
          <el-image
            v-for="(image, index) in viewForm.images"
            :key="index"
            :src="getImagePreviewUrl(image)"
            fit="cover"
            style="width: 100px; height: 100px; margin-right: 10px"
            lazy
          />
        </div>
      </div>

      <!-- SKU信息 -->
      <div class="mb-4" v-if="viewForm.skuList && viewForm.skuList.length > 0">
        <h4>SKU信息</h4>
        <el-table :data="viewForm.skuList" style="width: 100%">
          <el-table-column prop="name" label="SKU名称" min-width="200" />
          <el-table-column prop="specCode" label="规格编码" width="150" />
          <el-table-column prop="originPrice" label="原价" width="100">
            <template #default="scope">
              ¥{{ scope.row.originPrice }}
            </template>
          </el-table-column>
          <el-table-column prop="seckillPrice" label="秒杀价格" width="100">
            <template #default="scope">
              ¥{{ scope.row.seckillPrice }}
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="80" />
          <el-table-column label="SKU图片" width="120">
            <template #default="scope">
              <el-image
                v-if="scope.row.mainImage"
                :src="getImagePreviewUrl(scope.row.mainImage)"
                fit="cover"
                style="width: 80px; height: 80px"
                lazy
              />
              <span v-else>无图片</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { ElMessage } from 'element-plus'
import { Search, Refresh, View } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import request from '@/utils/request'
import RightToolbar from '@/components/RightToolbar/index.vue'

// 路由
const route = useRoute()

// 表格数据
const loading = ref(false)
const productList = ref([])
const total = ref(0)
const showSearch = ref(true)

// 查询参数
const queryParams = reactive({
  current: 1,
  size: 10,
  activityId: '',
  sessionId: '',
  auditStatus: '',
  mchName: '',
  shopName: '',
  spuName: ''
})

// 查看对话框
const viewDialogVisible = ref(false)

// 查看表单数据
const viewForm = reactive({})

// 活动列表
const activityList = ref([])

// 场次列表
const sessionList = ref([])

// 初始化
onMounted(() => {
  loadActivityList().then(() => {
    // 检查URL中是否有活动ID参数
    const activityId = route.query.activityId
    if (activityId) {
      // 设置活动ID到查询参数
      queryParams.activityId = activityId
      // 加载对应的场次列表
      loadSessionList(activityId)
    }
    // 页面加载时自动获取一次商品列表
    getProductList()
  })
})

// 加载活动列表
function loadActivityList() {
  return new Promise((resolve, reject) => {
    request({
      url: '/admin/seckillActivity/crud/query',
      method: 'get',
      params: {
        conditions_: 'sort:sort:asc',
        size: 100,
        current: 1
      }
    })
      .then(response => {
        const data = response.data
        if (data.records) {
          activityList.value = data.records
        }
        resolve()
      })
      .catch(error => {
        ElMessage.error('获取活动列表失败: ' + (error.message || '未知错误'))
        activityList.value = []
        resolve() // 即使失败也 resolve，确保初始化流程继续
      })
  })
}

// 加载场次列表
function loadSessionList(activityId) {
  if (!activityId) {
    sessionList.value = []
    return
  }

  const params = {
    conditions_: 'sort:sort:asc',
    activityId: activityId,
    size: 100,
    current: 1
  }

  request({
    url: '/admin/seckillSession/crud/query',
    method: 'get',
    params
  })
    .then(response => {
      const data = response.data
      if (data.records) {
        sessionList.value = data.records
      }
    })
    .catch(error => {
      ElMessage.error('获取场次列表失败: ' + (error.message || '未知错误'))
      sessionList.value = []
    })
}

// 处理活动选择变化
function handleActivityChange(activityId) {
  // 清空场次选择
  queryParams.sessionId = ''
  // 加载对应的场次列表
  loadSessionList(activityId)
}

// 加载商品列表
const getProductList = () => {
  loading.value = true
  const params = {
    conditions_: 'sort:createTime:desc',
    size: queryParams.size,
    current: queryParams.current
  }

  // 添加查询参数
  if (queryParams.activityId) {
    params.activityId = queryParams.activityId
  }
  if (queryParams.sessionId) {
    params.sessionId = queryParams.sessionId
  }
  if (queryParams.auditStatus) {
    params.auditStatus = queryParams.auditStatus
  }
  if (queryParams.mchName) {
    params.mchName = queryParams.mchName
  }
  if (queryParams.shopName) {
    params.shopName = queryParams.shopName
  }
  if (queryParams.spuName) {
    params.spuName = queryParams.spuName
  }

  request({
    url: '/admin/seckillSpu/query',
    method: 'get',
    params
  })
    .then(response => {
      const data = response.data
      if (data.records) {
        productList.value = data.records
        total.value = Number(data.total) || 0
      }
    })
    .catch(error => {
      ElMessage.error('获取商品列表失败: ' + (error.message || '未知错误'))
      productList.value = []
      total.value = 0
    })
    .finally(() => {
      loading.value = false
    })
}

// 搜索
const handleQuery = () => {
  queryParams.current = 1
  getProductList()
}

// 重置
const resetQuery = () => {
  Object.assign(queryParams, {
    activityId: '',
    sessionId: '',
    auditStatus: '',
    mchName: '',
    shopName: '',
    spuName: ''
  })
  // 清空场次列表
  sessionList.value = []
  handleQuery()
}

// 分页
const handleSizeChange = (size) => {
  queryParams.size = size
  getProductList()
}

const handleCurrentChange = (current) => {
  queryParams.current = current
  getProductList()
}

// 查看详情
const handleView = (row) => {
  // 保存从列表中获取的字段（详情接口可能不返回这些字段）
  const listFields = {
    activityName: row.activityName, // 活动名称
    sessionName: row.sessionName, // 场次名称
    mchName: row.mchName, // 商家名称
    shopName: row.shopName // 店铺名称
  }

  loading.value = true
  request({
    url: '/admin/seckillSpu/detail',
    method: 'get',
    params: {
      id: row.id
    }
  })
  .then(response => {
    const data = response.data
    if (data) {
      // 填充查看表单数据，优先使用列表中的字段
      Object.assign(viewForm, {
        ...data.spu,
        ...listFields, // 从列表中获取的字段
        images: data.images || [],
        skuList: data.skuList || []
      })
      viewDialogVisible.value = true
    }
  })
  .catch(error => {
    ElMessage.error('获取商品详情失败: ' + (error.message || '未知错误'))
  })
  .finally(() => {
    loading.value = false
  })
}

// 获取图片预览URL
function getImagePreviewUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    1: '待审核',
    2: '审核通过',
    3: '审核驳回'
  }
  return statusMap[status] || ''
}

// 获取状态标签类型
function getStatusTagType(status) {
  const typeMap = {
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return typeMap[status] || ''
}
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

.carousel-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
</style>