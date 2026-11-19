<template>
  <div class="mall-page seckill-insight-page seckill-monitor-page">
    <div class="ss-activity-bar">
      <span class="ss-activity-icon"><el-icon><Monitor /></el-icon></span>
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
            <span><el-icon><Goods /></el-icon>秒杀商品 {{ totals.productCount }} 款</span>
            <span><el-icon><Calendar /></el-icon>数据时间 {{ updatedAt.slice(0, 19) }}</span>
          </template>
          <span v-else>请先在活动管理中创建秒杀活动，再查看实时监控。</span>
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

    <div class="skm-control-bar">
      <div class="skm-control-left">
        <span class="ss-status-ticket" :class="`tone-${runTone}`">
          <span class="ss-status-live">
            <i v-if="running && autoRefresh" class="ss-live-dot"></i>{{ runLabel }}
          </span>
        </span>
        <button
          type="button"
          class="ss-toggle"
          :class="{ 'is-on': autoRefresh }"
          :aria-pressed="autoRefresh"
          @click="autoRefresh = !autoRefresh"
        >
          <span class="ss-toggle-track"><i></i></span><span>自动刷新</span>
        </button>
        <label class="skm-interval">
          <span>刷新间隔</span>
          <select v-model.number="refreshSeconds" :disabled="!autoRefresh">
            <option v-for="item in REFRESH_INTERVALS" :key="item" :value="item">{{ item }} 秒</option>
          </select>
        </label>
      </div>
      <div class="skm-control-right">
        <span class="skm-updated"><el-icon><Clock /></el-icon>最近更新 <b>{{ updatedAt.slice(11, 19) }}</b></span>
        <button type="button" class="skm-refresh" :disabled="refreshing" @click="manualRefresh">
          <el-icon><Refresh /></el-icon>立即刷新
        </button>
      </div>
    </div>

    <div class="skm-kpi-grid">
      <div class="skm-kpi">
        <span class="skm-kpi-icon"><el-icon><Tickets /></el-icon></span>
        <div class="skm-kpi-copy">
          <span>已支付订单</span>
          <b>{{ seckillNumber(totals.paidOrderCount) }}</b>
          <small>含 {{ seckillNumber(totals.soldCount) }} 件商品</small>
        </div>
      </div>
      <div class="skm-kpi">
        <span class="skm-kpi-icon"><el-icon><Avatar /></el-icon></span>
        <div class="skm-kpi-copy">
          <span>参与会员</span>
          <b>{{ seckillNumber(totals.participantCount) }}</b>
          <small>人均 {{ totals.ordersPerMember.toFixed(2) }} 单</small>
        </div>
      </div>
      <div class="skm-kpi">
        <span class="skm-kpi-icon"><el-icon><Money /></el-icon></span>
        <div class="skm-kpi-copy">
          <span>成交金额</span>
          <b class="is-price">{{ seckillAmount(totals.salesAmount) }}</b>
          <small>客单价 {{ seckillAmount(totals.averageOrder) }}</small>
        </div>
      </div>
      <div class="skm-kpi">
        <span class="skm-kpi-icon"><el-icon><Goods /></el-icon></span>
        <div class="skm-kpi-copy">
          <span>剩余秒杀库存</span>
          <b>{{ seckillNumber(totals.remainingStock) }}</b>
          <small>整体售罄率 {{ seckillPercent(totals.sellThrough) }}</small>
        </div>
      </div>
    </div>

    <div class="skm-session-strip">
      <template v-if="sortedSessions.length">
        <div
          v-for="session in sortedSessions"
          :key="String(session.id)"
          class="skm-session"
          :class="[`is-${sessionState(session, now).key}`, { 'is-off': !session.isEnabled }]"
        >
          <div class="skm-session-head">
            <b :title="session.name">{{ session.name }}</b>
            <span
              class="ss-status-ticket is-small"
              :class="`tone-${session.isEnabled ? sessionState(session, now).tone : 'neutral'}`"
            >
              {{ session.isEnabled ? sessionState(session, now).label : '已停用' }}
            </span>
          </div>
          <span class="skm-session-time">{{ sessionClock(session.beginTime) }} – {{ sessionClock(session.endTime) }}</span>
          <i class="skm-session-bar"><em :style="{ width: `${(sessionBarProgress(session) * 100).toFixed(1)}%` }"></em></i>
          <div class="skm-session-meta">
            <span>{{ sessionItems(session).length }} 款商品</span>
            <span>已售 {{ seckillNumber(sessionSold(session)) }} 件</span>
          </div>
        </div>
      </template>
      <div v-else class="skm-session-empty">
        <el-icon><Clock /></el-icon>当前活动尚未配置场次，开抢前请先在场次管理补充。
      </div>
    </div>

    <section class="mall-table-panel">
      <div class="ss-table-intro" :class="{ 'is-open': running }">
        <span>
          <el-icon><component :is="running ? Monitor : WarningFilled" /></el-icon>
          {{ tableIntroText }}
        </span>
        <div class="sa-intro-right">
          <b>商品 {{ ranking.length }} 款</b>
          <span v-if="warnings.length > 0" class="skm-warn-chip">库存预警 {{ warnings.length }}</span>
        </div>
      </div>
      <el-table data-ym-table="r49" v-loading="loading" :data="ranking">
        <el-table-column label="排名" min-width="67" align="center">
          <template #default="{ $index }">
            <span class="skm-rank" :class="{ 'is-top': $index < 3 }">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="秒杀商品" min-width="250" align="center">
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
                <small>{{ row.session ? row.session.name : '场次待确认' }} · {{ row.mchName }}</small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="已售" min-width="106" align="center">
          <template #default="{ row }">
            <span class="skm-num">{{ seckillNumber(row.sold) }} 件</span>
          </template>
        </el-table-column>
        <el-table-column label="成交额" min-width="144" align="center">
          <template #default="{ row }">
            <span class="skm-num is-price">{{ seckillAmount(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="剩余库存" min-width="115" align="center">
          <template #default="{ row }">
            <span class="skm-num" :class="remainingClass(row)">{{ seckillNumber(row.remaining) }} 件</span>
          </template>
        </el-table-column>
        <el-table-column label="售罄进度" min-width="163" align="center">
          <template #default="{ row }">
            <div class="skm-progress">
              <i><em :style="{ width: seckillPercent(row.sellThrough) }"></em></i>
              <span>{{ seckillPercent(row.sellThrough, 0) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="库存状态" min-width="115" align="center">
          <template #default="{ row }">
            <span class="ss-status-ticket" :class="`tone-${stockState(row, now, warnRatio).tone}`">
              {{ stockState(row, now, warnRatio).label }}
            </span>
          </template>
        </el-table-column>
        <template #empty>
          <div class="sa-empty">
            <el-icon><Monitor /></el-icon>
            <strong>暂无已审核的秒杀商品</strong>
            <span>报名审核通过后，商品会进入实时排行</span>
          </div>
        </template>
      </el-table>
    </section>

    <div class="skm-panels">
      <section class="skm-panel">
        <div class="skm-panel-head">
          <div><b>库存预警</b><small>售罄或余量低于阈值的商品</small></div>
          <label class="skm-warn-select">
            <span>预警阈值</span>
            <select v-model.number="warnRatio">
              <option v-for="item in WARN_RATIOS" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </label>
        </div>
        <div v-if="warnings.length" class="skm-warn-list">
          <div
            v-for="item in warnings"
            :key="item.id"
            class="skm-warn-item"
            :class="{ 'is-out': item.remaining <= 0 }"
          >
            <span class="skm-warn-art">
              <el-image v-if="item.mainImage" :src="storageUrl(item.mainImage)" fit="cover">
                <template #error>
                  <span class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                </template>
              </el-image>
              <span v-else class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
            </span>
            <div class="skm-warn-copy">
              <b :title="item.spuName">{{ item.spuName }}</b>
              <small>{{ item.session ? item.session.name : '场次待确认' }} · 投放 {{ seckillNumber(item.stock) }} 件</small>
            </div>
            <div class="skm-warn-value">
              <b>{{ item.remaining <= 0 ? '已售罄' : `剩 ${seckillNumber(item.remaining)} 件` }}</b>
              <small>{{ seckillPercent(item.sellThrough, 0) }} 已售</small>
            </div>
          </div>
        </div>
        <div v-else class="skm-panel-empty">
          <el-icon><Check /></el-icon>
          <b>库存充足</b>
          <span>按当前阈值没有需要补货的商品</span>
        </div>
        <p class="skm-panel-note">补货需由商家在报名中调整库存，平台可联系商家或临时下架商品。</p>
      </section>

      <section class="skm-panel">
        <div class="skm-panel-head">
          <div><b>实时成交动态</b><small>已支付秒杀订单滚动记录</small></div>
          <span class="skm-feed-count mono">{{ events.length }} 条</span>
        </div>
        <div v-if="events.length" class="skm-feed">
          <div v-for="event in events" :key="event.key" class="skm-feed-item">
            <span class="skm-feed-time">{{ event.time.slice(11, 19) }}</span>
            <div class="skm-feed-copy">
              <b>{{ event.member }} 拍下 {{ event.product }}</b>
              <small>{{ event.session }} · {{ event.qty }} 件</small>
            </div>
            <span class="skm-feed-amount">{{ seckillAmount(event.amount) }}</span>
          </div>
        </div>
        <div v-else class="skm-panel-empty">
          <el-icon><Clock /></el-icon>
          <b>{{ running ? '等待成交动态' : '当前无实时成交' }}</b>
          <span>{{ feedEmptyText }}</span>
        </div>
      </section>
    </div>
    <p class="skm-note">数据仅统计已支付且未关闭的秒杀订单，剩余库存为秒杀投放库存余量；访问量与在线人数需接入埋点后另行提供。</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Avatar,
  Back,
  Calendar,
  Check,
  Clock,
  Goods,
  Lightning,
  Money,
  Monitor,
  Picture,
  Refresh,
  Tickets,
  WarningFilled,
} from '@element-plus/icons-vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { getSeckillMonitorData, getSeckillMonitorEvents } from '@/api/mall/seckill'
import {
  REFRESH_INTERVALS,
  WARN_RATIOS,
  aggregate,
  mapEvents,
  mapRanking,
  nowStamp,
  ongoingEnabledActivityId,
  seckillAmount,
  seckillNumber,
  seckillPercent,
  sessionProgress,
  sessionState,
  stockState,
  useSeckillInsight,
} from '../insight-shared'
import type { DashboardData, FeedEvent, OrderEventRecord, RankingRow, SessionRecord } from '../insight-shared'
import '@/assets/yeah-mall-seckill-insight.css'

defineOptions({ name: 'MallSeckillMonitorManage' })

const ctx = useSeckillInsight({ tickMs: 1000, onRouteActivityChange: handleActivitySwitch })
const {
  activities,
  activityId,
  activitiesLoading,
  activity,
  state,
  running,
  activityEnabled,
  activityRangeText,
  sortedSessions,
  now,
  loadActivities,
  loadSessions,
  selectActivity,
  resolveInitialActivityId,
  goBackActivities,
} = ctx

const autoRefresh = ref(true)
const refreshSeconds = ref(5)
const warnRatio = ref(0.2)
const loading = ref(false)
const refreshing = ref(false)
const updatedAt = ref(nowStamp())
const dashboard = ref<DashboardData | null>(null)
const events = ref<FeedEvent[]>([])

let dataSeq = 0
let pollTimer: number | null = null

const ranking = computed<RankingRow[]>(() => mapRanking(dashboard.value, ctx.sessions.value))
const totals = computed(() => aggregate(ranking.value, dashboard.value))
const warnings = computed(() => ranking.value.filter(
  (item) => item.remaining <= 0 || (item.stock > 0 && item.remaining / item.stock <= warnRatio.value),
))

const runLabel = computed(() => {
  if (!activityEnabled.value) return '活动已停用'
  if (state.value.key === 'ongoing') return '监控中'
  if (state.value.key === 'upcoming') return '等待开抢'
  return '监控已结束'
})
const runTone = computed(() => {
  if (!activityEnabled.value) return 'neutral'
  if (state.value.key === 'ongoing') return 'success'
  if (state.value.key === 'upcoming') return 'info'
  return 'neutral'
})

const tableIntroText = computed(() => {
  if (running.value) {
    return `进行中场次实时累计成交，排行按成交额排序；自动刷新${autoRefresh.value ? `每 ${refreshSeconds.value} 秒更新一次` : '已关闭，可手动刷新'}。`
  }
  if (state.value.key === 'upcoming') {
    return '活动尚未开始，排行展示已审核商品的投放库存，开抢后开始累计成交。'
  }
  return '活动已结束，以下为最终成交与库存余量，数据不再变化。'
})

const feedEmptyText = computed(() => {
  if (!running.value) return '活动未开始或已结束，不再产生新的成交'
  return autoRefresh.value ? '自动刷新开启后，新的支付订单会在此滚动' : '开启自动刷新或点击立即刷新查看最新成交'
})

watch(
  [autoRefresh, running, refreshSeconds, activityId],
  () => {
    if (pollTimer !== null) {
      window.clearInterval(pollTimer)
      pollTimer = null
    }
    if (!autoRefresh.value || !running.value) return
    pollTimer = window.setInterval(() => {
      void refreshData(false)
    }, refreshSeconds.value * 1000)
  },
  { immediate: true },
)

onMounted(() => {
  void initialize()
})

onBeforeUnmount(() => {
  if (pollTimer !== null) window.clearInterval(pollTimer)
})

async function initialize() {
  await loadActivities()
  if (!activities.value.length) {
    ctx.initialized.value = true
    return
  }
  resolveInitialActivityId(defaultActivityId)
  await loadSessions()
  await refreshData(true)
}

function defaultActivityId() {
  const ongoing = ongoingEnabledActivityId(activities.value, now.value)
  if (ongoing) return ongoing
  return activities.value[0] ? String(activities.value[0].id) : ''
}

async function refreshData(showLoading: boolean) {
  const currentId = activityId.value
  if (!currentId) return
  const token = ++dataSeq
  if (showLoading) loading.value = true
  try {
    const [dataResult, eventsResult] = await Promise.all([
      getSeckillMonitorData(currentId) as unknown as { data?: DashboardData },
      getSeckillMonitorEvents(currentId, 24) as unknown as { data?: OrderEventRecord[] },
    ])
    if (token !== dataSeq || currentId !== activityId.value) return
    dashboard.value = dataResult.data || null
    events.value = mapEvents(eventsResult.data || [])
    updatedAt.value = nowStamp()
  } catch {
    // 请求层已提示错误，保留上一次数据便于继续观察。
  } finally {
    if (token === dataSeq && showLoading) loading.value = false
  }
}

async function manualRefresh() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await refreshData(true)
    ElMessage.success(
      running.value
        ? '监控数据已刷新'
        : state.value.key === 'ended'
          ? '活动已结束，展示最终成交数据'
          : '已刷新，当前活动没有进行中的场次',
    )
  } finally {
    refreshing.value = false
  }
}

function handleActivityChange(value: string | number) {
  selectActivity(String(value || ''))
}

function handleActivitySwitch() {
  dashboard.value = null
  events.value = []
  updatedAt.value = nowStamp()
  void loadSessions()
  void refreshData(true)
}

function sessionItems(session: SessionRecord) {
  return ranking.value.filter((item) => item.sessionId === String(session.id))
}

function sessionSold(session: SessionRecord) {
  return sessionItems(session).reduce((total, item) => total + item.sold, 0)
}

function sessionBarProgress(session: SessionRecord) {
  const key = sessionState(session, now.value).key
  if (key === 'ended') return 1
  if (key === 'upcoming') return 0
  return sessionProgress(session, now.value)
}

function sessionClock(value?: string) {
  return value ? String(value).slice(11, 16) : '—'
}

function remainingClass(row: RankingRow) {
  if (row.remaining <= 0) return 'is-danger'
  if (row.stock && row.remaining / row.stock <= warnRatio.value) return 'is-warning'
  return ''
}

function storageUrl(key?: string) {
  return key ? getStoragePreviewUrl(key) : ''
}
</script>