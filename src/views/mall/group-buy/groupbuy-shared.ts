import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { queryGroupBuyActivityList } from '@/api/mall/groupBuy'
import {
  activityState,
  fullRange,
  nowStamp,
  type ActivityRecord,
  type PageResponse,
  type StateMeta,
  type StatusTone,
} from '../seckill/insight-shared'

export interface GroupBuyActivity extends ActivityRecord {
  description?: string
  coverImage?: string
  minPeople?: number | string
  groupLimit?: number | string
  status?: string
  remark?: string
  applyCount?: number | string
  productCount?: number | string
  createTime?: string
  updateTime?: string
}

export interface GroupBuyActivityStats {
  total?: number | string
  created?: number | string
  published?: number | string
  applyStarted?: number | string
  applyFinished?: number | string
  activityStarted?: number | string
  activityFinished?: number | string
  activityDown?: number | string
  pendingSetup?: number | string
}

export interface GroupBuySku {
  id?: string | number
  spuId?: string | number
  skuId?: string | number
  groupBuySpuId?: string | number
  activityId?: string | number
  name?: string
  specCode?: string
  originPrice?: number | string
  groupPrice?: number | string
  stock?: number | string
  isStockReserved?: boolean
  mainImage?: string
}

export interface GroupBuyApply {
  id: string | number
  activityId?: string | number
  activityName?: string
  mchId?: string | number
  mchName?: string
  shopId?: string | number
  shopName?: string
  spuId?: string | number
  groupBuySpuId?: string | number
  spuName?: string
  mainImage?: string
  detailDesc?: string
  minGroupPrice?: number | string
  maxGroupPrice?: number | string
  minOriginPrice?: number | string
  maxOriginPrice?: number | string
  groupStock?: number | string
  auditStatus?: number | string
  applyRemark?: string
  auditRemark?: string
  createTime?: string
  updateTime?: string
}

export interface GroupBuyApplyDetail extends GroupBuyApply {
  activityStatus?: string
  activityMinPeople?: number | string
  activityGroupLimit?: number | string
  applyBeginTime?: string
  applyEndTime?: string
  activityBeginTime?: string
  activityEndTime?: string
  detailDesc?: string
  skus?: GroupBuySku[]
}

export interface GroupBuySpu {
  id: string | number
  activityId?: string | number
  activityName?: string
  activityStatus?: string
  activityBeginTime?: string
  activityEndTime?: string
  activityPurchasable?: boolean
  mchId?: string | number
  mchName?: string
  shopId?: string | number
  shopName?: string
  spuId?: string | number
  name?: string
  sales?: number | string
  soldAmount?: number | string
  minOriginPrice?: number | string
  minGroupPrice?: number | string
  maxOriginPrice?: number | string
  maxGroupPrice?: number | string
  mainImage?: string
  customMainImage?: string
  sourceMainImage?: string
  detailDesc?: string
  auditStatus?: number | string
  minPeople?: number | string
  groupStock?: number | string
  skuCount?: number | string
  applyTime?: string
  auditTime?: string
  applyRemark?: string
  auditRemark?: string
  createTime?: string
  updateTime?: string
}

export interface GroupBuyProductDetail extends GroupBuySpu {
  skus?: GroupBuySku[]
}

export interface GroupBuyOrder {
  id: string | number
  orderId?: string | number
  orderNo?: string
  groupId?: string | number
  groupNo?: string
  groupStatus?: string
  orderStatus?: string
  memberName?: string
  memberAvatar?: string
  activityId?: string | number
  activityName?: string
  productName?: string
  productImage?: string
  groupPrice?: number | string
  actualAmount?: number | string
  payTime?: string
  isLeader?: boolean
  groupMinPeople?: number | string
  groupMemberCount?: number | string
  groupReservedMemberCount?: number | string
  createTime?: string
  updateTime?: string
}

export interface GroupBuyGroup {
  id: string | number
  groupNo?: string
  productName?: string
  productImage?: string
  leaderMemberName?: string
  leaderMemberAvatar?: string
  memberCount?: number | string
  reservedMemberCount?: number | string
  minPeople?: number | string
  status?: string
  createTime?: string
  successTime?: string
  failedTime?: string
}

export interface GroupBuyMember {
  id: string | number
  orderId?: string | number
  orderNo?: string
  memberName?: string
  memberAvatar?: string
  isLeader?: boolean
  orderStatus?: string
  actualAmount?: number | string
  createTime?: string
  payTime?: string
}

export interface GroupBuyGroupDetail extends GroupBuyGroup {
  members?: GroupBuyMember[]
}

/** 商品池行：口径与原型 groupbuyProductPool 一致；预留库存 = 销量 + 剩余（通过后后端扣减口径）。 */
export interface GroupBuyPoolRow {
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
  minGroup: number
  maxGroup: number
  minOrigin: number
  maxOrigin: number
  applyTime: string
  auditTime: string
  applyRemark: string
  auditRemark: string
  raw: GroupBuySpu
}

export interface GroupBuyStatusMeta {
  label: string
  tone: StatusTone
  action: string
  next: string
  hint: string
}

const GROUPBUY_NEW_META: GroupBuyStatusMeta = { label: '新建', tone: 'neutral', action: '发布', next: '2', hint: '发布前会校验报名与活动时间段是否有效、成团人数与最大开团数是否设置。' }

export const GROUPBUY_STATUS_META: Record<string, GroupBuyStatusMeta> = {
  1: GROUPBUY_NEW_META,
  2: { label: '已发布', tone: 'info', action: '开始报名', next: '3', hint: '开始报名后，商家可在报名时间段内提交拼团商品报名。' },
  3: { label: '报名中', tone: 'warning', action: '结束报名', next: '4', hint: '结束报名后活动进入等待开始状态，请核对审核通过的拼团商品后开始活动。' },
  4: { label: '报名结束', tone: 'info', action: '开始活动', next: '5', hint: '开始活动后系统会按审核通过商品预留拼团库存，App 端开放开团与参团。' },
  5: { label: '进行中', tone: 'success', action: '结束活动', next: '6', hint: '结束活动后统一结算：满团进入待发货，未满团关闭或退款，并释放剩余预留库存。' },
  6: { label: '已结束', tone: 'neutral', action: '活动下架', next: '7', hint: '活动下架后会从进行中集合移除，App 端不再作为进行中活动展示。' },
  7: { label: '已下架', tone: 'neutral', action: '', next: '', hint: '' },
}

export const GROUPBUY_FLOW = [
  { value: '1', label: '新建' }, { value: '2', label: '发布' }, { value: '3', label: '报名中' },
  { value: '4', label: '报名结束' }, { value: '5', label: '进行中' }, { value: '6', label: '结束' }, { value: '7', label: '下架' },
]

export const APPLY_TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: '全部' }, { key: 'pending', label: '待审核' }, { key: 'passed', label: '审核通过' }, { key: 'rejected', label: '审核驳回' },
]

export const ORDER_TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: '全部订单' }, { key: 'waitpay', label: '待支付' }, { key: 'paid', label: '已支付' },
  { key: 'closed', label: '已关闭' }, { key: 'refunding', label: '退款中' }, { key: 'refunded', label: '已退款' }, { key: 'refundfail', label: '退款失败' },
]

export const GROUP_TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: '全部团' }, { key: 'waitpay', label: '待团长支付' }, { key: 'forming', label: '拼团中' },
  { key: 'success', label: '已成团' }, { key: 'failed', label: '拼团失败' }, { key: 'closed', label: '已关闭' },
]

const GROUP_WAITPAY_META: StateMeta = { key: 'waitpay', label: '待团长支付', tone: 'warning' }

export const GROUP_STATUS: Record<string, StateMeta> = {
  1: GROUP_WAITPAY_META,
  2: { key: 'forming', label: '拼团中', tone: 'info' },
  3: { key: 'success', label: '已成团', tone: 'success' },
  4: { key: 'failed', label: '拼团失败', tone: 'danger' },
  5: { key: 'closed', label: '已关闭', tone: 'neutral' },
}

const ORDER_WAITPAY_META: StateMeta = { key: 'waitpay', label: '待支付', tone: 'warning' }

export const ORDER_STATUS: Record<string, StateMeta> = {
  1: ORDER_WAITPAY_META,
  2: { key: 'paid', label: '已支付', tone: 'success' },
  3: { key: 'closed', label: '已关闭', tone: 'neutral' },
  4: { key: 'refunding', label: '退款中', tone: 'info' },
  5: { key: 'refunded', label: '已退款', tone: 'neutral' },
  6: { key: 'refundfail', label: '退款失败', tone: 'danger' },
}

export const PAID_ORDER_STATUSES = ['2', '4', '5', '6']

export const GROUPBUY_LIST_PATH = '/mall/group-buy/list'
export const GROUPBUY_AUDIT_PATH = '/mall/group-buy/audit'
export const GROUPBUY_PRODUCT_PATH = '/mall/group-buy/product'
export const GROUPBUY_ORDER_PATH = '/mall/group-buy/order'

export function groupbuyStatusMeta(status?: string | number | null): GroupBuyStatusMeta {
  return GROUPBUY_STATUS_META[String(status ?? '')] || GROUPBUY_NEW_META
}

export function groupStatusMeta(status?: string | number | null): StateMeta {
  return GROUP_STATUS[String(status ?? '')] || GROUP_WAITPAY_META
}

export function orderStatusMeta(status?: string | number | null): StateMeta {
  return ORDER_STATUS[String(status ?? '')] || ORDER_WAITPAY_META
}

export function groupbuyLimitText(limit?: number | string | null): string {
  const value = Number(limit)
  if (value === -1) return '不限'
  return value > 0 ? `${limit} 团` : '未设置'
}

export function groupbuyApplyWindowState(activity: GroupBuyActivity | undefined, now: string): StateMeta {
  if (!activity?.applyBeginTime || !activity?.applyEndTime) return { key: 'none', label: '报名未开放', tone: 'neutral' }
  if (now < activity.applyBeginTime) return { key: 'upcoming', label: '报名未开始', tone: 'info' }
  if (now < activity.applyEndTime) return { key: 'open', label: '报名中', tone: 'success' }
  return { key: 'closed', label: '报名已结束', tone: 'neutral' }
}

export function shortTime(value?: string): string {
  if (!value) return '—'
  const text = String(value).replace('T', ' ')
  return `${text.slice(5, 10)} ${text.slice(11, 16)}`
}

export function groupbuyPublishIssues(row: GroupBuyActivity): string[] {
  const issues: string[] = []
  if (!row.applyBeginTime || !row.applyEndTime || !row.activityBeginTime || !row.activityEndTime) {
    issues.push('报名与活动时间段未完整设置')
  } else {
    if (row.applyBeginTime > row.applyEndTime) issues.push('报名开始时间需早于或等于结束时间')
    if (row.activityBeginTime > row.activityEndTime) issues.push('活动开始时间需早于或等于结束时间')
  }
  if (!row.minPeople || Number(row.minPeople) < 2) issues.push('成团人数需大于等于 2 人')
  if (row.groupLimit === null || row.groupLimit === undefined || Number(row.groupLimit) === 0) issues.push('请设置最大开团数，或选择不限制')
  return issues
}

export function groupbuyInsightActivityId(
  activities: GroupBuyActivity[],
  applies: Array<{ activityId?: string | number; auditStatus?: number | string }>,
  orders: Array<{ activityId?: string | number }>,
  now: string,
): string {
  const ongoing = activities.find((item) => item.isEnabled
    && activityState(item, now).key === 'ongoing'
    && orders.some((order) => String(order.activityId ?? '') === String(item.id)))
  if (ongoing) return String(ongoing.id)
  const withPassed = activities.find((item) => applies.some((apply) => String(apply.activityId ?? '') === String(item.id) && Number(apply.auditStatus) === 2))
  if (withPassed) return String(withPassed.id)
  const withApply = activities.find((item) => applies.some((apply) => String(apply.activityId ?? '') === String(item.id)))
  if (withApply) return String(withApply.id)
  return activities[0] ? String(activities[0].id) : ''
}

export function groupbuyAuditDefaultActivityId(
  activities: GroupBuyActivity[],
  applies: Array<{ activityId?: string | number; auditStatus?: number | string }>,
  now: string,
): string {
  const open = activities.find((item) => item.applyBeginTime && item.applyEndTime
    && item.applyBeginTime <= now && now < item.applyEndTime)
  if (open) return String(open.id)
  const withPending = activities.find((item) => applies.some((apply) => String(apply.activityId ?? '') === String(item.id) && Number(apply.auditStatus) === 1))
  if (withPending) return String(withPending.id)
  return activities[0] ? String(activities[0].id) : ''
}

export function toGroupBuyPoolRow(spu: GroupBuySpu): GroupBuyPoolRow {
  const auditStatus = Number(spu.auditStatus || 0)
  const passed = auditStatus === 2
  const sales = passed ? Number(spu.sales || 0) : 0
  const groupStock = Number(spu.groupStock || 0)
  const stock = passed ? sales + groupStock : groupStock
  const remaining = groupStock
  const minGroup = Number(spu.minGroupPrice || 0)
  const minOrigin = Number(spu.minOriginPrice || 0)
  return {
    id: String(spu.id),
    spuName: spu.name || '—',
    mchName: spu.mchName || '—',
    shopName: spu.shopName || '—',
    mainImage: spu.mainImage || '',
    detailDesc: spu.detailDesc || '',
    auditStatus,
    statusKey: auditStatus === 2 ? 'passed' : auditStatus === 3 ? 'rejected' : 'pending',
    passed,
    skuCount: Number(spu.skuCount || 0),
    stock,
    sold: sales,
    remaining,
    amount: passed ? Number(spu.soldAmount || 0) : 0,
    sellThrough: stock ? sales / stock : 0,
    discount: minOrigin ? minGroup / minOrigin : 0,
    minGroup,
    maxGroup: Number(spu.maxGroupPrice || 0),
    minOrigin,
    maxOrigin: Number(spu.maxOriginPrice || 0),
    applyTime: String(spu.applyTime || '').replace('T', ' '),
    auditTime: String(spu.auditTime || '').replace('T', ' '),
    applyRemark: spu.applyRemark || '',
    auditRemark: spu.auditRemark || '',
    raw: spu,
  }
}

export function groupbuyStockState(
  item: { remaining: number; stock: number; sellThrough: number },
  activityStateKey: string,
): { label: string; tone: StatusTone } {
  if (item.remaining <= 0) return { label: '已售罄', tone: 'danger' }
  if (activityStateKey === 'upcoming') return { label: '待开团', tone: 'info' }
  if (item.stock > 0 && item.remaining / item.stock <= 0.2) return { label: '库存紧张', tone: 'warning' }
  if (item.sellThrough >= 0.6) return { label: '热销中', tone: 'success' }
  return { label: '库存充足', tone: 'neutral' }
}

export function groupbuyGroupProgress(group: {
  memberCount?: number | string
  minPeople?: number | string
  status?: string | number
}): { percent: number; full: boolean; fail: boolean; text: string } {
  const member = Number(group.memberCount || 0)
  const minPeople = Number(group.minPeople || 0)
  const status = String(group.status ?? '')
  const percent = minPeople > 0 ? Math.min(100, Math.round((member / minPeople) * 100)) : 0
  const full = minPeople > 0 && member >= minPeople
  const fail = status === '4' || status === '5'
  let text: string
  if (status === '3') text = '已成团'
  else if (status === '4') text = '拼团失败'
  else if (status === '5') text = '已关闭'
  else if (status === '1') text = '待团长支付'
  else text = `还差 ${Math.max(0, minPeople - member)} 人`
  return { percent, full, fail, text }
}

export function isPaidOrder(status?: string | number | null): boolean {
  return PAID_ORDER_STATUSES.includes(String(status ?? ''))
}

interface GroupBuyContextOptions {
  tickMs?: number
  onRouteActivityChange?: (id: string) => void
}

function normalizeTime(value?: string): string | undefined {
  return value ? String(value).replace('T', ' ') : value
}

/** 三个子页共用的活动上下文：活动列表 / 时钟 / 路由同步 / 返回活动管理。 */
export function useGroupBuyContext(options: GroupBuyContextOptions = {}) {
  const route = useRoute()
  const router = useRouter()

  const activities = ref<GroupBuyActivity[]>([])
  const activityId = ref('')
  const activitiesLoading = ref(false)
  const initialized = ref(false)
  const now = ref(nowStamp())

  let nowTimer: number | null = null

  const availablePaths = computed(() => new Set(router.getRoutes().map((item) => item.path)))
  const activity = computed(() => activities.value.find((item) => String(item.id) === activityId.value) || activities.value[0])
  const state = computed(() => activityState(activity.value, now.value))
  const applyState = computed(() => groupbuyApplyWindowState(activity.value, now.value))
  const activityRangeText = computed(() => fullRange(activity.value?.activityBeginTime, activity.value?.activityEndTime))
  const applyRangeText = computed(() => fullRange(activity.value?.applyBeginTime, activity.value?.applyEndTime))
  const ruleText = computed(() => `${Number(activity.value?.minPeople || 0)} 人成团 · 上限 ${groupbuyLimitText(activity.value?.groupLimit)}`)

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
      const result = await queryGroupBuyActivityList({ current: 1, size: 500 }) as unknown as PageResponse<GroupBuyActivity>
      activities.value = (result.data?.records || [])
        .filter((item) => item && item.id !== undefined && item.id !== null)
        .map((item) => ({
          ...item,
          applyBeginTime: normalizeTime(item.applyBeginTime),
          applyEndTime: normalizeTime(item.applyEndTime),
          activityBeginTime: normalizeTime(item.activityBeginTime),
          activityEndTime: normalizeTime(item.activityEndTime),
        }))
    } catch {
      activities.value = []
    } finally {
      activitiesLoading.value = false
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
    if (!availablePaths.value.has(GROUPBUY_LIST_PATH)) {
      ElMessage.warning('暂无活动管理页面访问权限')
      return
    }
    void router.push(GROUPBUY_LIST_PATH)
  }

  return {
    route,
    router,
    activities,
    activityId,
    activitiesLoading,
    initialized,
    now,
    availablePaths,
    activity,
    state,
    applyState,
    activityRangeText,
    applyRangeText,
    ruleText,
    loadActivities,
    syncActivityQuery,
    selectActivity,
    resolveInitialActivityId,
    goBackActivities,
  }
}