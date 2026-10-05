<template>
  <div class="mall-page">
    <section class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form" @submit.prevent="handleSearch">
        <el-form-item label="商家">
          <el-select v-model="searchForm.mchId" clearable filterable placeholder="全部商家">
            <el-option v-for="merchant in merchantOptions" :key="merchant.id" :label="merchant.loginAccount" :value="merchant.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="店铺名称">
          <el-input v-model="searchForm.shopName" placeholder="请输入店铺名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="action-bar">
      <el-button type="primary" @click="openCreateDialog">新增店铺</el-button>
      <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleDelete()">批量删除</el-button>
    </section>

    <el-table v-loading="loading" :data="shopList" border stripe @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="52" />
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="shopNo" label="店铺编号" min-width="140" />
      <el-table-column prop="shopName" label="店铺名称" min-width="180" />
      <el-table-column prop="mchName" label="商家" min-width="160" />
      <el-table-column prop="createTime" label="创建时间" width="176" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <div class="table-row-actions">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @current-change="loadShops"
        @size-change="handlePageSizeChange"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑店铺' : '新增店铺'" width="460px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="88px">
        <el-form-item label="所属商家" prop="mchId">
          <el-select v-model="form.mchId" :disabled="Boolean(editingId)" filterable placeholder="请选择商家" style="width: 100%">
            <el-option v-for="merchant in merchantOptions" :key="merchant.id" :label="merchant.loginAccount" :value="merchant.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="店铺名称" prop="shopName">
          <el-input v-model="form.shopName" placeholder="请输入店铺名称" />
        </el-form-item>
        <el-form-item label="店铺编号" prop="shopNo">
          <el-input v-model="form.shopNo" :disabled="Boolean(editingId)" placeholder="留空由系统生成" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createShop,
  deleteShops,
  getShopDetail,
  queryMerchants,
  queryShops,
  updateShop,
} from '@/api/mall/platform'
import type { MerchantRecord, ShopForm, ShopRecord } from '@/types/mall'
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'
import { buildConditions } from '@/utils/query'

const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number>()
const shopList = ref<ShopRecord[]>([])
const merchantOptions = ref<MerchantRecord[]>([])
const selectedIds = ref<number[]>([])

const searchForm = reactive<{ mchId?: number; shopName: string }>({ shopName: '' })
const pagination = reactive({ current: 1, size: 10, total: 0 })
const form = reactive<ShopForm>({ mchId: undefined, shopNo: '', shopName: '' })

const formRules: FormRules<ShopForm> = {
  mchId: [{ required: true, message: '请选择所属商家', trigger: 'change' }],
  shopName: [{ required: true, message: '请输入店铺名称', trigger: 'blur' }],
}

function resetForm() {
  editingId.value = undefined
  Object.assign(form, { mchId: undefined, shopNo: '', shopName: '' })
  formRef.value?.clearValidate()
}

async function loadMerchantOptions() {
  try {
    const response = await queryMerchants({ current: 1, size: 100 })
    merchantOptions.value = response.data.records || []
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载商家选项失败')
  }
}

async function loadShops() {
  loading.value = true
  try {
    const conditions = buildConditions([
      { field: 'mchId', operator: 'eq', value: searchForm.mchId },
      { field: 'shopName', operator: 'like', value: searchForm.shopName },
    ])
    const response = await queryShops({ current: pagination.current, size: pagination.size, conditions_: conditions })
    shopList.value = response.data.records || []
    pagination.total = response.data.total || 0
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载店铺列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  void loadShops()
}

function handleReset() {
  searchForm.mchId = undefined
  searchForm.shopName = ''
  handleSearch()
}

function handlePageSizeChange() {
  pagination.current = 1
  void loadShops()
}

function handleSelectionChange(rows: ShopRecord[]) {
  selectedIds.value = rows.map((row) => row.id)
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

async function openEditDialog(row: ShopRecord) {
  try {
    const response = await getShopDetail(row.id)
    editingId.value = row.id
    Object.assign(form, {
      mchId: response.data.mchId,
      shopNo: response.data.shopNo || '',
      shopName: response.data.shopName,
    })
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载店铺详情失败')
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true
    if (editingId.value) {
      await updateShop({ ...form, id: editingId.value })
    } else {
      await createShop({ ...form })
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await loadShops()
  } catch (error) {
    if (!isUserCancel(error)) {
      ElMessage.error(getRequestErrorMessage(error) || '保存店铺失败')
    }
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row?: ShopRecord) {
  const ids = row ? [row.id] : selectedIds.value
  if (ids.length === 0) return

  try {
    await ElMessageBox.confirm(`确认删除选中的 ${ids.length} 个店铺吗？`, '删除店铺', { type: 'warning' })
    await deleteShops(ids)
    ElMessage.success('删除成功')
    selectedIds.value = []
    await loadShops()
  } catch (error) {
    if (!isUserCancel(error)) {
      ElMessage.error(getRequestErrorMessage(error) || '删除店铺失败')
    }
  }
}

onMounted(() => {
  void loadMerchantOptions()
  void loadShops()
})
</script>

<style scoped>
.mall-page {
  padding: 20px;
}

.search-bar,
.action-bar {
  margin-bottom: 16px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
