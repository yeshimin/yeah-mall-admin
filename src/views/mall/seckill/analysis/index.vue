<template>
  <div class="mall-page seckill-insight-page seckill-analysis-page">
    <div class="ss-activity-bar">
      <span class="ss-activity-icon"><el-icon><DataAnalysis /></el-icon></span>
      <div class="ss-activity-copy">
        <div class="ss-activity-title">
          <h2>{{ activity?.name || (activitiesLoading ? '加载中…' : '暂无秒杀活动') }}</h2>
          <span v-if="activity" class="ss-status-ticket" :class="`tone-${state.tone}`">{{ state.label }}</span>
        </div>
        <div class="ss-activity-meta">
          <template v-if="activity">
            <span><el-icon><Lightning /></el-icon>活动 {{ activityRangeText }}</span>
            <span><el-icon><Clock /></el-icon>共 {{ sortedSessions.length }} 个场次</span>
            <span><el-icon><Goods /></el-icon>成交商品 {{ totals.productCount }} 款</span>
            <span><el-icon><DocumentChecked /></el-icon>口径：已支付且未关闭</span>
          </template>
          <span v-else>请先在活动管理中创建秒杀活动，再查看成交分析。</span>
        </div>
      </div>
      <div class="ss-activity-controls">
        <button type="button" class="skm-refresh" @click="exportReport">
          <el-icon><Document /></el-icon>导出报表
        </button>
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

    <div class="skm-kpi-grid ska-kpi-grid">
      <div class="skm-kpi">
        <span class="skm-kpi-icon"><el-icon><Tickets /></el-icon></span>
        <div class="skm-kpi-copy">
          <span>成交订单</span>
          <b>{{ seckillNumber(totals.paidOrderCount) }}</b>
          <small>共 {{ seckillNumber(totals.soldCount) }} 件商品</small>
        </div>
      </div>
      <div class="skm-kpi">
        <span class="skm-kpi-icon"><el-icon><Avatar /></el-icon></span>
        <div class="skm-kpi-copy">
          <span>成交会员</span>
          <b>{{ seckillNumber(totals.participantCount) }}</b>
          <small>人均 {{ totals.ordersPerMember.toFixed(2) }} 单</small>
        </div>
      </div>
      <div class="skm-kpi">
        <span class="skm-kpi-icon"><el-icon><Money /></el-icon></span>
        <div class="skm-kpi-copy">
          <span>成交总额</span>
          <b class="is-price">{{ seckillAmount(totals.salesAmount) }}</b>
          <small>投放库存 {{ seckillNumber(totals.stockTotal) }} 件</small>
        </div>
      </div>
      <div class="skm-kpi">
        <span class="skm-kpi-icon"><el-icon><Coin /></el-icon></span>
        <div class="skm-kpi-copy">
          <span>客单价</span>
          <b>{{ seckillAmount(totals.averageOrder) }}</b>
          <small>件单价 {{ seckillAmount(totals.unitPrice) }}</small>
        </div>
      </div>
    </div>

    <div class="ska-substrip">
      <div class="ska-sub">
        <span>整体售罄率</span>
        <b>{{ seckillPercent(totals.sellThrough) }}</b>
        <i class="ska-sub-bar"><em :style="{ width: seckillPercent(totals.sellThrough) }"></em></i>
      </div>
      <div class="ska-sub">
        <span>平均折扣</span>
        <b>{{ totals.discount ? `${(totals.discount * 10).toFixed(2)} 折` : '—' }}</b>
        <small>成交额 / 原价成交额</small>
      </div>
      <div class="ska-sub">
        <span>人均消费</span>
        <b>{{ seckillAmount(totals.perMember) }}</b>
        <small>成交会员口径</small>
      </div>
      <div class="ska-sub">
        <span>剩余库存</span>
        <b :class="{ 'is-danger': !totals.remainingStock }">{{ seckillNumber(totals.remainingStock) }} 件</b>
        <small>{{ totals.remainingStock ? '可继续承接流量' : '全部售罄' }}</small>
      </div>
    </div>

    <section class="ska-share">
      <div class="skm-panel-head">
        <div><b>成交额构成</b><small>按商品拆解成交总额占比</small></div>
        <span class="skm-feed-count">{{ shareStateText }}</span>
      </div>
      <template v-if="totals.salesAmount">
        <div class="ska-stack">
          <i
            v-for="item in positiveSegments"
            :key="item.id"
            :style="{ width: seckillPercent(item.share, 2), background: item.color }"
            :title="`${item.spuName} ${seckillPercent(item.share)}`"
          ></i>
        </div>
        <div class="ska-legend">
          <div v-for="item in segments" :key="item.id" class="ska-legend-item">
            <i :style="{ background: item.color }"></i>
            <b :title="item.spuName">{{ item.spuName }}</b>
            <span>{{ seckillAmount(item.amount) }}</span>
            <em>{{ seckillPercent(item.share) }}</em>
          </div>
        </div>
      </template>
      <div v-else class="skm-panel-empty">
        <el-icon><DataAnalysis /></el-icon>
        <b>暂无成交构成</b>
        <span>活动产生已支付订单后，这里会展示各商品成交额占比</span>
      </div>
    </section>

    <section class="mall-table-panel">
      <div class="ss-table-intro">
        <span><el-icon><DataAnalysis /></el-icon>成交分析只计算已支付且未关闭的秒杀订单，不混入普通订单或未支付订单。</span>
        <div class="sa-intro-right"><b>商品 {{ ranking.length }} 款</b></div>
      </div>
      <el-table data-ym-table="r46" v-loading="loading" :data="ranking">
        <el-table-column label="排名" min-width="67" align="center">
          <template #default="{ $index }">
            <span class="skm-rank" :class="{ 'is-top': $index < 3 }">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="250" align="center">
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
        <el-table-column label="销量" min-width="96" align="center">
          <template #default="{ row }">
            <span class="skm-num">{{ seckillNumber(row.sold) }} 件</span>
          </template>
        </el-table-column>
        <el-table-column label="成交额" min-width="144" align="center">
          <template #default="{ row }">
            <span class="skm-num is-price">{{ seckillAmount(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="成交占比" min-width="192" align="center">
          <template #default="{ row }">
            <div class="skm-progress">
              <i><em :style="{ width: seckillPercent(shareOf(row.amount), 2) }"></em></i>
              <span>{{ seckillPercent(shareOf(row.amount)) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="剩余库存" min-width="106" align="center">
          <template #default="{ row }">
            <span class="skm-num" :class="{ 'is-danger': row.remaining <= 0 }">{{ seckillNumber(row.remaining) }} 件</span>
          </template>
        </el-table-column>
        <el-table-column label="售罄率" min-width="106" align="center">
          <template #default="{ row }">
            <span class="skm-num">{{ seckillPercent(row.sellThrough) }}</span>
          </template>
        </el-table-column>
        <template #empty>
          <div class="sa-empty">
            <el-icon><DataAnalysis /></el-icon>
            <strong>暂无已支付秒杀订单</strong>
            <span>{{ state.key === 'upcoming' ? '活动开始后产生的成交会在此统计' : '审核通过的商品产生支付订单后，这里会展示成交贡献' }}</span>
          </div>
        </template>
      </el-table>
    </section>

    <div class="skm-panels">
      <section class="skm-panel">
        <div class="skm-panel-head">
          <div><b>场次成交分布</b><small>按场次归集成交额与销量</small></div>
          <span class="skm-feed-count mono">{{ sessionRows.length }} 个场次</span>
        </div>
        <div v-if="sessionRows.length" class="ska-bars">
          <div v-for="(row, index) in sessionRows" :key="row.key" class="ska-bar-row">
            <div class="ska-bar-copy">
              <b :title="row.name">{{ row.name }}</b>
              <small>{{ row.time }} · {{ row.count }} 款商品</small>
            </div>
            <i class="ska-bar">
              <em :style="{ width: seckillPercent(shareOf(row.amount), 2), background: SHARE_COLORS[index % SHARE_COLORS.length] }"></em>
            </i>
            <div class="ska-bar-value">
              <b>{{ seckillAmount(row.amount) }}</b>
              <small>{{ seckillNumber(row.sold) }} 件 · {{ seckillPercent(shareOf(row.amount)) }}</small>
            </div>
          </div>
        </div>
        <div v-else class="skm-panel-empty">
          <el-icon><Clock /></el-icon>
          <b>尚未配置场次</b>
          <span>补充场次后可按场次复盘成交</span>
        </div>
      </section>

      <section class="skm-panel">
        <div class="skm-panel-head">
          <div><b>商家成交贡献</b><small>按商家归集成交额与商品数</small></div>
          <span class="skm-feed-count mono">{{ merchantRows.length }} 家商家</span>
        </div>
        <div v-if="merchantRows.length" class="ska-bars">
          <div v-for="(row, index) in merchantRows" :key="row.key" class="ska-bar-row">
            <div class="ska-bar-copy">
              <b :title="row.key">{{ row.key }}</b>
              <small>{{ row.count }} 款商品</small>
            </div>
            <i class="ska-bar">
              <em :style="{ width: seckillPercent(shareOf(row.amount), 2), background: SHARE_COLORS[index % SHARE_COLORS.length] }"></em>
            </i>
            <div class="ska-bar-value">
              <b>{{ seckillAmount(row.amount) }}</b>
              <small>{{ seckillNumber(row.sold) }} 件 · {{ seckillPercent(shareOf(row.amount)) }}</small>
            </div>
          </div>
        </div>
        <div v-else class="skm-panel-empty">
          <el-icon><Shop /></el-icon>
          <b>暂无商家成交</b>
          <span>商家商品产生支付订单后在此归集</span>
        </div>
      </section>
    </div>
    <p class="skm-note">成交分析只计算已支付且未关闭的秒杀订单，不混入普通订单或未支付订单；退款订单需接入售后统计后另行扣减。</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Avatar,
  Back,
  Clock,
  Coin,
  DataAnalysis,
  Document,
  DocumentChecked,
  Goods,
  Lightning,
  Money,
  Picture,
  Shop,
  Tickets,
} from '@element-plus/icons-vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { getSeckillAnalysisData } from '@/api/mall/seckill'
import {
  SHARE_COLORS,
  aggregate,
  csvCell,
  mapRanking,
  nowStamp,
  ongoingEnabledActivityId,
  seckillAmount,
  seckillNumber,
  seckillPercent,
  sessionTimeText,
  useSeckillInsight,
} from '../insight-shared'
import type { DashboardData, RankingRow } from '../insight-shared'
import '@/assets/yeah-mall-seckill-insight.css'

defineOptions({ name: 'MallSeckillAnalysisManage' })

const ctx = useSeckillInsight({ onRouteActivityChange: handleActivitySwitch })
const {
  activities,
  activityId,
  activitiesLoading,
  activity,
  state,
  activityRangeText,
  sortedSessions,
  now,
  loadActivities,
  loadSessions,
  selectActivity,
  resolveInitialActivityId,
  goBackActivities,
} = ctx

const loading = ref(false)
const dashboard = ref<DashboardData | null>(null)

let dataSeq = 0

const ranking = computed<RankingRow[]>(() => mapRanking(dashboard.value, ctx.sessions.value))
const totals = computed(() => aggregate(ranking.value, dashboard.value))

function shareOf(amount: number) {
  return totals.value.salesAmount ? amount / totals.value.salesAmount : 0
}

const segments = computed(() => ranking.value.map((item, index) => ({
  ...item,
  share: shareOf(item.amount),
  color: SHARE_COLORS[index % SHARE_COLORS.length],
})))
const positiveSegments = computed(() => segments.value.filter((item) => item.share > 0))

const shareStateText = computed(() => {
  if (state.value.key === 'ongoing') return '活动进行中，数据持续累计'
  if (state.value.key === 'ended') return '活动已结束，最终复盘口径'
  return '活动未开始，暂无成交'
})

interface GroupRow {
  key: string
  name: string
  time: string
  count: number
  sold: number
  amount: number
}

const sessionRows = computed<GroupRow[]>(() => sortedSessions.value.map((session) => {
  const items = ranking.value.filter((item) => item.sessionId === String(session.id))
  return {
    key: String(session.id),
    name: session.name || '—',
    time: sessionTimeText(session),
    count: items.length,
    sold: items.reduce((total, item) => total + item.sold, 0),
    amount: items.reduce((total, item) => total + item.amount, 0),
  }
}).sort((a, b) => b.amount - a.amount || b.sold - a.sold))

const merchantRows = computed<GroupRow[]>(() => {
  const grouped = new Map<string, GroupRow>()
  ranking.value.forEach((item) => {
    if (!grouped.has(item.mchName)) {
      grouped.set(item.mchName, { key: item.mchName, name: item.mchName, time: '', count: 0, sold: 0, amount: 0 })
    }
    const entry = grouped.get(item.mchName)!
    entry.count += 1
    entry.sold += item.sold
    entry.amount += item.amount
  })
  return [...grouped.values()].sort((a, b) => b.amount - a.amount || b.sold - a.sold)
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
  resolveInitialActivityId(defaultActivityId)
  await loadSessions()
  await loadData(true)
}

function defaultActivityId() {
  const ongoing = ongoingEnabledActivityId(activities.value, now.value)
  if (ongoing) return ongoing
  return activities.value[0] ? String(activities.value[0].id) : ''
}

async function loadData(showLoading: boolean) {
  const currentId = activityId.value
  if (!currentId) return
  const token = ++dataSeq
  if (showLoading) loading.value = true
  try {
    const result = await getSeckillAnalysisData(currentId) as unknown as { data?: DashboardData }
    if (token !== dataSeq || currentId !== activityId.value) return
    dashboard.value = result.data || null
  } catch {
    // 请求层已提示具体错误。
  } finally {
    if (token === dataSeq && showLoading) loading.value = false
  }
}

function handleActivityChange(value: string | number) {
  selectActivity(String(value || ''))
}

function handleActivitySwitch() {
  dashboard.value = null
  void loadSessions()
  void loadData(true)
}

function exportReport() {
  if (!ranking.value.length) {
    ElMessage.warning('当前活动暂无成交数据可导出')
    return
  }
  const header = ['活动', '场次', '商品', '商家', '销量', '成交额', '成交占比', '剩余库存', '售罄率']
  const lines = [header.join(',')].concat(ranking.value.map((item) => [
    activity.value?.name || '',
    item.session ? item.session.name || '' : '',
    item.spuName,
    item.mchName,
    item.sold,
    item.amount.toFixed(2),
    seckillPercent(shareOf(item.amount), 2),
    item.remaining,
    seckillPercent(item.sellThrough),
  ].map(csvCell).join(',')))
  lines.push('')
  lines.push([
    '成交订单', totals.value.paidOrderCount,
    '成交会员', totals.value.participantCount,
    '成交总额', totals.value.salesAmount.toFixed(2),
    '客单价', totals.value.averageOrder.toFixed(2),
  ].map(csvCell).join(','))
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `秒杀成交分析_${activity.value?.name || '活动'}_${nowStamp().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  ElMessage.success('成交分析报表已导出')
}

function storageUrl(key?: string) {
  return key ? getStoragePreviewUrl(key) : ''
}
</script>