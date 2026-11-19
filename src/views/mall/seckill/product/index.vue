<template>
  <div class="mall-page seckill-insight-page seckill-product-page">
    <div class="ss-activity-bar">
      <span class="ss-activity-icon"><el-icon><Goods /></el-icon></span>
      <div class="ss-activity-copy">
        <div class="ss-activity-title">
          <h2>{{ activity?.name || (activitiesLoading ? '加载中…' : '暂无秒杀活动') }}</h2>
          <span v-if="activity" class="ss-status-ticket" :class="`tone-${state.tone}`">
            <span class="ss-status-live">
              <i v-if="state.key === 'ongoing'" class="ss-live-dot"></i>{{ state.label }}
            </span>
          </span>
        </div>
        <div class="ss-activity-meta">
          <template v-if="activity">
            <span><el-icon><Lightning /></el-icon>活动 {{ activityRangeText }}</span>
            <span><el-icon><Clock /></el-icon>共 {{ sortedSessions.length }} 个场次</span>
            <span><el-icon><Goods /></el-icon>商品池 {{ pool.length }} 款 · 通过 {{ live.length }} 款</span>
            <span><el-icon><Tickets /></el-icon>投放库存 {{ seckillNumber(stockTotal) }} 件</span>
          </template>
          <span v-else>请先在活动管理中创建秒杀活动，商家报名审核通过后商品会进入这里。</span>
        </div>
      </div>
      <div class="ss-activity-controls">
        <label class="ss-activity-switch">
          <span>切换活动</span>
          <el-select
            :model-value="activityId"
            class="ss-activity-select"
            placeholder="选择活动"
            filterable
            :disabled="activitiesLoading || !activities.length"
            @change="handleActivityChange"
          >
            <el-option
              v-for="item in activities"
              :key="String(item.id)"
              :label="item.name || String(item.id)"
              :value="String(item.id)"
            />
          </el-select>
        </label>
        <button type="button" class="ss-back-link" @click="goBackActivities">
          <el-icon><Back /></el-icon>返回活动管理
        </button>
      </div>
    </div>

    <div class="ss-queue">
      <div class="ss-tabs">
        <button
          v-for="tab in PRODUCT_TABS"
          :key="tab.key"
          type="button"
          :data-status="tab.key"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}<span class="ss-tab-count">{{ counts[tab.key] ?? 0 }}</span>
        </button>
      </div>
      <div class="ss-queue-summary">
        <span><el-icon><Tickets /></el-icon>投放库存 <b>{{ seckillNumber(stockTotal) }}</b> 件</span>
        <span><el-icon><Check /></el-icon>累计销量 <b>{{ seckillNumber(soldTotal) }}</b> 件</span>
      </div>
    </div>

    <section class="mall-filter-panel">
      <el-form :inline="true" class="mall-query-form" @submit.prevent="search">
        <el-form-item label="商品名称">
          <el-input
            v-model="filters.keyword"
            class="sk-filter-name"
            clearable
            placeholder="搜索秒杀商品名称"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="商家 / 店铺">
          <el-input
            v-model="filters.merchant"
            class="sk-filter-party"
            clearable
            placeholder="商家名称或店铺名称"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="所属场次">
          <el-select v-model="filters.sessionId" class="sk-filter-session" placeholder="全部场次">
            <el-option label="全部场次" value="" />
            <el-option
              v-for="item in sortedSessions"
              :key="String(item.id)"
              :label="item.name || String(item.id)"
              :value="String(item.id)"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="mall-query-actions">
          <el-button @click="resetFilters"><el-icon><Refresh /></el-icon>重置</el-button>
          <el-button type="primary" native-type="submit"><el-icon><Search /></el-icon>查询</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="mall-table-panel">
      <div class="ss-table-intro">
        <span>
          <el-icon><component :is="state.key === 'ongoing' ? Lightning : Goods" /></el-icon>
          {{ introText }}
        </span>
        <div class="sa-intro-right">
          <b>筛选 {{ filtered.length }} 条</b>
          <span v-if="(counts.pending ?? 0) > 0" class="sa-pending-chip">待审 {{ counts.pending ?? 0 }}</span>
        </div>
      </div>
      <el-table data-ym-table="r50" v-loading="loading" :data="pagedRows">
        <el-table-column label="秒杀商品" min-width="238" align="center">
          <template #default="{ row }">
            <div class="sa-product-cell">
              <span class="sa-product-art">
                <el-image v-if="row.mainImage" :src="storageUrl(row.mainImage)" fit="cover">
                  <template #error>
                    <span class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                  </template>
                </el-image>
                <span v-else class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
              </span>
              <div class="sa-product-copy">
                <b :title="row.spuName">{{ row.spuName }}</b>
                <small>{{ row.skuCount }} 个 SKU · 报名 {{ row.applyTime ? row.applyTime.slice(0, 10) : '—' }}</small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商家 / 店铺" min-width="130" align="center">
          <template #default="{ row }">
            <div class="sa-party-cell">
              <b :title="row.mchName">{{ row.mchName }}</b>
              <small :title="row.shopName">{{ row.shopName }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="所属场次" min-width="151" align="center">
          <template #default="{ row }">
            <div class="sa-session-cell">
              <b :title="row.session?.name">{{ row.session?.name || '—' }}</b>
              <small>{{ sessionTimeText(row.session) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="秒杀价" min-width="162" align="center">
          <template #default="{ row }">
            <div class="skp-price-cell">
              <b>{{ seckillRange(row.minSeckill, row.maxSeckill) }}</b>
              <small>
                <s>{{ seckillRange(row.minOrigin, row.maxOrigin) }}</s>
                <em>{{ seckillDiscount(row.minSeckill, row.minOrigin) }}</em>
              </small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="投放库存" min-width="108" align="center">
          <template #default="{ row }">
            <div class="skp-stock-cell">
              <b>{{ seckillNumber(row.stock) }} 件</b>
              <small>{{ row.passed ? `剩余 ${seckillNumber(row.remaining)} 件` : '审核通过后投放' }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="销量" min-width="119" align="center">
          <template #default="{ row }">
            <div class="skp-sales-cell">
              <b>{{ row.passed ? seckillNumber(row.sold) : '—' }}</b>
              <small>{{ row.passed ? (row.amount ? seckillAmount(row.amount) : '暂无成交') : '未进入商品池' }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" min-width="97" align="center">
          <template #default="{ row }">
            <span class="ss-status-ticket" :class="`tone-${applyStatusMeta(row.auditStatus).tone}`">
              {{ applyStatusMeta(row.auditStatus).label }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="76" align="right" header-align="center">
          <template #default="{ row }">
            <el-button link type="primary" class="skp-detail-link" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="sa-empty">
            <el-icon><Goods /></el-icon>
            <strong>{{ pool.length ? '没有匹配的秒杀商品' : '当前活动还没有秒杀商品' }}</strong>
            <span>{{ pool.length ? '调整商品名称、商家或场次筛选后重试' : '商家报名并审核通过后，商品会进入这里' }}</span>
          </div>
        </template>
      </el-table>

      <MallPagination
        :total="filtered.length"
        :page="page.current"
        :limit="page.size"
        @pagination="changePage"
      />
    </section>

    <el-dialog
      v-model="dialog.visible"
      width="880px"
      top="4vh"
      class="skp-detail-dialog"
      @closed="resetDialog"
    >
      <template #header>
        <div class="sa-dialog-heading">
          <span>SECKILL PRODUCT</span>
          <h2>秒杀商品详情</h2>
        </div>
      </template>

      <div v-if="dialog.row" v-loading="dialog.loading" class="sa-dialog-content">
        <div class="sa-apply-context">
          <div class="sa-context-item">
            <span>商家 / 店铺</span>
            <b :title="dialog.row.mchName">{{ dialog.row.mchName }}</b>
            <small :title="dialog.row.shopName">{{ dialog.row.shopName }}</small>
          </div>
          <div class="sa-context-item">
            <span>活动 / 场次</span>
            <b :title="activity?.name">{{ activity?.name || dialog.row.raw.activityName || '—' }}</b>
            <small :title="dialogSessionName">{{ dialogSessionName }}</small>
          </div>
          <div class="sa-context-item">
            <span>报名 / 审核时间</span>
            <b>{{ dialogApplyTimeText }}</b>
            <small>{{ dialogAuditTimeLine }}</small>
          </div>
          <div class="sa-context-item">
            <span>审核状态</span>
            <span class="ss-status-ticket" :class="`tone-${dialogStatusMeta.tone}`">
              {{ dialogStatusMeta.label }}
            </span>
            <small>{{ dialogPassed ? '已进入秒杀商品池' : '未进入秒杀商品池' }}</small>
          </div>
        </div>

        <template v-if="dialog.detail">
          <div class="sa-product-panel">
            <span class="sa-product-art large">
              <el-image v-if="dialogImageKey" :src="storageUrl(dialogImageKey)" fit="cover">
                <template #error>
                  <span class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                </template>
              </el-image>
              <span v-else class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
            </span>
            <div class="sa-product-info">
              <h3>{{ dialogProductName }}</h3>
              <p>{{ dialogDescription }}</p>
              <div class="sa-product-tags">
                <span><el-icon><Goods /></el-icon>{{ dialogSkuCount }} 个 SKU</span>
                <span><el-icon><Tickets /></el-icon>投放库存 {{ seckillNumber(dialog.row.stock) }} 件</span>
                <span><el-icon><Coin /></el-icon>{{ seckillDiscount(dialogPrices.minSeckill, dialogPrices.minOrigin) }}</span>
              </div>
            </div>
            <div class="sa-price-panel">
              <span>秒杀价</span>
              <b>{{ seckillRange(dialogPrices.minSeckill, dialogPrices.maxSeckill) }}</b>
              <small>原价 {{ seckillRange(dialogPrices.minOrigin, dialogPrices.maxOrigin) }}</small>
            </div>
          </div>

          <div class="sa-section">
            <div class="sa-section-head">
              <b>成交表现</b>
              <small>{{ dialogPassed ? '仅统计已支付且未关闭的秒杀订单' : '商品未审核通过，暂无成交数据' }}</small>
            </div>
            <div v-if="dialogPassed" class="skp-stat-grid">
              <div class="skp-stat">
                <span>累计销量</span>
                <b>{{ seckillNumber(dialog.row.sold) }} 件</b>
              </div>
              <div class="skp-stat">
                <span>成交金额</span>
                <b class="is-price">{{ seckillAmount(dialog.row.amount) }}</b>
              </div>
              <div class="skp-stat">
                <span>剩余库存</span>
                <b :class="{ 'is-danger': !dialog.row.remaining }">{{ seckillNumber(dialog.row.remaining) }} 件</b>
              </div>
              <div class="skp-stat">
                <span>售罄率</span>
                <b>{{ seckillPercent(dialog.row.sellThrough) }}</b>
                <i class="skp-stat-bar"><em :style="{ width: seckillPercent(dialog.row.sellThrough) }"></em></i>
              </div>
            </div>
            <div v-else class="sa-empty-sku">审核通过后商品才会投放库存并产生成交数据</div>
          </div>

          <div v-if="dialogApplyRemark || dialogAuditRemark" class="sa-apply-note">
            <el-icon><ChatLineSquare /></el-icon>
            <div>
              <b>报名与审核备注</b>
              <p>{{ dialogApplyRemark || '未填写报名备注' }}</p>
              <p v-if="dialogAuditRemark" class="skp-audit-remark">平台审核：{{ dialogAuditRemark }}</p>
            </div>
          </div>

          <div class="sa-section">
            <div class="sa-section-head">
              <b>SKU 信息</b>
              <small>共 {{ dialogSkuCount }} 个规格 · 投放库存 {{ seckillNumber(dialog.row.stock) }} 件</small>
            </div>
            <table v-if="dialogSkuRows.length" class="sa-sku-table">
              <thead>
                <tr>
                  <th>SKU 名称</th>
                  <th>规格编码</th>
                  <th>原价</th>
                  <th>秒杀价</th>
                  <th>库存</th>
                  <th>SKU 图片</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(sku, index) in dialogSkuRows" :key="`${sku.specCode || 'sku'}-${index}`">
                  <td><div class="sa-cb"><b class="sa-sku-name" :title="sku.name">{{ sku.name || '—' }}</b></div></td>
                  <td><div class="sa-cb"><span class="sa-sku-mono">{{ sku.specCode || '—' }}</span></div></td>
                  <td><div class="sa-cb"><span class="sa-sku-origin">{{ seckillMoney(sku.originPrice) }}</span></div></td>
                  <td><div class="sa-cb"><span class="sa-sku-price">{{ seckillMoney(sku.seckillPrice) }}</span></div></td>
                  <td><div class="sa-cb">{{ Number(sku.stock || 0) }} 件</div></td>
                  <td>
                    <div class="sa-cb">
                      <span class="sa-sku-art">
                        <el-image
                          v-if="sku.mainImage || dialogImageKey"
                          :src="storageUrl(sku.mainImage || dialogImageKey)"
                          fit="cover"
                        >
                          <template #error>
                            <span class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                          </template>
                        </el-image>
                        <span v-else class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="sa-empty-sku">暂无 SKU 信息</div>
          </div>

          <div class="sa-section">
            <div class="sa-section-head">
              <b>商品详情</b>
              <small>商家提交的富文本内容 · 只读预览</small>
            </div>
            <div v-if="dialogDetailHasContent" class="sa-richtext-wrap">
              <RichTextEditor :model-value="dialogDetailHtml" :height="260" readonly />
            </div>
            <div v-else class="sa-empty-sku">商家未提交商品详情</div>
          </div>
        </template>

        <div v-else-if="!dialog.loading" class="sa-detail-failed">
          <el-icon><Warning /></el-icon>
          <span>商品详情加载失败，请关闭弹窗后重试。</span>
        </div>
      </div>

      <template #footer>
        <div class="sa-dialog-actions">
          <el-button @click="goAudit">去报名审核</el-button>
          <el-button type="primary" @click="closeDialog">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Back,
  ChatLineSquare,
  Check,
  Clock,
  Coin,
  Goods,
  Lightning,
  Picture,
  Refresh,
  Search,
  Tickets,
  Warning,
} from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import RichTextEditor from '@/components/mall/RichTextEditor.vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { getSeckillSpuDetail, querySeckillSpuList } from '@/api/mall/seckill'
import {
  PRODUCT_TABS,
  applyStatusMeta,
  dateTimeText,
  hasRichContent,
  ongoingEnabledActivityId,
  richTextToPlain,
  seckillAmount,
  seckillDiscount,
  seckillMoney,
  seckillNumber,
  seckillPercent,
  seckillRange,
  sessionTimeText,
  toPoolRow,
  useSeckillInsight,
} from '../insight-shared'
import type { PageResponse, PoolRow, SpuDetail, SpuDetailSku, SpuRecord } from '../insight-shared'
import '@/assets/yeah-mall-seckill-insight.css'

defineOptions({ name: 'MallSeckillProductManage' })

const ctx = useSeckillInsight({ onRouteActivityChange: handleActivitySwitch })
const {
  activities,
  activityId,
  activitiesLoading,
  activity,
  state,
  activityRangeText,
  sortedSessions,
  availablePaths,
  router,
  loadActivities,
  loadSessions,
  selectActivity,
  resolveInitialActivityId,
  goBackActivities,
} = ctx

const allRows = ref<SpuRecord[]>([])
const loading = ref(false)
const activeTab = ref('all')
const filters = reactive({ keyword: '', merchant: '', sessionId: '' })
const applied = reactive({ keyword: '', merchant: '', sessionId: '' })
const page = reactive({ current: 1, size: 10 })

const dialog = reactive({
  visible: false,
  loading: false,
  row: null as PoolRow | null,
  detail: null as SpuDetail | null,
})

let dialogSeq = 0

const pool = computed<PoolRow[]>(() => {
  const currentId = activityId.value
  return allRows.value
    .filter((item) => String(item.activityId ?? '') === currentId)
    .map((item) => toPoolRow(item, ctx.sessions.value))
})

const baseRows = computed(() => {
  const keyword = applied.keyword.trim().toLowerCase()
  const merchant = applied.merchant.trim().toLowerCase()
  return pool.value
    .filter((row) => (
      (!keyword || row.spuName.toLowerCase().includes(keyword))
      && (!merchant || `${row.mchName}${row.shopName}`.toLowerCase().includes(merchant))
      && (!applied.sessionId || row.sessionId === applied.sessionId)
    ))
    .sort((a, b) => b.applyTime.localeCompare(a.applyTime))
})

const counts = computed(() => {
  const result: Record<string, number> = { all: baseRows.value.length, pending: 0, passed: 0, rejected: 0 }
  baseRows.value.forEach((row) => {
    result[row.statusKey] = (result[row.statusKey] ?? 0) + 1
  })
  return result
})

const filtered = computed(() => baseRows.value.filter((row) => activeTab.value === 'all' || row.statusKey === activeTab.value))
const pagedRows = computed(() => filtered.value.slice((page.current - 1) * page.size, page.current * page.size))
const live = computed(() => pool.value.filter((row) => row.passed))
const stockTotal = computed(() => live.value.reduce((total, row) => total + row.stock, 0))
const soldTotal = computed(() => live.value.reduce((total, row) => total + row.sold, 0))

const introText = computed(() => {
  if (state.value.key === 'ongoing') {
    return `活动进行中，${live.value.length} 款审核通过商品正在秒杀；销量与剩余库存按已支付订单累计。`
  }
  if (state.value.key === 'upcoming') {
    return `活动将于 ${activity.value?.activityBeginTime ? activity.value.activityBeginTime.slice(0, 16) : '待定'} 开始；审核通过的商品会在开抢时投放库存。`
  }
  if (state.value.key === 'ended') {
    return '活动已结束，商品池与成交表现仅供复盘；如需调整请回到报名审核。'
  }
  return '活动时间待设置，商品池仍可核对；商品由报名审核生成，平台在此只读查看。'
})

const dialogStatusMeta = computed(() => applyStatusMeta(dialog.detail?.spu?.auditStatus ?? dialog.row?.auditStatus))
const dialogPassed = computed(() => dialogStatusMeta.value.key === 'passed')
const dialogSessionName = computed(() => dialog.row?.session?.name || '场次待确认')
const dialogApplyTimeText = computed(() => dateTimeText(dialog.detail?.applyTime || dialog.row?.applyTime))
const dialogAuditTimeLine = computed(() => {
  const value = dialog.detail?.auditTime || dialog.row?.auditTime
  return value ? `审核 ${dateTimeText(value)}` : '等待平台审核'
})
const dialogImageKey = computed(() => dialog.detail?.spu?.mainImage || dialog.detail?.images?.[0] || dialog.row?.mainImage || '')
const dialogProductName = computed(() => dialog.detail?.spu?.name || dialog.row?.spuName || '—')
const dialogDetailHtml = computed(() => dialog.detail?.spu?.detailDesc || dialog.row?.detailDesc || '')
const dialogDescription = computed(() => richTextToPlain(dialogDetailHtml.value) || '暂无商品描述')
const dialogDetailHasContent = computed(() => hasRichContent(dialogDetailHtml.value))
const dialogSkuRows = computed<SpuDetailSku[]>(() => dialog.detail?.skuList || [])
const dialogSkuCount = computed(() => dialogSkuRows.value.length || dialog.row?.skuCount || 0)
const dialogApplyRemark = computed(() => dialog.detail?.applyRemark || '')
const dialogAuditRemark = computed(() => dialog.detail?.auditRemark || '')
const dialogPrices = computed(() => {
  const skus = dialogSkuRows.value
  const seckill = skus.map((sku) => Number(sku.seckillPrice)).filter((value) => Number.isFinite(value))
  const origin = skus.map((sku) => Number(sku.originPrice)).filter((value) => Number.isFinite(value))
  if (seckill.length && origin.length) {
    return {
      minSeckill: Math.min(...seckill),
      maxSeckill: Math.max(...seckill),
      minOrigin: Math.min(...origin),
      maxOrigin: Math.max(...origin),
    }
  }
  return {
    minSeckill: dialog.row?.minSeckill || 0,
    maxSeckill: dialog.row?.maxSeckill || 0,
    minOrigin: dialog.row?.minOrigin || 0,
    maxOrigin: dialog.row?.maxOrigin || 0,
  }
})

onMounted(() => {
  void initialize()
})

async function initialize() {
  await loadActivities()
  if (!activities.value.length) {
    ctx.initialized.value = true
    return
  }
  await loadAllSpus()
  resolveInitialActivityId(defaultActivityId)
  await loadSessions()
}

async function loadAllSpus() {
  loading.value = true
  try {
    const result = await querySeckillSpuList({ current: 1, size: 500 }) as unknown as PageResponse<SpuRecord>
    allRows.value = result.data?.records || []
  } catch {
    allRows.value = []
  } finally {
    loading.value = false
  }
}

function defaultActivityId() {
  const ongoing = ongoingEnabledActivityId(activities.value, ctx.now.value)
  if (ongoing) return ongoing
  const withPassed = activities.value.find((item) => allRows.value.some(
    (row) => String(row.activityId ?? '') === String(item.id) && Number(row.auditStatus) === 2,
  ))
  if (withPassed) return String(withPassed.id)
  const withAny = activities.value.find((item) => allRows.value.some(
    (row) => String(row.activityId ?? '') === String(item.id),
  ))
  if (withAny) return String(withAny.id)
  return activities.value[0] ? String(activities.value[0].id) : ''
}

function handleActivityChange(value: string | number) {
  selectActivity(String(value || ''))
}

function handleActivitySwitch() {
  activeTab.value = 'all'
  filters.keyword = ''
  filters.merchant = ''
  filters.sessionId = ''
  applied.keyword = ''
  applied.merchant = ''
  applied.sessionId = ''
  page.current = 1
  dialog.visible = false
  void loadSessions()
}

function search() {
  applied.keyword = filters.keyword.trim()
  applied.merchant = filters.merchant.trim()
  applied.sessionId = filters.sessionId ? String(filters.sessionId) : ''
  page.current = 1
}

function resetFilters() {
  filters.keyword = ''
  filters.merchant = ''
  filters.sessionId = ''
  applied.keyword = ''
  applied.merchant = ''
  applied.sessionId = ''
  activeTab.value = 'all'
  page.current = 1
}

function switchTab(key: string) {
  activeTab.value = key
  page.current = 1
}

function changePage(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
}

async function openDetail(row: PoolRow) {
  const token = ++dialogSeq
  dialog.row = row
  dialog.detail = null
  dialog.visible = true
  dialog.loading = true
  try {
    const result = await getSeckillSpuDetail(row.id) as unknown as { data?: SpuDetail }
    if (token !== dialogSeq) return
    dialog.detail = result.data || null
  } catch {
    if (token === dialogSeq) dialog.detail = null
  } finally {
    if (token === dialogSeq) dialog.loading = false
  }
}

function resetDialog() {
  dialogSeq++
  dialog.row = null
  dialog.detail = null
  dialog.loading = false
}

function closeDialog() {
  dialog.visible = false
}

function goAudit() {
  const target = '/mall/seckill/audit'
  dialog.visible = false
  if (!availablePaths.value.has(target)) {
    ElMessage.warning('暂无报名审核页面访问权限')
    return
  }
  void router.push({ path: target, query: { activityId: activityId.value } })
}

function storageUrl(key?: string) {
  return key ? getStoragePreviewUrl(key) : ''
}
</script>