<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="searchFormRef" :inline="true" v-show="showSearch">
      <el-form-item label="商品名称">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入商品名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="商品状态">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择商品状态"
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
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="productList" style="width: 100%">
      <el-table-column label="序号" type="index" width="80" />
      <el-table-column prop="name" label="商品名称" min-width="200" />
      <el-table-column label="商品图片" width="120">
        <template #default="scope">
          <el-image
            v-if="scope.row.mainImage"
            :src="getImagePreviewUrl(scope.row.mainImage)"
            fit="cover"
            style="width: 80px; height: 80px"
          >
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <el-empty v-else description="" style="width: 80px; height: 80px" />
        </template>
      </el-table-column>
      <el-table-column prop="originPrice" label="原价" width="100">
        <template #default="scope">
          ¥{{ scope.row.originPrice }}
        </template>
      </el-table-column>
      <el-table-column prop="groupPrice" label="拼团价" width="100">
        <template #default="scope">
          ¥{{ scope.row.groupPrice }}
        </template>
      </el-table-column>
      <el-table-column prop="minPeople" label="最低成团人数" width="120" />
      <el-table-column prop="stock" label="库存" width="100" />
      <el-table-column prop="sales" label="销量" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)" plain>
            <el-icon><Edit /></el-icon>
            编辑
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Edit, Delete, Picture } from '@element-plus/icons-vue'
import RightToolbar from '@/components/RightToolbar/index.vue'

// 响应式数据
const loading = ref(false)
const showSearch = ref(true)

// 查询参数
const queryParams = reactive({
  name: '',
  status: ''
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 商品列表
const productList = ref([])

// 模拟数据
const mockProductList = [
  {
    id: 1,
    name: '春季拼团商品1',
    mainImage: 'product1.jpg',
    originPrice: 199,
    groupPrice: 99,
    minPeople: 3,
    stock: 100,
    sales: 20,
    status: '1',
    createTime: '2026-03-01 00:00:00'
  },
  {
    id: 2,
    name: '春季拼团商品2',
    mainImage: 'product2.jpg',
    originPrice: 299,
    groupPrice: 149,
    minPeople: 2,
    stock: 50,
    sales: 15,
    status: '1',
    createTime: '2026-03-02 00:00:00'
  }
]

// 初始化
onMounted(() => {
  getList()
})

// 获取商品列表
function getList() {
  loading.value = true
  const params = {
    conditions_: `sort:sort:asc`,
    size: pagination.size,
    current: pagination.current
  }

  // 合并查询参数
  if (queryParams.name) {
    params.conditions_ += `,name:${queryParams.name}:like`
  }
  if (queryParams.status) {
    params.conditions_ += `,status:${queryParams.status}:eq`
  }

  // 模拟API调用
  setTimeout(() => {
    productList.value = mockProductList
    pagination.total = mockProductList.length
    loading.value = false
  }, 500)
}

// 编辑商品
function handleEdit(row) {
  // 编辑逻辑
  ElMessage.info('编辑功能开发中')
}

// 删除商品
function handleDelete(id) {
  ElMessageBox.confirm('确定要删除该商品吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loading.value = true
    // 模拟删除
    setTimeout(() => {
      ElMessage.success('删除成功')
      getList()
      loading.value = false
    }, 500)
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

// 获取图片预览URL
function getImagePreviewUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    '1': '启用',
    '0': '禁用'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
function getStatusTagType(status) {
  const typeMap = {
    '1': 'success',
    '0': 'danger'
  }
  return typeMap[status] || 'info'
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

.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background-color: #f5f7fa;
}
</style>