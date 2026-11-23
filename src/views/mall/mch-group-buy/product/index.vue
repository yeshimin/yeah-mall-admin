<template>
  <div class="mall-page groupbuy-page groupbuy-product-page merchant-groupbuy-page">
    <template v-if="activity">
      <div class="ss-activity-bar">
        <span class="ss-activity-icon"><el-icon><Goods /></el-icon></span>
        <div class="ss-activity-copy">
          <div class="ss-activity-title">
            <h2>{{ activity.name || '未命名活动' }}</h2>
            <span class="status-ticket" :class="`tone-${state.tone}`">
              <span class="ss-status-live">
                <i v-if="state.key === 'ongoing'" class="ss-live-dot"></i>{{ state.label }}
              </span>
            </span>
          </div>
          <div class="ss-activity-meta">
            <span><el-icon><Lightning /></el-icon>活动 {{ activityRangeText }}</span>
            <span><el-icon><Avatar /></el-icon>{{ ruleText }}</span>
            <span><el-icon><Goods /></el-icon>商品池 {{ pool.length }} 款 · 通过 {{ live.length }} 款</span>
            <span><el-icon><Tickets /></el-icon>预留库存 {{ seckillNumber(stockTotal) }} 件</span>
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
            <el-icon><Back /></el-icon>返回活动列表
          </button>
        </div>
      </div>

      <div class="ss-queue">
        <div class="ss-tabs">
          <button
            v-for="item in APPLY_TABS"
            :key="item.key"
            type="button"
            :data-status="item.key"
            :class="{ active: activeTab === item.key }"
            @click="switchTab(item.key)"
          >
            {{ item.label }}<span class="ss-tab-count">{{ counts[item.key] ?? 0 }}</span>
          </button>
        </div>
        <div class="ss-queue-summary">
          <span><el-icon><Tickets /></el-icon>预留库存 <b>{{ seckillNumber(stockTotal) }}</b> 件</span>
          <span><el-icon><Check /></el-icon>累计销量 <b>{{ seckillNumber(salesTotal) }}</b> 件</span>
        </div>
      </div>

      <section class="mall-filter-panel">
        <el-form :inline="true" class="mall-query-form" @submit.prevent="search">
          <div class="ms-filter-fields">
            <el-form-item label="商品名称" class="ms-filter-field ms-filter-product">
              <el-input
                v-model="filters.keyword"
                clearable
                placeholder="搜索拼团商品名称"
                @keyup.enter="search"
              />
            </el-form-item>
          </div>
          <el-form-item class="mall-query-actions">
            <el-button @click="resetFilters">重置</el-button>
            <el-button type="primary" native-type="submit">
              <el-icon><Search /></el-icon>查询
            </el-button>
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

        <el-table data-ym-table="r85" v-loading="loading" :data="pagedRows" row-key="id" style="width: 100%">
          <el-table-column label="拼团商品" min-width="250" align="center" header-align="center">
            <template #default="{ row }">
              <div class="sa-product-cell">
                <span class="sa-product-art">
                  <el-image v-if="row.mainImage" :src="getStoragePreviewUrl(row.mainImage)" fit="cover">
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
          <el-table-column label="拼团价" min-width="170" align="center" header-align="center">
            <template #default="{ row }">
              <div class="skp-price-cell">
                <b>{{ seckillRange(row.minGroup, row.maxGroup) }}</b>
                <small>
                  <s>{{ seckillRange(row.minOrigin, row.maxOrigin) }}</s>
                  <em>{{ seckillDiscount(row.minGroup, row.minOrigin) }}</em>
                </small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="拼团库存" min-width="140" align="center" header-align="center">
            <template #default="{ row }">
              <div class="skp-stock-cell">
                <b>{{ seckillNumber(row.stock) }} 件</b>
                <small>{{ row.passed ? `剩余 ${seckillNumber(row.remaining)} 件` : '审核通过后预留' }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="销量" min-width="150" align="center" header-align="center">
            <template #default="{ row }">
              <div class="skp-sales-cell">
                <b>{{ row.passed ? seckillNumber(row.sold) : '—' }}</b>
                <small>{{ row.passed ? (row.amount ? seckillAmount(row.amount) : '暂无成交') : '未进入商品池' }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="售罄率" min-width="100" align="center" header-align="center">
            <template #default="{ row }">
              {{ row.passed ? seckillPercent(row.sellThrough) : '—' }}
            </template>
          </el-table-column>
          <el-table-column label="审核状态" min-width="104" align="center" header-align="center">
            <template #default="{ row }">
              <span class="status-ticket" :class="`tone-${applyStatusMeta(row.auditStatus).tone}`">
                {{ applyStatusMeta(row.auditStatus).label }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="商品状态" min-width="110" align="center" header-align="center">
            <template #default="{ row }">
              <span class="status-ticket is-small" :class="`tone-${stockStateOf(row).tone}`">
                {{ stockStateOf(row).label }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="82" fixed="right" align="center" header-align="center">
            <template #default="{ row }">
              <button type="button" class="ms-link" @click="openDetail(row)">详情</button>
            </template>
          </el-table-column>

          <template #empty>
            <div class="ms-empty">
              <el-icon><Goods /></el-icon>
              <b>{{ pool.length ? '没有匹配的拼团商品' : '当前活动还没有拼团商品' }}</b>
              <span>{{ pool.length ? '调整商品名称筛选后重试' : '报名审核通过后，商品会进入这里' }}</span>
            </div>
          </template>
        </el-table>

        <MallPagination
          variant="admin"
          :total="filtered.length"
          :page="page.current"
          :limit="page.size"
          @pagination="changePage"
        />
      </section>

      <el-dialog
        v-model="detailVisible"
        width="880px"
        top="4vh"
        class="skp-detail-dialog"
        @closed="resetDetail"
      >
        <template #header>
          <div class="sa-dialog-heading">
            <span>GROUP BUY PRODUCT</span>
            <h2>拼团商品详情</h2>
          </div>
        </template>

        <div v-if="detailRow" v-loading="detailLoading" class="sa-dialog-content">
          <div class="sa-apply-context">
            <div class="sa-context-item">
              <span>活动 / 成团规则</span>
              <b :title="activity?.name">{{ activity?.name || '—' }}</b>
              <small>{{ ruleText }}</small>
            </div>
            <div class="sa-context-item">
              <span>活动时间</span>
              <b>{{ dateTimeText(activity?.activityBeginTime) }}</b>
              <small>至 {{ dateTimeText(activity?.activityEndTime) }}</small>
            </div>
            <div class="sa-context-item">
              <span>报名 / 审核时间</span>
              <b>{{ dateTimeText(detailRow.applyTime) }}</b>
              <small>{{ detailRow.auditTime ? `审核 ${dateTimeText(detailRow.auditTime)}` : '等待平台审核' }}</small>
            </div>
            <div class="sa-context-item">
              <span>审核状态</span>
              <span class="status-ticket" :class="`tone-${applyStatusMeta(detailRow.auditStatus).tone}`">
                {{ applyStatusMeta(detailRow.auditStatus).label }}
              </span>
              <small>{{ detailRow.passed ? '已进入拼团商品池' : '未进入拼团商品池' }}</small>
            </div>
          </div>

          <div class="sa-product-panel">
            <span class="sa-product-art large">
              <el-image v-if="detailImage" :src="getStoragePreviewUrl(detailImage)" fit="cover">
                <template #error>
                  <span class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                </template>
              </el-image>
              <span v-else class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
            </span>
            <div class="sa-product-info">
              <h3>{{ detailName }}</h3>
              <p>{{ detailDescription }}</p>
              <div class="sa-product-tags">
                <span><el-icon><Goods /></el-icon>{{ detailSkuCount }} 个 SKU</span>
                <span><el-icon><Tickets /></el-icon>预留库存 {{ seckillNumber(detailRow.stock) }} 件</span>
                <span><el-icon><Coin /></el-icon>{{ seckillDiscount(detailRow.minGroup, detailRow.minOrigin) }}</span>
              </div>
            </div>
            <div class="sa-price-panel">
              <span>拼团价</span>
              <b>{{ seckillRange(detailRow.minGroup, detailRow.maxGroup) }}</b>
              <small>原价 {{ seckillRange(detailRow.minOrigin, detailRow.maxOrigin) }}</small>
            </div>
          </div>

          <div class="sa-section">
            <div class="sa-section-head">
              <b>成交表现</b>
              <small>{{ detailRow.passed ? '仅统计已支付且未关闭的拼团订单' : '商品未审核通过，暂无成交数据' }}</small>
            </div>
            <div v-if="detailRow.passed" class="skp-stat-grid">
              <div class="skp-stat">
                <span>累计销量</span>
                <b>{{ seckillNumber(detailRow.sold) }} 件</b>
              </div>
              <div class="skp-stat">
                <span>成交金额</span>
                <b class="is-price">{{ seckillAmount(detailRow.amount) }}</b>
              </div>
              <div class="skp-stat">
                <span>剩余库存</span>
                <b :class="{ 'is-danger': !detailRow.remaining }">{{ seckillNumber(detailRow.remaining) }} 件</b>
              </div>
              <div class="skp-stat">
                <span>售罄率</span>
                <b>{{ seckillPercent(detailRow.sellThrough) }}</b>
                <i class="skp-stat-bar"><em :style="{ width: seckillPercent(detailRow.sellThrough) }"></em></i>
              </div>
            </div>
            <div v-else class="sa-empty-sku">审核通过后商品才会预留库存并产生成交数据</div>
          </div>

          <div v-if="detailRow.applyRemark || detailRow.auditRemark" class="sa-apply-note">
            <el-icon><ChatDotRound /></el-icon>
            <div>
              <b>申请与审核备注</b>
              <p>{{ detailRow.applyRemark || '未填写申请备注' }}</p>
              <p v-if="detailRow.auditRemark" class="skp-audit-remark">平台审核：{{ detailRow.auditRemark }}</p>
            </div>
          </div>

          <div class="sa-section">
            <div class="sa-section-head">
              <b>SKU 信息</b>
              <small>共 {{ detailSkuCount }} 个规格 · 预留库存 {{ seckillNumber(detailRow.stock) }} 件</small>
            </div>
            <table v-if="detailSkuRows.length" class="sa-sku-table">
              <thead>
                <tr>
                  <th>SKU 名称</th>
                  <th>规格编码</th>
                  <th>原价</th>
                  <th>拼团价</th>
                  <th>库存</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(sku, index) in detailSkuRows" :key="`${sku.specCode || 'sku'}-${index}`">
                  <td><div class="sa-cb"><b class="sa-sku-name" :title="sku.name">{{ sku.name || '—' }}</b></div></td>
                  <td><div class="sa-cb"><span class="sa-sku-mono">{{ sku.specCode || '—' }}</span></div></td>
                  <td><div class="sa-cb"><span class="sa-sku-origin">{{ seckillMoney(sku.originPrice) }}</span></div></td>
                  <td><div class="sa-cb"><span class="sa-sku-price">{{ seckillMoney(sku.groupPrice) }}</span></div></td>
                  <td><div class="sa-cb">{{ Number(sku.stock || 0) }} 件</div></td>
                </tr>
              </tbody>
            </table>
            <div v-else class="sa-empty-sku">暂无 SKU 信息</div>
          </div>

          <div class="sa-section">
            <div class="sa-section-head">
              <b>商品详情</b>
              <small>提交的报名内容 · 只读预览</small>
            </div>
            <div v-if="detailHasContent" class="sa-richtext-wrap">
              <RichTextEditor :model-value="detailHtml" :height="260" readonly />
            </div>
            <div v-else class="sa-empty-sku">未提交商品详情</div>
          </div>
        </div>

        <template #footer>
          <div class="sa-dialog-actions">
            <el-button @click="goRecords">查看申请记录</el-button>
            <el-button type="primary" @click="detailVisible = false">关闭</el-button>
          </div>
        </template>
      </el-dialog>
    </template>

    <section v-else-if="activitiesLoading" class="gb-page-empty">
      <span class="gb-page-empty-icon"><el-icon><Goods /></el-icon></span>
      <strong>正在加载拼团活动</strong>
      <span>请稍候…</span>
    </section>

    <section v-else class="gb-page-empty">
      <span class="gb-page-empty-icon"><el-icon><Goods /></el-icon></span>
      <strong>暂无可查看的拼团活动</strong>
      <span>平台发布拼团活动后，审核通过的商品会展示在这里。</span>
      <button type="button" class="gb-page-empty-action" @click="goBackActivities">返回活动列表</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Avatar,
  Back,
  ChatDotRound,
  Check,
  Coin,
  Goods,
  Lightning,
  Picture,
  Search,
  Tickets,
} from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import RichTextEditor from '@/components/mall/RichTextEditor.vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { getMchGroupBuyProductDetail, queryMchGroupBuyApplyList, queryMchGroupBuyProductList } from '@/api/mall/groupBuy'
import SeckillThumb from '../../mch-seckill/components/SeckillThumb.vue'
import {
  APPLY_TABS,
  applyStatusMeta,
  dateTimeText,
  groupbuyStockState,
  hasRichContent,
  loadAllPages,
  mchGroupbuyInsightActivityId,
  normalizeTime,
  richTextToPlain,
  seckillAmount,
  seckillDiscount,
  seckillMoney,
  seckillNumber,
  seckillPercent,
  seckillRange,
  toGroupBuyPoolRow,
  useMchGroupBuyContext,
  type GroupBuyPoolRow,
  type GroupBuyProductDetail,
  type GroupBuySku,
  type GroupBuySpu,
  type MchGroupbuyApplyRow,
} from '../shared'
import '@/assets/yeah-mall-seckill.css'
import '@/assets/yeah-mall-seckill-insight.css'

defineOptions({ name: 'MchGroupBuyProduct' })

const {
  router,
  shopId,
  activities,
  activityId,
  activitiesLoading,
  now,
  activity,
  state,
  activityRangeText,
  ruleText,
  loadActivities,
  selectActivity,
  resolveInitialActivityId,
  goBackActivities,
} = useMchGroupBuyContext({ onRouteActivityChange: handleActivitySwitch })

const products = ref<GroupBuySpu[]>([])
const applies = ref<MchGroupbuyApplyRow[]>([])
const loading = ref(false)
const activeTab = ref('all')
const filters = reactive({ keyword: '' })
const applied = reactive({ keyword: '' })
const page = reactive({ current: 1, size: 10 })

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailRow = ref<GroupBuyPoolRow | null>(null)
const detailPayload = ref<GroupBuyProductDetail | null>(null)

let detailToken = 0

const pool = computed<GroupBuyPoolRow[]>(() => (
  products.value
    .filter((item) => String(item.activityId ?? '') === String(activity.value?.id ?? ''))
    .map((item) => toGroupBuyPoolRow(item))
))

const baseRows = computed(() => {
  const keyword = applied.keyword.trim().toLowerCase()
  return pool.value
    .filter((row) => !keyword || row.spuName.toLowerCase().includes(keyword))
    .slice()
    .sort((a, b) => String(b.applyTime).localeCompare(String(a.applyTime)))
})

const counts = computed(() => {
  const result: Record<string, number> = { all: baseRows.value.length, pending: 0, passed: 0, rejected: 0 }
  baseRows.value.forEach((row) => {
    const key = applyStatusMeta(row.auditStatus).key
    if (key in result) result[key] = (result[key] || 0) + 1
  })
  return result
})

const filtered = computed(() => (
  baseRows.value.filter((row) => activeTab.value === 'all' || applyStatusMeta(row.auditStatus).key === activeTab.value)
))

const pagedRows = computed(() => {
  const start = (page.current - 1) * page.size
  return filtered.value.slice(start, start + page.size)
})

const live = computed(() => pool.value.filter((row) => row.passed))
const stockTotal = computed(() => live.value.reduce((total, row) => total + row.stock, 0))
const salesTotal = computed(() => live.value.reduce((total, row) => total + row.sold, 0))

const introText = computed(() => {
  if (state.value.key === 'ongoing') {
    return `活动进行中，${live.value.length} 款审核通过商品正在拼团；销量与剩余库存按已支付订单累计，满团后于活动结束统一发货。`
  }
  if (state.value.key === 'upcoming') {
    return `活动将于 ${activity.value?.activityBeginTime ? dateTimeText(activity.value.activityBeginTime) : '待定'} 开始；审核通过的商品会在开始活动时预留拼团库存。`
  }
  if (state.value.key === 'ended') {
    return '活动已结束并完成统一结算，商品池与成交表现仅供复盘。'
  }
  return '活动时间待设置，商品池仍可核对；商品由平台审核报名后生成。'
})

const detailSkuRows = computed<GroupBuySku[]>(() => detailPayload.value?.skus || [])
const detailName = computed(() => detailPayload.value?.name || detailRow.value?.spuName || '—')
const detailImage = computed(() => detailPayload.value?.mainImage || detailRow.value?.mainImage || '')
const detailHtml = computed(() => detailPayload.value?.detailDesc ?? detailRow.value?.detailDesc ?? '')
const detailHasContent = computed(() => hasRichContent(detailHtml.value))
const detailDescription = computed(() => richTextToPlain(detailHtml.value) || '暂无商品描述')
const detailSkuCount = computed(() => detailSkuRows.value.length || Number(detailRow.value?.skuCount || 0))

function stockStateOf(row: GroupBuyPoolRow) {
  return row.passed ? groupbuyStockState(row, state.value.key) : { label: '未入池', tone: 'neutral' as const }
}

onMounted(() => {
  void initialize()
})

async function initialize() {
  await loadActivities()
  if (!activities.value.length) {
    return
  }
  await Promise.all([loadApplies(), loadProducts()])
  resolveInitialActivityId(() => mchGroupbuyInsightActivityId(activities.value, applies.value, [], now.value))
}

async function loadApplies() {
  if (!shopId.value) {
    applies.value = []
    return
  }
  try {
    const rows = await loadAllPages<MchGroupbuyApplyRow>((params) => queryMchGroupBuyApplyList({ ...params, shopId: shopId.value }))
    applies.value = rows.filter((row) => row && row.id !== undefined && row.id !== null)
  } catch {
    applies.value = []
  }
}

async function loadProducts() {
  if (!shopId.value) {
    products.value = []
    return
  }
  loading.value = true
  try {
    const rows = await loadAllPages<GroupBuySpu>((params) => queryMchGroupBuyProductList({ ...params, shopId: shopId.value }))
    products.value = rows
      .filter((row) => row && row.id !== undefined && row.id !== null)
      .map((row) => ({
        ...row,
        applyTime: normalizeTime(row.applyTime),
        auditTime: normalizeTime(row.auditTime),
        activityBeginTime: normalizeTime(row.activityBeginTime),
        activityEndTime: normalizeTime(row.activityEndTime),
      }))
  } catch {
    products.value = []
  } finally {
    loading.value = false
  }
}

function handleActivitySwitch() {
  activeTab.value = 'all'
  filters.keyword = ''
  applied.keyword = ''
  page.current = 1
  detailVisible.value = false
}

function handleActivityChange(value: string) {
  selectActivity(value)
}

function search() {
  applied.keyword = filters.keyword.trim()
  page.current = 1
}

function resetFilters() {
  filters.keyword = ''
  applied.keyword = ''
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

async function openDetail(row: GroupBuyPoolRow) {
  if (!shopId.value) return
  const token = ++detailToken
  detailRow.value = row
  detailPayload.value = null
  detailVisible.value = true
  detailLoading.value = true
  try {
    const response = await getMchGroupBuyProductDetail({ shopId: shopId.value, id: row.id }) as unknown as { data?: GroupBuyProductDetail }
    if (token !== detailToken) return
    detailPayload.value = response?.data || null
  } catch {
    if (token === detailToken) ElMessage.error('拼团商品详情加载失败，请稍后重试')
  } finally {
    if (token === detailToken) detailLoading.value = false
  }
}

function resetDetail() {
  detailToken += 1
  detailRow.value = null
  detailPayload.value = null
  detailLoading.value = false
}

function goRecords() {
  detailVisible.value = false
  if (!activityId.value) return
  void router.push({ path: '/mall/mch-group-buy/apply', query: { activityId: String(activityId.value) } })
}
</script>