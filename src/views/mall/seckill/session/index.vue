<template>
  <div class="mall-page ss-session-page">
    <div class="ss-activity-bar">
      <span class="ss-activity-icon"><el-icon><Lightning /></el-icon></span>
      <div class="ss-activity-copy">
        <div class="ss-activity-title">
          <h2>{{ activity?.name || (activitiesLoading ? '加载中…' : '暂无秒杀活动') }}</h2>
          <span v-if="activity" class="ss-status-ticket" :class="`tone-${activityState.tone}`">
            {{ activityState.label }}
          </span>
        </div>
        <div class="ss-activity-meta">
          <template v-if="activity">
            <span><el-icon><Calendar /></el-icon>活动时间 {{ activityRangeText }}</span>
            <span><el-icon><Clock /></el-icon>共 {{ activitySessions.length }} 个场次</span>
            <span><el-icon><Goods /></el-icon>参与商品 {{ productTotal }} 件</span>
          </template>
          <span v-else>请先在活动管理中创建秒杀活动，再配置场次。</span>
        </div>
      </div>
      <div class="ss-activity-controls">
        <label class="ss-activity-switch">
          <span>切换活动</span>
          <el-select
            v-model="activityId"
            class="ss-activity-select"
            placeholder="选择活动"
            filterable
            :disabled="activitiesLoading || !activities.length"
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
          v-for="tab in SESSION_TABS"
          :key="tab.key"
          type="button"
          :data-status="tab.key"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}<span class="ss-tab-count">{{ stateCounts[tab.key] }}</span>
        </button>
      </div>
      <div class="ss-queue-summary">
        <span><i class="ss-live-dot"></i>已启用 <b>{{ enabledCount }}</b> 场</span>
        <span><el-icon><Goods /></el-icon>参与商品 <b>{{ productTotal }}</b> 件</span>
      </div>
    </div>

    <section class="mall-filter-panel">
      <el-form :inline="true" class="mall-query-form" @submit.prevent="applyFilters">
        <el-form-item label="场次名称">
          <el-input
            v-model="filters.name"
            class="ss-filter-name"
            clearable
            placeholder="场次名称或备注"
            @keyup.enter="applyFilters"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-select v-model="filters.enabled" class="ss-filter-enabled" placeholder="全部状态">
            <el-option label="全部状态" value="all" />
            <el-option label="已启用" value="on" />
            <el-option label="已停用" value="off" />
          </el-select>
        </el-form-item>
        <el-form-item label="场次日期">
          <el-date-picker
            v-model="filters.date"
            class="ss-filter-date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择场次日期"
            clearable
          />
        </el-form-item>
        <el-form-item class="mall-query-actions">
          <el-button @click="resetFilters"><el-icon><Refresh /></el-icon>重置</el-button>
          <el-button type="primary" native-type="submit"><el-icon><Search /></el-icon>查询</el-button>
        </el-form-item>
      </el-form>
      <div class="mall-business-actions">
        <el-button type="primary" :disabled="!activity" @click="openCreate">
          <el-icon><Plus /></el-icon>新增场次
        </el-button>
      </div>
    </section>

    <section class="mall-table-panel">
      <div class="ss-table-intro">
        <span><el-icon><Warning /></el-icon>{{ tableIntroText }}</span>
        <b>当前 {{ filteredRows.length }} 场</b>
      </div>
      <el-table data-ym-table="r52"
        v-loading="sessionsLoading"
        :data="pagedRows"
        :row-class-name="sessionRowClass"
        class="ss-session-table"
      >
        <el-table-column label="场次" min-width="220" align="center">
          <template #default="{ row }">
            <div class="ss-session-cell">
              <span class="ss-sort-chip">{{ sortChip(row.sort) }}</span>
              <div>
                <b :title="row.name">{{ row.name || '未命名场次' }}</b>
                <small :title="row.remark || '未填写备注'">
                  {{ row.remark || '未填写备注' }} · 排序 {{ row.sort ?? '—' }}
                </small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="场次时间" min-width="205" align="center">
          <template #default="{ row }">
            <div class="ss-time-cell">
              <span class="ss-date-line">{{ shortDate(row.beginTime) }}<em>{{ weekdayOf(row.beginTime) }}</em></span>
              <b :title="fullSessionRange(row)">{{ timeRangeText(row) }}</b>
              <small>时长 {{ durationText(row.beginTime, row.endTime) || '—' }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时间状态" min-width="110" align="center">
          <template #default="{ row }">
            <span class="ss-status-ticket" :class="`tone-${sessionState(row).tone}`">
              <span class="ss-status-live">
                <i v-if="sessionState(row).key === 'ongoing'" class="ss-live-dot"></i>{{ sessionState(row).label }}
              </span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="启用" min-width="96" align="center">
          <template #default="{ row }">
            <button
              type="button"
              class="ss-toggle"
              :class="{ 'is-on': row.isEnabled, 'is-busy': isToggleBusy(row) }"
              role="switch"
              :aria-checked="row.isEnabled"
              :disabled="isToggleBusy(row)"
              :title="row.isEnabled ? '点击停用：App 端将不再展示该场次' : '点击启用：App 端将展示该场次'"
              @click="toggleEnabled(row)"
            >
              <span class="ss-toggle-track"><i></i></span>{{ row.isEnabled ? '已启用' : '已停用' }}
            </button>
          </template>
        </el-table-column>
        <el-table-column label="商品数" min-width="90" align="center">
          <template #default="{ row }">
            <span class="ss-product-count" :class="{ 'is-zero': !row.productCount }">
              <b>{{ row.productCount }}</b>件
            </span>
          </template>
        </el-table-column>
        <el-table-column label="最近更新" min-width="130" align="center">
          <template #default="{ row }">
            <div v-if="row.updateTime" class="ss-time-stamp">
              <span>{{ dateOnly(row.updateTime) }}</span>
              <small>{{ clockOnly(row.updateTime) }}</small>
            </div>
            <span v-else class="ss-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="right" header-align="center" class-name="ss-actions-column">
          <template #default="{ row }">
            <div class="ss-row-actions">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="primary" @click="openCopy(row)">复制</el-button>
              <el-button link type="primary" class="ss-danger-link" @click="openDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="ss-empty">
            <el-icon><Clock /></el-icon>
            <b>{{ emptyTitle }}</b>
            <span>{{ emptyDescription }}</span>
          </div>
        </template>
      </el-table>

      <MallPagination
        :total="filteredRows.length"
        :page="page.current"
        :limit="page.size"
        @pagination="changePage"
      />
    </section>

    <el-dialog
      v-model="editorVisible"
      width="720px"
      class="ss-session-dialog"
      :close-on-click-modal="false"
      :close-on-press-escape="!saving"
      :show-close="!saving"
    >
      <template #header>
        <div class="ss-dialog-heading">
          <span>{{ editorKicker }}</span>
          <h2>{{ editorTitle }}</h2>
        </div>
      </template>
      <template v-if="editor && activity">
        <div class="ss-dialog-context">
          <span class="ss-context-icon"><el-icon><Lightning /></el-icon></span>
          <div>
            <b>{{ activity.name }}</b>
            <small>活动时间 {{ activityRangeText }}</small>
          </div>
          <span class="ss-status-ticket" :class="`tone-${activityState.tone}`">{{ activityState.label }}</span>
        </div>
        <div v-if="editor.mode === 'copy'" class="ss-form-hint">
          <el-icon><Warning /></el-icon>
          <span>副本时间已顺延 1 天，请确认仍在活动时间内且不与其他场次重叠后再保存。</span>
        </div>
        <div class="ss-form-grid">
          <label class="wide">
            <span>场次名称<em>*</em></span>
            <el-input v-model="editor.name" maxlength="30" show-word-limit placeholder="例如：晚八点场" />
          </label>
          <label>
            <span>开始时间<em>*</em></span>
            <el-date-picker
              v-model="editor.beginTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              format="YYYY-MM-DD HH:mm"
              placeholder="选择开始时间"
              :disabled-date="disabledSessionDate"
            />
          </label>
          <label>
            <span>结束时间<em>*</em></span>
            <el-date-picker
              v-model="editor.endTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              format="YYYY-MM-DD HH:mm"
              placeholder="选择结束时间"
              :disabled-date="disabledSessionDate"
            />
          </label>
          <div class="ss-presets wide">
            <span>快捷时段</span>
            <button
              v-for="preset in SESSION_PRESETS"
              :key="preset.label"
              type="button"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </button>
            <small>按开始日期填充</small>
          </div>
          <label>
            <span>排序</span>
            <el-input-number v-model="editor.sort" :min="1" :max="999" :step="1" controls-position="right" />
          </label>
          <label>
            <span>启用状态</span>
            <el-select v-model="editor.isEnabled">
              <el-option label="启用" :value="true" />
              <el-option label="停用" :value="false" />
            </el-select>
          </label>
          <label class="wide">
            <span>备注</span>
            <el-input
              v-model="editor.remark"
              type="textarea"
              :rows="2"
              maxlength="100"
              show-word-limit
              placeholder="选填，用于说明场次用途或运营策略"
            />
          </label>
        </div>
        <div
          class="ss-form-hint"
          :class="{ 'is-error': draftValidation.errors.length, 'is-ok': !draftValidation.errors.length && draftValidation.ready }"
          aria-live="polite"
        >
          <el-icon><component :is="draftHintIcon" /></el-icon>
          <span>{{ draftHint }}</span>
        </div>
      </template>
      <template #footer>
        <div class="ss-dialog-actions">
          <el-button :disabled="saving" @click="editorVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" :disabled="!canSave" @click="saveSession">保存场次</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="deletingVisible"
      width="480px"
      class="ss-delete-dialog"
      :close-on-click-modal="false"
      :close-on-press-escape="!deleteBusy"
      :show-close="!deleteBusy"
    >
      <template #header>
        <div class="ss-dialog-heading">
          <span>DELETE SESSION</span>
          <h2>{{ deleting?.productCount ? '无法删除场次' : '删除场次' }}</h2>
        </div>
      </template>
      <template v-if="deleting">
        <div class="ss-delete-warning" :class="{ 'is-plain': !deleting.productCount }">
          <el-icon><component :is="deleting.productCount ? Warning : Clock" /></el-icon>
          <div v-if="deleting.productCount">
            <b>该场次下仍关联 {{ deleting.productCount }} 件秒杀商品</b>
            <p>请先在「商品管理」中移除或调整这些商品的场次后再删除，避免商品数据失去关联。</p>
          </div>
          <div v-else>
            <b>确定删除「{{ deleting.name }}」？</b>
            <p>删除后不可恢复；若只是暂停展示，可在列表中直接停用该场次。</p>
          </div>
        </div>
        <div class="ss-delete-meta">
          <span>场次时间</span><b>{{ fullSessionRange(deleting) }}</b>
          <span>商品数</span><b>{{ deleting.productCount }} 件</b>
        </div>
      </template>
      <template #footer>
        <div class="ss-dialog-actions">
          <el-button :disabled="deleteBusy" @click="deletingVisible = false">
            {{ deleting?.productCount ? '关闭' : '取消' }}
          </el-button>
          <el-button v-if="deleting?.productCount" type="primary" :disabled="deleteBusy" @click="goProductFromDelete">
            去商品管理
          </el-button>
          <el-button v-else type="danger" :loading="deleteBusy" @click="confirmDelete">确认删除</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Back,
  Calendar,
  CircleCheck,
  Clock,
  Goods,
  Lightning,
  Plus,
  Refresh,
  Search,
  Warning,
} from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import {
  createSeckillSession,
  deleteSeckillSession,
  getSeckillSessionProductCounts,
  querySeckillActivityList,
  querySeckillSessionList,
  updateSeckillSession,
  updateSeckillSessionEnabled,
} from '@/api/mall/seckill'

defineOptions({ name: 'MallSeckillSessionManage' })

type SessionStateKey = 'upcoming' | 'ongoing' | 'ended'
type SessionTabKey = 'all' | SessionStateKey
type StatusTone = 'info' | 'success' | 'neutral'

interface SeckillActivityRecord {
  id: string | number
  name?: string
  activityBeginTime?: string
  activityEndTime?: string
}

interface SeckillSessionRecord {
  id: string | number
  activityId?: string | number
  name?: string
  beginTime?: string
  endTime?: string
  sort?: number | string
  isEnabled?: boolean
  remark?: string
  updateTime?: string
  createTime?: string
  productCount: number
}

interface SessionState {
  key: SessionStateKey
  label: string
  tone: StatusTone
}

interface SessionDraft {
  mode: 'create' | 'edit' | 'copy'
  id: string | number | null
  name: string
  beginTime: string
  endTime: string
  sort?: number
  isEnabled: boolean
  remark: string
}

interface PageResponse<T> {
  data?: {
    records?: T[]
    total?: number | string
  }
}

interface DataResponse<T> {
  data?: T
}

const SESSION_TABS: Array<{ key: SessionTabKey; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'upcoming', label: '未开始' },
  { key: 'ongoing', label: '进行中' },
  { key: 'ended', label: '已结束' },
]

const SESSION_PRESETS = [
  { label: '10:00 – 12:00', begin: '10:00', end: '12:00' },
  { label: '14:00 – 16:00', begin: '14:00', end: '16:00' },
  { label: '20:00 – 22:00', begin: '20:00', end: '22:00' },
]

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const route = useRoute()
const router = useRouter()

const activities = ref<SeckillActivityRecord[]>([])
const activityId = ref('')
const sessions = ref<SeckillSessionRecord[]>([])
const activitiesLoading = ref(false)
const sessionsLoading = ref(false)
const initialized = ref(false)
const now = ref(nowStamp())

const activeTab = ref<SessionTabKey>('all')
const filters = reactive({
  name: '',
  enabled: 'all',
  date: '',
})
const applied = reactive({
  name: '',
  enabled: 'all',
  date: '',
})
const page = reactive({ current: 1, size: 10 })

const editor = ref<SessionDraft | null>(null)
const saving = ref(false)
const deleting = ref<SeckillSessionRecord | null>(null)
const deleteBusy = ref(false)
const toggleBusyIds = ref<string[]>([])

let loadToken = 0
let nowTimer: number | null = null

const availablePaths = computed(() => new Set(router.getRoutes().map((item) => item.path)))

const activity = computed(() => {
  const current = activities.value.find((item) => String(item.id) === activityId.value)
  if (current) return current
  return activities.value.find((item) => String(item.id) === defaultActivityId()) || activities.value[0]
})

const activityState = computed(() => resolveActivityState(activity.value))
const activityRangeText = computed(() => {
  const begin = activity.value?.activityBeginTime
  const end = activity.value?.activityEndTime
  if (begin && end) return `${formatDateTime(begin)} 至 ${formatDateTime(end)}`
  if (begin) return `${formatDateTime(begin)} 起（结束时间待设置）`
  if (end) return `截至 ${formatDateTime(end)}`
  return '待设置'
})
const activityWindowReady = computed(() => Boolean(activity.value?.activityBeginTime && activity.value?.activityEndTime))

const activitySessions = computed(() => sessions.value)
const sortedSessions = computed(() => {
  return [...activitySessions.value].sort((a, b) => {
    const timeCompare = String(a.beginTime || '').localeCompare(String(b.beginTime || ''))
    if (timeCompare !== 0) return timeCompare
    return Number(a.sort || 0) - Number(b.sort || 0)
  })
})

const enabledCount = computed(() => activitySessions.value.filter((row) => row.isEnabled).length)
const productTotal = computed(() => activitySessions.value.reduce((total, row) => total + row.productCount, 0))
const nextSort = computed(() => Math.min(999, activitySessions.value.reduce((max, row) => Math.max(max, Number(row.sort || 0)), 0) + 1))

const baseRows = computed(() => {
  const keyword = applied.name.trim().toLowerCase()
  return sortedSessions.value.filter((row) => {
    const nameMatch = !keyword || `${row.name || ''}${row.remark || ''}`.toLowerCase().includes(keyword)
    const enabledMatch = applied.enabled === 'all'
      || (applied.enabled === 'on' ? Boolean(row.isEnabled) : !row.isEnabled)
    const dateMatch = !applied.date || String(row.beginTime || '').slice(0, 10) === applied.date
    return nameMatch && enabledMatch && dateMatch
  })
})

const stateCounts = computed<Record<SessionTabKey, number>>(() => {
  const counts: Record<SessionTabKey, number> = { all: baseRows.value.length, upcoming: 0, ongoing: 0, ended: 0 }
  baseRows.value.forEach((row) => {
    counts[resolveSessionState(row).key] += 1
  })
  return counts
})

const filteredRows = computed(() => {
  if (activeTab.value === 'all') return baseRows.value
  return baseRows.value.filter((row) => resolveSessionState(row).key === activeTab.value)
})

const pagedRows = computed(() => {
  const start = (page.current - 1) * page.size
  return filteredRows.value.slice(start, start + page.size)
})

const emptyTitle = computed(() => {
  if (!activity.value) return '暂无秒杀活动'
  if (activitySessions.value.length) return '没有匹配的场次'
  return '当前活动还没有场次'
})

const emptyDescription = computed(() => {
  if (!activity.value) return '请先在活动管理中创建秒杀活动'
  if (activitySessions.value.length) return '调整筛选条件后重试'
  return '点击「新增场次」创建第一场秒杀'
})

const tableIntroText = computed(() => {
  if (!activity.value) return '请先在活动管理中创建秒杀活动，创建成功后可在此配置场次。'
  if (!activityWindowReady.value) {
    return '活动时间尚未设置，场次时间暂仅校验先后与重叠；建议先在活动管理中完善活动时间。'
  }
  return '启用后的场次会展示在 App 秒杀页；场次时间需位于活动时间内且不可重叠，停用后 App 端不再展示。'
})

const editorVisible = computed({
  get: () => editor.value !== null,
  set: (value: boolean) => {
    if (!value && !saving.value) editor.value = null
  },
})

const deletingVisible = computed({
  get: () => deleting.value !== null,
  set: (value: boolean) => {
    if (!value && !deleteBusy.value) deleting.value = null
  },
})

const editorKicker = computed(() => {
  if (editor.value?.mode === 'edit') return 'EDIT SESSION'
  if (editor.value?.mode === 'copy') return 'COPY SESSION'
  return 'NEW SESSION'
})

const editorTitle = computed(() => {
  if (editor.value?.mode === 'edit') return '编辑场次'
  if (editor.value?.mode === 'copy') return '复制场次'
  return '新增场次'
})

const draftValidation = computed(() => {
  const draft = editor.value
  if (!draft) return { errors: [] as string[], ready: false, duration: '' }

  const errors: string[] = []
  const name = draft.name.trim()
  const sort = Number(draft.sort)
  const sortValid = draft.sort !== undefined && Number.isInteger(sort) && sort >= 1 && sort <= 999

  if (draft.sort !== undefined && !sortValid) {
    errors.push('排序需为 1 至 999 的整数')
  }

  if (draft.beginTime && draft.endTime) {
    if (draft.endTime <= draft.beginTime) {
      errors.push('结束时间需晚于开始时间')
    } else {
      const beginLimit = activity.value?.activityBeginTime || ''
      const endLimit = activity.value?.activityEndTime || ''
      const outOfRange = (beginLimit && draft.beginTime < beginLimit) || (endLimit && draft.endTime > endLimit)
      if (outOfRange) {
        const rangeText = beginLimit && endLimit
          ? ` ${formatDateTime(beginLimit)} 至 ${formatDateTime(endLimit)} 内`
          : '范围内'
        errors.push(`场次时间需位于活动时间${rangeText}`)
      } else {
        const conflict = sortedSessions.value.find((session) => (
          String(session.id) !== String(draft.id ?? '')
          && draft.beginTime < String(session.endTime || '')
          && draft.endTime > String(session.beginTime || '')
        ))
        if (conflict) {
          const begin = String(conflict.beginTime || '').slice(5, 16)
          const end = String(conflict.endTime || '').slice(11, 16)
          errors.push(`与「${conflict.name || '未命名场次'}」(${begin} – ${end}) 时间重叠`)
        }
      }
    }
  }

  return {
    errors,
    ready: Boolean(name && draft.beginTime && draft.endTime && sortValid),
    duration: draft.beginTime && draft.endTime && draft.endTime > draft.beginTime
      ? durationText(draft.beginTime, draft.endTime)
      : '',
  }
})

const draftHint = computed(() => {
  const draft = editor.value
  const validation = draftValidation.value
  if (!draft) return ''
  if (validation.errors.length) return validation.errors.join('；')
  if (validation.ready) return `场次时长 ${validation.duration}，时间范围校验通过。`
  if (draft.beginTime && draft.endTime) return '时间未发现冲突；请填写场次名称后保存。'
  return '场次时间需位于活动时间内，且不能与其他场次重叠（可首尾相接）。'
})

const draftHintIcon = computed(() => {
  if (draftValidation.value.errors.length) return Warning
  if (draftValidation.value.ready) return CircleCheck
  return Clock
})

const canSave = computed(() => {
  return Boolean(editor.value)
    && draftValidation.value.ready
    && draftValidation.value.errors.length === 0
    && !saving.value
})

watch(activityId, (value, previous) => {
  if (!initialized.value || !value || value === previous) return
  resetQueryState()
  syncActivityQuery()
  void loadSessions()
})

watch(
  () => route.query.activityId,
  (value) => {
    if (!initialized.value) return
    const nextId = value ? String(value) : ''
    if (!nextId || nextId === activityId.value) return
    if (!activities.value.some((item) => String(item.id) === nextId)) return
    activityId.value = nextId
  },
)

watch(
  () => filteredRows.value.length,
  () => {
    const maxPage = Math.max(1, Math.ceil(filteredRows.value.length / page.size))
    if (page.current > maxPage) page.current = maxPage
  },
)

onMounted(() => {
  nowTimer = window.setInterval(() => {
    now.value = nowStamp()
  }, 30000)
  void initialize()
})

onBeforeUnmount(() => {
  if (nowTimer !== null) {
    window.clearInterval(nowTimer)
  }
})

async function initialize() {
  await loadActivities()
  if (!activities.value.length) {
    initialized.value = true
    return
  }

  const routeId = route.query.activityId ? String(route.query.activityId) : ''
  const targetId = activities.value.some((item) => String(item.id) === routeId) ? routeId : defaultActivityId()
  activityId.value = targetId
  initialized.value = true
  await loadSessions()
  syncActivityQuery()
}

async function loadActivities() {
  activitiesLoading.value = true
  try {
    const result = await querySeckillActivityList({
      current: 1,
      size: 500,
      conditions_: 'sort:sort:asc',
    }) as unknown as PageResponse<SeckillActivityRecord>
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
    sessions.value = []
    return
  }

  const token = ++loadToken
  sessionsLoading.value = true
  try {
    const [result, countsResult] = await Promise.all([
      querySeckillSessionList({
        activityId: currentId,
        current: 1,
        size: 500,
      }) as unknown as Promise<PageResponse<SeckillSessionRecord>>,
      getSeckillSessionProductCounts(currentId)
        .then((response) => response as unknown as DataResponse<Record<string, number | string>>)
        .catch(() => null),
    ])
    if (token !== loadToken) return

    const counts = countsResult?.data || {}
    sessions.value = (result.data?.records || []).map((item) => ({
      ...item,
      isEnabled: Boolean(item.isEnabled),
      productCount: Number(counts[String(item.id)] || 0),
    }))
  } catch {
    if (token === loadToken) sessions.value = []
  } finally {
    if (token === loadToken) sessionsLoading.value = false
  }
}

function defaultActivityId() {
  const currentTime = now.value
  const ongoing = activities.value.find((item) => (
    item.activityBeginTime
    && item.activityEndTime
    && item.activityBeginTime <= currentTime
    && currentTime < item.activityEndTime
  ))
  if (ongoing) return String(ongoing.id)

  const upcoming = activities.value
    .filter((item) => item.activityBeginTime && item.activityBeginTime > currentTime)
    .sort((a, b) => String(a.activityBeginTime).localeCompare(String(b.activityBeginTime)))[0]
  const target = upcoming || activities.value[0]
  return target ? String(target.id) : ''
}

function resetQueryState() {
  activeTab.value = 'all'
  filters.name = ''
  filters.enabled = 'all'
  filters.date = ''
  applied.name = ''
  applied.enabled = 'all'
  applied.date = ''
  page.current = 1
  sessions.value = []
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

function applyFilters() {
  applied.name = filters.name.trim()
  applied.enabled = filters.enabled
  applied.date = filters.date || ''
  activeTab.value = 'all'
  page.current = 1
}

function resetFilters() {
  filters.name = ''
  filters.enabled = 'all'
  filters.date = ''
  applyFilters()
}

function switchTab(key: SessionTabKey) {
  activeTab.value = key
  page.current = 1
}

function changePage(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
}

function goBackActivities() {
  const listPath = '/mall/seckill/list'
  if (!availablePaths.value.has(listPath)) {
    ElMessage.warning('暂无活动管理页面访问权限')
    return
  }
  void router.push(listPath)
}

function openCreate() {
  if (!activity.value) {
    ElMessage.warning('请先创建秒杀活动')
    return
  }
  editor.value = {
    mode: 'create',
    id: null,
    name: '',
    beginTime: '',
    endTime: '',
    sort: nextSort.value,
    isEnabled: true,
    remark: '',
  }
}

function openEdit(row: SeckillSessionRecord) {
  editor.value = {
    mode: 'edit',
    id: row.id,
    name: row.name || '',
    beginTime: row.beginTime || '',
    endTime: row.endTime || '',
    sort: Number(row.sort || 1),
    isEnabled: Boolean(row.isEnabled),
    remark: row.remark || '',
  }
}

function openCopy(row: SeckillSessionRecord) {
  editor.value = {
    mode: 'copy',
    id: null,
    name: copyName(row.name || ''),
    beginTime: shiftOneDay(row.beginTime),
    endTime: shiftOneDay(row.endTime),
    sort: nextSort.value,
    isEnabled: Boolean(row.isEnabled),
    remark: row.remark || '',
  }
}

function copyName(name: string) {
  const suffix = '（副本）'
  const base = (name || '场次').trim()
  return `${base.slice(0, Math.max(1, 30 - suffix.length))}${suffix}`
}

function applyPreset(preset: { begin: string; end: string }) {
  if (!editor.value) return
  const date = editor.value.beginTime
    ? editor.value.beginTime.slice(0, 10)
    : defaultPresetDate()
  editor.value.beginTime = `${date} ${preset.begin}:00`
  editor.value.endTime = `${date} ${preset.end}:00`
}

function defaultPresetDate() {
  const today = now.value.slice(0, 10)
  const begin = activity.value?.activityBeginTime?.slice(0, 10) || ''
  const end = activity.value?.activityEndTime?.slice(0, 10) || ''
  if (begin && end && (today < begin || today > end)) return begin
  return today
}

function disabledSessionDate(date: Date) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const begin = activity.value?.activityBeginTime
    ? parseDateTime(`${activity.value.activityBeginTime.slice(0, 10)} 00:00:00`)
    : Number.NaN
  const end = activity.value?.activityEndTime
    ? parseDateTime(`${activity.value.activityEndTime.slice(0, 10)} 23:59:59`)
    : Number.NaN
  return (Number.isFinite(begin) && day < begin) || (Number.isFinite(end) && day > end)
}

async function saveSession() {
  const draft = editor.value
  if (!draft || saving.value) return
  if (!canSave.value) return
  const currentActivity = activity.value
  if (!currentActivity) return

  saving.value = true
  try {
    const payload = {
      activityId: String(currentActivity.id),
      name: draft.name.trim(),
      beginTime: draft.beginTime,
      endTime: draft.endTime,
      sort: Number(draft.sort),
      isEnabled: draft.isEnabled,
      remark: draft.remark.trim(),
    }
    if (draft.mode === 'edit' && draft.id !== null && draft.id !== undefined) {
      await updateSeckillSession({ id: draft.id, ...payload })
    } else {
      await createSeckillSession(payload)
    }
    ElMessage.success(
      draft.mode === 'edit'
        ? '场次已更新'
        : draft.mode === 'copy'
          ? '场次副本已创建，请确认时间'
          : '场次已新增',
    )
    editor.value = null
    await loadSessions()
  } catch {
    // 请求层已提示错误，保留弹窗便于修正。
  } finally {
    saving.value = false
  }
}

function isToggleBusy(row: SeckillSessionRecord) {
  return toggleBusyIds.value.includes(String(row.id))
}

async function toggleEnabled(row: SeckillSessionRecord) {
  const id = String(row.id)
  if (isToggleBusy(row)) return

  const nextEnabled = !row.isEnabled
  toggleBusyIds.value = [...toggleBusyIds.value, id]
  try {
    await updateSeckillSessionEnabled({ id: row.id, isEnabled: nextEnabled })
    row.isEnabled = nextEnabled
    row.updateTime = now.value
    ElMessage.success(nextEnabled ? '场次已启用' : '场次已停用，App 端将不再展示')
  } catch {
    // 请求层已提示错误，保持原状态。
  } finally {
    toggleBusyIds.value = toggleBusyIds.value.filter((item) => item !== id)
  }
}

function openDelete(row: SeckillSessionRecord) {
  deleting.value = row
}

async function confirmDelete() {
  const row = deleting.value
  if (!row || row.productCount > 0 || deleteBusy.value) return

  deleteBusy.value = true
  try {
    await deleteSeckillSession([row.id])
    deleting.value = null
    ElMessage.success('场次已删除')
    await loadSessions()
  } catch {
    await loadSessions()
    const fresh = sessions.value.find((item) => String(item.id) === String(row.id))
    deleting.value = fresh || null
  } finally {
    deleteBusy.value = false
  }
}

function goProductFromDelete() {
  if (!activity.value) return
  const productPath = '/mall/seckill/product'
  if (!availablePaths.value.has(productPath)) {
    ElMessage.warning('暂无商品管理页面访问权限')
    return
  }
  deleting.value = null
  void router.push({
    path: productPath,
    query: {
      activityId: String(activity.value.id),
      ...(activity.value.name ? { activityName: activity.value.name } : {}),
    },
  })
}

function resolveSessionState(row: SeckillSessionRecord): SessionState {
  if (!row.beginTime || !row.endTime) return { key: 'ended', label: '待完善', tone: 'neutral' }
  if (now.value < row.beginTime) return { key: 'upcoming', label: '未开始', tone: 'info' }
  if (now.value < row.endTime) return { key: 'ongoing', label: '进行中', tone: 'success' }
  return { key: 'ended', label: '已结束', tone: 'neutral' }
}

function resolveActivityState(value?: SeckillActivityRecord): SessionState {
  if (!value?.activityBeginTime || !value.activityEndTime) {
    return { key: 'ended', label: '活动时间待设置', tone: 'neutral' }
  }
  if (now.value < value.activityBeginTime) return { key: 'upcoming', label: '活动未开始', tone: 'info' }
  if (now.value < value.activityEndTime) return { key: 'ongoing', label: '活动进行中', tone: 'success' }
  return { key: 'ended', label: '活动已结束', tone: 'neutral' }
}

function sessionState(row: SeckillSessionRecord) {
  return resolveSessionState(row)
}

function sessionRowClass({ row }: { row: SeckillSessionRecord }) {
  return row.isEnabled ? '' : 'is-off'
}

function sortChip(value?: number | string) {
  const sort = Number(value || 0)
  return String(sort).padStart(2, '0')
}

function timeRangeText(row: SeckillSessionRecord) {
  if (!row.beginTime || !row.endTime) return '待设置'
  const sameDay = row.beginTime.slice(0, 10) === row.endTime.slice(0, 10)
  if (sameDay) return `${clockOnly(row.beginTime)} – ${clockOnly(row.endTime)}`
  return `${row.beginTime.slice(5, 10)} ${clockOnly(row.beginTime)} – ${row.endTime.slice(5, 10)} ${clockOnly(row.endTime)}`
}

function fullSessionRange(row: SeckillSessionRecord) {
  if (!row.beginTime || !row.endTime) return '待设置'
  return `${formatDateTime(row.beginTime)} 至 ${formatDateTime(row.endTime)}`
}

function durationText(begin?: string, end?: string) {
  const start = parseDateTime(begin)
  const finish = parseDateTime(end)
  if (!Number.isFinite(start) || !Number.isFinite(finish) || finish <= start) return ''
  const minutes = Math.round((finish - start) / 60000)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} 分钟`
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`
}

function shiftOneDay(value?: string) {
  const timestamp = parseDateTime(value)
  if (!Number.isFinite(timestamp)) return ''
  const date = new Date(timestamp)
  date.setDate(date.getDate() + 1)
  return formatStamp(date)
}

function parseDateTime(value?: string) {
  if (!value) return Number.NaN
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(value))
  if (!match) return Number.NaN
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] || 0),
  )
  return date.getTime()
}

function formatStamp(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} `
    + `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

function nowStamp() {
  return formatStamp(new Date())
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function formatDateTime(value?: string) {
  return value ? String(value).slice(0, 16) : '—'
}

function dateOnly(value?: string) {
  return value ? String(value).slice(0, 10) : '—'
}

function clockOnly(value?: string) {
  return value && String(value).length >= 16 ? String(value).slice(11, 16) : '—'
}

function shortDate(value?: string) {
  return value ? String(value).slice(5, 10) : '—'
}

function weekdayOf(value?: string) {
  if (!value) return ''
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return ''
  return WEEKDAYS[new Date(year, month - 1, day).getDay()]
}
</script>

<style scoped>
.ss-session-page {
  --ss-mono: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
}

.ss-activity-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
  padding: 14px 16px;
  border: 1px solid var(--mall-line);
  border-radius: 8px;
  background: linear-gradient(90deg, #fff 0%, var(--ym-surface-2) 100%);
}

.ss-activity-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  color: #fff;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--ym-brand), #1e4e60);
  box-shadow: 0 6px 14px rgba(23, 63, 49, 0.18);
}

.ss-activity-icon .el-icon {
  font-size: 22px;
}

.ss-activity-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.ss-activity-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.ss-activity-title h2 {
  margin: 0;
  color: var(--mall-ink);
  font-size: 17px;
  line-height: 1.2;
}

.ss-activity-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  color: var(--mall-muted);
  font-size: 11px;
}

.ss-activity-meta > span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.ss-activity-meta .el-icon {
  color: var(--mall-brand);
  opacity: 0.8;
}

.ss-activity-controls {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

.ss-activity-switch {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--mall-muted);
  font-size: 11px;
  white-space: nowrap;
}

.ss-activity-select {
  width: 210px;
}

.ss-activity-select :deep(.el-select__wrapper) {
  min-height: 32px;
}

.ss-back-link {
  display: inline-flex;
  height: 32px;
  align-items: center;
  gap: 5px;
  padding: 0 11px;
  color: var(--mall-brand);
  border: 1px solid #c7d8de;
  border-radius: 6px;
  background: var(--mall-brand-soft);
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
}

.ss-back-link:hover {
  border-color: var(--mall-brand);
  background: var(--ym-brand-soft);
}

.ss-queue {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 10px;
  padding: 0 2px;
}

.ss-tabs {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
}

.ss-tabs::-webkit-scrollbar {
  display: none;
}

.ss-tabs button {
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

.ss-tabs button:hover {
  color: var(--mall-ink);
  background: #fff;
}

.ss-tabs button.active {
  color: var(--mall-brand);
  background: var(--mall-brand-soft);
  font-weight: 600;
}

.ss-tab-count {
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

.ss-tabs button[data-status='ongoing'] .ss-tab-count {
  color: var(--mall-brand);
  background: var(--mall-brand-soft);
}

.ss-tabs button.active .ss-tab-count {
  color: #fff;
  background: var(--mall-brand);
}

.ss-queue-summary {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 14px;
  color: var(--mall-muted);
  font-size: 11px;
  white-space: nowrap;
}

.ss-queue-summary > span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.ss-queue-summary b {
  color: var(--mall-ink);
  font: 600 13px var(--ss-mono);
}

.ss-queue-summary .el-icon {
  color: var(--mall-brand);
  opacity: 0.8;
}

.ss-live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: currentColor;
  animation: ssLivePulse 1.8s ease-out infinite;
}

@keyframes ssLivePulse {
  0% { box-shadow: 0 0 0 0 rgba(36, 99, 79, 0.3); }
  70% { box-shadow: 0 0 0 5px rgba(36, 99, 79, 0); }
  100% { box-shadow: 0 0 0 0 rgba(36, 99, 79, 0); }
}

.ss-filter-name {
  width: 240px;
}

.ss-filter-enabled {
  width: 130px;
}

.ss-filter-date {
  width: 160px;
}

.ss-table-intro {
  display: flex;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  color: var(--mall-muted);
  border-bottom: 1px solid var(--mall-line);
  background: var(--ym-row-hover);
  font-size: 11px;
  line-height: 1.5;
}

.ss-table-intro > span {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.ss-table-intro .el-icon {
  flex: 0 0 auto;
  color: var(--mall-brand);
}

.ss-table-intro > b {
  flex: 0 0 auto;
  color: var(--mall-ink-secondary);
  font-size: 11px;
  font-weight: 600;
}

.ss-session-table :deep(.el-table__cell) {
  text-align: center;
}

.ss-session-table :deep(td.el-table__cell) {
  height: 62px;
}

.ss-session-table :deep(.el-table__row.is-off > td.el-table__cell) {
  background: #fbfcfb;
}

.ss-session-table :deep(.el-table__row.is-off) {
  --el-table-row-hover-bg-color: var(--ym-surface-2);
}

.ss-row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

.ss-row-actions :deep(.el-button) {
  margin-left: 0;
  padding: 0 4px;
}

.ss-danger-link {
  color: var(--mall-price) !important;
}

.ss-danger-link:hover {
  color: #a33120 !important;
}

.ss-session-cell {
  display: flex;
  width: 190px;
  max-width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: flex-start !important;
  gap: 10px;
  margin: 0 auto;
  text-align: left;
}

.ss-sort-chip {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  color: var(--mall-brand);
  border: 1px solid #cfe0d7;
  border-radius: 8px;
  background: var(--mall-brand-soft);
  font: 700 12px var(--ss-mono);
}

.ss-session-table :deep(.el-table__row.is-off) .ss-sort-chip {
  color: var(--mall-muted);
  border-color: var(--mall-line);
  background: var(--ym-paper);
}

.ss-session-cell > div {
  display: flex;
  min-width: 0;
  flex: 1 1 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  text-align: left;
}

.ss-session-cell b {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--mall-ink);
  font-size: 12px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ss-session-table :deep(.el-table__row.is-off) .ss-session-cell b {
  color: var(--mall-muted);
}

.ss-session-cell small {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--mall-muted);
  font-size: 10px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ss-time-cell {
  display: flex;
  width: max-content;
  margin: 0 auto;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
}

.ss-date-line {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--mall-ink-secondary);
  font-size: 11px;
  font-weight: 600;
}

.ss-date-line em {
  color: var(--mall-muted);
  font-size: 10px;
  font-style: normal;
  font-weight: 500;
}

.ss-time-cell b {
  color: var(--mall-ink);
  font: 600 12px var(--ss-mono);
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.ss-time-cell small {
  color: var(--mall-muted);
  font-size: 10px;
}

.ss-session-table :deep(.el-table__row.is-off) .ss-time-cell b {
  color: var(--mall-ink-secondary);
}

.ss-status-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ss-status-ticket {
  display: inline-flex;
  min-height: 22px;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  color: var(--mall-muted);
  border: 1px solid var(--mall-line-strong);
  border-radius: 4px;
  background: var(--ym-paper);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.ss-status-ticket.tone-success {
  color: var(--mall-brand);
  border-color: #c7d8de;
  background: var(--mall-brand-soft);
}

.ss-status-ticket.tone-info {
  color: #2f5f8f;
  border-color: #c9d9ea;
  background: #eef4fb;
}

.ss-status-ticket.tone-neutral {
  color: var(--mall-muted);
  border-color: var(--mall-line);
  background: var(--ym-paper);
}

.ss-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0;
  color: var(--mall-muted);
  border: 0;
  background: transparent;
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
}

.ss-toggle-track {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
  border-radius: 9px;
  background: #d7ded9;
  transition: background 0.16s ease;
}

.ss-toggle-track i {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(20, 38, 29, 0.25);
  transition: left 0.16s ease;
}

.ss-toggle.is-on {
  color: var(--mall-brand);
}

.ss-toggle.is-on .ss-toggle-track {
  background: var(--mall-brand);
}

.ss-toggle.is-on .ss-toggle-track i {
  left: 16px;
}

.ss-toggle:hover .ss-toggle-track {
  box-shadow: 0 0 0 3px rgba(36, 99, 79, 0.12);
}

.ss-toggle:focus-visible {
  outline: 2px solid rgba(36, 99, 79, 0.45);
  outline-offset: 3px;
  border-radius: 4px;
}

.ss-toggle:disabled {
  cursor: wait;
  opacity: 0.62;
}

.ss-product-count {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  color: var(--mall-ink-secondary);
  font-size: 11px;
  white-space: nowrap;
}

.ss-product-count b {
  color: var(--mall-ink);
  font: 600 14px var(--ss-mono);
}

.ss-product-count.is-zero,
.ss-product-count.is-zero b {
  color: var(--mall-muted);
}

.ss-time-stamp {
  display: flex;
  width: max-content;
  margin: 0 auto;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
}

.ss-time-stamp span {
  color: var(--mall-ink-secondary);
  font-size: 11px;
}

.ss-time-stamp small {
  color: var(--mall-muted);
  font-size: 10px;
}

.ss-muted {
  color: var(--mall-muted);
}

.ss-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 34px 0;
  color: var(--mall-muted);
}

.ss-empty .el-icon {
  color: var(--mall-muted);
  font-size: 28px;
  opacity: 0.7;
}

.ss-empty b {
  color: var(--mall-ink-secondary);
  font-size: 13px;
}

.ss-empty span {
  font-size: 12px;
}

.ss-session-page :deep(.mall-pagination) {
  min-height: 52px;
  align-items: center;
  margin: 0;
  padding: 9px 14px;
  border-top: 1px solid var(--mall-line);
}

.ss-session-dialog {
  max-width: calc(100vw - 32px);
  border-radius: 10px;
}

.ss-delete-dialog {
  max-width: calc(100vw - 32px);
  border-radius: 10px;
}

.ss-session-dialog :deep(.el-dialog__header),
.ss-delete-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--mall-line);
}

.ss-session-dialog :deep(.el-dialog__body),
.ss-delete-dialog :deep(.el-dialog__body) {
  padding: 0 20px 8px;
}

.ss-session-dialog :deep(.el-dialog__footer),
.ss-delete-dialog :deep(.el-dialog__footer) {
  padding: 12px 20px 18px;
}

.ss-dialog-heading span {
  color: var(--mall-brand);
  font: 600 10px var(--ss-mono);
  letter-spacing: 0.12em;
}

.ss-dialog-heading h2 {
  margin: 3px 0 0;
  color: var(--mall-ink);
  font-size: 19px;
  line-height: 1.3;
}

.ss-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.ss-dialog-actions :deep(.el-button) {
  min-width: 90px;
  margin-left: 0;
}

.ss-dialog-context {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 0;
  padding: 10px 12px;
  border: 1px solid var(--mall-line);
  border-radius: 7px;
  background: #f7f9f7;
}

.ss-context-icon {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  place-items: center;
  color: var(--mall-brand);
  border: 1px solid #d5e4dc;
  border-radius: 7px;
  background: #fff;
}

.ss-context-icon .el-icon {
  font-size: 16px;
}

.ss-dialog-context > div {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.ss-dialog-context b {
  color: var(--mall-ink);
  font-size: 12px;
}

.ss-dialog-context small {
  overflow: hidden;
  color: var(--mall-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ss-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 14px;
  margin-top: 14px;
}

.ss-form-grid label {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.ss-form-grid label.wide,
.ss-presets.wide {
  grid-column: 1 / -1;
}

.ss-form-grid label > span {
  color: var(--mall-ink-secondary);
  font-size: 12px;
  font-weight: 600;
}

.ss-form-grid label > span em {
  margin-left: 2px;
  color: var(--mall-price);
  font-style: normal;
}

.ss-form-grid :deep(.el-input__wrapper),
.ss-form-grid :deep(.el-select__wrapper),
.ss-form-grid :deep(.el-date-editor .el-input__wrapper) {
  min-height: 34px;
  border-radius: 6px;
}

.ss-form-grid :deep(.el-date-editor),
.ss-form-grid :deep(.el-select),
.ss-form-grid :deep(.el-input-number) {
  width: 100%;
}

.ss-presets {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ss-presets > span {
  color: var(--mall-muted);
  font-size: 10px;
}

.ss-presets button {
  min-height: 24px;
  padding: 0 9px;
  color: var(--mall-ink-secondary);
  border: 1px solid var(--mall-line);
  border-radius: 5px;
  background: #fff;
  font-size: 10px;
  cursor: pointer;
}

.ss-presets button:hover {
  color: var(--mall-brand);
  border-color: var(--mall-brand);
  background: var(--mall-brand-soft);
}

.ss-presets small {
  color: var(--mall-muted);
  font-size: 10px;
}

.ss-form-hint {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-top: 12px;
  padding: 9px 11px;
  color: var(--mall-muted);
  border: 1px solid var(--mall-line);
  border-radius: 6px;
  background: #f7f9f7;
  font-size: 11px;
  line-height: 1.5;
}

.ss-form-hint .el-icon {
  flex: 0 0 auto;
  margin-top: 1px;
}

.ss-form-hint.is-error {
  color: var(--mall-price);
  border-color: #e7bfbb;
  background: #fcf1ef;
}

.ss-form-hint.is-ok {
  color: var(--mall-brand);
  border-color: #c8dfd2;
  background: var(--mall-brand-soft);
}

.ss-form-hint + .ss-form-hint {
  margin-top: 8px;
}

.ss-delete-warning {
  display: flex;
  gap: 10px;
  margin: 14px 0 0;
  padding: 12px;
  border: 1px solid #e7bfbb;
  border-radius: 7px;
  background: #fcf1ef;
}

.ss-delete-warning .el-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--mall-price);
  font-size: 18px;
}

.ss-delete-warning b {
  color: var(--mall-ink);
  font-size: 12px;
}

.ss-delete-warning p {
  margin: 4px 0 0;
  color: var(--mall-ink-secondary);
  font-size: 11px;
  line-height: 1.6;
}

.ss-delete-warning.is-plain {
  border-color: var(--mall-line);
  background: #f7f9f7;
}

.ss-delete-warning.is-plain .el-icon {
  color: var(--mall-muted);
}

.ss-delete-meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 14px;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--mall-line);
  border-radius: 7px;
  background: #fff;
}

.ss-delete-meta span {
  color: var(--mall-muted);
  font-size: 11px;
}

.ss-delete-meta b {
  color: var(--mall-ink-secondary);
  font-size: 11px;
  font-weight: 600;
}

@media (max-width: 1180px) {
  .ss-activity-bar {
    flex-wrap: wrap;
  }

  .ss-activity-controls {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 720px) {
  .ss-form-grid {
    grid-template-columns: 1fr;
  }

  .ss-form-grid label.wide,
  .ss-presets.wide {
    grid-column: auto;
  }

  .ss-queue {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
