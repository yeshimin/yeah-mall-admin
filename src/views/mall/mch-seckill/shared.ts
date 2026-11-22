export interface SeckillActivity {
  id: string | number
  name: string
  description?: string
  coverImage?: string
  applyBeginTime?: string
  applyEndTime?: string
  activityBeginTime?: string
  activityEndTime?: string
  status?: string | number
  sort?: number
  sessionCount?: number
  firstSessionName?: string
  applyCount?: number
  pendingCount?: number
  passedCount?: number
  rejectedCount?: number
}

export interface SeckillSession {
  id: string | number
  activityId?: string | number
  name: string
  beginTime: string
  endTime: string
  sort?: number
  isEnabled?: boolean
}

export interface SeckillApply {
  applyId: string | number
  id?: string | number
  activityId: string | number
  activityName?: string
  sessionId: string | number
  sessionName?: string
  sessionBeginTime?: string
  sessionEndTime?: string
  spuId: string | number
  seckillSpuId?: string | number
  spuName: string
  mainImage?: string
  detailDesc?: string
  auditStatus?: number
  applyRemark?: string
  auditRemark?: string
  applyTime?: string
  auditTime?: string
}

export interface SeckillProduct {
  id: string | number
  applyId?: string | number
  activityId: string | number
  activityName?: string
  sessionId: string | number
  sessionName?: string
  sessionBeginTime?: string
  sessionEndTime?: string
  spuId?: string | number
  name: string
  mainImage?: string
  sales?: number
  stock?: number
  skuCount?: number
  minOriginPrice?: number | string
  maxOriginPrice?: number | string
  minSeckillPrice?: number | string
  maxSeckillPrice?: number | string
  salesAmount?: number | string
  auditStatus?: number
  applyRemark?: string
  auditRemark?: string
  detailDesc?: string
  applyTime?: string
  auditTime?: string
}

export interface SeckillSkuItem {
  id: string | number
  skuId?: string | number
  name: string
  specCode?: string
  originPrice?: number | string
  seckillPrice?: number | string
  stock?: number
  mainImage?: string
}

export interface ProductOption {
  id: string | number
  name: string
  subtitle?: string
  categoryName?: string
  mainImage?: string
  detailDesc?: string
}

export interface ProductSkuOption {
  id: string | number
  spuId: string | number
  name: string
  specCode?: string
  price?: number | string
  stock?: number
  mainImage?: string
}

export interface ActivityMeta {
  label: string
  tone: string
  hint: string
}

const ACTIVITY_META: Record<string, ActivityMeta> = {
  '2': { label: '已发布', tone: 'info', hint: '报名未开始' },
  '3': { label: '报名中', tone: 'success', hint: '可提交商品报名' },
  '4': { label: '报名结束', tone: 'neutral', hint: '等待活动开始' },
  '5': { label: '进行中', tone: 'warning', hint: '活动进行中' },
  '6': { label: '已结束', tone: 'neutral', hint: '活动已结束' },
}

const AUDIT_META: Record<string, { label: string; tone: string }> = {
  '1': { label: '待审核', tone: 'warning' },
  '2': { label: '审核通过', tone: 'success' },
  '3': { label: '审核驳回', tone: 'danger' },
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function activityMeta(status?: string | number): ActivityMeta {
  return ACTIVITY_META[String(status)] || { label: '—', tone: 'neutral', hint: '' }
}

export function auditMeta(status?: string | number) {
  return AUDIT_META[String(status)] || { label: '—', tone: 'neutral' }
}

export function blockKey(sessionId?: string | number, spuId?: string | number) {
  return `${sessionId ?? ''}:${spuId ?? ''}`
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function parseDate(value?: string | null) {
  if (!value) return null
  const text = String(value).trim()
  if (!text) return null
  const date = new Date(text.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

export function shortTime(value?: string | null) {
  if (!value) return '—'
  const date = parseDate(value)
  if (date) return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  const matched = String(value).match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
  return matched ? `${matched[2]}-${matched[3]} ${matched[4]}:${matched[5]}` : String(value)
}

export function clockTime(value?: string | null) {
  if (!value) return '—'
  const date = parseDate(value)
  if (date) return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  const matched = String(value).match(/(\d{2}):(\d{2})/)
  return matched ? `${matched[1]}:${matched[2]}` : '—'
}

export function dateTime(value?: string | null) {
  if (!value) return '—'
  const text = String(value).trim()
  const normalized = text.replace('T', ' ')
  return normalized.length >= 19 ? normalized.slice(0, 19) : normalized || '—'
}

export function minuteTime(value?: string | null) {
  const text = dateTime(value)
  return text === '—' ? text : text.slice(0, 16)
}

export function dateRange(begin?: string | null, end?: string | null) {
  return `${minuteTime(begin)} 至 ${minuteTime(end)}`
}

export function weekday(value?: string | null) {
  const date = parseDate(value)
  return date ? WEEKDAYS[date.getDay()] : ''
}

export function money(value?: number | string | null) {
  return `¥${Number(value || 0).toFixed(2)}`
}

export function priceRange(min?: number | string | null, max?: number | string | null) {
  const low = Number(min || 0)
  const high = Number(max || 0)
  if (!low && !high) return '—'
  return !high || low === high ? money(low) : `${money(low)} – ${money(high)}`
}

export function percent(value?: number | string | null, total?: number | string | null) {
  const count = Number(value || 0)
  const sum = Number(total || 0)
  return sum > 0 ? Math.min(100, Math.round((count / sum) * 100)) : 0
}

export function stripHtml(value?: string | null) {
  return String(value || '').replace(/<[^>]+>/g, '').trim()
}

export function asNumber(value?: number | string | null) {
  return Number(value || 0)
}

export function textOr(value?: string | number | null, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}