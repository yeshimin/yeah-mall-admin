<template>
  <div class="settlement-page mall-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" :model="filters" class="mall-query-form" @submit.prevent="search">
        <el-form-item v-if="scope === 'platform'" label="店铺ID">
          <el-input v-model="filters.shopId" clearable placeholder="全部店铺" />
        </el-form-item>
        <el-form-item label="订单编号">
          <el-input v-model="filters.orderNo" clearable placeholder="请输入订单编号" />
        </el-form-item>
        <el-form-item label="结算状态">
          <el-select v-model="filters.status" clearable placeholder="全部状态">
            <el-option label="待结算" value="1" />
            <el-option label="已结算" value="2" />
            <el-option label="已取消" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="结算批次">
          <el-input v-model="filters.settlementNo" clearable placeholder="请输入结算批次编号" />
        </el-form-item>
        <el-form-item class="mall-query-actions">
          <el-button @click="reset">重置</el-button>
          <el-button type="primary" native-type="submit">查询</el-button>
        </el-form-item>
      </el-form>
      <div v-if="scope === 'platform'" class="mall-business-actions">
        <el-button type="primary" :loading="dialog.previewing" :disabled="selected.length === 0" @click="openSettleDialog">
          确认线下打款
        </el-button>
      </div>
    </section>

    <section class="mall-table-panel">
      <el-table v-loading="loading" :data="records" height="100%" @selection-change="selected = $event">
        <el-table-column v-if="scope === 'platform'" type="selection" width="52" :selectable="isSelectable" />
        <el-table-column prop="orderNo" label="订单编号" min-width="170" />
        <el-table-column v-if="scope === 'platform'" prop="shopId" label="店铺ID" min-width="100" />
        <el-table-column label="业务类型" width="100">
          <template #default="{ row }">{{ bizTypeText(row.bizType) }}</template>
        </el-table-column>
        <el-table-column label="实际支付" width="110" align="right">
          <template #default="{ row }">¥{{ amountText(row.grossAmount) }}</template>
        </el-table-column>
        <el-table-column label="平台佣金" width="130" align="right">
          <template #default="{ row }">¥{{ amountText(row.commissionAmount) }}（{{ row.commissionRate || 0 }}%）</template>
        </el-table-column>
        <el-table-column label="结算变动" width="120" align="right">
          <template #default="{ row }">
            <span :class="Number(row.amount) < 0 ? 'negative' : 'positive'">
              {{ Number(row.amount) >= 0 ? '+' : '' }}¥{{ amountText(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="availableTime" label="可结算时间" min-width="170" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="settlementNo" label="结算批次" min-width="150">
          <template #default="{ row }">{{ row.settlementNo || '-' }}</template>
        </el-table-column>
        <el-table-column prop="transactionNo" label="转账流水号" min-width="160">
          <template #default="{ row }">{{ row.transactionNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="打款凭证" width="110">
          <template #default="{ row }">
            <StorageImage v-if="row.proof" :src="row.proof" :width="64" :height="48" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="settledTime" label="结算时间" min-width="170">
          <template #default="{ row }">{{ row.settledTime || '-' }}</template>
        </el-table-column>
      </el-table>
      <MallPagination
        :total="page.total"
        :page="page.current"
        :limit="page.size"
        @pagination="changePage"
      />
    </section>

    <el-dialog v-model="dialog.visible" title="确认线下打款" width="560px" @closed="resetDialog">
      <el-alert
        :title="`本次结算 ${dialog.recordCount} 条记录，实际净额 ¥${amountText(dialog.totalAmount)}`"
        type="info"
        :closable="false"
        show-icon
      />
      <div class="account-preview">
        <div><span>收款方式：</span>{{ dialog.accountType === '1' ? '银行卡' : '支付宝' }}</div>
        <div><span>收款名称：</span>{{ dialog.accountName }}</div>
        <div><span>收款账号：</span>{{ dialog.accountNo }}</div>
        <div v-if="dialog.bankName"><span>开户银行：</span>{{ dialog.bankName }}</div>
      </div>
      <el-alert
        v-if="dialog.autoIncludedNegativeCount > 0"
        class="negative-alert"
        :title="`已自动纳入 ${dialog.autoIncludedNegativeCount} 条到期退款/冲减记录`"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form label-position="top" class="settlement-form">
        <el-form-item label="转账流水号" required>
          <el-input v-model="dialog.transactionNo" maxlength="64" placeholder="请输入银行或第三方转账流水号" />
        </el-form-item>
        <el-form-item label="打款凭证">
          <StorageFileUpload v-model="dialog.proof" :file-type="imageTypes" :file-size="5" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="dialog.remark" type="textarea" :rows="3" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="dialog.submitting" @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.submitting" @click="submitSettlement">确认已打款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import MallPagination from '@/components/mall/MallPagination.vue'
import StorageFileUpload from '@/components/mall/StorageFileUpload.vue'
import StorageImage from '@/components/mall/StorageImage.vue'
import {
  confirmPlatformSettlement,
  previewPlatformSettlement,
  queryMerchantSettlements,
  queryPlatformSettlements,
  type SettlementRecord,
} from '@/api/mall/settlement'
import { getCurrentShop } from '@/utils/shop'
import { getRequestErrorMessage } from '@/utils/error'

const props = defineProps<{ scope: 'platform' | 'merchant' }>()
const imageTypes = ['jpg', 'jpeg', 'png', 'webp']
const loading = ref(false)
const records = ref<SettlementRecord[]>([])
const selected = ref<SettlementRecord[]>([])
const filters = reactive({ shopId: '', orderNo: '', status: '', settlementNo: '' })
const page = reactive({ current: 1, size: 10, total: 0 })
const dialog = reactive({
  visible: false,
  previewing: false,
  submitting: false,
  transactionNo: '',
  proof: '',
  remark: '',
  totalAmount: 0,
  recordCount: 0,
  autoIncludedNegativeCount: 0,
  accountId: '',
  accountType: '',
  accountName: '',
  accountNo: '',
  bankName: '',
})

const selectedTotal = computed(() => selected.value
  .reduce((total, item) => total + Number(item.amount || 0), 0).toFixed(2))

function amountText(value: unknown) {
  return Number(value || 0).toFixed(2)
}

function bizTypeText(value: string) {
  return ({ '1': '订单收入', '2': '退款冲减', '3': '人工调整' } as Record<string, string>)[value] || '未知'
}

function statusText(value: string) {
  return ({ '1': '待结算', '2': '已结算', '3': '已取消' } as Record<string, string>)[value] || '未知'
}

function statusType(value: string) {
  return value === '2' ? 'success' : value === '3' ? 'info' : 'warning'
}

function isSelectable(row: SettlementRecord) {
  return row.status === '1' && (!row.availableTime || new Date(row.availableTime).getTime() <= Date.now())
}

async function load() {
  const shopId = props.scope === 'merchant' ? getCurrentShop()?.id : filters.shopId
  if (props.scope === 'merchant' && !shopId) {
    records.value = []
    page.total = 0
    return
  }
  loading.value = true
  try {
    const request = props.scope === 'platform' ? queryPlatformSettlements : queryMerchantSettlements
    const response = await request({
      current: page.current,
      size: page.size,
      shopId: shopId || undefined,
      orderNo: filters.orderNo || undefined,
      status: filters.status || undefined,
      settlementNo: filters.settlementNo || undefined,
    })
    records.value = response.data?.records || []
    page.total = Number(response.data?.total || 0)
    selected.value = []
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载结算台账失败')
  } finally {
    loading.value = false
  }
}

function search() {
  page.current = 1
  void load()
}

function reset() {
  Object.assign(filters, { shopId: '', orderNo: '', status: '', settlementNo: '' })
  search()
}

function changePage(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
  void load()
}

async function openSettleDialog() {
  if (Number(selectedTotal.value) <= 0) {
    ElMessage.warning('所选记录的结算净额必须大于0')
    return
  }
  dialog.previewing = true
  try {
    const response = await previewPlatformSettlement(selected.value.map((item) => item.id))
    dialog.totalAmount = Number(response.data.totalAmount || 0)
    dialog.recordCount = Number(response.data.recordCount || 0)
    dialog.autoIncludedNegativeCount = Number(response.data.autoIncludedNegativeCount || 0)
    dialog.accountId = response.data.settlementAccountId
    dialog.accountType = response.data.settlementAccountType
    dialog.accountName = response.data.settlementAccountName
    dialog.accountNo = response.data.settlementAccountNo
    dialog.bankName = response.data.settlementBankName || ''
    dialog.visible = true
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '预览结算金额失败')
  } finally {
    dialog.previewing = false
  }
}

function resetDialog() {
  Object.assign(dialog, {
    submitting: false,
    transactionNo: '',
    proof: '',
    remark: '',
    totalAmount: 0,
    recordCount: 0,
    autoIncludedNegativeCount: 0,
    accountId: '',
    accountType: '',
    accountName: '',
    accountNo: '',
    bankName: '',
  })
}

async function submitSettlement() {
  if (!dialog.transactionNo.trim()) {
    ElMessage.warning('请输入转账流水号')
    return
  }
  dialog.submitting = true
  try {
    const response = await confirmPlatformSettlement({
      ids: selected.value.map((item) => item.id),
      expectedAmount: dialog.totalAmount,
      expectedRecordCount: dialog.recordCount,
      settlementAccountId: dialog.accountId,
      transactionNo: dialog.transactionNo.trim(),
      proof: dialog.proof || undefined,
      remark: dialog.remark.trim() || undefined,
    })
    ElMessage.success(`结算成功，批次号：${response.data}`)
    dialog.visible = false
    await load()
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '确认结算失败')
  } finally {
    dialog.submitting = false
  }
}

onMounted(() => void load())
</script>

<style scoped>
.settlement-page { height: 100%; display: flex; flex-direction: column; }
.mall-table-panel { flex: 1; min-height: 0; }
.settlement-form { margin-top: 18px; }
.negative-alert { margin-top: 12px; }
.account-preview {
  margin-top: 12px;
  padding: 14px 16px;
  color: #303133;
  line-height: 1.9;
  background: #f5f7fa;
}
.account-preview span { color: #909399; }
.positive { color: #24634f; }
.negative { color: #b6403a; }
</style>
