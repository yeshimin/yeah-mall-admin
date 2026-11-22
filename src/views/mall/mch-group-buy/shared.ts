import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { queryMchGroupBuyActivityList } from '@/api/mall/groupBuy'
import { getCurrentShop } from '@/utils/shop'
import {
  activityState,
  applyStatusMeta,
  clockText,
  dateOnly,
  dateTimeText,
  fullRange,
  hasRichContent,
  nowStamp,
  richTextToPlain,
  seckillAmount,
  seckillDiscount,
  seckillMoney,
  seckillNumber,
  seckillPercent,
  seckillRange,
  type PageResponse,
  type StateMeta,
} from '../seckill/insight-shared'
import {
  APPLY_TABS,
  GROUP_TABS,
  ORDER_TABS,
  groupStatusMeta,
  groupbuyApplyWindowState,
  groupbuyGroupProgress,
  groupbuyLimitText,
  groupbuyStockState,
  groupbuyStatusMeta,
  isPaidOrder,
  orderStatusMeta,
  shortTime,
  toGroupBuyPoolRow,
  type GroupBuyActivity,
  type GroupBuyApply,
  type GroupBuyApplyDetail,
  type GroupBuyGroup,
  type GroupBuyGroupDetail,
  type GroupBuyMember,
  type GroupBuyOrder,
  type GroupBuyPoolRow,
  type GroupBuyProductDetail,
  type GroupBuySku,
  type GroupBuySpu,
} from '../group-buy/groupbuy-shared'

export {
  APPLY_TABS,
  GROUP_TABS,
  ORDER_TABS,
  activityState,
  applyStatusMeta,
  clockText,
  dateOnly,
  dateTimeText,
  fullRange,
  groupStatusMeta,
  groupbuyApplyWindowState,
  groupbuyGroupProgress,
  groupbuyLimitText,
  groupbuyStockState,
  groupbuyStatusMeta,
  hasRichContent,
  isPaidOrder,
  nowStamp,
  orderStatusMeta,
  richTextToPlain,
  seckillAmount,
  seckillDiscount,
  seckillMoney,
  seckillNumber,
  seckillPercent,
  seckillRange,
  shortTime,
  toGroupBuyPoolRow,
  type GroupBuyActivity,
  type GroupBuyApply,
  type GroupBuyApplyDetail,
  type GroupBuyGroup,
  type GroupBuyGroupDetail,
  type GroupBuyMember,
  type GroupBuyOrder,
  type GroupBuyPoolRow,
  type GroupBuyProductDetail,
  type GroupBuySku,
  type GroupBuySpu,
  type PageResponse,
  type StateMeta,
}

export const MCH_GROUPBUY_ACTIVITY_PATH = '/mall/mch-group-buy/activity'
export const MCH_GROUPBUY_APPLY_PATH = '/mall/mch-group-buy/apply'
export const MCH_GROUPBUY_PRODUCT_PATH = '/mall/mch-group-buy/product'
export const MCH_GROUPBUY_ORDER_PATH = '/mall/mch-group-buy/order'

export interface MchGroupbuyApplyRow extends GroupBuyApply {
  applyTime: string
  auditTime: string
}

export interface MchGroupbuyApplySummary {
  skuCount: number
  stock: number
  minGroup: number
  maxGroup: number
  minOrigin: number
  maxOrigin: number
}

export function mchGroupbuyApplyBlockKey(activityId?: string | number, spuId?: string | number): string {
  return `${activityId ?? ''}:${spuId ?? ''}`
}

export function mchGroupbuyCanApply(activity: GroupBuyActivity | undefined | null, now: string): boolean {
  return Boolean(activity
    && activity.isEnabled !== false
    && String(activity.status ?? '') === '3'
    && groupbuyApplyWindowState(activity, now).key === 'open')
}

export function mchGroupbuyApplyActivityId(
  activities: GroupBuyActivity[],
  applies: Array<{ activityId?: string | number; auditStatus?: number | string }>,
): string {
  const pending = activities.find((activity) => applies.some(
    (apply) => String(apply.activityId ?? '') === String(activity.id) && Number(apply.auditStatus) === 1,
  ))
  if (pending) return String(pending.id)
  const open = activities.find((activity) => {
    const applyState = groupbuyApplyWindowState(activity, nowStamp())
    return Boolean(activity.isEnabled !== false && String(activity.status ?? '') === '3' && applyState.key === 'open')
  })
  if (open) return String(open.id)
  const withApply = activities.find((activity) => applies.some(
    (apply) => String(apply.activityId ?? '') === String(activity.id),
  ))
  return withApply ? String(withApply.id) : (activities[0] ? String(activities[0].id) : '')
}

export function mchGroupbuyInsightActivityId(
  activities: GroupBuyActivity[],
  applies: Array<{ activityId?: string | number; auditStatus?: number | string }>,
  orders: Array<{ activityId?: string | number }>,
  now: string,
): string {
  const ongoing = activities.find((activity) => activity.isEnabled !== false
    && activityState(activity, now).key === 'ongoing'
    && orders.some((order) => String(order.activityId ?? '') === String(activity.id)))
  if (ongoing) return String(ongoing.id)
  const withPassed = activities.find((activity) => applies.some(
    (apply) => String(apply.activityId ?? '') === String(activity.id) && Number(apply.auditStatus) === 2,
  ))
  if (withPassed) return String(withPassed.id)
  const withApply = activities.find((activity) => applies.some(
    (apply) => String(apply.activityId ?? '') === String(activity.id),
  ))
  if (withApply) return String(withApply.id)
  return activities[0] ? String(activities[0].id) : ''
}

export function mchGroupbuyAuditTab(auditStatus?: unknown): string {
  const raw = String(auditStatus ?? '').toLowerCase()
  if (['1', 'pending', '待审核'].includes(raw)) return 'pending'
  if (['2', 'passed', '审核通过'].includes(raw)) return 'passed'
  if (['3', 'rejected', '审核驳回'].includes(raw)) return 'rejected'
  return 'all'
}

export function mchGroupbuyApplySummary(apply?: GroupBuyApply | null): MchGroupbuyApplySummary {
  return {
    skuCount: Number(apply?.skuCount || 0),
    stock: Number(apply?.groupStock || 0),
    minGroup: Number(apply?.minGroupPrice || 0),
    maxGroup: Number(apply?.maxGroupPrice || 0),
    minOrigin: Number(apply?.minOriginPrice || 0),
    maxOrigin: Number(apply?.maxOriginPrice || 0),
  }
}

export function toMchGroupbuyApplyRow(apply: GroupBuyApply): MchGroupbuyApplyRow {
  const createTime = normalizeTime(apply.createTime) || ''
  const updateTime = normalizeTime(apply.updateTime) || ''
  return {
    ...apply,
    createTime,
    updateTime,
    applyTime: createTime,
    auditTime: Number(apply.auditStatus) === 1 ? '' : updateTime,
  }
}

export function normalizeTime(value?: string): string {
  return value ? String(value).replace('T', ' ') : ''
}

export function mchGroupbuyShopId(): string {
  return getCurrentShop()?.id || ''
}

export async function loadAllPages<T>(
  fetcher: (params: Record<string, unknown>) => Promise<unknown>,
  params: Record<string, unknown> = {},
  size = 500,
): Promise<T[]> {
  const rows: T[] = []
  for (let current = 1; current <= 10; current += 1) {
    const response = await fetcher({ ...params, current, size }) as PageResponse<T>
    const records = response?.data?.records || []
    rows.push(...records)
    const total = Number(response?.data?.total || 0)
    if (!records.length || rows.length >= total) break
  }
  return rows
}

interface MchGroupBuyContextOptions {
  tickMs?: number
  onRouteActivityChange?: (id: string) => void
}

/** 商家拼团三个子页共用：活动下拉 / 时钟 / 路由同步 / 返回活动列表。 */
export function useMchGroupBuyContext(options: MchGroupBuyContextOptions = {}) {
  const route = useRoute()
  const router = useRouter()

  const shopId = ref(mchGroupbuyShopId())
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
  const canApply = computed(() => mchGroupbuyCanApply(activity.value, now.value))

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
      const rows = await loadAllPages<GroupBuyActivity>((params) => queryMchGroupBuyActivityList(params))
      activities.value = rows
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
    const hasAuditStatus = route.query.auditStatus !== undefined
    if (currentId === activityId.value && currentName === name && !hasAuditStatus) return

    const query: Record<string, string> = {}
    Object.entries(route.query).forEach(([key, value]) => {
      if (typeof value === 'string' && key !== 'auditStatus') query[key] = value
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
    if (!availablePaths.value.has(MCH_GROUPBUY_ACTIVITY_PATH)) {
      ElMessage.warning('暂无活动列表页面访问权限')
      return
    }
    void router.push(MCH_GROUPBUY_ACTIVITY_PATH)
  }

  return {
    route,
    router,
    shopId,
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
    canApply,
    loadActivities,
    selectActivity,
    resolveInitialActivityId,
    goBackActivities,
  }
}