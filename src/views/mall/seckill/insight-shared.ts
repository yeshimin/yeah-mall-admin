import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { querySeckillActivityList, querySeckillSessionList } from '@/api/mall/seckill'

export type StatusTone = 'success' | 'info' | 'neutral' | 'warning' | 'danger'

export interface StateMeta {
  key: string
  label: string
  tone: StatusTone
}

export interface ActivityRecord {
  id: string | number
  name?: string
  isEnabled?: boolean
  activityBeginTime?: string
  activityEndTime?: string
  applyBeginTime?: string
  applyEndTime?: string
  sort?: number | string
}

export interface SessionRecord {
  id: string | number
  activityId?: string | number
  name?: string
  beginTime?: string
  endTime?: string
  sort?: number | string
  isEnabled?: boolean
}

export interface SpuRecord {
  id: string | number
  mchId?: string | number
  mchName?: string
  shopId?: string | number
  shopName?: string
  spuId?: string | number
  activityId?: string | number
  activityName?: string
  sessionId?: string | number
  sessionName?: string
  name?: string
  sales?: number | string
  mainImage?: string
  minOriginPrice?: number | string
  minSeckillPrice?: number | string
  maxOriginPrice?: number | string
  maxSeckillPrice?: number | string
  detailDesc?: string
  auditStatus?: number | string
  skuCount?: number | string
  stock?: number | string
  salesAmount?: number | string
  sessionBeginTime?: string
  sessionEndTime?: string
  applyTime?: string
  auditTime?: string
}

export interface SpuDetailSku {
  name?: string
  specCode?: string
  originPrice?: number | string
  seckillPrice?: number | string
  stock?: number | string
  mainImage?: string
}

export interface SpuDetail {
  spu?: {
    name?: string
    mainImage?: string
    detailDesc?: string
    auditStatus?: number | string
  }
  images?: string[]
  skuList?: SpuDetailSku[]
  applyTime?: string
  auditTime?: string
  applyRemark?: string
  auditRemark?: string
}

export interface ProductStatRecord {
  seckillSpuId: string | number
  name?: string
  salesCount?: number | string
  salesAmount?: number | string
  remainingStock?: number | string
  sessionId?: string | number
  sessionName?: string
  mchName?: string
  mainImage?: string
  minOriginPrice?: number | string
}

export interface DashboardData {
  paidOrderCount?: number | string
  participantCount?: number | string
  salesAmount?: number | string
  remainingStock?: number | string
  productRanking?: ProductStatRecord[]
}

export interface OrderEventRecord {
  orderId: string | number
  payTime?: string
  memberName?: string
  spuName?: string
  sessionName?: string
  quantity?: number | string
  totalPrice?: number | string
}

export interface PageResponse<T> {
  data?: {
    records?: T[]
    total?: number | string
  }
}

/** 商品池行：商品管理页直接由秒杀商品列表映射，口径与原型 seckillProductPool 一致。 */
export interface PoolRow {
  id: string
  spuName: string
  mchName: string
  shopName: string
  mainImage: string
  detailDesc: string
  auditStatus: number
  statusKey: string
  passed: boolean
  skuCount: number
  stock: number
  sold: number
  remaining: number
  amount: number
  sellThrough: number
  discount: number
  minSeckill: number
  maxSeckill: number
  minOrigin: number
  maxOrigin: number
  sessionId: string
  session: SessionRecord | null
  sessionName: string
  sessionBeginTime: string
  sessionEndTime: string
  applyTime: string
  auditTime: string
  raw: SpuRecord
}

/** 排行行：监控 / 分析页由 dashboard.productRanking 映射。 */
export interface RankingRow {
  id: string
  spuName: string
  mchName: string
  mainImage: string
  sessionId: string
  sessionName: string
  session: SessionRecord | null
  sold: number
  amount: number
  stock: number
  remaining: number
  sellThrough: number
  minOrigin: number
}

export interface InsightTotals {
  paidOrderCount: number
  participantCount: number
  salesAmount: number
  soldCount: number
  stockTotal: number
  remainingStock: number
  productCount: number
  averageOrder: number
  unitPrice: number
  perMember: number
  ordersPerMember: number
  sellThrough: number
  discount: number
}

export interface FeedEvent {
  key: string
  time: string
  member: string
  product: string
  session: string
  qty: number
  amount: number
}

export const SHARE_COLORS = ['#24634f', '#376d80', '#986019', '#be412b', '#65538d', '#4a7c59', '#8a6d3b', '#2f6a8a']
export const REFRESH_INTERVALS = [5, 10, 30]
export const WARN_RATIOS = [
  { value: 0.1, label: '剩余 ≤ 10%' },
  { value: 0.2, label: '剩余 ≤ 20%' },
  { value: 0.3, label: '剩余 ≤ 30%' },
]

export const PRODUCT_TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: '全部商品' },
  { key: 'pending', label: '待审核' },
  { key: 'passed', label: '审核通过' },
  { key: 'rejected', label: '审核驳回' },
]

const APPLY_STATUS: Record<string, StateMeta> = {
  1: { key: 'pending', label: '待审核', tone: 'warning' },
  2: { key: 'passed', label: '审核通过', tone: 'success' },
  3: { key: 'rejected', label: '审核驳回', tone: 'danger' },
}

export function applyStatusMeta(value?: number | string | null): StateMeta {
  return APPLY_STATUS[String(value ?? '')] || { key: 'unknown', label: '—', tone: 'neutral' }
}

export function seckillNumber(value?: number | string): string {
  return Number(value || 0).toLocaleString('zh-CN')
}

export function seckillAmount(value?: number | string): string {
  return `¥${Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function seckillPercent(value?: number | string, digits = 1): string {
  return `${(Number(value || 0) * 100).toFixed(digits)}%`
}

export function seckillDiscount(seckill?: number | string, origin?: number | string): string {
  const sale = Number(seckill || 0)
  const base = Number(origin || 0)
  return base > 0 && sale > 0 ? `${((sale / base) * 10).toFixed(1)} 折` : '—'
}

export function seckillMoney(value?: number | string): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `¥${amount.toFixed(2)}`
}

export function seckillRange(min?: number | string, max?: number | string): string {
  const low = Number(min)
  const high = Number(max)
  if (!Number.isFinite(low) && !Number.isFinite(high)) return '—'
  const a = Number.isFinite(low) ? low : high
  const b = Number.isFinite(high) ? high : low
  return a === b ? seckillMoney(a) : `${seckillMoney(a)} – ${seckillMoney(b)}`
}

export function maskMember(name?: string): string {
  const value = String(name || '').trim()
  return value ? `${value.slice(0, 1)}**` : '会员**'
}

export function csvCell(value: unknown): string {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function fullRange(begin?: string, end?: string): string {
  if (!begin || !end) return '待设置'
  return `${String(begin).slice(0, 16)} 至 ${String(end).slice(0, 16)}`
}

export function dateTimeText(value?: string): string {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '—'
}

export function dateOnly(value?: string): string {
  return value ? String(value).slice(0, 10) : '—'
}

export function clockText(value?: string): string {
  return value && String(value).length >= 19 ? String(value).replace('T', ' ').slice(11, 19) : '—'
}

export function sessionTimeText(session?: SessionRecord | null): string {
  if (!session?.beginTime || !session?.endTime) return '场次待确认'
  return `${String(session.beginTime).slice(5, 16)} – ${String(session.endTime).slice(11, 16)}`
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatStamp(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} `
    + `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

export function nowStamp(): string {
  return formatStamp(new Date())
}

export function parseDateTime(value?: string): number {
  if (!value) return Number.NaN
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(value))
  if (!match) return Number.NaN
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] || 0),
  ).getTime()
}

export function activityState(activity: ActivityRecord | undefined, now: string): StateMeta {
  if (!activity?.activityBeginTime || !activity?.activityEndTime) {
    return { key: 'none', label: '时间待设置', tone: 'neutral' }
  }
  if (now < activity.activityBeginTime) return { key: 'upcoming', label: '活动未开始', tone: 'info' }
  if (now < activity.activityEndTime) return { key: 'ongoing', label: '活动进行中', tone: 'success' }
  return { key: 'ended', label: '活动已结束', tone: 'neutral' }
}

export function sessionState(session: SessionRecord | null | undefined, now: string): StateMeta {
  if (!session?.beginTime || !session?.endTime) return { key: 'ended', label: '待完善', tone: 'neutral' }
  if (now < session.beginTime) return { key: 'upcoming', label: '未开始', tone: 'info' }
  if (now < session.endTime) return { key: 'ongoing', label: '进行中', tone: 'success' }
  return { key: 'ended', label: '已结束', tone: 'neutral' }
}

export function sessionProgress(session: SessionRecord | null | undefined, now: string): number {
  const start = parseDateTime(session?.beginTime)
  const finish = parseDateTime(session?.endTime)
  const current = parseDateTime(now)
  if (!Number.isFinite(start) || !Number.isFinite(finish) || finish <= start) return 0
  return Math.min(1, Math.max(0, (current - start) / (finish - start)))
}

export function stockState(
  item: { remaining: number; stock: number; sellThrough: number; session?: SessionRecord | null },
  now: string,
  warnRatio = 0.2,
): { label: string; tone: StatusTone } {
  if (item.remaining <= 0) return { label: '已售罄', tone: 'danger' }
  if (item.session && sessionState(item.session, now).key === 'upcoming') return { label: '待开抢', tone: 'info' }
  if (item.stock > 0 && item.remaining / item.stock <= warnRatio) return { label: '库存紧张', tone: 'warning' }
  if (item.sellThrough >= 0.6) return { label: '热销中', tone: 'success' }
  return { label: '库存充足', tone: 'neutral' }
}

export function richTextToPlain(html?: string): string {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim()
}

export function hasRichContent(html?: string): boolean {
  if (!html) return false
  return !!richTextToPlain(html) || /<img|<iframe/i.test(html)
}

export function ongoingEnabledActivityId(activities: ActivityRecord[], now: string): string {
  const found = activities.find((item) => item.isEnabled && activityState(item, now).key === 'ongoing')
  return found ? String(found.id) : ''
}

export function toPoolRow(spu: SpuRecord, sessions: SessionRecord[]): PoolRow {
  const auditStatus = Number(spu.auditStatus || 0)
  const statusKey = applyStatusMeta(auditStatus).key
  const passed = auditStatus === 2
  const stock = Number(spu.stock || 0)
  const sold = passed ? Math.min(Number(spu.sales || 0), stock) : 0
  const remaining = Math.max(0, stock - sold)
  const amount = passed ? Number(spu.salesAmount || 0) : 0
  const minSeckill = Number(spu.minSeckillPrice || 0)
  const minOrigin = Number(spu.minOriginPrice || 0)
  const session = sessions.find((item) => String(item.id) === String(spu.sessionId ?? '')) || null
  return {
    id: String(spu.id),
    spuName: spu.name || '—',
    mchName: spu.mchName || '—',
    shopName: spu.shopName || '—',
    mainImage: spu.mainImage || '',
    detailDesc: spu.detailDesc || '',
    auditStatus,
    statusKey,
    passed,
    skuCount: Number(spu.skuCount || 0),
    stock,
    sold,
    remaining,
    amount,
    sellThrough: stock ? sold / stock : 0,
    discount: minOrigin ? minSeckill / minOrigin : 0,
    minSeckill,
    maxSeckill: Number(spu.maxSeckillPrice || 0),
    minOrigin,
    maxOrigin: Number(spu.maxOriginPrice || 0),
    sessionId: String(spu.sessionId ?? ''),
    session,
    sessionName: session?.name || spu.sessionName || '',
    sessionBeginTime: session?.beginTime || spu.sessionBeginTime || '',
    sessionEndTime: session?.endTime || spu.sessionEndTime || '',
    applyTime: String(spu.applyTime || '').replace('T', ' '),
    auditTime: String(spu.auditTime || '').replace('T', ' '),
    raw: spu,
  }
}

export function mapRanking(dashboard: DashboardData | null, sessions: SessionRecord[]): RankingRow[] {
  const rows = dashboard?.productRanking || []
  return rows.map((item) => {
    const sold = Number(item.salesCount || 0)
    const remaining = Number(item.remainingStock || 0)
    const stock = remaining + sold
    const session = sessions.find((entry) => String(entry.id) === String(item.sessionId ?? '')) || null
    return {
      id: String(item.seckillSpuId),
      spuName: item.name || '—',
      mchName: item.mchName || '—',
      mainImage: item.mainImage || '',
      sessionId: String(item.sessionId ?? ''),
      sessionName: session?.name || item.sessionName || '',
      session,
      sold,
      amount: Number(item.salesAmount || 0),
      stock,
      remaining,
      sellThrough: stock ? sold / stock : 0,
      minOrigin: Number(item.minOriginPrice || 0),
    }
  })
}

export function aggregate(ranking: RankingRow[], dashboard: DashboardData | null): InsightTotals {
  const paidOrderCount = Number(dashboard?.paidOrderCount || 0)
  const participantCount = Number(dashboard?.participantCount || 0)
  const salesAmount = ranking.reduce((total, item) => total + item.amount, 0)
  const soldCount = ranking.reduce((total, item) => total + item.sold, 0)
  const stockTotal = ranking.reduce((total, item) => total + item.stock, 0)
  const remainingStock = ranking.reduce((total, item) => total + item.remaining, 0)
  const originTotal = ranking.reduce((total, item) => total + item.sold * item.minOrigin, 0)
  return {
    paidOrderCount,
    participantCount,
    salesAmount,
    soldCount,
    stockTotal,
    remainingStock,
    productCount: ranking.length,
    averageOrder: paidOrderCount ? salesAmount / paidOrderCount : 0,
    unitPrice: soldCount ? salesAmount / soldCount : 0,
    perMember: participantCount ? salesAmount / participantCount : 0,
    ordersPerMember: participantCount ? paidOrderCount / participantCount : 0,
    sellThrough: stockTotal ? soldCount / stockTotal : 0,
    discount: originTotal ? salesAmount / originTotal : 0,
  }
}

/** 成交动态按订单去重（后端一单多明细会返回多行），会员昵称脱敏后展示。 */
export function mapEvents(records: OrderEventRecord[]): FeedEvent[] {
  const seen = new Set<string>()
  const events: FeedEvent[] = []
  for (const item of records || []) {
    const key = String(item.orderId ?? '')
    if (!key || seen.has(key)) continue
    seen.add(key)
    events.push({
      key,
      time: String(item.payTime || '').replace('T', ' '),
      member: maskMember(item.memberName),
      product: item.spuName || '秒杀商品',
      session: item.sessionName || '场次待确认',
      qty: Number(item.quantity || 0),
      amount: Number(item.totalPrice || 0),
    })
  }
  return events
}

interface InsightContextOptions {
  tickMs?: number
  onRouteActivityChange?: (id: string) => void
}

/** 三页共用的活动上下文：活动列表 / 场次 / 时钟 / 路由同步 / 返回活动管理。 */
export function useSeckillInsight(options: InsightContextOptions = {}) {
  const route = useRoute()
  const router = useRouter()

  const activities = ref<ActivityRecord[]>([])
  const activityId = ref('')
  const sessions = ref<SessionRecord[]>([])
  const activitiesLoading = ref(false)
  const initialized = ref(false)
  const now = ref(nowStamp())

  let sessionSeq = 0
  let nowTimer: number | null = null

  const availablePaths = computed(() => new Set(router.getRoutes().map((item) => item.path)))
  const activity = computed(() => activities.value.find((item) => String(item.id) === activityId.value) || activities.value[0])
  const state = computed(() => activityState(activity.value, now.value))
  const activityEnabled = computed(() => activity.value?.isEnabled !== false)
  const running = computed(() => activityEnabled.value && state.value.key === 'ongoing')
  const activityRangeText = computed(() => fullRange(activity.value?.activityBeginTime, activity.value?.activityEndTime))
  const sortedSessions = computed(() => [...sessions.value].sort((a, b) => {
    const timeCompare = String(a.beginTime || '').localeCompare(String(b.beginTime || ''))
    if (timeCompare !== 0) return timeCompare
    return Number(a.sort || 0) - Number(b.sort || 0)
  }))

  watch(
    () => route.query.activityId,
    (value) => {
      if (!initialized.value) return
      const nextId = value ? String(value) : ''
      if (!nextId || nextId === activityId.value) return
      if (!activities.value.some((item) => String(item.id) === nextId)) return
      selectActivity(nextId)
    },
  )

  onMounted(() => {
    nowTimer = window.setInterval(() => {
      now.value = nowStamp()
    }, options.tickMs ?? 30000)
  })

  onBeforeUnmount(() => {
    if (nowTimer !== null) window.clearInterval(nowTimer)
  })

  async function loadActivities() {
    activitiesLoading.value = true
    try {
      const result = await querySeckillActivityList({
        current: 1,
        size: 500,
        conditions_: 'sort:sort:asc',
      }) as unknown as PageResponse<ActivityRecord>
      activities.value = (result.data?.records || []).filter((item) => item && item.id !== undefined && item.id !== null)
    } catch {
      activities.value = []
    } finally {
      activitiesLoading.value = false
    }
  }

  async function loadSessions() {
    const currentId = activityId.value
    if (!currentId) {
      sessionSeq++
      sessions.value = []
      return
    }
    const token = ++sessionSeq
    try {
      const result = await querySeckillSessionList({
        activityId: currentId,
        current: 1,
        size: 500,
      }) as unknown as PageResponse<SessionRecord>
      if (token !== sessionSeq) return
      sessions.value = result.data?.records || []
    } catch {
      if (token === sessionSeq) sessions.value = []
    }
  }

  function syncActivityQuery() {
    if (!activityId.value) return
    const name = activity.value?.name || ''
    const currentId = String(route.query.activityId || '')
    const currentName = String(route.query.activityName || '')
    if (currentId === activityId.value && currentName === name) return

    const query: Record<string, string> = {}
    Object.entries(route.query).forEach(([key, value]) => {
      if (typeof value === 'string') query[key] = value
    })
    query.activityId = activityId.value
    if (name) query.activityName = name
    else delete query.activityName
    void router.replace({ path: route.path, query })
  }

  function selectActivity(id: string) {
    activityId.value = String(id || '')
    syncActivityQuery()
    options.onRouteActivityChange?.(activityId.value)
  }

  function resolveInitialActivityId(fallback: () => string) {
    const routeId = route.query.activityId ? String(route.query.activityId) : ''
    const targetId = activities.value.some((item) => String(item.id) === routeId) ? routeId : fallback()
    activityId.value = targetId
    initialized.value = true
    syncActivityQuery()
  }

  function goBackActivities() {
    const listPath = '/mall/seckill/list'
    if (!availablePaths.value.has(listPath)) {
      ElMessage.warning('暂无活动管理页面访问权限')
      return
    }
    void router.push(listPath)
  }

  function sessionOf(value?: string | number): SessionRecord | null {
    if (value === undefined || value === null || value === '') return null
    const key = String(value)
    return sessions.value.find((item) => String(item.id) === key) || null
  }

  return {
    route,
    router,
    activities,
    activityId,
    sessions,
    activitiesLoading,
    initialized,
    now,
    availablePaths,
    activity,
    state,
    activityEnabled,
    running,
    activityRangeText,
    sortedSessions,
    loadActivities,
    loadSessions,
    syncActivityQuery,
    selectActivity,
    resolveInitialActivityId,
    goBackActivities,
    sessionOf,
  }
}