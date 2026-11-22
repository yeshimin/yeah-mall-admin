<template>
  <div class="mall-page groupbuy-page groupbuy-audit-page merchant-groupbuy-page">
    <template v-if="activity">
      <div class="ss-activity-bar">
        <span class="ss-activity-icon"><el-icon><DocumentChecked /></el-icon></span>
        <div class="ss-activity-copy">
          <div class="ss-activity-title">
            <h2>{{ activity.name || '未命名活动' }}</h2>
            <span class="status-ticket" :class="`tone-${applyState.tone}`">
              <span class="ss-status-live">
                <i v-if="applyState.key === 'open'" class="ss-live-dot"></i>{{ applyState.label }}
              </span>
            </span>
          </div>
          <div class="ss-activity-meta">
            <span><el-icon><Calendar /></el-icon>报名 {{ applyRangeText }}</span>
            <span><el-icon><Lightning /></el-icon>活动 {{ activityRangeText }}</span>
            <span><el-icon><Avatar /></el-icon>{{ ruleText }}</span>
            <span><el-icon><DocumentChecked /></el-icon>我的报名 {{ activityApplies.length }} 条</span>
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
            <el-icon><Back /></el-icon>返回活动列表
          </button>
        </div>
      </div>

      <div class="ss-queue">
        <div class="ss-tabs">
          <button
            v-for="item in APPLY_TABS"
            :key="item.key"
            type="button"
            :data-status="item.key"
            :class="{ active: activeTab === item.key }"
            @click="switchTab(item.key)"
          >
            {{ item.label }}<span class="ss-tab-count">{{ counts[item.key] }}</span>
          </button>
        </div>
        <div class="ss-queue-summary">
          <span :class="{ 'is-warning': (counts.pending || 0) > 0 }">
            <i v-if="(counts.pending || 0) > 0" class="ss-live-dot"></i>待审核 <b>{{ counts.pending }}</b> 条
          </span>
          <span>
            <el-icon><Check /></el-icon>通过率 <b>{{ passRateText }}</b>
          </span>
        </div>
      </div>

      <section class="mall-filter-panel">
        <el-form :inline="true" class="mall-query-form" @submit.prevent="search">
          <div class="ms-filter-fields">
            <el-form-item label="商品名称 / 报名编号" class="ms-filter-field ms-filter-record">
              <el-input
                v-model="filters.keyword"
                clearable
                placeholder="搜索报名商品名称或报名编号"
                @keyup.enter="search"
              />
            </el-form-item>
          </div>
          <el-form-item class="mall-query-actions">
            <el-button @click="resetFilters">重置</el-button>
            <el-button type="primary" native-type="submit">
              <el-icon><Search /></el-icon>查询
            </el-button>
          </el-form-item>
        </el-form>
      </section>

      <section class="mall-table-panel">
        <div class="ss-table-intro sa-table-intro" :class="tableIntroTone">
          <span>
            <el-icon>
              <WarningFilled v-if="tableIntroTone === 'is-warning'" />
              <Clock v-else-if="applyState.key === 'open'" />
              <DocumentChecked v-else />
            </el-icon>
            {{ tableIntroText }}
          </span>
          <div class="sa-intro-right">
            <b>筛选 {{ filtered.length }} 条</b>
            <span v-if="(counts.pending || 0) > 0" class="sa-pending-chip">待审 {{ counts.pending }}</span>
          </div>
        </div>

        <el-table data-ym-table="r84" v-loading="loading" :data="pagedRows" row-key="id" style="width: 100%">
          <el-table-column label="报名商品" min-width="250" align="center" header-align="center">
            <template #default="{ row }">
              <div class="sa-product-cell">
                <span class="sa-product-art">
                  <el-image v-if="row.mainImage" :src="getStoragePreviewUrl(row.mainImage)" fit="cover">
                    <template #error>
                      <span class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                    </template>
                  </el-image>
                  <span v-else class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                </span>
                <div class="sa-product-copy">
                  <b :title="row.spuName">{{ row.spuName || '—' }}</b>
                  <small>{{ Number(row.skuCount || 0) }} 个 SKU · 报名库存 {{ Number(row.groupStock || 0) }} 件</small>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="拼团价" width="170" align="center" header-align="center">
            <template #default="{ row }">
              <div class="skp-price-cell">
                <b>{{ seckillRange(row.minGroupPrice, row.maxGroupPrice) }}</b>
                <small>
                  <s>{{ seckillRange(row.minOriginPrice, row.maxOriginPrice) }}</s>
                  <em>{{ seckillDiscount(row.minGroupPrice, row.minOriginPrice) }}</em>
                </small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="报名时间" width="128" align="center" header-align="center">
            <template #default="{ row }">
              <div class="sa-time-cell">
                <b>{{ dateOnly(row.applyTime) }}</b>
                <small>{{ clockText(row.applyTime) }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="审核状态" width="104" align="center" header-align="center">
            <template #default="{ row }">
              <span class="status-ticket" :class="`tone-${applyStatusMeta(row.auditStatus).tone}`">
                {{ applyStatusMeta(row.auditStatus).label }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="审核时间" width="128" align="center" header-align="center">
            <template #default="{ row }">
              <div class="sa-time-cell">
                <b>{{ row.auditTime ? dateOnly(row.auditTime) : '—' }}</b>
                <small>{{ row.auditTime ? clockText(row.auditTime) : '等待审核' }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="申请备注" min-width="150" align="center" header-align="center">
            <template #default="{ row }">
              <span
                class="sa-remark"
                :class="{ 'is-empty': !row.applyRemark }"
                :title="row.applyRemark || '未填写申请备注'"
              >
                {{ row.applyRemark || '未填写' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="审核备注" min-width="150" align="center" header-align="center">
            <template #default="{ row }">
              <span
                class="sa-remark"
                :class="{ 'is-empty': !row.auditRemark }"
                :title="row.auditRemark || (Number(row.auditStatus) === 1 ? '待平台审核' : '未填写审核备注')"
              >
                {{ row.auditRemark || (Number(row.auditStatus) === 1 ? '—' : '未填写') }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="82" fixed="right" align="center" header-align="center">
            <template #default="{ row }">
              <button type="button" class="ms-link" @click="openDetail(row)">详情</button>
            </template>
          </el-table-column>

          <template #empty>
            <div class="ms-empty">
              <el-icon><DocumentChecked /></el-icon>
              <b>{{ activityApplies.length ? '没有匹配的报名记录' : '当前活动还没有报名记录' }}</b>
              <span>{{ activityApplies.length ? '调整商品名称或报名编号后重试' : '在活动列表选择商品提交报名后，记录会出现在这里' }}</span>
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
    </template>

    <section v-else-if="activitiesLoading" class="gb-page-empty">
      <span class="gb-page-empty-icon"><el-icon><DocumentChecked /></el-icon></span>
      <strong>正在加载拼团活动</strong>
      <span>请稍候…</span>
    </section>

    <section v-else class="gb-page-empty">
      <span class="gb-page-empty-icon"><el-icon><DocumentChecked /></el-icon></span>
      <strong>暂无可查看的拼团活动</strong>
      <span>平台发布拼团活动后，店铺报名记录会展示在这里。</span>
      <button type="button" class="gb-page-empty-action" @click="goBackActivities">返回活动列表</button>
    </section>

    <el-drawer
      v-model="detailVisible"
      :with-header="false"
      size="720px"
      class="ms-drawer-scope ms-record-drawer"
    >
      <div v-if="detailView" v-loading="detailLoading" class="ms-drawer-content">
        <div class="ms-drawer-head">
          <div>
            <span class="ms-drawer-kicker">GROUP BUY APPLICATION</span>
            <h2>报名详情</h2>
          </div>
          <button type="button" class="ms-drawer-close" title="关闭" @click="detailVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="ms-drawer-hero">
          <SeckillThumb :src="detailView.mainImage" :alt="detailView.spuName" class="ms-drawer-cover" />
          <div class="ms-drawer-hero-copy">
            <div class="ms-drawer-title">
              <h3>{{ detailView.spuName }}</h3>
              <span class="status-ticket" :class="`tone-${detailAudit.tone}`">{{ detailAudit.label }}</span>
            </div>
            <p class="ms-hero-sub">报名编号 <CopyableText :value="String(detailView.id)" label="报名编号" /></p>
            <span class="ms-drawer-meta">
              <el-icon><Calendar /></el-icon>
              {{ detailView.activityName }} · {{ detailView.minPeople }} 人成团
            </span>
          </div>
        </div>

        <div v-if="detailAudit.key === 'rejected'" class="ms-audit-banner">
          <el-icon :size="16"><WarningFilled /></el-icon>
          <div>
            <b>审核驳回</b>
            <span>{{ detailView.auditRemark || '平台未填写驳回原因' }}</span>
          </div>
        </div>

        <div class="ms-description-grid">
          <div><span>所属活动</span><b>{{ detailView.activityName }}</b></div>
          <div><span>成团规则</span><b>{{ detailView.minPeople }} 人 · 上限 {{ groupbuyLimitText(detailView.groupLimit) }}</b></div>
          <div><span>报名时间</span><b>{{ dateTimeText(detailView.applyTime) }}</b></div>
          <div><span>审核时间</span><b>{{ detailView.auditTime ? dateTimeText(detailView.auditTime) : '—' }}</b></div>
          <div><span>拼团价</span><b>{{ seckillRange(detailView.minGroup, detailView.maxGroup) }}</b></div>
          <div><span>报名库存</span><b>{{ detailView.stock }} 件</b></div>
        </div>

        <div class="ms-drawer-section">
          <h3>报名商品</h3>
          <div class="ms-detail-gallery">
            <SeckillThumb
              v-for="(image, index) in detailGallery"
              :key="`${image || 'empty'}-${index}`"
              :src="image"
              :alt="detailView.spuName"
              class="ms-detail-shot"
            />
          </div>
          <div class="ms-detail-desc">
            <b>商品描述</b>
            <p>{{ detailDescText }}</p>
          </div>
        </div>

        <div class="ms-drawer-section">
          <h3>SKU 明细</h3>
          <div v-if="detailSkus.length" class="ms-sku-wrap">
            <table class="ms-sku-table">
              <thead>
                <tr>
                  <th>SKU 名称</th>
                  <th>规格编码</th>
                  <th>原价</th>
                  <th>拼团价</th>
                  <th>报名库存</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(sku, index) in detailSkus" :key="`${sku.specCode || 'sku'}-${index}`">
                  <td>{{ sku.name || '—' }}</td>
                  <td><span class="mono">{{ sku.specCode || '—' }}</span></td>
                  <td>{{ seckillMoney(sku.originPrice) }}</td>
                  <td class="ms-price-text">{{ seckillMoney(sku.groupPrice) }}</td>
                  <td>{{ Number(sku.stock || 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="ms-empty is-compact">
            <el-icon><Goods /></el-icon>
            <b>暂无 SKU 明细</b>
            <span>报名商品的规格信息尚未生成</span>
          </div>
        </div>

        <div class="ms-drawer-section">
          <h3>备注信息</h3>
          <div class="ms-description-grid">
            <div class="wide"><span>申请备注</span><b>{{ detailView.applyRemark || '未填写' }}</b></div>
            <div class="wide"><span>审核备注</span><b>{{ detailView.auditRemark || '未填写' }}</b></div>
          </div>
        </div>

        <div class="ms-drawer-actions">
          <button type="button" class="ms-btn" @click="detailVisible = false">关闭</button>
          <button
            v-if="detailAudit.key === 'passed'"
            type="button"
            class="ms-btn primary"
            @click="goProducts(detailView.activityId)"
          >查看拼团商品</button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Avatar,
  Back,
  Calendar,
  Check,
  Clock,
  Close,
  DocumentChecked,
  Goods,
  Lightning,
  Picture,
  Search,
  WarningFilled,
} from '@element-plus/icons-vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { getMchGroupBuyApplyDetail, queryMchGroupBuyApplyList } from '@/api/mall/groupBuy'
import SeckillThumb from '../../mch-seckill/components/SeckillThumb.vue'
import {
  APPLY_TABS,
  applyStatusMeta,
  clockText,
  dateOnly,
  dateTimeText,
  groupbuyLimitText,
  loadAllPages,
  mchGroupbuyApplyActivityId,
  mchGroupbuyAuditTab,
  normalizeTime,
  richTextToPlain,
  seckillDiscount,
  seckillMoney,
  seckillRange,
  toMchGroupbuyApplyRow,
  useMchGroupBuyContext,
  type GroupBuyApplyDetail,
  type GroupBuySku,
  type MchGroupbuyApplyRow,
} from '../shared'
import '@/assets/yeah-mall-seckill.css'
import '@/assets/yeah-mall-seckill-insight.css'

defineOptions({ name: 'MchGroupBuyApply' })

const {
  route,
  router,
  shopId,
  activities,
  activityId,
  activitiesLoading,
  now,
  activity,
  applyState,
  activityRangeText,
  applyRangeText,
  ruleText,
  loadActivities,
  selectActivity,
  resolveInitialActivityId,
  goBackActivities,
} = useMchGroupBuyContext({ onRouteActivityChange: handleActivitySwitch })

const allApplies = ref<MchGroupbuyApplyRow[]>([])
const loading = ref(false)
const activeTab = ref(mchGroupbuyAuditTab(route.query.auditStatus))
const filters = reactive({ keyword: '' })
const applied = reactive({ keyword: '' })
const page = reactive({ current: 1, size: 10 })

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailRow = ref<MchGroupbuyApplyRow | null>(null)
const detailPayload = ref<GroupBuyApplyDetail | null>(null)

let detailToken = 0

const activityApplies = computed(() => (
  allApplies.value.filter((row) => String(row.activityId ?? '') === String(activity.value?.id ?? ''))
))

const baseRows = computed(() => {
  const keyword = applied.keyword.trim().toLowerCase()
  return activityApplies.value
    .filter((row) => (
      !keyword
      || `${row.spuName || ''}${row.id}${row.applyRemark || ''}`.toLowerCase().includes(keyword)
    ))
    .slice()
    .sort((a, b) => String(b.applyTime || '').localeCompare(String(a.applyTime || '')))
})

const counts = computed(() => {
  const result: Record<string, number> = { all: baseRows.value.length, pending: 0, passed: 0, rejected: 0 }
  baseRows.value.forEach((row) => {
    const key = applyStatusMeta(row.auditStatus).key
    if (key in result) result[key] = (result[key] || 0) + 1
  })
  return result
})

const filtered = computed(() => (
  baseRows.value.filter((row) => activeTab.value === 'all' || applyStatusMeta(row.auditStatus).key === activeTab.value)
))

const pagedRows = computed(() => {
  const start = (page.current - 1) * page.size
  return filtered.value.slice(start, start + page.size)
})

const pendingInActivity = computed(() => (
  activityApplies.value.filter((row) => Number(row.auditStatus) === 1).length
))

const passRateText = computed(() => {
  const passed = counts.value.passed || 0
  const processed = passed + (counts.value.rejected || 0)
  return processed ? `${Math.round((passed / processed) * 100)}%` : '—'
})

const tableIntroTone = computed(() => {
  if (applyState.value.key === 'closed' && pendingInActivity.value) return 'is-warning'
  return applyState.value.key === 'open' ? 'is-open' : ''
})

const tableIntroText = computed(() => {
  const begin = String(activity.value?.applyBeginTime || '').slice(0, 16)
  const end = String(activity.value?.applyEndTime || '').slice(0, 16)
  if (applyState.value.key === 'open') {
    return `报名进行中，截止 ${end}；待审核记录由平台审核，通过后商品进入拼团商品池。`
  }
  if (applyState.value.key === 'upcoming') {
    return `报名将于 ${begin} 开始；当前可先核对活动规则。`
  }
  if (pendingInActivity.value) {
    return `报名已于 ${end} 结束，仍有 ${pendingInActivity.value} 条待审核；未通过的申请不会进入拼团商品池。`
  }
  return `报名已于 ${end} 结束；历史报名与审核结果仅供查看。`
})

const detailView = computed(() => {
  const row = detailRow.value
  if (!row) return null
  const detail = detailPayload.value || ({} as GroupBuyApplyDetail)
  const auditStatus = detail.auditStatus ?? row.auditStatus
  return {
    id: row.id,
    spuName: detail.spuName || row.spuName || '—',
    mainImage: detail.mainImage || row.mainImage || '',
    activityId: detail.activityId ?? row.activityId,
    activityName: detail.activityName || activity.value?.name || row.activityName || '—',
    auditStatus,
    applyRemark: detail.applyRemark ?? row.applyRemark,
    auditRemark: detail.auditRemark ?? row.auditRemark,
    applyTime: normalizeTime(detail.createTime) || row.applyTime,
    auditTime: Number(auditStatus) === 1 ? '' : (normalizeTime(detail.updateTime) || row.auditTime),
    minGroup: Number(detail.minGroupPrice ?? row.minGroupPrice ?? 0),
    maxGroup: Number(detail.maxGroupPrice ?? row.maxGroupPrice ?? 0),
    minOrigin: Number(detail.minOriginPrice ?? row.minOriginPrice ?? 0),
    maxOrigin: Number(detail.maxOriginPrice ?? row.maxOriginPrice ?? 0),
    stock: Number(detail.groupStock ?? row.groupStock ?? 0),
    minPeople: Number(detail.activityMinPeople ?? activity.value?.minPeople ?? 0),
    groupLimit: detail.activityGroupLimit ?? activity.value?.groupLimit,
    detailDesc: detail.detailDesc ?? '',
    images: Array.isArray(detail.images) ? detail.images.filter(Boolean) : [],
    skus: Array.isArray(detail.skus) ? detail.skus : [],
  }
})

const detailAudit = computed(() => applyStatusMeta(detailView.value?.auditStatus))
const detailSkus = computed<GroupBuySku[]>(() => detailView.value?.skus || [])
const detailGallery = computed(() => {
  if (!detailView.value) return []
  const images = detailView.value.images.length
    ? detailView.value.images
    : (detailView.value.mainImage ? [detailView.value.mainImage] : [])
  return images
})
const detailDescText = computed(() => richTextToPlain(detailView.value?.detailDesc) || '未填写商品描述')

watch(
  () => route.query.auditStatus,
  (value) => {
    const next = mchGroupbuyAuditTab(value)
    if (next === activeTab.value) return
    activeTab.value = next
    page.current = 1
  },
)

watch(filtered, (rows) => {
  const maxPage = Math.max(1, Math.ceil(rows.length / page.size))
  if (page.current > maxPage) page.current = maxPage
})

onMounted(() => {
  void initialize()
})

async function initialize() {
  await loadActivities()
  if (!activities.value.length) {
    return
  }
  await loadApplies()
  resolveInitialActivityId(() => mchGroupbuyApplyActivityId(activities.value, allApplies.value))
}

async function loadApplies() {
  if (!shopId.value) {
    allApplies.value = []
    return
  }
  loading.value = true
  try {
    const rows = await loadAllPages<MchGroupbuyApplyRow>((params) => queryMchGroupBuyApplyList({ ...params, shopId: shopId.value }))
    allApplies.value = rows
      .filter((row) => row && row.id !== undefined && row.id !== null)
      .map((row) => toMchGroupbuyApplyRow({ ...row, createTime: normalizeTime(row.createTime), updateTime: normalizeTime(row.updateTime) }))
  } catch {
    allApplies.value = []
  } finally {
    loading.value = false
  }
}

function handleActivitySwitch() {
  activeTab.value = 'all'
  filters.keyword = ''
  applied.keyword = ''
  page.current = 1
  detailVisible.value = false
}

function handleActivityChange(value: string) {
  selectActivity(value)
}

function search() {
  applied.keyword = filters.keyword.trim()
  page.current = 1
}

function resetFilters() {
  filters.keyword = ''
  applied.keyword = ''
  activeTab.value = 'all'
  page.current = 1
}

function switchTab(key: string) {
  activeTab.value = key
  page.current = 1
}

function changePage(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
}

async function openDetail(row: MchGroupbuyApplyRow) {
  if (!shopId.value) return
  const token = ++detailToken
  detailRow.value = row
  detailPayload.value = null
  detailVisible.value = true
  detailLoading.value = true
  try {
    const response = await getMchGroupBuyApplyDetail({ shopId: shopId.value, id: row.id }) as unknown as { data?: GroupBuyApplyDetail }
    if (token !== detailToken) return
    detailPayload.value = response?.data || null
  } catch {
    if (token === detailToken) ElMessage.error('报名详情加载失败，请稍后重试')
  } finally {
    if (token === detailToken) detailLoading.value = false
  }
}

function goProducts(targetActivityId?: string | number) {
  detailVisible.value = false
  if (!targetActivityId) return
  void router.push({ path: '/mall/mch-group-buy/product', query: { activityId: String(targetActivityId) } })
}
</script>