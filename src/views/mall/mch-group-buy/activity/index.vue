<template>
  <div class="mall-page groupbuy-page merchant-groupbuy-page mgb-activity-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" class="mall-query-form" @submit.prevent="handleSearch">
        <div class="ms-filter-fields">
          <el-form-item label="活动名称" class="ms-filter-field ms-filter-keyword">
            <el-input
              v-model="draft.keyword"
              clearable
              placeholder="搜索活动名称或说明"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="活动状态" class="ms-filter-field ms-filter-status">
            <el-select v-model="draft.status" placeholder="全部状态">
              <el-option label="全部状态" value="" />
              <el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item class="mall-query-actions">
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="primary" native-type="submit">
            <el-icon><Search /></el-icon>查询
          </el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="mall-table-panel">
      <div class="ms-table-intro">
        <span>
          <el-icon :size="15"><Connection /></el-icon>
          平台已发布的拼团活动展示在此处，报名中的活动可提交店铺商品参加。
        </span>
        <div class="ms-intro-right">
          <span class="ms-open-chip"><i></i>{{ openCount }} 个活动正在报名</span>
          <b>共 {{ filtered.length }} 个活动</b>
        </div>
      </div>

      <el-table data-ym-table="r83" v-loading="loading" :data="pagedRows" row-key="id" style="width: 100%">
        <el-table-column label="活动" min-width="250" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-activity-cell">
              <SeckillThumb :src="row.coverImage" :alt="row.name" />
              <span class="ms-activity-copy">
                <b :title="row.name">{{ row.name }}</b>
                <small :title="row.description">{{ row.description || '—' }}</small>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报名时间" min-width="160" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-range-cell">
              <b>{{ shortTime(row.applyBeginTime) }}</b>
              <small>至 {{ shortTime(row.applyEndTime) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="活动时间" min-width="160" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-range-cell">
              <b>{{ shortTime(row.activityBeginTime) }}</b>
              <small>至 {{ shortTime(row.activityEndTime) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="成团规则" min-width="120" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-session-summary">
              <b>{{ Number(row.minPeople || 0) }} 人成团</b>
              <small>开团上限 {{ groupbuyLimitText(row.groupLimit) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="我的报名" min-width="140" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-apply-count">
              <b :class="{ 'is-muted': !myApplies(row.id).length }">
                {{ myApplies(row.id).length ? `${myApplies(row.id).length} 个商品` : '未报名' }}
              </b>
              <small v-if="applyHint(row)">{{ applyHint(row) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="活动状态" min-width="100" align="center" header-align="center">
          <template #default="{ row }">
            <span
              class="status-ticket"
              :class="`tone-${groupbuyStatusMeta(row.status).tone}`"
              :title="groupbuyStatusMeta(row.status).hint"
            >{{ groupbuyStatusMeta(row.status).label }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-actions">
              <button type="button" class="ms-link" @click="openDetail(row)">详情</button>
              <button
                v-if="mchGroupbuyCanApply(row, now)"
                type="button"
                class="ms-link"
                @click="openApply(row)"
              >申请参加</button>
              <span v-else class="ms-action-hint">{{ applyWindowOf(row).label }}</span>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <div class="ms-empty">
            <el-icon><Connection /></el-icon>
            <b>没有匹配的拼团活动</b>
            <span>调整活动名称或状态后重新查询</span>
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

    <el-drawer
      v-model="detailVisible"
      :with-header="false"
      size="720px"
      class="ms-drawer-scope ms-activity-drawer"
      @closed="resetDetail"
    >
      <div v-if="detailRow" v-loading="detailLoading" class="ms-drawer-content">
        <div class="ms-drawer-head">
          <div>
            <span class="ms-drawer-kicker">GROUP BUY ACTIVITY</span>
            <h2>活动详情</h2>
          </div>
          <button type="button" class="ms-drawer-close" title="关闭" @click="detailVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="ms-drawer-hero">
          <SeckillThumb :src="detailRow.coverImage" :alt="detailRow.name" class="ms-drawer-cover" />
          <div class="ms-drawer-hero-copy">
            <div class="ms-drawer-title">
              <h3>{{ detailRow.name }}</h3>
              <span class="status-ticket" :class="`tone-${groupbuyStatusMeta(detailRow.status).tone}`">
                {{ groupbuyStatusMeta(detailRow.status).label }}
              </span>
            </div>
            <p>{{ detailRow.description || '暂无活动说明' }}</p>
            <span class="ms-drawer-meta">
              <el-icon><Calendar /></el-icon>
              {{ applyWindowOf(detailRow).label }} · 活动编号 {{ detailRow.id }}
            </span>
          </div>
        </div>

        <div class="ms-description-grid">
          <div class="wide">
            <span>报名时间</span>
            <b>{{ fullRange(detailRow.applyBeginTime, detailRow.applyEndTime) }}</b>
          </div>
          <div class="wide">
            <span>活动时间</span>
            <b>{{ fullRange(detailRow.activityBeginTime, detailRow.activityEndTime) }}</b>
          </div>
          <div><span>成团人数</span><b>{{ Number(detailRow.minPeople || 0) }} 人</b></div>
          <div><span>开团上限</span><b>{{ groupbuyLimitText(detailRow.groupLimit) }}</b></div>
          <div><span>我的报名</span><b>{{ detailApplies.length }} 个商品</b></div>
          <div><span>拼团数据</span><b>{{ detailOrders.length }} 单 · {{ detailGroups.length }} 团</b></div>
        </div>

        <div class="gb-play-note">
          <el-icon><Avatar /></el-icon>
          <span>团长支付后开团，满 {{ Number(detailRow.minPeople || 0) }} 人成团；活动结束统一结算——满团待发货、未满团退款并释放预留库存。</span>
        </div>

        <div class="ms-drawer-section">
          <h3>我的报名</h3>
          <div v-if="detailApplies.length" class="ms-mini-apply-list">
            <button
              v-for="apply in detailApplies"
              :key="apply.id"
              type="button"
              @click="goRecords(detailRow.id)"
            >
              <SeckillThumb :src="apply.mainImage" :alt="apply.spuName" class="ms-mini-art" />
              <span class="ms-mini-copy">
                <b>{{ apply.spuName }}</b>
                <small>{{ seckillRange(apply.minGroupPrice, apply.maxGroupPrice) }} · {{ apply.applyTime.slice(5, 16) }}</small>
              </span>
              <span class="status-ticket is-small" :class="`tone-${applyStatusMeta(apply.auditStatus).tone}`">
                {{ applyStatusMeta(apply.auditStatus).label }}
              </span>
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
          <div v-else class="ms-empty is-compact">
            <el-icon><DocumentChecked /></el-icon>
            <b>尚未报名本活动</b>
            <span>{{ mchGroupbuyCanApply(detailRow, now) ? '可提交店铺商品参加拼团' : '当前不在报名期' }}</span>
          </div>
        </div>

        <div class="ms-drawer-actions">
          <button type="button" class="ms-btn" @click="detailVisible = false">关闭</button>
          <button
            v-if="detailApplies.length"
            type="button"
            class="ms-btn"
            @click="goRecords(detailRow.id)"
          >查看申请记录</button>
          <button
            v-if="detailApplies.length"
            type="button"
            class="ms-btn"
            @click="goProducts(detailRow.id)"
          >查看拼团商品</button>
          <button
            v-if="detailOrders.length"
            type="button"
            class="ms-btn"
            @click="goOrders(detailRow.id)"
          >查看拼团订单</button>
          <button
            v-if="mchGroupbuyCanApply(detailRow, now)"
            type="button"
            class="ms-btn primary"
            @click="openApply(detailRow)"
          >申请参加</button>
        </div>
      </div>
    </el-drawer>

    <ApplyDialog
      v-model="applyVisible"
      :activity="applying"
      :applies="applies"
      @submitted="handleApplied"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowRight,
  Avatar,
  Calendar,
  Close,
  Connection,
  DocumentChecked,
  Search,
} from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import { queryMchGroupBuyActivityList, queryMchGroupBuyApplyList, queryMchGroupBuyGroupList, queryMchGroupBuyOrderList } from '@/api/mall/groupBuy'
import SeckillThumb from '../../mch-seckill/components/SeckillThumb.vue'
import ApplyDialog from '../components/ApplyDialog.vue'
import {
  applyStatusMeta,
  fullRange,
  groupbuyApplyWindowState,
  groupbuyLimitText,
  groupbuyStatusMeta,
  loadAllPages,
  mchGroupbuyCanApply,
  mchGroupbuyShopId,
  nowStamp,
  seckillRange,
  shortTime,
  toMchGroupbuyApplyRow,
  normalizeTime,
  type GroupBuyActivity,
  type GroupBuyGroup,
  type GroupBuyOrder,
  type MchGroupbuyApplyRow,
} from '../shared'
import '@/assets/yeah-mall-seckill.css'

defineOptions({ name: 'MchGroupBuyActivity' })

const STATUS_OPTIONS = [
  { value: '2', label: '已发布' },
  { value: '3', label: '报名中' },
  { value: '4', label: '报名结束' },
  { value: '5', label: '进行中' },
]

const router = useRouter()
const shopId = mchGroupbuyShopId()

const activities = ref<GroupBuyActivity[]>([])
const applies = ref<MchGroupbuyApplyRow[]>([])
const loading = ref(false)
const now = ref(nowStamp())

const draft = reactive({ keyword: '', status: '' })
const query = reactive({ keyword: '', status: '' })
const page = reactive({ current: 1, size: 10 })

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailRow = ref<GroupBuyActivity | null>(null)
const detailGroups = ref<GroupBuyGroup[]>([])
const allOrders = ref<GroupBuyOrder[]>([])
const ordersLoaded = ref(false)

const applyVisible = ref(false)
const applying = ref<GroupBuyActivity | null>(null)

let nowTimer: number | null = null
let detailToken = 0

const appliesByActivity = computed(() => {
  const map = new Map<string, MchGroupbuyApplyRow[]>()
  applies.value.forEach((apply) => {
    const key = String(apply.activityId ?? '')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(apply)
  })
  return map
})

function myApplies(activityId?: string | number): MchGroupbuyApplyRow[] {
  return appliesByActivity.value.get(String(activityId ?? '')) || []
}

const filtered = computed(() => {
  const keyword = query.keyword.trim().toLowerCase()
  return activities.value
    .filter((activity) => {
      const keywordMatch = !keyword || `${activity.name || ''}${activity.description || ''}`.toLowerCase().includes(keyword)
      const statusMatch = !query.status || String(activity.status ?? '') === query.status
      return keywordMatch && statusMatch
    })
    .slice()
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
})

const pagedRows = computed(() => {
  const start = (page.current - 1) * page.size
  return filtered.value.slice(start, start + page.size)
})

const openCount = computed(() => activities.value.filter((activity) => mchGroupbuyCanApply(activity, now.value)).length)

const detailApplies = computed(() => (detailRow.value ? myApplies(detailRow.value.id) : []))
const detailOrders = computed(() => (
  detailRow.value
    ? allOrders.value.filter((order) => String(order.activityId ?? '') === String(detailRow.value?.id ?? ''))
    : []
))

function applyWindowOf(activity?: GroupBuyActivity | null) {
  return groupbuyApplyWindowState(activity || undefined, now.value)
}

function applyHint(activity: GroupBuyActivity): string {
  const rows = myApplies(activity.id)
  const pending = rows.filter((apply) => Number(apply.auditStatus) === 1).length
  if (pending) return `${pending} 个待审核`
  const passed = rows.filter((apply) => Number(apply.auditStatus) === 2).length
  if (passed) return `${passed} 个已通过`
  const rejected = rows.filter((apply) => Number(apply.auditStatus) === 3).length
  return rejected ? `${rejected} 个已驳回` : ''
}

onMounted(() => {
  nowTimer = window.setInterval(() => {
    now.value = nowStamp()
  }, 30000)
  void initialize()
})

onBeforeUnmount(() => {
  if (nowTimer !== null) window.clearInterval(nowTimer)
})

async function initialize() {
  await Promise.all([loadActivities(), loadApplies()])
}

async function loadActivities() {
  loading.value = true
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
    loading.value = false
  }
}

async function loadApplies() {
  if (!shopId) {
    applies.value = []
    return
  }
  try {
    const rows = await loadAllPages<MchGroupbuyApplyRow>((params) => queryMchGroupBuyApplyList({ ...params, shopId }))
    applies.value = rows
      .filter((item) => item && item.id !== undefined && item.id !== null)
      .map((item) => toMchGroupbuyApplyRow(item))
  } catch {
    applies.value = []
  }
}

async function loadOrders() {
  if (!shopId) return
  try {
    const rows = await loadAllPages<GroupBuyOrder>((params) => queryMchGroupBuyOrderList({ ...params, shopId }))
    allOrders.value = rows
      .filter((item) => item && item.id !== undefined && item.id !== null)
      .map((item) => ({
        ...item,
        createTime: normalizeTime(item.createTime),
        payTime: normalizeTime(item.payTime),
        updateTime: normalizeTime(item.updateTime),
      }))
    ordersLoaded.value = true
  } catch {
    ordersLoaded.value = false
  }
}

function handleSearch() {
  query.keyword = draft.keyword.trim()
  query.status = draft.status
  page.current = 1
}

function resetQuery() {
  draft.keyword = ''
  draft.status = ''
  query.keyword = ''
  query.status = ''
  page.current = 1
}

function changePage(payload: { page: number; limit: number }) {
  page.current = payload.page
  page.size = payload.limit
}

async function openDetail(row: GroupBuyActivity) {
  const token = ++detailToken
  detailRow.value = row
  detailGroups.value = []
  detailVisible.value = true
  detailLoading.value = true
  try {
    const tasks: Promise<unknown>[] = []
    if (!ordersLoaded.value) tasks.push(loadOrders())
    if (shopId) {
      tasks.push(loadAllPages<GroupBuyGroup>((params) => queryMchGroupBuyGroupList({
        ...params,
        shopId,
        activityId: row.id,
      })).then((groups) => {
        if (token !== detailToken) return
        detailGroups.value = groups.filter((item) => item && item.id !== undefined && item.id !== null)
      }).catch(() => {
        if (token === detailToken) detailGroups.value = []
      }))
    }
    await Promise.all(tasks)
  } finally {
    if (token === detailToken) detailLoading.value = false
  }
}

function resetDetail() {
  detailToken += 1
  detailRow.value = null
  detailGroups.value = []
  detailLoading.value = false
}

function openApply(row: GroupBuyActivity) {
  if (!mchGroupbuyCanApply(row, now.value)) {
    ElMessage.warning(`当前活动${applyWindowOf(row).label}`)
    return
  }
  detailVisible.value = false
  applying.value = row
  applyVisible.value = true
}

function handleApplied() {
  void loadApplies()
}

function goRecords(activityId?: string | number) {
  detailVisible.value = false
  if (!activityId) return
  void router.push({ path: '/mall/mch-group-buy/apply', query: { activityId: String(activityId) } })
}

function goProducts(activityId?: string | number) {
  detailVisible.value = false
  if (!activityId) return
  void router.push({ path: '/mall/mch-group-buy/product', query: { activityId: String(activityId) } })
}

function goOrders(activityId?: string | number) {
  detailVisible.value = false
  if (!activityId) return
  void router.push({ path: '/mall/mch-group-buy/order', query: { activityId: String(activityId) } })
}
</script>