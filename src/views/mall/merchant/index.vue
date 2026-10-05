<template>
  <div class="mall-page">
    <section class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form" @submit.prevent="handleSearch">
        <el-form-item label="商家账号">
          <el-input v-model="searchForm.loginAccount" placeholder="请输入商家账号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="action-bar">
      <el-button type="primary" @click="openCreateDialog">新增商家</el-button>
      <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleDelete()">批量删除</el-button>
    </section>

    <el-table v-loading="loading" :data="merchantList" border stripe @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="52" />
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="loginAccount" label="商家账号" min-width="180" />
      <el-table-column prop="createTime" label="创建时间" width="176" />
      <el-table-column prop="updateTime" label="更新时间" width="176" />
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
        @current-change="loadMerchants"
        @size-change="handlePageSizeChange"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑商家' : '新增商家'" width="460px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="88px">
        <el-form-item label="商家账号" prop="loginAccount">
          <el-input v-model="form.loginAccount" placeholder="请输入商家账号" />
        </el-form-item>
        <el-form-item :label="editingId ? '重置密码' : '登录密码'" prop="loginPassword">
          <el-input
            v-model="form.loginPassword"
            type="password"
            :placeholder="editingId ? '留空则不修改密码' : '请输入登录密码'"
            show-password
          />
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
import { createMerchant, deleteMerchants, getMerchantDetail, queryMerchants, updateMerchant } from '@/api/mall/platform'
import type { MerchantForm, MerchantRecord } from '@/types/mall'
import { sha256Hex } from '@/utils/crypto'
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'
import { buildConditions } from '@/utils/query'

const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number>()
const merchantList = ref<MerchantRecord[]>([])
const selectedIds = ref<number[]>([])

const searchForm = reactive({ loginAccount: '' })
const pagination = reactive({ current: 1, size: 10, total: 0 })
const form = reactive<MerchantForm>({ loginAccount: '', loginPassword: '' })

const formRules: FormRules<MerchantForm> = {
  loginAccount: [{ required: true, message: '请输入商家账号', trigger: 'blur' }],
  loginPassword: [{
    validator: (_rule, value, callback) => {
      if (!editingId.value && !value) {
        callback(new Error('请输入登录密码'))
        return
      }
      callback()
    },
    trigger: 'blur',
  }],
}

function resetForm() {
  editingId.value = undefined
  Object.assign(form, { loginAccount: '', loginPassword: '' })
  formRef.value?.clearValidate()
}

async function loadMerchants() {
  loading.value = true
  try {
    const response = await queryMerchants({
      current: pagination.current,
      size: pagination.size,
      conditions_: buildConditions([{ field: 'loginAccount', operator: 'like', value: searchForm.loginAccount }]),
    })
    merchantList.value = response.data.records || []
    pagination.total = response.data.total || 0
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载商家列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  void loadMerchants()
}

function handleReset() {
  searchForm.loginAccount = ''
  handleSearch()
}

function handlePageSizeChange() {
  pagination.current = 1
  void loadMerchants()
}

function handleSelectionChange(rows: MerchantRecord[]) {
  selectedIds.value = rows.map((row) => row.id)
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

async function openEditDialog(row: MerchantRecord) {
  try {
    const response = await getMerchantDetail(row.id)
    editingId.value = row.id
    Object.assign(form, { loginAccount: response.data.loginAccount, loginPassword: '' })
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载商家详情失败')
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true
    const data: MerchantForm = { ...form }
    if (data.loginPassword) {
      data.loginPassword = await sha256Hex(data.loginPassword.trim())
    }

    if (editingId.value) {
      data.id = editingId.value
      if (!data.loginPassword) delete data.loginPassword
      await updateMerchant(data)
    } else {
      await createMerchant(data)
    }

    ElMessage.success('保存成功')
    dialogVisible.value = false
    await loadMerchants()
  } catch (error) {
    if (!isUserCancel(error)) {
      ElMessage.error(getRequestErrorMessage(error) || '保存商家失败')
    }
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row?: MerchantRecord) {
  const ids = row ? [row.id] : selectedIds.value
  if (ids.length === 0) return

  try {
    await ElMessageBox.confirm(`确认删除选中的 ${ids.length} 个商家吗？`, '删除商家', { type: 'warning' })
    await deleteMerchants(ids)
    ElMessage.success('删除成功')
    selectedIds.value = []
    await loadMerchants()
  } catch (error) {
    if (!isUserCancel(error)) {
      ElMessage.error(getRequestErrorMessage(error) || '删除商家失败')
    }
  }
}

onMounted(() => {
  void loadMerchants()
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
