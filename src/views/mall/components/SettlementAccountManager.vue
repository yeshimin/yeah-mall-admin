<template>
  <div class="account-page mall-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" :model="filters" class="mall-query-form" @submit.prevent="search">
        <el-form-item label="店铺ID">
          <el-input v-model="filters.shopId" clearable placeholder="全部店铺" />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="filters.status" clearable placeholder="全部状态">
            <el-option label="待审核" value="1" />
            <el-option label="已通过" value="2" />
            <el-option label="已拒绝" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item class="mall-query-actions">
          <el-button @click="reset">重置</el-button>
          <el-button type="primary" native-type="submit" icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="mall-table-panel">
      <el-table v-loading="loading" :data="records" height="100%">
        <el-table-column prop="shopId" label="店铺ID" width="110" />
        <el-table-column label="账户类型" width="110">
          <template #default="{ row }">{{ row.accountType === '1' ? '银行卡' : '支付宝' }}</template>
        </el-table-column>
        <el-table-column prop="accountName" label="收款名称" min-width="160" />
        <el-table-column prop="accountNo" label="收款账号" min-width="150" />
        <el-table-column prop="bankName" label="开户银行" min-width="180">
          <template #default="{ row }">{{ row.bankName || '-' }}</template>
        </el-table-column>
        <el-table-column label="审核状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditRemark" label="审核备注" min-width="180">
          <template #default="{ row }">{{ row.auditRemark || '-' }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" width="170" />
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openAudit(row)">{{ row.status === '1' ? '审核' : '查看' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <MallPagination :total="page.total" :page="page.current" :limit="page.size" @pagination="changePage" />
    </section>

    <el-dialog v-model="dialog.visible" title="结算账户审核" width="560px" @closed="resetDialog">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="店铺ID">{{ dialog.record?.shopId }}</el-descriptions-item>
        <el-descriptions-item label="账户类型">{{ dialog.record?.accountType === '1' ? '银行卡' : '支付宝' }}</el-descriptions-item>
        <el-descriptions-item label="收款名称">{{ dialog.record?.accountName }}</el-descriptions-item>
        <el-descriptions-item label="收款账号">{{ dialog.record?.accountNo }}</el-descriptions-item>
        <el-descriptions-item label="开户银行">{{ dialog.record?.bankName || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-form v-if="dialog.record?.status === '1'" label-position="top" class="audit-form">
        <el-form-item label="审核备注">
          <el-input v-model="dialog.remark" type="textarea" :rows="3" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">关闭</el-button>
        <template v-if="dialog.record?.status === '1'">
          <el-button type="danger" plain :loading="dialog.submitting" @click="audit(false)">拒绝</el-button>
          <el-button type="primary" :loading="dialog.submitting" @click="audit(true)">通过</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import MallPagination from '@/components/mall/MallPagination.vue'
import {
  auditPlatformSettlementAccount,
  getPlatformSettlementAccount,
  queryPlatformSettlementAccounts,
  type SettlementAccountRecord,
} from '@/api/mall/settlement'
import { getRequestErrorMessage } from '@/utils/error'

const loading = ref(false)
const records = ref<SettlementAccountRecord[]>([])
const filters = reactive({ shopId: '', status: '' })
const page = reactive({ current: 1, size: 10, total: 0 })
const dialog = reactive({
  visible: false,
  submitting: false,
  record: undefined as SettlementAccountRecord | undefined,
  remark: '',
})

function statusText(status: string) {
  return ({ '1': '待审核', '2': '已通过', '3': '已拒绝' } as Record<string, string>)[status] || '未知'
}

function statusType(status: string) {
  return status === '2' ? 'success' : status === '3' ? 'danger' : 'warning'
}

async function load() {
  loading.value = true
  try {
    const response = await queryPlatformSettlementAccounts({
      current: page.current,
      size: page.size,
      shopId: filters.shopId || undefined,
      status: filters.status || undefined,
    })
    records.value = response.data?.records || []
    page.total = Number(response.data?.total || 0)
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载结算账户失败')
  } finally {
    loading.value = false
  }
}

function search() {
  page.current = 1
  void load()
}

function reset() {
  Object.assign(filters, { shopId: '', status: '' })
  search()
}

function changePage(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
  void load()
}

async function openAudit(row: SettlementAccountRecord) {
  try {
    const response = await getPlatformSettlementAccount(row.id)
    dialog.record = response.data
    dialog.remark = row.auditRemark || ''
    dialog.visible = true
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载账户详情失败')
  }
}

function resetDialog() {
  dialog.record = undefined
  dialog.remark = ''
  dialog.submitting = false
}

async function audit(approved: boolean) {
  if (!dialog.record) return
  if (!approved && !dialog.remark.trim()) {
    ElMessage.warning('拒绝时必须填写审核备注')
    return
  }
  dialog.submitting = true
  try {
    await auditPlatformSettlementAccount({
      id: dialog.record.id,
      approved,
      remark: dialog.remark.trim() || undefined,
    })
    ElMessage.success(approved ? '账户审核通过' : '账户已拒绝')
    dialog.visible = false
    await load()
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '审核失败')
  } finally {
    dialog.submitting = false
  }
}

onMounted(() => void load())
</script>

<style scoped>
.account-page { height: 100%; display: flex; flex-direction: column; }
.mall-table-panel { flex: 1; min-height: 0; }
.audit-form { margin-top: 18px; }
</style>
