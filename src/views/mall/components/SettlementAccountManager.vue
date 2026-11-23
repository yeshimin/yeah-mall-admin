<template>
  <div class="settlement-page mall-page">
    <section class="mall-filter-panel">
      <div class="settlement-filter-query">
        <el-form :inline="true" :model="filters" class="mall-query-form" @submit.prevent="search">
          <el-form-item label="店铺">
            <el-select v-model="filters.shopId" clearable placeholder="全部店铺">
              <el-option
                v-for="shop in shopOptions"
                :key="shop.id"
                :label="shop.shopName"
                :value="String(shop.id)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="账户关键词">
            <el-input v-model="filters.keyword" clearable placeholder="收款名称、账号或开户银行" />
          </el-form-item>
          <el-form-item label="审核状态">
            <el-select v-model="filters.status" clearable placeholder="全部状态">
              <el-option label="待审核" value="1" />
              <el-option label="已通过" value="2" />
              <el-option label="已拒绝" value="3" />
            </el-select>
          </el-form-item>
        </el-form>
        <div class="settlement-filter-actions">
          <el-button @click="reset">重置</el-button>
          <el-button type="primary" icon="Search" @click="search">查询</el-button>
        </div>
      </div>
    </section>

    <section class="mall-table-panel">
      <el-table
        class="settlement-account-table"
        data-ym-table="r4"
        v-loading="loading"
        :data="records"
        height="100%"
      >
        <el-table-column label="店铺" min-width="116" class-name="settlement-col-shop">
          <template #default="{ row }">
            <span class="settlement-shop-cell">
              <b>{{ row.shopName || shopNameMap.get(String(row.shopId)) || '未知店铺' }}</b>
              <small>ID {{ row.shopId }}</small>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="账户类型" min-width="80" class-name="settlement-col-type">
          <template #default="{ row }">{{ accountTypeText(row.accountType) }}</template>
        </el-table-column>
        <el-table-column label="收款名称" min-width="158" class-name="settlement-col-name">
          <template #default="{ row }">
            <CopyableText :value="row.accountName" label="收款名称" />
          </template>
        </el-table-column>
        <el-table-column label="收款账号" min-width="124" class-name="settlement-col-account">
          <template #default="{ row }">
            <span class="settlement-mono">
              <CopyableText :value="row.accountNo" label="收款账号" />
            </span>
          </template>
        </el-table-column>
        <el-table-column label="开户银行" min-width="122" class-name="settlement-col-bank">
          <template #default="{ row }">{{ row.bankName || '-' }}</template>
        </el-table-column>
        <el-table-column label="审核状态" min-width="82" class-name="settlement-col-status">
          <template #default="{ row }">
            <el-tag class="settlement-status-tag" :type="statusType(row.status)" effect="light">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="142" class-name="settlement-col-remark">
          <template #default="{ row }">{{ row.auditRemark || '-' }}</template>
        </el-table-column>
        <el-table-column label="提交时间" min-width="100" class-name="settlement-col-time">
          <template #default="{ row }">
            <span class="settlement-cell-stack">
              <span>{{ dateTimeDate(row.createTime) }}</span>
              <small v-if="dateTimeClock(row.createTime)" class="settlement-cell-sub">
                {{ dateTimeClock(row.createTime) }}
              </small>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="审核时间" min-width="100" class-name="settlement-col-time">
          <template #default="{ row }">
            <span class="settlement-cell-stack">
              <span>{{ dateTimeDate(row.auditTime) }}</span>
              <small v-if="dateTimeClock(row.auditTime)" class="settlement-cell-sub">
                {{ dateTimeClock(row.auditTime) }}
              </small>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="58" fixed="right" class-name="settlement-col-actions">
          <template #default="{ row }">
            <el-button link type="primary" @click="openAudit(row)">
              {{ row.status === '1' ? '审核' : '查看' }}
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="settlement-empty">
            <el-icon><Filter /></el-icon>
            <b>没有匹配的结算账户</b>
            <span>调整店铺或审核状态后重试</span>
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
          <span>ACCOUNT AUDIT</span>
          <h2>结算账户审核</h2>
        </div>
      </template>
      <div class="settlement-description">
        <div>
          <span>店铺</span>
          <b>
            {{ dialog.record?.shopName || shopNameMap.get(String(dialog.record?.shopId)) || '未知店铺' }}
            · ID {{ dialog.record?.shopId }}
          </b>
        </div>
        <div>
          <span>审核状态</span>
          <b>
            <el-tag class="settlement-status-tag" :type="statusType(dialog.record?.status || '')" effect="light">
              {{ statusText(dialog.record?.status || '') }}
            </el-tag>
          </b>
        </div>
        <div><span>账户类型</span><b>{{ accountTypeText(dialog.record?.accountType) }}</b></div>
        <div><span>收款名称</span><b>{{ dialog.record?.accountName || '-' }}</b></div>
        <div><span>收款账号</span><b>{{ dialog.record?.accountNo || '-' }}</b></div>
        <div><span>开户银行</span><b>{{ dialog.record?.bankName || '-' }}</b></div>
        <div><span>提交时间</span><b>{{ dateTimeText(dialog.record?.createTime) }}</b></div>
        <div><span>审核时间</span><b>{{ dateTimeText(dialog.record?.auditTime) }}</b></div>
      </div>
      <el-form v-if="dialog.record?.status === '1'" label-position="top" require-asterisk-position="right">
        <el-form-item>
          <template #label>审核备注 <small class="settlement-field-hint">拒绝时必填</small></template>
          <el-input
            v-model="dialog.remark"
            type="textarea"
            :rows="3"
            maxlength="255"
            placeholder="填写审核说明或拒绝原因"
          />
        </el-form-item>
      </el-form>
      <div v-else class="settlement-audit-readonly">
        <span>审核备注</span>
        <b>{{ dialog.record?.auditRemark || '-' }}</b>
      </div>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Filter } from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import { queryShops } from '@/api/mall/platform'
import {
  auditPlatformSettlementAccount,
  getPlatformSettlementAccount,
  queryPlatformSettlementAccounts,
  type SettlementAccountRecord,
} from '@/api/mall/settlement'
import type { ShopRecord } from '@/types/mall'
import { getRequestErrorMessage } from '@/utils/error'

const loading = ref(false)
const records = ref<SettlementAccountRecord[]>([])
const shopOptions = ref<ShopRecord[]>([])
const filters = reactive({ shopId: '', keyword: '', status: '' })
const page = reactive({ current: 1, size: 10, total: 0 })
const dialog = reactive({
  visible: false,
  submitting: false,
  record: undefined as SettlementAccountRecord | undefined,
  remark: '',
})

const shopNameMap = computed(() => {
  const map = new Map<string, string>()
  for (const shop of shopOptions.value) {
    map.set(String(shop.id), shop.shopName)
  }
  return map
})

function accountTypeText(value?: string) {
  return value === '1' ? '银行卡' : value === '2' ? '支付宝' : '-'
}

function statusText(status: string) {
  return ({ '1': '待审核', '2': '已通过', '3': '已拒绝' } as Record<string, string>)[status] || '未知'
}

function statusType(status: string) {
  return status === '2' ? 'success' : status === '3' ? 'danger' : 'warning'
}

function dateTimeText(value?: string) {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 16)
}

function dateTimeDate(value?: string) {
  if (!value) return '-'
  return dateTimeText(value).slice(0, 10)
}

function dateTimeClock(value?: string) {
  if (!value) return ''
  return dateTimeText(value).slice(11)
}

async function loadShopOptions() {
  try {
    const response = await queryShops({ current: 1, size: 500 })
    shopOptions.value = response.data?.records || []
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载店铺列表失败')
  }
}

async function load() {
  loading.value = true
  try {
    const response = await queryPlatformSettlementAccounts({
      current: page.current,
      size: page.size,
      shopId: filters.shopId || undefined,
      keyword: filters.keyword.trim() || undefined,
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
  Object.assign(filters, { shopId: '', keyword: '', status: '' })
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
    dialog.record = {
      ...response.data,
      shopName: response.data?.shopName || row.shopName,
      shopNo: response.data?.shopNo || row.shopNo,
    }
    dialog.remark = ''
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

onMounted(async () => {
  await loadShopOptions()
  await load()
})
</script>