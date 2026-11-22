<template>
  <div class="mall-page merchant-coupon-page">
    <CouponPageTabs :active="mode" />

    <section class="mall-filter-panel">
      <el-form :inline="true" class="mall-query-form" @submit.prevent="handleSearch">
        <div class="mc-filter-fields">
          <el-form-item label="优惠券">
            <el-select v-model="draft.couponId" class="mc-coupon-select" filterable clearable placeholder="全部优惠券">
              <el-option label="全部优惠券" value="" />
              <el-option v-for="coupon in couponOptions" :key="coupon.id" :label="coupon.name" :value="coupon.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="会员">
            <el-input
              v-model="draft.memberKeyword"
              class="mc-member-input"
              clearable
              placeholder="昵称、账号或手机号"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
        </div>
        <el-form-item class="mall-query-actions">
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="primary" native-type="submit">
            <el-icon><Search /></el-icon>查询
          </el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="mall-table-panel">
      <el-table :data-ym-table="tableId" v-loading="loading" :data="records" row-key="id" style="width: 100%">
        <template v-if="isUsage">
          <el-table-column label="会员" min-width="190" align="center" header-align="center">
            <template #default="{ row }">
              <div class="mc-member-cell">
                <span class="mc-avatar">{{ avatarText(row) }}</span>
                <span class="mc-member-info">
                  <b>{{ row.memberName || '—' }}</b>
                  <small>{{ memberSub(row) }}</small>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="优惠券" min-width="220" align="center" header-align="center">
            <template #default="{ row }">
              <div class="mc-record-coupon-cell">
                <b class="mc-record-coupon" :title="row.couponName">{{ row.couponName || '—' }}</b>
                <small class="cell-sub">{{ `${typeText(row.couponType)} · ${valueText(row)}` }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="关联订单" min-width="220" align="center" header-align="center">
            <template #default="{ row }">
              <b v-if="row.orderNo" class="mc-order-no">
                <CopyableText :value="row.orderNo" label="订单编号" />
              </b>
              <span v-else class="mc-muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="订单金额" min-width="105" align="center" header-align="center">
            <template #default="{ row }">
              <span class="mono">{{ money(row.orderAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="优惠金额" min-width="105" align="center" header-align="center">
            <template #default="{ row }">
              <span class="mono amount-strong">-{{ money(row.discountAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="使用时间" min-width="160" align="center" header-align="center">
            <template #default="{ row }">{{ formatDateTime(row.useTime) || '—' }}</template>
          </el-table-column>
          <el-table-column label="领取渠道" min-width="110" align="center" header-align="center">
            <template #default="{ row }">
              <div class="mc-channel-cell">
                <span>{{ channelText(row) }}</span>
                <small v-if="row.sourcePointsOrderNo" class="cell-sub">{{ row.sourcePointsOrderNo }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="70" fixed="right" align="center" header-align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </template>

        <template v-else>
          <el-table-column label="会员" min-width="188" align="center" header-align="center">
            <template #default="{ row }">
              <div class="mc-member-cell">
                <span class="mc-avatar">{{ avatarText(row) }}</span>
                <span class="mc-member-info">
                  <b>{{ row.memberName || '—' }}</b>
                  <small>{{ memberSub(row) }}</small>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="优惠券" min-width="220" align="center" header-align="center">
            <template #default="{ row }">
              <div class="mc-record-coupon-cell">
                <b class="mc-record-coupon" :title="row.couponName">{{ row.couponName || '—' }}</b>
                <small class="cell-sub">{{ typeText(row.couponType) }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="优惠内容" min-width="120" align="center" header-align="center">
            <template #default="{ row }">
              <div class="mc-value-cell">
                <b class="mc-value small">{{ valueText(row) }}</b>
                <small>{{ conditionText(row) }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="领取时间" min-width="150" align="center" header-align="center">
            <template #default="{ row }">{{ formatDateTime(row.createTime) || '—' }}</template>
          </el-table-column>
          <el-table-column label="使用状态" min-width="125" align="center" header-align="center">
            <template #default="{ row }">
              <div class="mc-status-cell">
                <span class="status-ticket" :class="`tone-${statusTone(row)}`">{{ statusText(row) }}</span>
                <small v-if="row.useTime" class="cell-sub">{{ formatDateTime(row.useTime) }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="关联订单" min-width="200" align="center" header-align="center">
            <template #default="{ row }">
              <div v-if="row.orderNo" class="mc-order-cell">
                <b class="mc-order-no">
                  <CopyableText :value="row.orderNo" label="订单编号" />
                </b>
                <small class="cell-sub">订单 {{ money(row.orderAmount) }} · 优惠 {{ money(row.discountAmount) }}</small>
              </div>
              <span v-else class="mc-muted">未关联订单</span>
            </template>
          </el-table-column>
          <el-table-column label="领取渠道" min-width="115" align="center" header-align="center">
            <template #default="{ row }">
              <div class="mc-channel-cell">
                <span>{{ channelText(row) }}</span>
                <small v-if="row.sourcePointsOrderNo" class="cell-sub">{{ row.sourcePointsOrderNo }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="70" fixed="right" align="center" header-align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </template>

        <template #empty>
          <div class="mc-empty">
            <el-icon :size="28"><Ticket /></el-icon>
            <b>{{ isUsage ? '没有匹配的使用记录' : '没有匹配的领取记录' }}</b>
            <span>调整优惠券或会员条件后重新查询</span>
          </div>
        </template>
      </el-table>

      <MallPagination
        :total="pagination.total"
        :page="pagination.current"
        :limit="pagination.pageSize"
        @pagination="changePage"
      />
    </section>

    <el-drawer v-model="detail.visible" size="680px" class="mc-record-drawer" append-to-body>
      <template #header>
        <div class="mc-drawer-head">
          <span>{{ isUsage ? 'REDEEM RECORD' : 'RECEIVE RECORD' }}</span>
          <h2>{{ isUsage ? '使用记录详情' : '领取记录详情' }}</h2>
        </div>
      </template>
      <template v-if="detail.record">
        <div class="mc-detail-heading">
          <div>
            <span>优惠券</span>
            <b>{{ detail.record.couponName || '—' }}</b>
          </div>
          <span class="status-ticket" :class="`tone-${statusTone(detail.record)}`">{{ statusText(detail.record) }}</span>
        </div>

        <div class="drawer-section">
          <h3>会员信息</h3>
          <div class="description-grid">
            <div><span>会员昵称</span><b>{{ detail.record.memberName || '—' }}</b></div>
            <div><span>会员账号</span><b>{{ detail.record.memberAccount || '—' }}</b></div>
            <div><span>手机号</span><b class="mono">{{ maskMobile(detail.record.memberMobile) }}</b></div>
            <div><span>领取渠道</span><b>{{ channelText(detail.record) }}</b></div>
          </div>
        </div>

        <div class="drawer-section">
          <h3>优惠券信息</h3>
          <div class="description-grid">
            <div><span>优惠券类型</span><b>{{ typeText(detail.record.couponType) }}</b></div>
            <div><span>优惠内容</span><b>{{ valueText(detail.record) }}</b></div>
            <div><span>使用门槛</span><b>{{ conditionText(detail.record) }}</b></div>
            <div><span>使用范围</span><b>{{ scopeText(detail.record) }}</b></div>
            <div class="wide">
              <span>有效期</span>
              <b>{{ shortDate(detail.record.beginTime) || '—' }} 至 {{ shortDate(detail.record.endTime) || '—' }}</b>
            </div>
          </div>
        </div>

        <div class="drawer-section">
          <h3>领取信息</h3>
          <div class="description-grid">
            <div><span>领取时间</span><b>{{ formatDateTime(detail.record.createTime) || '—' }}</b></div>
            <div><span>领取渠道</span><b>{{ channelText(detail.record) }}</b></div>
            <div v-if="detail.record.sourcePointsOrderNo" class="wide">
              <span>来源积分兑换单</span><b class="mono">{{ detail.record.sourcePointsOrderNo }}</b>
            </div>
          </div>
        </div>

        <div class="drawer-section">
          <h3>使用信息</h3>
          <div class="description-grid">
            <div class="mc-detail-status">
              <span>使用状态</span>
              <b class="status-ticket" :class="`tone-${statusTone(detail.record)}`">{{ statusText(detail.record) }}</b>
            </div>
            <div><span>使用时间</span><b>{{ formatDateTime(detail.record.useTime) || '—' }}</b></div>
            <div><span>关联订单</span><b class="mono">{{ detail.record.orderNo || '—' }}</b></div>
            <div><span>订单金额</span><b>{{ detail.record.orderNo ? money(detail.record.orderAmount) : '—' }}</b></div>
            <div><span>优惠金额</span><b>{{ detail.record.orderNo ? `-${money(detail.record.discountAmount)}` : '—' }}</b></div>
            <div><span>订单实付</span><b>{{ detail.record.orderNo ? money(Number(detail.record.orderAmount || 0) - Number(detail.record.discountAmount || 0)) : '—' }}</b></div>
          </div>
        </div>

        <div class="drawer-actions">
          <el-button @click="detail.visible = false">关闭</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Ticket } from '@element-plus/icons-vue'
import { getCurrentShop } from '@/utils/shop'
import { getMchCouponDetail, getMchCouponList, queryMchCouponRecord } from '@/api/mall/mchCoupon'
import CopyableText from '@/components/mall/CopyableText.vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import CouponPageTabs from './CouponPageTabs.vue'
import '@/assets/yeah-mall-coupon.css'

const props = defineProps({
  mode: {
    type: String,
    required: true,
  },
})

const TYPE_TEXT = { 1: '满减券', 2: '折扣券', 3: '无门槛券' }
const RANGE_TEXT = { 1: '店铺通用', 2: '指定商品', 3: '指定分类' }
const STATUS_TEXT = { 0: '未使用', 1: '已使用', 2: '已过期' }
const STATUS_TONE = { 0: 'warning', 1: 'success', 2: 'neutral' }
const CHANNEL_TEXT = { 1: '普通领取', 2: '积分兑换' }

const route = useRoute()
const isUsage = computed(() => props.mode === 'usage')
const tableId = computed(() => (isUsage.value ? 'r79' : 'r78'))

const loading = ref(false)
const records = ref([])
const couponOptions = ref([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })

function initialCouponId() {
  const value = route.query.couponId
  return String(Array.isArray(value) ? value[0] || '' : value || '')
}

const emptyDraft = () => ({ couponId: initialCouponId(), memberKeyword: '' })
const draft = reactive(emptyDraft())
const query = reactive(emptyDraft())
const detail = reactive({ visible: false, record: null })

const shopId = () => getCurrentShop()?.id

function toTime(value) {
  if (!value) return 0
  const parsed = new Date(String(value).replace(' ', 'T')).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatDateTime(value) {
  return value ? String(value).replace('T', ' ').slice(0, 19) : ''
}

function shortDate(value) {
  return formatDateTime(value).slice(0, 10)
}

function money(value) {
  return `¥${Number(value || 0).toFixed(2)}`
}

function typeText(type) {
  return TYPE_TEXT[Number(type)] || '—'
}

function rangeText(range) {
  return RANGE_TEXT[Number(range)] || '—'
}

function channelText(row) {
  return row.receiveChannelName || CHANNEL_TEXT[Number(row.receiveChannel)] || '—'
}

function conditionText(row) {
  if (Number(row.couponType) === 3) return '无门槛'
  return Number(row.minAmount || 0) > 0 ? `满 ¥${Number(row.minAmount)} 可用` : '无门槛'
}

function valueText(row) {
  if (Number(row.couponType) === 2) return `${Number(row.couponValue || 0)} 折`
  return `¥${Number(row.couponValue || 0)}`
}

function scopeText(row) {
  const range = Number(row.useRange)
  if (range === 1) return rangeText(range)
  return row.targetName ? `${rangeText(range)} · ${row.targetName}` : rangeText(range)
}

function statusOf(row) {
  if (row.status !== null && row.status !== undefined && row.status !== '') return Number(row.status)
  if (row.useTime) return 1
  const end = toTime(row.endTime)
  return end && Date.now() > end ? 2 : 0
}

function statusText(row) {
  return STATUS_TEXT[statusOf(row)] || '—'
}

function statusTone(row) {
  return STATUS_TONE[statusOf(row)] || 'neutral'
}

function avatarText(row) {
  return Array.from(String(row.memberName || '—'))[0] || '—'
}

function maskMobile(value) {
  const mobile = String(value || '').trim()
  if (!mobile) return '—'
  return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}

function memberSub(row) {
  return [row.memberAccount, maskMobile(row.memberMobile)].filter((item) => item && item !== '—').join(' · ') || '—'
}

function mergeCouponOption(id, name) {
  const couponId = String(id || '')
  if (!couponId || !name) return
  if (couponOptions.value.some((item) => item.id === couponId)) return
  couponOptions.value = [...couponOptions.value, { id: couponId, name }]
}

async function loadCouponOptions() {
  const currentShopId = shopId()
  if (!currentShopId) return
  try {
    const result = await getMchCouponList({
      shopId: currentShopId,
      conditions_: 'createTime:sort:desc',
      current: 1,
      size: 200,
    })
    const options = (result.data?.records || []).map((item) => ({ id: String(item.id), name: item.name }))
    options.forEach((item) => mergeCouponOption(item.id, item.name))
    if (draft.couponId && !couponOptions.value.some((item) => item.id === draft.couponId)) {
      try {
        const response = await getMchCouponDetail(draft.couponId)
        if (response.data) mergeCouponOption(response.data.id, response.data.name)
      } catch {
        // 深链优惠券可能已删除，保留筛选条件但不再补下拉项。
      }
    }
  } catch {
    // 下拉加载失败不阻塞记录查询，接口层已提示错误。
  }
}

async function load(reset = false) {
  const currentShopId = shopId()
  if (!currentShopId) {
    ElMessage.warning('请先选择店铺')
    return
  }
  if (reset) pagination.current = 1
  loading.value = true
  try {
    const result = await queryMchCouponRecord({
      shopId: currentShopId,
      current: pagination.current,
      size: pagination.pageSize,
      couponId: query.couponId || undefined,
      memberKeyword: query.memberKeyword || undefined,
      status: isUsage.value ? 1 : undefined,
    })
    records.value = result.data?.records || []
    pagination.total = Number(result.data?.total || 0)
    records.value.forEach((row) => mergeCouponOption(row.couponId, row.couponName))
  } catch {
    // 接口层已统一提示错误。
  } finally {
    loading.value = false
  }
}

function applyDraft() {
  query.couponId = draft.couponId
  query.memberKeyword = draft.memberKeyword.trim()
}

function handleSearch() {
  applyDraft()
  load(true)
}

function resetQuery() {
  Object.assign(draft, { couponId: '', memberKeyword: '' })
  Object.assign(query, { couponId: '', memberKeyword: '' })
  load(true)
}

function changePage(payload) {
  pagination.current = payload.page
  pagination.pageSize = payload.limit
  load()
}

function openDetail(row) {
  detail.record = row
  detail.visible = true
}

watch(
  () => route.query.couponId,
  (value) => {
    const couponId = String(Array.isArray(value) ? value[0] || '' : value || '')
    if (couponId === query.couponId) return
    draft.couponId = couponId
    query.couponId = couponId
    detail.visible = false
    load(true)
    if (couponId) {
      getMchCouponDetail(couponId)
        .then((response) => {
          if (response.data) mergeCouponOption(response.data.id, response.data.name)
        })
        .catch(() => {})
    }
  },
)

onMounted(() => {
  loadCouponOptions()
  load()
})
</script>