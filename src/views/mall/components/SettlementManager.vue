<template>
  <div class="settlement-page mall-page">
    <section class="settlement-kpis">
      <article class="settlement-kpi is-pending">
        <span>待结算净额</span>
        <b>{{ money(stats.pendingAmount) }}</b>
        <small>{{ stats.pendingCount }} 笔 · {{ stats.availableCount }} 笔已到可结算时间</small>
      </article>
      <article class="settlement-kpi is-available">
        <span>到期可结算</span>
        <b>{{ money(stats.availableAmount) }}</b>
        <small>按店铺分别发起，自动纳入到期负记录</small>
      </article>
      <article class="settlement-kpi is-settled">
        <span>累计已结算</span>
        <b>{{ money(stats.settledAmount) }}</b>
        <small>{{ stats.settledCount }} 笔已完成线下打款</small>
      </article>
      <article class="settlement-kpi is-canceled">
        <span>已取消记录</span>
        <b>{{ stats.canceledCount }} 笔</b>
        <small>已取消记录不可参与线下结算</small>
      </article>
    </section>

    <section class="mall-filter-panel">
      <div class="settlement-filter-query">
        <el-form :inline="true" :model="filters" class="mall-query-form" @submit.prevent="search">
          <el-form-item v-if="scope === 'platform'" label="店铺">
            <el-select v-model="filters.shopId" clearable placeholder="全部店铺">
              <el-option
                v-for="shop in shopOptions"
                :key="shop.id"
                :label="shop.shopName"
                :value="String(shop.id)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="订单编号">
            <el-input v-model="filters.orderNo" clearable placeholder="搜索订单编号" />
          </el-form-item>
          <el-form-item label="业务类型">
            <el-select v-model="filters.bizType" clearable placeholder="全部业务">
              <el-option label="订单收入" value="1" />
              <el-option label="退款冲减" value="2" />
              <el-option label="人工调整" value="3" />
            </el-select>
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
        </el-form>
        <div class="settlement-filter-actions">
          <el-button @click="reset">重置</el-button>
          <el-button type="primary" icon="Search" @click="search">查询</el-button>
        </div>
      </div>
      <div class="mall-business-actions settlement-business-actions">
        <el-button
          v-if="scope === 'platform'"
          type="primary"
          :loading="dialog.previewing"
          :disabled="selected.length === 0"
          @click="openSettleDialog"
        >
          确认线下打款
        </el-button>
        <span v-else class="settlement-scope-note">当前店铺 · {{ merchantShopName || '未选择店铺' }}</span>
      </div>
    </section>

    <div v-if="scope === 'platform'" class="settlement-batch-guide">
      <el-icon><Warning /></el-icon>
      <span>一次只能结算同一家店铺；选中收入记录后，系统会自动纳入该店铺已到期的退款冲减记录，最终净额以结算预览为准。</span>
    </div>

    <section class="mall-table-panel">
      <el-table
        ref="tableRef"
        class="settlement-ledger-table"
        :data-ym-table="scope === 'platform' ? 'r5' : 'r5m'"
        v-loading="loading"
        :data="records"
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          v-if="scope === 'platform'"
          type="selection"
          width="48"
          :selectable="isRowSelectable"
        />
        <el-table-column label="订单编号" min-width="142" class-name="settlement-col-order">
          <template #default="{ row }">
            <b class="settlement-mono"><CopyableText :value="row.orderNo" label="订单编号" /></b>
          </template>
        </el-table-column>
        <el-table-column v-if="scope === 'platform'" label="店铺" min-width="116" class-name="settlement-col-shop">
          <template #default="{ row }">
            <span class="settlement-shop-cell">
              <b>{{ row.shopName || shopNameMap.get(String(row.shopId)) || '未知店铺' }}</b>
              <small>ID {{ row.shopId }}</small>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="业务类型" min-width="78" class-name="settlement-col-biz">
          <template #default="{ row }">{{ bizTypeText(row.bizType) }}</template>
        </el-table-column>
        <el-table-column label="实际支付" min-width="92" class-name="settlement-col-amount">
          <template #default="{ row }">{{ money(row.grossAmount) }}</template>
        </el-table-column>
        <el-table-column label="平台佣金" min-width="100" class-name="settlement-col-rate">
          <template #default="{ row }">
            <span class="settlement-cell-stack">
              <span>{{ money(row.commissionAmount) }}</span>
              <small class="settlement-cell-sub">费率 {{ Number(row.commissionRate || 0) }}%</small>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="结算变动" min-width="98" class-name="settlement-col-change">
          <template #default="{ row }">
            <span :class="Number(row.amount) < 0 ? 'negative-amount' : 'positive-amount'">
              {{ signedMoney(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="可结算时间" min-width="100" class-name="settlement-col-time">
          <template #default="{ row }">
            <span class="settlement-cell-stack">
              <span>{{ dateText(row.availableTime) }}</span>
              <small v-if="timeText(row.availableTime)" class="settlement-cell-sub">{{ timeText(row.availableTime) }}</small>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="92" class-name="settlement-col-status">
          <template #default="{ row }">
            <span class="settlement-cell-stack">
              <el-tag class="settlement-status-tag" :type="statusType(row.status)" effect="light">
                {{ statusText(row.status) }}
              </el-tag>
              <small v-if="row.status === '2' && row.settledTime" class="settlement-cell-sub">
                {{ dateText(row.settledTime) }}
              </small>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="结算信息" min-width="154" class-name="settlement-col-settle">
          <template #default="{ row }">
            <span v-if="!row.settlementNo && !row.transactionNo && !row.proof" class="settlement-info">-</span>
            <span v-else class="settlement-info">
              <span v-if="row.settlementNo" class="settlement-mono">
                <CopyableText :value="row.settlementNo" label="结算批次" />
              </span>
              <small v-if="row.transactionNo" class="settlement-cell-sub">流水 {{ row.transactionNo }}</small>
              <span v-if="row.proof" class="settlement-proof-chip">凭证</span>
            </span>
          </template>
        </el-table-column>
        <template #empty>
          <div class="settlement-empty">
            <el-icon><Filter /></el-icon>
            <b>没有匹配的结算记录</b>
            <span>调整店铺、业务类型或状态筛选后重试</span>
          </div>
        </template>
      </el-table>
      <MallPagination
        variant="admin"
        :total="page.total"
        :page="page.current"
        :limit="page.size"
        @pagination="changePage"
      />
    </section>

    <el-dialog
      v-model="dialog.visible"
      width="580px"
      class="settlement-dialog"
      @closed="resetDialog"
    >
      <template #header>
        <div class="settlement-dialog-head">
          <span>OFFLINE SETTLEMENT</span>
          <h2>确认线下打款</h2>
        </div>
      </template>
      <div class="settlement-summary">
        <span>
          本次结算 {{ selected.length }} 条记录
          <template v-if="dialog.autoIncludedNegativeCount">
            · 自动纳入 {{ dialog.autoIncludedNegativeCount }} 条负记录
          </template>
        </span>
        <b>净额 {{ money(dialog.totalAmount) }}</b>
      </div>
      <div v-if="dialog.autoIncludedNegativeCount" class="settlement-auto-include">
        <el-icon><Warning /></el-icon>
        <span>已自动纳入 {{ dialog.autoIncludedNegativeCount }} 条到期退款 / 冲减记录，最终净额以系统预览为准。</span>
      </div>
      <div v-if="!dialog.accountId" class="settlement-auto-include is-danger">
        <el-icon><Warning /></el-icon>
        <span>店铺尚未配置已审核通过的结算账户，暂不可打款。</span>
      </div>
      <div v-if="dialog.accountId" class="settlement-description">
        <div><span>店铺</span><b>{{ dialog.shopName || '-' }}</b></div>
        <div><span>收款方式</span><b>{{ accountTypeText(dialog.accountType) }}</b></div>
        <div><span>收款名称</span><b>{{ dialog.accountName || '-' }}</b></div>
        <div><span>收款账号</span><b>{{ dialog.accountNo || '-' }}</b></div>
        <div class="wide"><span>开户银行</span><b>{{ dialog.bankName || '-' }}</b></div>
        <div class="wide"><span>纳入记录</span><b>{{ dialog.recordCount }} 笔，合计 {{ money(dialog.totalAmount) }}</b></div>
      </div>
      <el-form label-position="top" require-asterisk-position="right">
        <el-form-item label="转账流水号" required>
          <el-input v-model="dialog.transactionNo" maxlength="64" placeholder="请输入银行或第三方转账流水号" />
        </el-form-item>
        <el-form-item label="打款凭证">
          <StorageFileUpload
            v-model="dialog.proof"
            :file-type="imageTypes"
            :file-size="5"
            empty-text="上传图片"
            filled-text="重新上传凭证"
          />
        </el-form-item>
        <el-form-item>
          <template #label>备注 <small class="settlement-field-hint">选填</small></template>
          <el-input v-model="dialog.remark" type="textarea" :rows="3" maxlength="255" placeholder="补充本次结算说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="dialog.submitting" @click="dialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="dialog.submitting"
          :disabled="!dialog.accountId || dialog.totalAmount <= 0"
          @click="submitSettlement"
        >
          确认已打款
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { TableInstance } from 'element-plus'
import { Filter, Warning } from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import StorageFileUpload from '@/components/mall/StorageFileUpload.vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import { queryShops } from '@/api/mall/platform'
import {
  confirmPlatformSettlement,
  previewPlatformSettlement,
  queryMerchantSettlementStats,
  queryMerchantSettlements,
  queryPlatformSettlementStats,
  queryPlatformSettlements,
  type SettlementPreview,
  type SettlementRecord,
  type SettlementStats,
} from '@/api/mall/settlement'
import type { ShopRecord } from '@/types/mall'
import { getCurrentShop, SHOP_CONTEXT_CHANGED } from '@/utils/shop'
import { getRequestErrorMessage } from '@/utils/error'

const props = defineProps<{ scope: 'platform' | 'merchant' }>()
const imageTypes = ['jpg', 'jpeg', 'png', 'webp']

const tableRef = ref<TableInstance>()
const loading = ref(false)
const records = ref<SettlementRecord[]>([])
const selected = ref<SettlementRecord[]>([])
const shopOptions = ref<ShopRecord[]>([])
const merchantShopName = ref('')
const stats = ref<SettlementStats>(emptyStats())
const filters = reactive({ shopId: '', orderNo: '', bizType: '', status: '', settlementNo: '' })
const page = reactive({ current: 1, size: 10, total: 0 })
const dialog = reactive({
  visible: false,
  previewing: false,
  submitting: false,
  transactionNo: '',
  proof: '',
  remark: '',
  shopName: '',
  totalAmount: 0,
  recordCount: 0,
  autoIncludedNegativeCount: 0,
  accountId: '',
  accountType: '',
  accountName: '',
  accountNo: '',
  bankName: '',
})

const shopNameMap = computed(() => {
  const map = new Map<string, string>()
  for (const shop of shopOptions.value) {
    map.set(String(shop.id), shop.shopName)
  }
  return map
})

function emptyStats(): SettlementStats {
  return {
    pendingAmount: 0,
    pendingCount: 0,
    availableAmount: 0,
    availableCount: 0,
    settledAmount: 0,
    settledCount: 0,
    canceledCount: 0,
  }
}

function money(value: unknown) {
  return `¥${Number(value || 0).toFixed(2)}`
}

function signedMoney(value: unknown) {
  const amount = Number(value || 0)
  return `${amount > 0 ? '+' : ''}${money(amount)}`
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

function accountTypeText(value: string) {
  return value === '1' ? '银行卡' : value === '2' ? '支付宝' : '-'
}

function dateText(value?: string) {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 10)
}

function timeText(value?: string) {
  if (!value) return ''
  return value.replace('T', ' ').slice(11, 19)
}

function isDue(row: SettlementRecord) {
  return !row.availableTime || new Date(row.availableTime).getTime() <= Date.now()
}

function isRowSelectable(row: SettlementRecord) {
  if (row.status !== '1' || !isDue(row)) return false
  if (!selected.value.length) return true
  return selected.value[0]?.shopId === row.shopId
}

function handleSelectionChange(rows: SettlementRecord[]) {
  const shopId = rows[0]?.shopId
  if (shopId && rows.some((row) => row.shopId !== shopId)) {
    tableRef.value?.clearSelection()
    selected.value = []
    ElMessage.warning('一次只能结算同一家店铺的记录，请先取消其他店铺的选择')
    return
  }
  selected.value = rows
}

async function loadShopOptions() {
  try {
    const response = await queryShops({ current: 1, size: 500 })
    shopOptions.value = response.data?.records || []
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载店铺列表失败')
  }
}

function scopedShopId() {
  return props.scope === 'merchant' ? getCurrentShop()?.id : filters.shopId
}

function baseParams(shopId?: string) {
  return {
    shopId: shopId || undefined,
    orderNo: filters.orderNo || undefined,
    bizType: filters.bizType || undefined,
    settlementNo: filters.settlementNo || undefined,
  }
}

async function load() {
  const shopId = scopedShopId()
  if (props.scope === 'merchant') {
    merchantShopName.value = getCurrentShop()?.name || ''
  }
  if (props.scope === 'merchant' && !shopId) {
    records.value = []
    page.total = 0
    stats.value = emptyStats()
    selected.value = []
    return
  }
  loading.value = true
  try {
    const listRequest = props.scope === 'platform' ? queryPlatformSettlements : queryMerchantSettlements
    const statsRequest = props.scope === 'platform' ? queryPlatformSettlementStats : queryMerchantSettlementStats
    const [listResponse, statsResponse] = await Promise.all([
      listRequest({
        current: page.current,
        size: page.size,
        ...baseParams(shopId),
        status: filters.status || undefined,
      }),
      statsRequest(baseParams(shopId)),
    ])
    records.value = listResponse.data?.records || []
    page.total = Number(listResponse.data?.total || 0)
    stats.value = statsResponse.data || emptyStats()
    selected.value = []
    await nextTick()
    tableRef.value?.clearSelection()
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
  Object.assign(filters, { shopId: '', orderNo: '', bizType: '', status: '', settlementNo: '' })
  search()
}

function changePage(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
  void load()
}

async function openSettleDialog() {
  if (!selected.value.length) return
  dialog.previewing = true
  try {
    const response = await previewPlatformSettlement(selected.value.map((item) => item.id))
    applyPreview(response.data)
    dialog.shopName = selected.value[0]?.shopName
      || shopNameMap.value.get(String(selected.value[0]?.shopId))
      || `店铺 ID ${selected.value[0]?.shopId || ''}`
    dialog.visible = true
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '预览结算金额失败')
  } finally {
    dialog.previewing = false
  }
}

function applyPreview(preview: SettlementPreview) {
  dialog.totalAmount = Number(preview.totalAmount || 0)
  dialog.recordCount = Number(preview.recordCount || 0)
  dialog.autoIncludedNegativeCount = Number(preview.autoIncludedNegativeCount || 0)
  dialog.accountId = preview.settlementAccountId || ''
  dialog.accountType = preview.settlementAccountType || ''
  dialog.accountName = preview.settlementAccountName || ''
  dialog.accountNo = preview.settlementAccountNo || ''
  dialog.bankName = preview.settlementBankName || ''
}

function resetDialog() {
  Object.assign(dialog, {
    previewing: false,
    submitting: false,
    transactionNo: '',
    proof: '',
    remark: '',
    shopName: '',
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
  if (!dialog.accountId || dialog.totalAmount <= 0) {
    ElMessage.warning('当前结算信息不可提交，请重新预览')
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

function handleShopContextChanged() {
  if (props.scope !== 'merchant') return
  page.current = 1
  void load()
}

onMounted(async () => {
  if (props.scope === 'platform') {
    await loadShopOptions()
  }
  window.addEventListener(SHOP_CONTEXT_CHANGED, handleShopContextChanged)
  await load()
})

onBeforeUnmount(() => {
  window.removeEventListener(SHOP_CONTEXT_CHANGED, handleShopContextChanged)
})
</script>