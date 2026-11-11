<template>
  <div v-loading="loading" class="overview-page">
    <el-empty
      v-if="isMerchant && !currentShop"
      description="请先选择店铺，再查看经营概览"
    />

    <template v-else>
      <section class="overview-metrics">
        <article v-for="item in metrics" :key="item.label">
          <span>{{ item.label }}</span>
          <b>{{ item.value }}</b>
          <small :class="{ attention: item.attention }">{{ item.hint }}</small>
        </article>
      </section>

      <section class="overview-grid">
        <section class="overview-tasks">
          <div class="panel-toolbar">
            <div class="panel-title">
              <span class="shelf-mark"></span>
              <b>待办事项</b>
            </div>
            <el-tag size="small" type="warning" effect="light">今日</el-tag>
          </div>
          <button
            v-for="task in tasks"
            :key="task.label"
            type="button"
            @click="openTask(task)"
          >
            <span>
              <b>{{ task.label }}</b>
              <small>点击进入对应业务列表</small>
            </span>
            <strong>{{ task.count }}</strong>
            <el-icon><ArrowRight /></el-icon>
          </button>
        </section>

        <section class="trend-panel">
          <div class="panel-toolbar">
            <div class="panel-title">
              <span class="shelf-mark"></span>
              <b>近 7 日交易趋势</b>
            </div>
            <span class="mini-legend"><i></i>支付金额</span>
          </div>
          <div v-if="trendBars.length" class="trend-chart">
            <div v-for="bar in trendBars" :key="bar.date" class="trend-bar">
              <span
                class="trend-bar-fill"
                :style="{ height: `${bar.height}%` }"
                :title="`${bar.date} 支付金额 ${bar.amountText}，${bar.orderCount} 笔`"
              ></span>
              <i>{{ bar.label }}</i>
            </div>
          </div>
          <el-empty v-else description="暂无交易数据" :image-size="70" />
        </section>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getCurrentShop, type CurrentShop } from '@/utils/shop'
import {
  queryAdminDashboardOverview,
  queryAdminDashboardTrend,
  queryMerchantDashboard,
  queryMerchantDashboardTrend,
} from '@/api/mall/dashboard'
import { queryMchReviews } from '@/api/mall/review'
import request from '@/utils/request'
import type { ResourceTreeNode } from '@/types/upms'

interface PlatformOverview {
  todayOrderCount?: number
  todaySalesAmount?: number
  yesterdayOrderCount?: number
  yesterdaySalesAmount?: number
  activeShopCount?: number
  totalShopCount?: number
  refundPendingCount?: number
  refundShopCount?: number
  pendingMerchantCount?: number
  seckillApplyPendingCount?: number
  hiddenReviewCount?: number
  feedbackPendingCount?: number
}

interface MerchantOverview {
  waitShipCount?: number
  refundPendingCount?: number
  stockWarningCount?: number
  todayOrderCount?: number
  todaySalesAmount?: number
  stockWarningThreshold?: number
}

interface MetricCard {
  label: string
  value: string
  hint: string
  attention?: boolean
}

interface TaskItem {
  label: string
  count: number
  component: string
  fallbackPath: string
  query?: Record<string, string>
}

interface TrendPoint {
  date: string
  orderCount: number
  salesAmount: number
}

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const currentShop = ref<CurrentShop | null>(getCurrentShop())
const platformOverview = ref<PlatformOverview | null>(null)
const merchantOverview = ref<MerchantOverview | null>(null)
const trend = ref<TrendPoint[]>([])
const unrepliedReviewCount = ref(0)
const groupBuyApplyPendingCount = ref(0)

const isMerchant = computed(() => authStore.subject === 'merchant')

const metrics = computed<MetricCard[]>(() => {
  if (isMerchant.value) {
    const data = merchantOverview.value
    if (!data) {
      return emptyMetrics(['今日支付订单', '今日销售额', '待发货', '退款待处理'])
    }
    return [
      {
        label: '今日支付订单',
        value: formatCount(data.todayOrderCount),
        hint: growthHint(data.todayOrderCount, trendValue(1, 'orderCount')),
      },
      {
        label: '今日销售额',
        value: formatMoney(data.todaySalesAmount),
        hint: growthHint(data.todaySalesAmount, trendValue(1, 'salesAmount')),
      },
      { label: '待发货', value: formatCount(data.waitShipCount), hint: '需及时处理' },
      {
        label: '退款待处理',
        value: formatCount(data.refundPendingCount),
        hint: '申请中或处理中',
        attention: Number(data.refundPendingCount || 0) > 0,
      },
    ]
  }

  const data = platformOverview.value
  if (!data) {
    return emptyMetrics(['今日支付订单', '今日交易额', '活跃店铺', '退款待处理'])
  }
  return [
    {
      label: '今日支付订单',
      value: formatCount(data.todayOrderCount),
      hint: growthHint(data.todayOrderCount, data.yesterdayOrderCount),
    },
    {
      label: '今日交易额',
      value: formatMoney(data.todaySalesAmount),
      hint: growthHint(data.todaySalesAmount, data.yesterdaySalesAmount),
    },
    {
      label: '活跃店铺',
      value: formatCount(data.activeShopCount),
      hint: `共 ${formatCount(data.totalShopCount)} 家`,
    },
    {
      label: '退款待处理',
      value: formatCount(data.refundPendingCount),
      hint: `跨 ${formatCount(data.refundShopCount)} 家店铺`,
      attention: Number(data.refundPendingCount || 0) > 0,
    },
  ]
})

const tasks = computed<TaskItem[]>(() => {
  if (isMerchant.value) {
    const data = merchantOverview.value
    const merchantTasks: TaskItem[] = [
      {
        label: '待发货订单',
        count: Number(data?.waitShipCount || 0),
        component: 'mall/order/index',
        fallbackPath: '/mall/order',
        query: { status: '2' },
      },
      {
        label: '低库存商品',
        count: Number(data?.stockWarningCount || 0),
        component: 'mall/sku/index',
        fallbackPath: '/mall/sku',
        query: { stockMax: String(data?.stockWarningThreshold || 10) },
      },
      {
        label: '待回复评价',
        count: unrepliedReviewCount.value,
        component: 'mall/mch-review/index',
        fallbackPath: '/mall/mch-review',
        query: { isReplied: 'false' },
      },
      {
        label: '拼团报名待审',
        count: groupBuyApplyPendingCount.value,
        component: 'mall/mch-group-buy/apply/index',
        fallbackPath: '/mall/mch-group-buy/apply',
        query: { auditStatus: '1' },
      },
    ]
    return merchantTasks
  }

  const data = platformOverview.value
  const platformTasks: TaskItem[] = [
    {
      label: '待启用商家',
      count: Number(data?.pendingMerchantCount || 0),
      component: 'mall/merchant/index',
      fallbackPath: '/mall/merchant',
      query: { isEnabled: 'false' },
    },
    {
      label: '秒杀报名待审',
      count: Number(data?.seckillApplyPendingCount || 0),
      component: 'mall/seckill/audit/index',
      fallbackPath: '/mall/seckill/audit',
      query: { auditStatus: '1' },
    },
    {
      label: '已隐藏评价',
      count: Number(data?.hiddenReviewCount || 0),
      component: 'mall/review/index',
      fallbackPath: '/mall/review',
      query: { isVisible: 'false' },
    },
    {
      label: '意见反馈待处理',
      count: Number(data?.feedbackPendingCount || 0),
      component: 'mall/feedback/index',
      fallbackPath: '/mall/feedback',
      query: { status: '1' },
    },
  ]
  return platformTasks
})

const trendBars = computed(() => {
  const max = Math.max(...trend.value.map((point) => point.salesAmount), 0)
  return trend.value.map((point) => ({
    ...point,
    label: point.date.slice(5).replace('-', '/'),
    height: max > 0 ? Math.max(6, Math.round((point.salesAmount / max) * 100)) : 6,
    amountText: formatMoney(point.salesAmount),
  }))
})

function emptyMetrics(labels: string[]): MetricCard[] {
  return labels.map((label) => ({ label, value: '—', hint: '暂无数据' }))
}

function trendValue(offsetFromEnd: number, key: 'orderCount' | 'salesAmount') {
  const index = trend.value.length - 1 - offsetFromEnd
  const point = index >= 0 ? trend.value[index] : undefined
  return point ? Number(point[key] || 0) : 0
}

function growthHint(today: unknown, yesterday: unknown) {
  const current = Number(today || 0)
  const previous = Number(yesterday || 0)
  if (previous <= 0) {
    return current > 0 ? '较昨日新增' : '较昨日持平'
  }
  const rate = ((current - previous) / previous) * 100
  return `较昨日 ${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`
}

function formatCount(value: unknown) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatMoney(value: unknown) {
  return `¥${Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function pageTotal(response: unknown) {
  const data = (response as { data?: { total?: unknown } } | null)?.data
  return Number(data?.total || 0)
}

function normalizeTrend(value: unknown): TrendPoint[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map((item) => {
    const point = item as Partial<TrendPoint>
    return {
      date: String(point.date || ''),
      orderCount: Number(point.orderCount || 0),
      salesAmount: Number(point.salesAmount || 0),
    }
  })
}

function findMenuPath(nodes: ResourceTreeNode[], component: string): string | null {
  for (const node of nodes) {
    if (node.component === component && node.path) {
      return node.path
    }
    if (node.children?.length) {
      const found = findMenuPath(node.children, component)
      if (found) {
        return found
      }
    }
  }
  return null
}

function openTask(task: TaskItem) {
  const path = findMenuPath(authStore.sidebarMenus, task.component) || task.fallbackPath
  void router.push({ path, query: task.query })
}

async function loadOverview() {
  loading.value = true
  try {
    if (isMerchant.value) {
      currentShop.value = getCurrentShop()
      if (!currentShop.value) {
        return
      }
      const shopId = currentShop.value.id
      const [overviewResponse, trendResponse, reviewResponse, applyResponse] = await Promise.all([
        queryMerchantDashboard(shopId),
        queryMerchantDashboardTrend(shopId, 7),
        queryMchReviews({ shopId, isReplied: false, current: 1, size: 1 }).catch(() => null),
        request({
          url: '/mch/groupBuy/apply/query',
          method: 'get',
          params: { shopId, auditStatus: '1', current: 1, size: 1 },
        }).catch(() => null),
      ])
      merchantOverview.value = overviewResponse.data || null
      trend.value = normalizeTrend(trendResponse.data)
      unrepliedReviewCount.value = pageTotal(reviewResponse)
      groupBuyApplyPendingCount.value = pageTotal(applyResponse)
      return
    }

    const [overviewResponse, trendResponse] = await Promise.all([
      queryAdminDashboardOverview(),
      queryAdminDashboardTrend(7),
    ])
    platformOverview.value = overviewResponse.data || null
    trend.value = normalizeTrend(trendResponse.data)
  } catch {
    ElMessage.error('经营概览数据加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadOverview()
})
</script>

<style scoped>
.overview-page {
  min-height: 100%;
  padding: 18px 20px 20px;
  background: var(--ym-paper);
}

.overview-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.overview-metrics article {
  display: flex;
  min-height: 110px;
  flex-direction: column;
  justify-content: center;
  padding: 15px;
  border: 1px solid var(--ym-line);
  border-radius: 8px;
  background: #fff;
}

.overview-metrics span {
  color: var(--ym-muted);
  font-size: 12px;
}

.overview-metrics b {
  margin: 9px 0 7px;
  color: var(--ym-ink);
  font-family: var(--ym-font-mono);
  font-size: 25px;
  font-weight: 600;
}

.overview-metrics small {
  color: var(--ym-brand);
  font-size: 12px;
}

.overview-metrics small.attention {
  color: var(--ym-warning);
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.85fr) minmax(420px, 1.4fr);
  gap: 12px;
  margin-top: 12px;
}

.overview-tasks,
.trend-panel {
  overflow: hidden;
  border: 1px solid var(--ym-line);
  border-radius: 8px;
  background: #fff;
}

.panel-toolbar {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid #edf1ee;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 7px;
}

.panel-title b {
  color: var(--ym-ink);
  font-size: 13px;
}

.shelf-mark {
  display: inline-block;
  width: 5px;
  height: 17px;
  border-radius: 1px;
  background: var(--ym-brand);
}

.overview-tasks button {
  display: grid;
  width: 100%;
  min-height: 62px;
  grid-template-columns: 1fr 42px 20px;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border: 0;
  border-bottom: 1px solid #edf1ee;
  background: #fff;
  color: var(--ym-ink-secondary);
  cursor: pointer;
  text-align: left;
}

.overview-tasks button:last-child {
  border-bottom: 0;
}

.overview-tasks button:hover {
  background: #fafcfa;
}

.overview-tasks button > span {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.overview-tasks b {
  font-size: 13px;
}

.overview-tasks small {
  color: var(--ym-muted);
  font-size: 11px;
}

.overview-tasks strong {
  color: var(--ym-warning);
  font-family: var(--ym-font-mono);
  font-size: 15px;
  font-weight: 600;
  text-align: right;
}

.overview-tasks .el-icon {
  color: var(--ym-muted);
}

.trend-panel {
  display: flex;
  flex-direction: column;
}

.mini-legend {
  display: flex;
  align-items: center;
  color: var(--ym-muted);
  font-size: 12px;
}

.mini-legend i {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 5px;
  border-radius: 2px;
  background: var(--ym-brand);
}

.trend-chart {
  display: flex;
  height: 255px;
  align-items: flex-end;
  justify-content: space-around;
  gap: 15px;
  padding: 32px 24px 28px;
  background-image: linear-gradient(
    to bottom,
    transparent 24%,
    #edf1ee 25%,
    transparent 26%,
    transparent 49%,
    #edf1ee 50%,
    transparent 51%,
    transparent 74%,
    #edf1ee 75%,
    transparent 76%
  );
}

.trend-bar {
  position: relative;
  display: flex;
  height: 100%;
  width: 42px;
  align-items: flex-end;
}

.trend-bar-fill {
  width: 100%;
  min-height: 12px;
  border-radius: 5px 5px 1px 1px;
  background: linear-gradient(to top, var(--ym-brand), #68a38a);
  transition: height 0.2s ease;
}

.trend-bar-fill:hover {
  background: var(--ym-price);
}

.trend-bar i {
  position: absolute;
  right: 0;
  bottom: -20px;
  left: 0;
  color: var(--ym-muted);
  font-family: var(--ym-font-mono);
  font-size: 11px;
  font-style: normal;
  text-align: center;
}

@media (max-width: 1050px) {
  .overview-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .overview-page {
    padding: 12px;
  }

  .overview-metrics {
    grid-template-columns: 1fr;
  }

  .trend-chart {
    gap: 8px;
    padding: 26px 12px 26px;
  }

  .trend-bar {
    width: 28px;
  }
}
</style>
