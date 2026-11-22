<template>
  <div class="mall-page merchant-seckill-page ms-activity-page">
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
          <el-icon :size="15"><Lightning /></el-icon>
          平台已发布的活动展示在此处，报名中的活动可提交店铺商品参加。
        </span>
        <div class="ms-intro-right">
          <span class="ms-open-chip"><i></i>{{ openCount }} 个活动正在报名</span>
          <b>共 {{ pagination.total }} 个活动</b>
        </div>
      </div>

      <el-table data-ym-table="r80" v-loading="loading" :data="activities" row-key="id" style="width: 100%">
        <el-table-column label="活动" min-width="270" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-activity-cell">
              <SeckillThumb :src="row.coverImage" :alt="row.name" />
              <span class="ms-activity-copy">
                <b :title="row.name">{{ row.name }}</b>
                <small v-if="row.description" :title="row.description">{{ row.description }}</small>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报名时间" min-width="180" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-range-cell">
              <b>{{ shortTime(row.applyBeginTime) }}</b>
              <small>至 {{ shortTime(row.applyEndTime) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="活动时间" min-width="180" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-range-cell">
              <b>{{ shortTime(row.activityBeginTime) }}</b>
              <small>至 {{ shortTime(row.activityEndTime) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="场次" min-width="110" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-session-summary">
              <b>{{ row.sessionCount || 0 }} 场</b>
              <small>{{ row.firstSessionName ? `${row.firstSessionName} 起` : '待配置' }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="我的报名" min-width="125" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-apply-count">
              <b :class="{ 'is-muted': !row.applyCount }">
                {{ row.applyCount ? `${row.applyCount} 个商品` : '未报名' }}
              </b>
              <small v-if="applyHint(row)">{{ applyHint(row) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="活动状态" min-width="105" align="center" header-align="center">
          <template #default="{ row }">
            <span class="status-ticket" :class="`tone-${activityMeta(row.status).tone}`">
              {{ activityMeta(row.status).label }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-actions">
              <button type="button" class="ms-link" @click="openDetail(row)">详情</button>
              <button v-if="String(row.status) === '3'" type="button" class="ms-link" @click="openApply(row)">
                申请参加
              </button>
              <span v-else class="ms-action-hint">{{ activityMeta(row.status).hint }}</span>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <div class="ms-empty">
            <el-icon><Lightning /></el-icon>
            <b>没有匹配的秒杀活动</b>
            <span>调整活动名称或状态后重新查询</span>
          </div>
        </template>
      </el-table>

      <MallPagination
        variant="admin"
        :total="pagination.total"
        :page="pagination.current"
        :limit="pagination.pageSize"
        @pagination="changePage"
      />
    </section>

    <el-drawer
      v-model="detailVisible"
      :with-header="false"
      size="720px"
      class="ms-drawer-scope ms-activity-drawer"
    >
      <div v-if="detail" v-loading="detailLoading" class="ms-drawer-content">
        <div class="ms-drawer-head">
          <div>
            <span class="ms-drawer-kicker">SECKILL ACTIVITY</span>
            <h2>活动详情</h2>
          </div>
          <button type="button" class="ms-drawer-close" title="关闭" @click="detailVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="ms-drawer-hero">
          <SeckillThumb :src="detail.coverImage" :alt="detail.name" class="ms-drawer-cover" />
          <div class="ms-drawer-hero-copy">
            <div class="ms-drawer-title">
              <h3>{{ detail.name }}</h3>
              <span class="status-ticket" :class="`tone-${activityMeta(detail.status).tone}`">
                {{ activityMeta(detail.status).label }}
              </span>
            </div>
            <p v-if="detail.description">{{ detail.description }}</p>
            <span class="ms-drawer-meta">
              <el-icon><Clock /></el-icon>
              {{ activityMeta(detail.status).hint }} · 活动编号 {{ detail.id }}
            </span>
          </div>
        </div>

        <div class="ms-description-grid">
          <div class="wide">
            <span>报名时间</span>
            <b>{{ dateRange(detail.applyBeginTime, detail.applyEndTime) }}</b>
          </div>
          <div class="wide">
            <span>活动时间</span>
            <b>{{ dateRange(detail.activityBeginTime, detail.activityEndTime) }}</b>
          </div>
          <div><span>活动场次</span><b>{{ detail.sessionCount || 0 }} 场</b></div>
          <div><span>我的报名</span><b>{{ detailApplies.length }} 个商品</b></div>
        </div>

        <div class="ms-drawer-section">
          <h3>活动场次</h3>
          <div v-if="detailSessions.length" class="ms-session-list">
            <article
              v-for="(session, index) in detailSessions"
              :key="session.id"
              class="ms-session-item"
              :class="{ 'is-off': !session.isEnabled }"
            >
              <span class="ms-session-index">{{ index + 1 }}</span>
              <div>
                <b>{{ session.name }}</b>
                <small>{{ shortTime(session.beginTime) }} – {{ clockTime(session.endTime) }} · {{ weekday(session.beginTime) }}</small>
              </div>
              <span
                class="status-ticket is-small"
                :class="`tone-${session.isEnabled ? 'success' : 'neutral'}`"
              >{{ session.isEnabled ? '启用' : '停用' }}</span>
            </article>
          </div>
          <div v-else class="ms-empty is-compact">
            <el-icon><Clock /></el-icon>
            <b>暂未配置场次</b>
            <span>活动开始前需由平台补充场次</span>
          </div>
        </div>

        <div class="ms-drawer-section">
          <h3>我的报名</h3>
          <div v-if="detailApplies.length" class="ms-mini-apply-list">
            <button
              v-for="apply in detailApplies"
              :key="apply.applyId"
              type="button"
              @click="goRecords(apply.activityId || detail.id)"
            >
              <SeckillThumb :src="apply.mainImage" :alt="apply.spuName" class="ms-mini-art" />
              <span class="ms-mini-copy">
                <b>{{ apply.spuName }}</b>
                <small>{{ applySessionName(apply) }} · {{ shortTime(apply.applyTime) }}</small>
              </span>
              <span class="status-ticket is-small" :class="`tone-${auditMeta(apply.auditStatus).tone}`">
                {{ auditMeta(apply.auditStatus).label }}
              </span>
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
          <div v-else class="ms-empty is-compact">
            <el-icon><DocumentChecked /></el-icon>
            <b>尚未报名本活动</b>
            <span>{{ String(detail.status) === '3' ? '可提交店铺商品参加秒杀' : '当前不在报名期' }}</span>
          </div>
        </div>

        <div class="ms-drawer-actions">
          <button type="button" class="ms-btn" @click="detailVisible = false">关闭</button>
          <button
            v-if="detailApplies.length"
            type="button"
            class="ms-btn"
            @click="goRecords(detail.id)"
          >查看报名记录</button>
          <button
            v-if="hasDetailProducts"
            type="button"
            class="ms-btn"
            @click="goProducts(detail.id)"
          >查看秒杀商品</button>
          <button
            v-if="String(detail.status) === '3'"
            type="button"
            class="ms-btn primary"
            @click="applyFromDetail"
          >申请参加</button>
        </div>
      </div>
    </el-drawer>

    <ApplyDialog v-model="applyVisible" :activity="applying" @submitted="handleApplied" />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Clock, Close, DocumentChecked, Lightning, Search } from '@element-plus/icons-vue'
import {
  queryMchSeckillActivityList,
  queryMchSeckillApplyList,
  queryMchSeckillSessionList,
  queryMchSeckillSpuList,
} from '@/api/mall/seckill'
import MallPagination from '@/components/mall/MallPagination.vue'
import ApplyDialog from '../components/ApplyDialog.vue'
import SeckillThumb from '../components/SeckillThumb.vue'
import {
  activityMeta,
  auditMeta,
  clockTime,
  dateRange,
  shortTime,
  weekday,
} from '../shared'
import '@/assets/yeah-mall-seckill.css'

defineOptions({ name: 'MchSeckillActivity' })

const STATUS_OPTIONS = [
  { value: '2', label: '已发布' },
  { value: '3', label: '报名中' },
  { value: '4', label: '报名结束' },
  { value: '5', label: '进行中' },
  { value: '6', label: '已结束' },
]

const router = useRouter()
const loading = ref(false)
const activities = ref([])
const openCount = ref(0)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const emptyQuery = () => ({ keyword: '', status: '' })
const draft = reactive(emptyQuery())
const query = reactive(emptyQuery())

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)
const detailSessions = ref([])
const detailApplies = ref([])
const hasDetailProducts = ref(false)
let detailToken = 0

const applyVisible = ref(false)
const applying = ref(null)

function applyHint(row) {
  if (Number(row.pendingCount) > 0) return `${row.pendingCount} 个待审核`
  if (Number(row.passedCount) > 0) return `${row.passedCount} 个已通过`
  if (Number(row.rejectedCount) > 0) return `${row.rejectedCount} 个已驳回`
  return ''
}

function applySessionName(apply) {
  if (apply.sessionName) return apply.sessionName
  const session = detailSessions.value.find((item) => String(item.id) === String(apply.sessionId))
  return session?.name || '—'
}

async function getActivities() {
  loading.value = true
  try {
    const params = {
      current: pagination.current,
      size: pagination.pageSize,
    }
    if (query.keyword) params.keyword = query.keyword
    if (query.status) params.status = query.status
    const response = await queryMchSeckillActivityList(params)
    const data = response?.data || {}
    activities.value = data.records || []
    pagination.total = Number(data.total || 0)
  } catch {
    activities.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

async function getOpenCount() {
  try {
    const response = await queryMchSeckillActivityList({ status: '3', current: 1, size: 1 })
    openCount.value = Number(response?.data?.total || 0)
  } catch {
    openCount.value = 0
  }
}

function applyDraft() {
  Object.assign(query, {
    keyword: draft.keyword.trim(),
    status: draft.status,
  })
}

function handleSearch() {
  applyDraft()
  pagination.current = 1
  getActivities()
}

function resetQuery() {
  Object.assign(draft, emptyQuery())
  Object.assign(query, emptyQuery())
  pagination.current = 1
  getActivities()
}

function changePage(payload) {
  pagination.current = payload.page
  pagination.pageSize = payload.limit
  getActivities()
}

async function fetchDetailApplies(activityId) {
  const rows = []
  let current = 1
  const size = 200
  for (let guard = 0; guard < 5; guard += 1) {
    const response = await queryMchSeckillApplyList({ activityId, current, size })
    const data = response?.data || {}
    const records = data.records || []
    rows.push(...records)
    const total = Number(data.total || 0)
    if (!records.length || rows.length >= total) break
    current += 1
  }
  return rows
}

async function openDetail(row) {
  detail.value = row
  detailSessions.value = []
  detailApplies.value = []
  hasDetailProducts.value = false
  detailVisible.value = true
  const token = ++detailToken
  detailLoading.value = true
  try {
    const [sessions, applies, products] = await Promise.all([
      queryMchSeckillSessionList({ activityId: row.id }).then((response) => response?.data || []).catch(() => []),
      fetchDetailApplies(row.id).catch(() => []),
      queryMchSeckillSpuList({ activityId: row.id, current: 1, size: 1 })
        .then((response) => Number(response?.data?.total || 0) > 0)
        .catch(() => false),
    ])
    if (token !== detailToken) return
    detailSessions.value = sessions
    detailApplies.value = applies
    hasDetailProducts.value = products
  } finally {
    if (token === detailToken) detailLoading.value = false
  }
}

function openApply(row) {
  applying.value = row
  applyVisible.value = true
}

function applyFromDetail() {
  const row = detail.value
  detailVisible.value = false
  if (row) openApply(row)
}

function handleApplied() {
  getActivities()
  getOpenCount()
}

function goRecords(activityId) {
  detailVisible.value = false
  router.push({
    path: '/mall/mch-seckill/apply',
    query: { activityId: String(activityId) },
  })
}

function goProducts(activityId) {
  detailVisible.value = false
  router.push({
    path: '/mall/mch-seckill/product',
    query: { activityId: String(activityId) },
  })
}

onMounted(() => {
  getActivities()
  getOpenCount()
})
</script>