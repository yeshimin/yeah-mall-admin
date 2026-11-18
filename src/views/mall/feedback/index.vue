<template>
  <div class="mall-page feedback-page">
    <div class="fb-queue">
      <div class="fb-tabs">
        <button
          v-for="tab in FEEDBACK_TABS"
          :key="tab.key"
          type="button"
          class="fb-tab"
          :data-status="tab.key"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}<span class="fb-tab-count">{{ tabCount(tab.key) }}</span>
        </button>
      </div>
      <button
        v-if="stats.pendingOverdue > 0"
        type="button"
        class="fb-overdue-toggle"
        :class="{ active: onlyOverdue }"
        @click="toggleOverdue"
      >
        <el-icon><Clock /></el-icon>超 24 小时待处理 {{ stats.pendingOverdue }}
      </button>
    </div>

    <section class="mall-filter-panel">
      <el-form :inline="true" class="mall-query-form" @submit.prevent="search">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="反馈内容、联系方式或会员"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="反馈图片">
          <el-select v-model="filters.hasImage" clearable placeholder="全部图片">
            <el-option label="有图" :value="true" />
            <el-option label="无图" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="提交时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            range-separator="至"
            clearable
          />
        </el-form-item>
        <el-form-item class="mall-query-actions">
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" native-type="submit"><el-icon><Search /></el-icon>查询</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="mall-table-panel">
      <div class="fb-table-intro">
        <span><el-icon><ChatDotRound /></el-icon>标记已解决时必须填写平台回复，回复内容会展示在 App「我的反馈」中。</span>
        <b>当前 {{ page.total }} 条</b>
      </div>
      <el-table data-ym-table="r7" v-loading="loading" :data="records">
        <el-table-column label="会员" min-width="200">
          <template #default="{ row }">
            <div class="fb-member-cell">
              <el-avatar :size="38" :src="avatarUrl(row.avatar)">{{ memberName(row).slice(0, 1) }}</el-avatar>
              <div class="fb-member-copy">
                <strong><CopyableText :value="memberName(row)" label="会员昵称" /></strong>
                <small>ID <CopyableText :value="row.memberId" label="会员 ID" /></small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="反馈内容" min-width="300">
          <template #default="{ row }">
            <div class="fb-content-cell">
              <b class="fb-content-text" :title="row.content">{{ row.content || '-' }}</b>
              <span class="fb-content-meta">
                <span v-if="Number(row.imageCount) > 0" class="fb-image-chip">
                  <el-icon><Picture /></el-icon>{{ row.imageCount }} 张图片
                </span>
                <span v-if="isOverdue(row)" class="fb-overdue-tag">
                  <el-icon><Clock /></el-icon>超 24 小时
                </span>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联系方式" min-width="140">
          <template #default="{ row }">
            <div v-if="row.contact" class="fb-contact-cell">
              <CopyableText :value="row.contact" label="联系方式" />
            </div>
            <span v-else class="fb-muted-text">未留联系方式</span>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="170">
          <template #default="{ row }">
            <div class="fb-time-cell">
              <span>{{ formatDate(row.createTime) }}</span>
              <small class="fb-cell-sub">{{ formatClock(row.createTime) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近处理" width="170">
          <template #default="{ row }">
            <div v-if="recentHandledTime(row)" class="fb-time-cell">
              <span>{{ formatDate(recentHandledTime(row)) }}</span>
              <small class="fb-cell-sub">{{ formatClock(recentHandledTime(row)) }}</small>
            </div>
            <span v-else class="fb-muted-text">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" class-name="mall-actions-column">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button link type="primary" @click="openHandle(row)">{{ row.status === '3' ? '更新' : '处理' }}</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="fb-empty">
            <el-icon><ChatDotRound /></el-icon>
            <strong>{{ onlyOverdue ? '没有超时未处理的反馈' : '没有匹配的反馈' }}</strong>
            <span>{{ onlyOverdue ? '当前没有超过 24 小时仍未处理的反馈' : '调整筛选条件后重试' }}</span>
          </div>
        </template>
      </el-table>

      <MallPagination
        :total="page.total"
        :page="page.current"
        :limit="page.size"
        @pagination="changePage"
      />
    </section>

    <el-drawer v-model="detail.visible" class="fb-detail-drawer" size="560px">
      <template #header>
        <div class="fb-drawer-heading">
          <span>FEEDBACK DETAIL</span>
          <strong>反馈详情</strong>
        </div>
      </template>
      <div v-if="detail.row" class="fb-detail">
        <div class="fb-member-summary">
          <el-avatar :size="48" :src="avatarUrl(detail.row.avatar)">{{ memberName(detail.row).slice(0, 1) }}</el-avatar>
          <div class="fb-member-summary-copy">
            <h3>
              {{ memberName(detail.row) }}
              <el-tag :type="statusTagType(detail.row.status)" effect="light">{{ statusText(detail.row.status) }}</el-tag>
            </h3>
            <span>会员 ID <CopyableText :value="detail.row.memberId" label="会员 ID" /></span>
            <span>{{ detail.row.account || '-' }} · {{ detail.row.mobile || '-' }}</span>
          </div>
        </div>

        <div class="fb-meta-grid">
          <div>
            <span>反馈编号</span>
            <b class="fb-mono"><CopyableText :value="detail.row.id" label="反馈编号" /></b>
          </div>
          <div>
            <span>提交时间</span>
            <b>{{ detail.row.createTime || '-' }}</b>
          </div>
          <div>
            <span>联系方式</span>
            <b>{{ detail.row.contact || '未留联系方式' }}</b>
          </div>
          <div>
            <span>最近处理</span>
            <b>{{ recentHandledTime(detail.row) || '尚未处理' }}</b>
          </div>
        </div>

        <div v-if="isOverdue(detail.row)" class="fb-overdue-note">
          <el-icon><Warning /></el-icon>
          <span>该反馈已提交 {{ overdueHours(detail.row) }} 小时仍未处理，建议尽快跟进。</span>
        </div>

        <div class="fb-detail-section">
          <h3>反馈内容</h3>
          <p class="fb-detail-content">{{ detail.row.content || '-' }}</p>
        </div>

        <div v-if="detail.images.length" class="fb-detail-section">
          <h3>反馈图片 <small>共 {{ detail.images.length }} 张</small></h3>
          <div class="fb-detail-images">
            <el-image
              v-for="image in detail.images"
              :key="image"
              :src="getStoragePreviewUrl(image)"
              :preview-src-list="detail.images.map(getStoragePreviewUrl)"
              preview-teleported
              fit="cover"
              class="fb-detail-image"
            />
          </div>
        </div>

        <div class="fb-detail-section">
          <h3>平台回复</h3>
          <div v-if="detail.row.replyContent" class="fb-reply-card">
            <b>平台运营团队</b>
            <p>{{ detail.row.replyContent }}</p>
            <span>{{ detail.row.replyTime || detail.row.updateTime }}</span>
          </div>
          <p v-else class="fb-no-reply">尚未回复用户。标记已解决前必须填写平台回复，用户可在 App「我的反馈」中查看。</p>
        </div>
      </div>
      <template #footer>
        <div v-if="detail.row" class="fb-detail-actions">
          <el-button @click="detail.visible = false">关闭</el-button>
          <el-button type="primary" @click="openHandle(detail.row)">
            {{ detail.row.status === '3' ? '更新处理' : '处理反馈' }}
          </el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="handle.visible" width="600px" class="fb-handle-dialog">
      <template #header>
        <div class="fb-drawer-heading">
          <span>FEEDBACK HANDLE</span>
          <strong>{{ handle.row?.status === '3' ? '更新处理' : '处理反馈' }}</strong>
        </div>
      </template>
      <template v-if="handle.row">
        <div class="fb-handle-context">
          <el-avatar :size="38" :src="avatarUrl(handle.row.avatar)">{{ memberName(handle.row).slice(0, 1) }}</el-avatar>
          <div class="fb-handle-copy">
            <b>{{ memberName(handle.row) }}</b>
            <p>{{ handle.row.content || '-' }}</p>
            <small>提交于 {{ handle.row.createTime || '-' }}</small>
          </div>
          <el-tag :type="statusTagType(handle.row.status)" effect="light">{{ statusText(handle.row.status) }}</el-tag>
        </div>

        <div v-if="isOverdue(handle.row)" class="fb-overdue-note">
          <el-icon><Warning /></el-icon>
          <span>该反馈已超过 24 小时未处理，建议优先跟进。</span>
        </div>

        <div class="fb-status-choice">
          <button
            v-for="option in HANDLE_STATUS_OPTIONS"
            :key="option.value"
            type="button"
            :class="{ selected: handle.status === option.value }"
            @click="handle.status = option.value"
          >
            <i class="fb-choice-dot"></i>
            <span><b>{{ option.label }}</b><small>{{ option.desc }}</small></span>
          </button>
        </div>

        <div class="fb-field">
          <label>
            平台回复
            <em :class="handle.status === '3' ? 'fb-required' : 'fb-optional'">
              {{ handle.status === '3' ? '必填' : '选填' }}
            </em>
          </label>
          <el-input
            v-model="handle.reply"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="填写处理结论或给用户的建议，最多 500 字"
          />
        </div>

        <div class="fb-reply-presets">
          <span>快捷回复</span>
          <button v-for="preset in REPLY_PRESETS" :key="preset" type="button" @click="handle.reply = preset">
            {{ preset }}
          </button>
        </div>

        <p class="fb-handle-tip" :class="{ 'is-warn': handle.status === '3' && !handle.reply.trim() }">
          {{
            handle.status === '3'
              ? (handle.reply.trim()
                ? '保存后该反馈将标记为已解决，回复内容同步展示给用户。'
                : '标记已解决时必须填写平台回复。')
              : '保存后反馈进入处理中，用户可先了解到平台已受理。'
          }}
        </p>
      </template>
      <template #footer>
        <el-button @click="handle.visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="handle.loading"
          :disabled="handle.status === '3' && !handle.reply.trim()"
          @click="submitHandle"
        >
          保存处理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Clock, Picture, Search, Warning } from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import {
  getAdminFeedbackDetail,
  handleAdminFeedback,
  queryAdminFeedbacks,
  queryAdminFeedbackStats,
} from '@/api/mall/feedback'

interface FeedbackRecord {
  id: string | number
  memberId?: string | number
  nickname?: string
  account?: string
  mobile?: string
  avatar?: string
  content?: string
  contact?: string
  status?: string
  replyContent?: string
  replyTime?: string
  imageCount?: number
  createTime?: string
  updateTime?: string
}

interface FeedbackPageResponse {
  data?: {
    records?: FeedbackRecord[]
    total?: number | string
  }
}

interface FeedbackStatsResponse {
  data?: {
    total?: number | string
    pending?: number | string
    processing?: number | string
    resolved?: number | string
    pendingOverdue?: number | string
  }
}

defineOptions({ name: 'MallFeedbackManage' })

const FEEDBACK_TABS = [
  { key: 'all', label: '全部' },
  { key: '1', label: '待处理' },
  { key: '2', label: '处理中' },
  { key: '3', label: '已解决' },
]

const HANDLE_STATUS_OPTIONS: Array<{ value: '2' | '3'; label: string; desc: string }> = [
  { value: '2', label: '处理中', desc: '已受理该反馈，可稍后补充平台回复' },
  { value: '3', label: '已解决', desc: '需填写回复，用户可在 App 查看处理结果' },
]

const REPLY_PRESETS = [
  '感谢反馈，我们已记录并安排排查。',
  '问题已处理完成，请更新至最新版本后重试。',
  '该建议已纳入后续迭代计划，感谢你的建议。',
]

const loading = ref(false)
const records = ref<FeedbackRecord[]>([])
const activeTab = ref('all')
const onlyOverdue = ref(false)
const filters = reactive({
  keyword: '',
  hasImage: undefined as boolean | undefined,
  dateRange: [] as string[],
})
const applied = reactive({
  keyword: '',
  hasImage: undefined as boolean | undefined,
  createStart: undefined as string | undefined,
  createEnd: undefined as string | undefined,
})
const stats = reactive({
  total: 0,
  pending: 0,
  processing: 0,
  resolved: 0,
  pendingOverdue: 0,
})
const page = reactive({ current: 1, size: 10, total: 0 })
const detail = reactive({
  visible: false,
  row: null as FeedbackRecord | null,
  images: [] as string[],
})
const handle = reactive({
  visible: false,
  loading: false,
  row: null as FeedbackRecord | null,
  status: '2' as '2' | '3',
  reply: '',
})

function memberName(row?: FeedbackRecord | null) {
  if (!row) return '-'
  return row.nickname || row.account || `会员${row.memberId ?? ''}`
}

function avatarUrl(key?: string) {
  return key ? getStoragePreviewUrl(key) : ''
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : '-'
}

function formatClock(value?: string) {
  return value && value.length > 10 ? value.slice(11, 19) : ''
}

function statusText(status?: string) {
  return ({ '1': '待处理', '2': '处理中', '3': '已解决' } as Record<string, string>)[String(status)] || '-'
}

function statusTagType(status?: string) {
  return ({ '1': 'warning', '2': 'info', '3': 'success' } as Record<string, string>)[String(status)] || 'info'
}

function isOverdue(row?: FeedbackRecord | null) {
  if (!row || String(row.status) !== '1' || !row.createTime) return false
  const time = new Date(String(row.createTime).replace(/-/g, '/')).getTime()
  return Date.now() - time >= 24 * 60 * 60 * 1000
}

function overdueHours(row?: FeedbackRecord | null) {
  if (!row?.createTime) return 0
  const time = new Date(String(row.createTime).replace(/-/g, '/')).getTime()
  return Math.max(0, Math.floor((Date.now() - time) / 3600000))
}

function recentHandledTime(row?: FeedbackRecord | null) {
  if (!row || String(row.status) === '1') return ''
  return row.replyTime || row.updateTime || ''
}

function tabCount(key: string) {
  if (key === 'all') return stats.total
  if (key === '1') return stats.pending
  if (key === '2') return stats.processing
  return stats.resolved
}

function buildQuery() {
  return {
    keyword: applied.keyword || undefined,
    hasImage: applied.hasImage,
    createStart: applied.createStart,
    createEnd: applied.createEnd,
  }
}

async function loadStats() {
  try {
    const result = await queryAdminFeedbackStats(buildQuery()) as FeedbackStatsResponse
    const data = result.data || {}
    stats.total = Number(data.total || 0)
    stats.pending = Number(data.pending || 0)
    stats.processing = Number(data.processing || 0)
    stats.resolved = Number(data.resolved || 0)
    stats.pendingOverdue = Number(data.pendingOverdue || 0)
  } catch {
    // 统计失败不影响列表查询。
  }
}

async function load(reset = false) {
  if (reset) page.current = 1
  loading.value = true
  try {
    const result = await queryAdminFeedbacks({
      ...buildQuery(),
      status: activeTab.value === 'all' ? undefined : activeTab.value,
      overdue: onlyOverdue.value || undefined,
      current: page.current,
      size: page.size,
    }) as FeedbackPageResponse
    records.value = result.data?.records || []
    page.total = Number(result.data?.total || 0)
  } finally {
    loading.value = false
  }
}

function changePage(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
  load()
}

function switchTab(key: string) {
  activeTab.value = key
  if (key !== '1') onlyOverdue.value = false
  load(true)
}

function toggleOverdue() {
  if (!onlyOverdue.value) activeTab.value = '1'
  onlyOverdue.value = !onlyOverdue.value
  load(true)
}

function search() {
  applied.keyword = filters.keyword.trim()
  applied.hasImage = typeof filters.hasImage === 'boolean' ? filters.hasImage : undefined
  const [createStart, createEnd] = filters.dateRange || []
  applied.createStart = createStart
  applied.createEnd = createEnd
  void loadStats()
  load(true)
}

function resetFilters() {
  filters.keyword = ''
  filters.hasImage = undefined
  filters.dateRange = []
  activeTab.value = 'all'
  onlyOverdue.value = false
  search()
}

async function openDetail(row: FeedbackRecord) {
  detail.row = row
  detail.images = []
  detail.visible = true
  try {
    const result: any = await getAdminFeedbackDetail(row.id)
    detail.row = { ...row, ...(result.data?.feedback || {}) }
    detail.images = result.data?.images || []
  } catch {
    // 详情请求失败时保留列表行数据。
  }
}

function openHandle(row: FeedbackRecord) {
  detail.visible = false
  handle.row = row
  handle.status = row.status === '3' ? '3' : '2'
  handle.reply = row.replyContent || ''
  handle.visible = true
}

async function submitHandle() {
  if (!handle.row) return
  const replyContent = handle.reply.trim()
  if (handle.status === '3' && !replyContent) return
  handle.loading = true
  try {
    await handleAdminFeedback({
      feedbackId: handle.row.id,
      status: handle.status,
      replyContent,
    })
    ElMessage.success(handle.status === '3' ? '反馈已标记为已解决' : '反馈已更新为处理中')
    handle.visible = false
    try {
      await Promise.all([load(), loadStats()])
    } catch {
      // 刷新失败不影响已成功的处理结果提示。
    }
  } finally {
    handle.loading = false
  }
}

onMounted(() => {
  void loadStats()
  load()
})
</script>

<style scoped>
.fb-queue {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 8px;
  padding: 0 2px;
}

.fb-tabs {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
}

.fb-tabs::-webkit-scrollbar {
  display: none;
}

.fb-tab {
  display: inline-flex;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  padding: 0 11px;
  color: var(--mall-muted);
  border: 0;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
}

.fb-tab:hover {
  color: var(--mall-ink);
  background: #fff;
}

.fb-tab.active {
  color: var(--mall-brand);
  background: var(--mall-brand-soft);
  font-weight: 600;
}

.fb-tab-count {
  display: inline-grid;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  place-items: center;
  color: var(--mall-muted);
  border-radius: 9px;
  background: rgba(23, 37, 31, 0.06);
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.fb-tab[data-status='1'] .fb-tab-count {
  color: #a06616;
  background: #fbf1df;
}

.fb-tab[data-status='1'].active .fb-tab-count {
  color: #fff;
  background: #c98a2e;
}

.fb-tab.active .fb-tab-count {
  color: #fff;
  background: var(--mall-brand);
}

.fb-overdue-toggle {
  display: inline-flex;
  height: 30px;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  color: var(--mall-price);
  border: 1px solid #e7bfbb;
  border-radius: 6px;
  background: #fcf1ef;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.fb-overdue-toggle:hover {
  border-color: var(--mall-price);
}

.fb-overdue-toggle.active {
  color: #fff;
  border-color: var(--mall-price);
  background: var(--mall-price);
}

.feedback-page :deep(.mall-query-form .el-input) {
  width: 260px;
}

.feedback-page :deep(.mall-query-form .el-select) {
  width: 130px;
}

.feedback-page :deep(.el-date-editor--daterange) {
  width: 260px;
}

.fb-table-intro {
  display: flex;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  color: var(--mall-muted);
  border-bottom: 1px solid var(--mall-line);
  background: #fbfdfb;
  font-size: 11px;
  line-height: 1.5;
}

.fb-table-intro > span {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.fb-table-intro .el-icon {
  flex: 0 0 auto;
  color: var(--mall-brand);
}

.fb-table-intro > b {
  flex: 0 0 auto;
  color: var(--mall-ink-secondary);
  font-size: 11px;
  font-weight: 600;
}

.fb-member-cell {
  display: flex;
  width: 220px;
  max-width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  margin: 0 auto;
  text-align: left;
}

.fb-member-cell :deep(.el-avatar) {
  flex: 0 0 auto;
  color: var(--mall-brand);
  background: var(--mall-brand-soft);
  font-size: 12px;
  font-weight: 600;
}

.fb-member-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}

.fb-member-copy strong {
  overflow: hidden;
  color: var(--mall-ink);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fb-member-copy > small {
  color: var(--mall-muted);
  font-family: var(--ym-font-mono, monospace);
  font-size: 10px;
  white-space: nowrap;
}

.fb-member-copy :deep(.copyable-text) {
  color: inherit;
  font: inherit;
}

.fb-content-cell {
  display: flex;
  width: 100%;
  max-width: 360px;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin: 0 auto;
  text-align: left;
}

.fb-content-text {
  display: block;
  width: 100%;
  overflow: hidden;
  color: var(--mall-ink);
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fb-content-meta {
  display: flex;
  max-width: 100%;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-bottom: 6px;
  color: var(--mall-muted);
  font-size: 10px;
}

.fb-image-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  color: #306b7c;
  border-radius: 4px;
  background: #edf4f6;
  font-size: 10px;
}

.fb-overdue-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  color: var(--mall-price);
  border-radius: 4px;
  background: #fcf1ef;
  font-size: 10px;
  font-weight: 600;
}

.fb-contact-cell {
  display: flex;
  width: max-content;
  max-width: 100%;
  min-width: 0;
  margin: 0 auto;
  flex-direction: column;
  align-items: flex-start;
  overflow: hidden;
  text-align: left;
}

.fb-contact-cell :deep(.copyable-text) {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fb-muted-text {
  color: var(--mall-muted);
  font-size: 11px;
}

.fb-time-cell {
  display: flex;
  width: max-content;
  margin: 0 auto;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
}

.fb-time-cell > span {
  color: var(--mall-ink);
  font-size: 12px;
}

.fb-cell-sub {
  color: var(--mall-muted);
  font-family: var(--ym-font-mono, monospace);
  font-size: 10px;
}

.fb-empty {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  color: var(--mall-muted);
}

.fb-empty .el-icon {
  margin-bottom: 3px;
  color: var(--mall-brand);
  font-size: 28px;
}

.fb-empty strong {
  color: var(--mall-ink);
  font-size: 13px;
}

.fb-empty span {
  font-size: 12px;
}

.fb-drawer-heading {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.fb-drawer-heading span {
  color: #24634f;
  font-family: var(--ym-font-mono, monospace);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.fb-drawer-heading strong {
  color: #17251f;
  font-size: 19px;
}

.fb-detail {
  display: flex;
  flex-direction: column;
}

.fb-member-summary {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 0 0 18px;
  border-bottom: 1px solid #e4e9e5;
}

.fb-member-summary :deep(.el-avatar) {
  color: #24634f;
  background: #e8f2ed;
  font-weight: 600;
}

.fb-member-summary-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.fb-member-summary h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 2px;
  color: #17251f;
  font-size: 15px;
}

.fb-member-summary-copy > span {
  overflow: hidden;
  color: #65726a;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fb-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px 16px;
  padding: 16px 0;
  border-bottom: 1px solid #e4e9e5;
}

.fb-meta-grid > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.fb-meta-grid span {
  color: #65726a;
  font-size: 11px;
}

.fb-meta-grid b {
  overflow: hidden;
  color: #30423a;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fb-mono {
  font-family: var(--ym-font-mono, monospace);
}

.fb-overdue-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 12px;
  color: #8f4b40;
  border: 1px solid #ecc9c3;
  border-radius: 7px;
  background: #fcf1ef;
  font-size: 11px;
  line-height: 1.5;
}

.fb-overdue-note .el-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: #be412b;
}

.fb-detail-section {
  margin-top: 18px;
}

.fb-detail-section h3 {
  margin: 0 0 8px;
  color: #17251f;
  font-size: 13px;
}

.fb-detail-section h3 small {
  margin-left: 4px;
  color: #65726a;
  font-size: 10px;
  font-weight: 400;
}

.fb-detail-content {
  margin: 0;
  padding: 12px 14px;
  color: #30423a;
  border-radius: 7px;
  background: #f4f6f3;
  font-size: 12px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.fb-detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.fb-detail-image {
  width: 92px;
  height: 92px;
  border-radius: 8px;
}

.fb-reply-card {
  padding: 12px 14px;
  border: 1px solid #cfe0d6;
  border-radius: 7px;
  background: #e8f2ed;
}

.fb-reply-card b {
  display: block;
  color: #24634f;
  font-size: 11px;
}

.fb-reply-card p {
  margin: 6px 0;
  color: #30423a;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.fb-reply-card span {
  color: #65726a;
  font-size: 10px;
}

.fb-no-reply {
  margin: 0;
  color: #65726a;
  font-size: 12px;
  line-height: 1.6;
}

.fb-detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.fb-handle-context {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: start;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e4e9e5;
  border-radius: 7px;
  background: #fbfdfb;
}

.fb-handle-context :deep(.el-avatar) {
  color: #24634f;
  background: #e8f2ed;
  font-weight: 600;
}

.fb-handle-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.fb-handle-copy b {
  color: #17251f;
  font-size: 12px;
}

.fb-handle-copy p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #30423a;
  font-size: 11px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.fb-handle-copy small {
  color: #65726a;
  font-size: 10px;
}

.fb-status-choice {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.fb-status-choice button {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 11px 12px;
  text-align: left;
  border: 1px solid #e4e9e5;
  border-radius: 7px;
  background: #fff;
  cursor: pointer;
}

.fb-status-choice button:hover {
  border-color: #c8d4cc;
}

.fb-status-choice button.selected {
  border-color: #24634f;
  background: #e8f2ed;
  box-shadow: 0 0 0 2px rgba(36, 99, 79, 0.1);
}

.fb-choice-dot {
  width: 15px;
  height: 15px;
  flex: 0 0 15px;
  margin-top: 2px;
  border: 1.5px solid #c8d4cc;
  border-radius: 50%;
  background: #fff;
}

.fb-status-choice button.selected .fb-choice-dot {
  border: 4.5px solid #24634f;
}

.fb-status-choice button > span {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.fb-status-choice b {
  color: #17251f;
  font-size: 13px;
}

.fb-status-choice small {
  color: #65726a;
  font-size: 11px;
  line-height: 1.5;
}

.fb-field {
  margin-top: 14px;
}

.fb-field label {
  display: block;
  margin-bottom: 6px;
  color: #30423a;
  font-size: 12px;
  font-weight: 600;
}

.fb-required {
  color: #be412b;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
}

.fb-optional {
  color: #65726a;
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
}

.fb-reply-presets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.fb-reply-presets > span {
  color: #65726a;
  font-size: 10px;
}

.fb-reply-presets button {
  min-height: 24px;
  padding: 0 8px;
  color: #30423a;
  border: 1px solid #e4e9e5;
  border-radius: 5px;
  background: #fff;
  font-size: 10px;
  cursor: pointer;
}

.fb-reply-presets button:hover {
  color: #24634f;
  border-color: #24634f;
  background: #e8f2ed;
}

.fb-handle-tip {
  margin: 9px 0 0;
  color: #65726a;
  font-size: 10px;
  line-height: 1.5;
}

.fb-handle-tip.is-warn {
  color: #be412b;
}
</style>
