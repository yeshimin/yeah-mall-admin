<template>
  <div class="mall-page sa-audit-page">
    <template v-if="activity">
      <div class="sa-activity-bar">
        <span class="sa-activity-icon"><el-icon><DocumentChecked /></el-icon></span>
        <div class="sa-activity-copy">
          <div class="sa-activity-title">
            <h2>{{ activity.name || '未命名活动' }}</h2>
            <span class="sa-status-ticket" :class="`tone-${applyState.tone}`">
              <i v-if="applyState.key === 'open'" class="sa-live-dot"></i>{{ applyState.label }}
            </span>
          </div>
          <div class="sa-activity-meta">
            <span><el-icon><Calendar /></el-icon>报名 {{ applyRangeText }}</span>
            <span><el-icon><Lightning /></el-icon>活动 {{ activityRangeText }}</span>
            <span><el-icon><Clock /></el-icon>共 {{ sessions.length }} 个场次</span>
            <span><el-icon><DocumentChecked /></el-icon>报名 {{ stats.activityTotal }} 条</span>
          </div>
        </div>
        <div class="sa-activity-controls">
          <label class="sa-activity-switch">
            <span>切换活动</span>
            <el-select
              v-model="activityId"
              class="sa-activity-select"
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
          <button type="button" class="sa-back-link" @click="goBackActivities">
            <el-icon><Back /></el-icon>返回活动管理
          </button>
        </div>
      </div>

      <div class="sa-queue">
        <div class="sa-tabs">
          <button
            v-for="tab in APPLY_TABS"
            :key="tab.key"
            type="button"
            :data-status="tab.key"
            :class="{ active: activeTab === tab.key }"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}<span class="sa-tab-count">{{ tabCount(tab.key) }}</span>
          </button>
        </div>
        <div class="sa-queue-summary">
          <span :class="{ 'is-warning': stats.pending > 0 }">
            <i v-if="stats.pending > 0" class="sa-live-dot"></i>待审核 <b>{{ stats.pending }}</b> 条
          </span>
          <span>
            <el-icon><CircleCheck /></el-icon>通过率 <b>{{ passRateText }}</b>
          </span>
        </div>
      </div>

      <section class="mall-filter-panel">
        <el-form :inline="true" class="mall-query-form" @submit.prevent="search">
          <el-form-item label="申请商家">
            <el-input
              v-model="filters.merchantName"
              class="sa-filter-merchant"
              clearable
              placeholder="商家名称或店铺名称"
              @keyup.enter="search"
            />
          </el-form-item>
          <el-form-item label="报名场次">
            <el-select v-model="filters.sessionId" class="sa-filter-session" clearable placeholder="全部场次">
              <el-option label="全部场次" value="" />
              <el-option
                v-for="item in sortedSessions"
                :key="String(item.id)"
                :label="item.name || String(item.id)"
                :value="String(item.id)"
              />
            </el-select>
          </el-form-item>
          <el-form-item class="mall-query-actions">
            <el-button @click="resetFilters">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" native-type="submit">
              <el-icon><Search /></el-icon>查询
            </el-button>
          </el-form-item>
        </el-form>
      </section>

      <section class="mall-table-panel sa-table-panel">
        <div class="sa-table-intro" :class="tableIntroTone">
          <span>
            <el-icon>
              <Warning v-if="tableIntroTone === 'is-warning'" />
              <Clock v-else-if="applyState.key === 'open'" />
              <DocumentChecked v-else />
            </el-icon>
            {{ tableIntroText }}
          </span>
          <div class="sa-intro-right">
            <b>筛选 {{ page.total }} 条</b>
            <span v-if="stats.pending > 0" class="sa-pending-chip">待审 {{ stats.pending }}</span>
          </div>
        </div>

        <el-table data-ym-table="r47" v-loading="loading" :data="records" row-key="applyId" class="sa-table" style="width: 100%">
          <el-table-column label="报名商品" min-width="250">
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
                  <b :title="row.spuName">{{ row.spuName || '—' }}</b>
                  <small :title="richTextToPlain(row.detailDesc) || '暂无商品描述'">{{ richTextToPlain(row.detailDesc) || '暂无商品描述' }}</small>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="商家 / 店铺" min-width="130">
            <template #default="{ row }">
              <div class="sa-party-cell">
                <b :title="row.mchName">{{ row.mchName || '—' }}</b>
                <small :title="row.shopName">{{ row.shopName || '—' }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="场次" min-width="130">
            <template #default="{ row }">
              <div class="sa-session-cell">
                <b :title="sessionNameOf(row)">{{ sessionNameOf(row) }}</b>
                <small>{{ sessionTimeOf(row) }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="报名时间" min-width="128">
            <template #default="{ row }">
              <div class="sa-time-cell">
                <b>{{ dateOnly(row.applyTime) }}</b>
                <small>{{ clockOnly(row.applyTime) }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="审核状态" min-width="96">
            <template #default="{ row }">
              <span class="sa-status-ticket" :class="`tone-${statusMeta(row.auditStatus).tone}`">
                {{ statusMeta(row.auditStatus).label }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="申请备注" min-width="130">
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
          <el-table-column label="审核备注" min-width="130">
            <template #default="{ row }">
              <span
                class="sa-remark"
                :class="{ 'is-empty': !row.auditRemark }"
                :title="row.auditRemark || (Number(row.auditStatus) === 1 ? '待审核' : '未填写审核备注')"
              >
                {{ row.auditRemark || (Number(row.auditStatus) === 1 ? '—' : '未填写') }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="82" align="right" header-align="center">
            <template #default="{ row }">
              <el-button link type="primary" class="sa-review-link" @click="openReview(row)">
                {{ Number(row.auditStatus) === 1 ? '审核' : '查看' }}
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <div class="sa-empty">
              <el-icon><DocumentChecked /></el-icon>
              <strong>{{ emptyTitle }}</strong>
              <span>{{ emptyDescription }}</span>
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
    </template>

    <section v-else-if="activitiesLoading" class="sa-page-empty">
      <span class="sa-page-empty-icon"><el-icon><DocumentChecked /></el-icon></span>
      <strong>正在加载秒杀活动</strong>
      <span>请稍候…</span>
    </section>

    <section v-else class="sa-page-empty">
      <span class="sa-page-empty-icon"><el-icon><DocumentChecked /></el-icon></span>
      <strong>暂无可管理的秒杀活动</strong>
      <span>请先在活动管理中创建并发布秒杀活动，再回来审核商家报名。</span>
      <button type="button" class="sa-page-empty-action" @click="goBackActivities">前往活动管理</button>
    </section>

    <el-dialog
      v-model="dialog.visible"
      width="880px"
      top="4vh"
      class="sa-audit-dialog"
      :close-on-click-modal="false"
      :close-on-press-escape="!dialog.submitting"
      :show-close="!dialog.submitting"
      @closed="resetDialog"
    >
      <template #header>
        <div class="sa-dialog-heading">
          <span>{{ isPending ? 'APPLY REVIEW' : 'APPLY DETAIL' }}</span>
          <h2>{{ isPending ? '报名审核' : '报名详情' }}</h2>
        </div>
      </template>

      <div v-if="dialog.row" v-loading="dialog.loading" class="sa-dialog-content">
        <div class="sa-apply-context">
          <div class="sa-context-item">
            <span>商家 / 店铺</span>
            <b :title="dialog.row.mchName">{{ dialog.row.mchName || '—' }}</b>
            <small :title="dialog.row.shopName">{{ dialog.row.shopName || '—' }}</small>
          </div>
          <div class="sa-context-item">
            <span>活动 / 场次</span>
            <b :title="activity?.name">{{ activity?.name || dialog.row.activityName || '—' }}</b>
            <small :title="dialogSessionName">{{ dialogSessionName }}</small>
          </div>
          <div class="sa-context-item">
            <span>报名时间</span>
            <b>{{ applyTimeText }}</b>
            <small>{{ auditTimeLine }}</small>
          </div>
          <div class="sa-context-item">
            <span>审核状态</span>
            <span class="sa-status-ticket" :class="`tone-${dialogStatusMeta.tone}`">
              {{ dialogStatusMeta.label }}
            </span>
            <small>{{ statusHint }}</small>
          </div>
        </div>

        <template v-if="dialog.detail">
          <div class="sa-product-panel">
            <span class="sa-product-art large">
              <el-image v-if="productImageKey" :src="storageUrl(productImageKey)" fit="cover">
                <template #error>
                  <span class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                </template>
              </el-image>
              <span v-else class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
            </span>
            <div class="sa-product-info">
              <h3>{{ productName }}</h3>
              <p>{{ productDescription }}</p>
              <div class="sa-product-tags">
                <span><el-icon><Goods /></el-icon>{{ skuSummary.skuCount }} 个 SKU</span>
                <span><el-icon><Tickets /></el-icon>报名库存 {{ skuSummary.stock }} 件</span>
              </div>
            </div>
            <div class="sa-price-panel">
              <span>秒杀价</span>
              <b>{{ seckillPriceText }}</b>
              <small>原价 {{ originPriceText }}</small>
            </div>
          </div>

          <div class="sa-apply-note">
            <el-icon><ChatLineSquare /></el-icon>
            <div>
              <b>商家报名备注</b>
              <p>{{ dialogApplyRemark || '未填写报名备注' }}</p>
            </div>
          </div>

          <div class="sa-section">
            <div class="sa-section-head">
              <b>SKU 信息</b>
              <small>共 {{ skuSummary.skuCount }} 个规格 · 报名库存 {{ skuSummary.stock }} 件</small>
            </div>
            <table v-if="skuRows.length" class="sa-sku-table">
              <thead>
                <tr>
                  <th>SKU 名称</th>
                  <th>规格编码</th>
                  <th>原价</th>
                  <th>秒杀价</th>
                  <th>库存</th>
                  <th>SKU 图片</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(sku, index) in skuRows" :key="`${sku.specCode || 'sku'}-${index}`">
                  <td><div class="sa-cb"><b class="sa-sku-name" :title="sku.name">{{ sku.name || '—' }}</b></div></td>
                  <td><div class="sa-cb"><span class="sa-sku-mono">{{ sku.specCode || '—' }}</span></div></td>
                  <td><div class="sa-cb"><span class="sa-sku-origin">{{ formatMoney(sku.originPrice) }}</span></div></td>
                  <td><div class="sa-cb"><span class="sa-sku-price">{{ formatMoney(sku.seckillPrice) }}</span></div></td>
                  <td><div class="sa-cb">{{ Number(sku.stock || 0) }} 件</div></td>
                  <td>
                    <div class="sa-cb">
                      <span class="sa-sku-art">
                        <el-image
                          v-if="sku.mainImage || productImageKey"
                          :src="storageUrl(sku.mainImage || productImageKey)"
                          fit="cover"
                        >
                          <template #error>
                            <span class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                          </template>
                        </el-image>
                        <span v-else class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="sa-empty-sku">暂无 SKU 信息</div>
          </div>

          <div class="sa-section">
            <div class="sa-section-head">
              <b>商品详情</b>
              <small>商家提交的富文本内容 · 只读预览</small>
            </div>
            <div v-if="productDetailHasContent" class="sa-richtext-wrap">
              <RichTextEditor :model-value="productDetailHtml" :height="260" readonly />
            </div>
            <div v-else class="sa-empty-sku">商家未提交商品详情</div>
          </div>

          <div class="sa-section sa-review-section">
            <div class="sa-section-head">
              <b>{{ isPending ? '审核操作' : '审核结果' }}</b>
              <small>{{ isPending ? '审核结果将同步至秒杀商品' : '审核记录仅供查看，不可再次提交' }}</small>
            </div>

            <template v-if="isPending">
              <div class="sa-result-options" role="radiogroup" aria-label="审核结果">
                <button
                  type="button"
                  role="radio"
                  :aria-checked="dialog.result === '2'"
                  class="sa-result-option is-pass"
                  :class="{ 'is-active': dialog.result === '2' }"
                  @click="dialog.result = '2'"
                >
                  <span class="sa-result-check"><el-icon><Check /></el-icon></span>
                  <span class="sa-result-copy">
                    <b>审核通过</b>
                    <small>商品资料与价格符合要求，进入对应场次的秒杀商品池。</small>
                  </span>
                </button>
                <button
                  type="button"
                  role="radio"
                  :aria-checked="dialog.result === '3'"
                  class="sa-result-option is-reject"
                  :class="{ 'is-active': dialog.result === '3' }"
                  @click="dialog.result = '3'"
                >
                  <span class="sa-result-check"><el-icon><Close /></el-icon></span>
                  <span class="sa-result-copy">
                    <b>审核驳回</b>
                    <small>商品资料或价格不符合要求，商家可调整后重新报名。</small>
                  </span>
                </button>
              </div>

              <div class="sa-remark-field">
                <span>审核备注<small>选填，审核结果与备注将同步给商家</small></span>
                <el-input
                  v-model="dialog.auditRemark"
                  type="textarea"
                  :rows="3"
                  maxlength="200"
                  :placeholder="dialog.result === '3' ? '建议说明驳回原因，便于商家调整后重新报名' : '可补充审核说明，最多 200 字'"
                />
                <div class="sa-remark-meta">
                  <small>{{ dialog.auditRemark.length }}/200</small>
                  <small v-if="dialog.result === '3'" class="is-warning">驳回时建议填写原因</small>
                </div>
              </div>

              <div class="sa-audit-tip">
                <el-icon><Warning /></el-icon>
                审核结果提交后不可修改，请先核对商品、价格与库存信息。
              </div>
            </template>

            <div v-else class="sa-audit-result" :class="`is-${dialogStatusMeta.key}`">
              <div class="sa-result-head">
                <span class="sa-status-ticket" :class="`tone-${dialogStatusMeta.tone}`">
                  {{ dialogStatusMeta.label }}
                </span>
                <span>审核时间 <b>{{ dialogAuditTime || '—' }}</b></span>
              </div>
              <div class="sa-result-note">
                <span>审核备注</span>
                <p>{{ dialogAuditRemark || '未填写审核备注' }}</p>
              </div>
            </div>
          </div>
        </template>

        <div v-else-if="!dialog.loading" class="sa-detail-failed">
          <el-icon><Warning /></el-icon>
          <span>报名详情加载失败，请关闭弹窗后重试。</span>
        </div>
      </div>

      <template #footer>
        <div class="sa-dialog-actions">
          <template v-if="isPending">
            <el-button :disabled="dialog.submitting" @click="closeDialog">取消</el-button>
            <el-button
              type="primary"
              :loading="dialog.submitting"
              :disabled="!dialog.result || dialog.loading || !dialog.detail?.apply"
              @click="submitAudit"
            >
              提交审核
            </el-button>
          </template>
          <el-button v-else @click="closeDialog">关闭</el-button>
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
  ChatLineSquare,
  Check,
  CircleCheck,
  Clock,
  Close,
  DocumentChecked,
  Goods,
  Lightning,
  Picture,
  Refresh,
  Search,
  Tickets,
  Warning,
} from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import RichTextEditor from '@/components/mall/RichTextEditor.vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import {
  auditSeckillApply,
  getSeckillApplyDetail,
  getSeckillApplyStats,
  querySeckillActivityList,
  querySeckillApplyList,
  querySeckillSessionList,
} from '@/api/mall/seckill'

defineOptions({ name: 'MallSeckillAuditManage' })

function richTextToPlain(html?: string) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim()
}

function hasRichContent(html?: string) {
  if (!html) return false
  return !!richTextToPlain(html) || /<img|<iframe/i.test(html)
}

type ApplyTabKey = 'all' | '1' | '2' | '3'
type StatusTone = 'success' | 'info' | 'neutral' | 'warning' | 'danger'
type ApplyWindowKey = 'none' | 'upcoming' | 'open' | 'closed'

interface SeckillActivityRecord {
  id: string | number
  name?: string
  applyBeginTime?: string
  applyEndTime?: string
  activityBeginTime?: string
  activityEndTime?: string
}

interface SeckillSessionRecord {
  id: string | number
  name?: string
  beginTime?: string
  endTime?: string
  sort?: number | string
}

interface ApplyRecord {
  applyId: string | number
  mchId?: string | number
  mchName?: string
  shopId?: string | number
  shopName?: string
  activityId?: string | number
  activityName?: string
  sessionId?: string | number
  sessionName?: string
  seckillSpuId?: string | number
  spuName?: string
  mainImage?: string
  detailDesc?: string
  auditStatus?: number | string
  applyRemark?: string
  auditRemark?: string
  applyTime?: string
  auditTime?: string
}

interface ApplyDetailApply {
  id: string | number
  auditStatus?: number | string
  applyRemark?: string
  auditRemark?: string
  createTime?: string
  updateTime?: string
}

interface ApplyDetailSpu {
  name?: string
  mainImage?: string
  detailDesc?: string
}

interface ApplySku {
  name?: string
  specCode?: string
  originPrice?: number | string
  seckillPrice?: number | string
  stock?: number | string
  mainImage?: string
}

interface ApplyDetail {
  apply?: ApplyDetailApply
  spu?: ApplyDetailSpu
  images?: string[]
  skuList?: ApplySku[]
}

interface PageResponse<T> {
  data?: {
    records?: T[]
    total?: number | string
  }
}

interface StatsResponse {
  data?: {
    total?: number | string
    pending?: number | string
    passed?: number | string
    rejected?: number | string
    activityTotal?: number | string
    activityPending?: number | string
  }
}

interface DetailResponse {
  data?: ApplyDetail
}

interface StatusMeta {
  key: string
  label: string
  tone: StatusTone
}

interface ApplyWindowState {
  key: ApplyWindowKey
  label: string
  tone: StatusTone
}

const APPLY_TABS: Array<{ key: ApplyTabKey; label: string }> = [
  { key: 'all', label: '全部' },
  { key: '1', label: '待审核' },
  { key: '2', label: '审核通过' },
  { key: '3', label: '审核驳回' },
]

const STATUS_META: Record<string, StatusMeta> = {
  '1': { key: 'pending', label: '待审核', tone: 'warning' },
  '2': { key: 'passed', label: '审核通过', tone: 'success' },
  '3': { key: 'rejected', label: '审核驳回', tone: 'danger' },
}

const route = useRoute()
const router = useRouter()

const activities = ref<SeckillActivityRecord[]>([])
const activityId = ref('')
const sessions = ref<SeckillSessionRecord[]>([])
const records = ref<ApplyRecord[]>([])
const activitiesLoading = ref(false)
const loading = ref(false)
const initialized = ref(false)
const now = ref(nowStamp())

const activeTab = ref<ApplyTabKey>('all')
const filters = reactive({
  merchantName: '',
  sessionId: '',
})
const applied = reactive({
  merchantName: '',
  sessionId: '',
})
const page = reactive({ current: 1, size: 10, total: 0 })
const stats = reactive({
  total: 0,
  pending: 0,
  passed: 0,
  rejected: 0,
  activityTotal: 0,
  activityPending: 0,
})

const dialog = reactive({
  visible: false,
  loading: false,
  submitting: false,
  row: null as ApplyRecord | null,
  detail: null as ApplyDetail | null,
  result: '' as '' | '2' | '3',
  auditRemark: '',
})

const availablePaths = computed(() => new Set(router.getRoutes().map((item) => item.path)))
const activity = computed(() => activities.value.find((item) => String(item.id) === activityId.value) || activities.value[0])
const sortedSessions = computed(() => {
  return [...sessions.value].sort((a, b) => {
    const timeCompare = String(a.beginTime || '').localeCompare(String(b.beginTime || ''))
    if (timeCompare !== 0) return timeCompare
    return Number(a.sort || 0) - Number(b.sort || 0)
  })
})
const applyState = computed(() => resolveApplyState(activity.value))
const applyRangeText = computed(() => formatRange(activity.value?.applyBeginTime, activity.value?.applyEndTime))
const activityRangeText = computed(() => formatRange(activity.value?.activityBeginTime, activity.value?.activityEndTime))
const passRate = computed(() => {
  const processed = stats.passed + stats.rejected
  if (!processed) return null
  return Math.round((stats.passed / processed) * 100)
})
const passRateText = computed(() => (passRate.value === null ? '—' : `${passRate.value}%`))
const hasAppliedFilters = computed(() => Boolean(applied.merchantName || applied.sessionId))
const tableIntroTone = computed(() => {
  if (applyState.value.key === 'closed' && stats.activityPending > 0) return 'is-warning'
  if (applyState.value.key === 'open') return 'is-open'
  return ''
})
const tableIntroText = computed(() => {
  const endText = formatDateTime(activity.value?.applyEndTime)
  if (applyState.value.key === 'open') {
    return `报名进行中，截止 ${endText}；仅待审核记录可执行审核。`
  }
  if (applyState.value.key === 'upcoming') {
    return `报名将于 ${formatDateTime(activity.value?.applyBeginTime)} 开始；当前可提前核对活动与场次。`
  }
  if (applyState.value.key === 'closed') {
    if (stats.activityPending > 0) {
      return `报名已于 ${endText} 结束，仍有 ${stats.activityPending} 条待审核；未通过的报名不会进入秒杀商品池。`
    }
    return `报名已于 ${endText} 结束；历史审核记录仅可查看。`
  }
  return '报名时间待设置；当前仅可查看历史审核记录。'
})
const emptyTitle = computed(() => {
  if (!stats.activityTotal) return '当前活动还没有报名记录'
  if (hasAppliedFilters.value) return '没有匹配的报名记录'
  if (activeTab.value !== 'all') return '当前状态下没有报名记录'
  return '当前活动还没有报名记录'
})
const emptyDescription = computed(() => {
  if (!stats.activityTotal) {
    if (applyState.value.key === 'upcoming') return '报名开始后，商家提交的记录会出现在这里'
    return '商家提交报名后，记录会出现在这里'
  }
  if (hasAppliedFilters.value) return '调整申请商家或报名场次筛选后重试'
  if (activeTab.value !== 'all') return '切换状态查看其他报名记录'
  return '商家提交报名后，记录会出现在这里'
})

const dialogStatusKey = computed(() => String(dialog.detail?.apply?.auditStatus ?? dialog.row?.auditStatus ?? ''))
const dialogStatusMeta = computed(() => statusMeta(dialogStatusKey.value))
const isPending = computed(() => dialogStatusKey.value === '1')
const dialogSession = computed(() => {
  if (!dialog.row) return null
  return sessionOf(dialog.row.sessionId)
})
const dialogSessionName = computed(() => {
  return dialogSession.value?.name || dialog.row?.sessionName || '场次待确认'
})
const applyTimeText = computed(() => {
  const value = dialog.detail?.apply?.createTime || dialog.row?.applyTime
  return formatDateTime(value)
})
const dialogAuditTime = computed(() => {
  if (isPending.value) return ''
  return formatDateTime(dialog.detail?.apply?.updateTime || dialog.row?.auditTime)
})
const auditTimeLine = computed(() => {
  if (isPending.value) return '等待平台审核'
  return dialogAuditTime.value === '—' ? '暂无审核时间' : `审核 ${dialogAuditTime.value}`
})
const dialogApplyRemark = computed(() => dialog.detail?.apply?.applyRemark || dialog.row?.applyRemark || '')
const dialogAuditRemark = computed(() => dialog.detail?.apply?.auditRemark || dialog.row?.auditRemark || '')
const statusHint = computed(() => {
  if (isPending.value) return '当前可提交审核结果'
  return dialogAuditRemark.value ? '已填写审核备注' : '未填写审核备注'
})
const productImageKey = computed(() => {
  return dialog.detail?.spu?.mainImage || dialog.detail?.images?.[0] || dialog.row?.mainImage || ''
})
const productName = computed(() => dialog.detail?.spu?.name || dialog.row?.spuName || '—')
const productDetailHtml = computed(() => dialog.detail?.spu?.detailDesc || dialog.row?.detailDesc || '')
const productDescription = computed(() => richTextToPlain(productDetailHtml.value) || '暂无商品描述')
const productDetailHasContent = computed(() => hasRichContent(productDetailHtml.value))
const skuRows = computed<ApplySku[]>(() => dialog.detail?.skuList || [])
const skuSummary = computed(() => {
  const stock = skuRows.value.reduce((total, sku) => total + Number(sku.stock || 0), 0)
  return { skuCount: skuRows.value.length, stock }
})
const seckillPriceText = computed(() => formatPriceRange(skuRows.value.map((sku) => sku.seckillPrice)))
const originPriceText = computed(() => formatPriceRange(skuRows.value.map((sku) => sku.originPrice)))

let listSeq = 0
let statsSeq = 0
let sessionSeq = 0
let dialogSeq = 0
let nowTimer: number | null = null

watch(
  () => route.query.activityId,
  (value) => {
    if (!initialized.value) return
    const nextId = value ? String(value) : ''
    if (!nextId || nextId === activityId.value) return
    if (!activities.value.some((item) => String(item.id) === nextId)) return
    activityId.value = nextId
    resetActivityState()
    syncActivityQuery()
    void loadActivityData()
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
  syncActivityQuery()
  await loadActivityData()
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

async function loadActivityData() {
  await Promise.all([loadSessions(), loadStats(), loadList()])
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
    }) as unknown as PageResponse<SeckillSessionRecord>
    if (token !== sessionSeq) return
    sessions.value = result.data?.records || []
  } catch {
    if (token === sessionSeq) sessions.value = []
  }
}

async function loadStats() {
  const currentId = activityId.value
  if (!currentId) {
    statsSeq++
    resetStats()
    return
  }

  const token = ++statsSeq
  try {
    const result = await getSeckillApplyStats(buildFilterParams()) as unknown as StatsResponse
    if (token !== statsSeq) return
    const data = result.data || {}
    stats.total = Number(data.total || 0)
    stats.pending = Number(data.pending || 0)
    stats.passed = Number(data.passed || 0)
    stats.rejected = Number(data.rejected || 0)
    stats.activityTotal = Number(data.activityTotal ?? data.total ?? 0)
    stats.activityPending = Number(data.activityPending ?? data.pending ?? 0)
  } catch {
    // 统计失败时保留当前计数，列表功能不受影响。
  }
}

async function loadList() {
  const currentId = activityId.value
  if (!currentId) {
    listSeq++
    records.value = []
    page.total = 0
    loading.value = false
    return
  }

  const token = ++listSeq
  loading.value = true
  try {
    const result = await querySeckillApplyList(buildListParams()) as unknown as PageResponse<ApplyRecord>
    if (token !== listSeq || currentId !== activityId.value) return
    records.value = result.data?.records || []
    page.total = Number(result.data?.total || 0)
    if (!records.value.length && page.total > 0 && page.current > 1) {
      page.current = Math.max(1, Math.ceil(page.total / page.size))
      await loadList()
    }
  } catch {
    if (token === listSeq) {
      records.value = []
      page.total = 0
    }
  } finally {
    if (token === listSeq) loading.value = false
  }
}

function buildFilterParams() {
  return {
    activityId: activityId.value,
    sessionId: applied.sessionId || undefined,
    mchName: applied.merchantName || undefined,
  }
}

function buildListParams() {
  return {
    ...buildFilterParams(),
    auditStatus: activeTab.value === 'all' ? undefined : activeTab.value,
    current: page.current,
    size: page.size,
  }
}

function handleActivityChange(value: string) {
  activityId.value = String(value || '')
  resetActivityState()
  syncActivityQuery()
  void loadActivityData()
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

function defaultActivityId() {
  const open = activities.value.find((item) => (
    item.applyBeginTime
    && item.applyEndTime
    && item.applyBeginTime <= now.value
    && now.value < item.applyEndTime
  ))
  if (open) return String(open.id)
  return activities.value[0] ? String(activities.value[0].id) : ''
}

function resetActivityState() {
  activeTab.value = 'all'
  filters.merchantName = ''
  filters.sessionId = ''
  applied.merchantName = ''
  applied.sessionId = ''
  page.current = 1
  sessions.value = []
  resetStats()
}

function resetStats() {
  stats.total = 0
  stats.pending = 0
  stats.passed = 0
  stats.rejected = 0
  stats.activityTotal = 0
  stats.activityPending = 0
}

function search() {
  applied.merchantName = filters.merchantName.trim()
  applied.sessionId = filters.sessionId ? String(filters.sessionId) : ''
  page.current = 1
  void loadStats()
  void loadList()
}

function resetFilters() {
  filters.merchantName = ''
  filters.sessionId = ''
  applied.merchantName = ''
  applied.sessionId = ''
  activeTab.value = 'all'
  page.current = 1
  void loadStats()
  void loadList()
}

function switchTab(key: ApplyTabKey) {
  activeTab.value = key
  page.current = 1
  void loadList()
}

function changePage(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
  void loadList()
}

function tabCount(key: ApplyTabKey) {
  if (key === 'all') return stats.total
  if (key === '1') return stats.pending
  if (key === '2') return stats.passed
  return stats.rejected
}

function goBackActivities() {
  const listPath = '/mall/seckill/list'
  if (!availablePaths.value.has(listPath)) {
    ElMessage.warning('暂无活动管理页面访问权限')
    return
  }
  void router.push(listPath)
}

function sessionOf(value?: string | number) {
  if (value === undefined || value === null || value === '') return null
  const key = String(value)
  return sessions.value.find((item) => String(item.id) === key) || null
}

function sessionNameOf(row: ApplyRecord) {
  return sessionOf(row.sessionId)?.name || row.sessionName || '—'
}

function sessionTimeOf(row: ApplyRecord) {
  const session = sessionOf(row.sessionId)
  if (!session?.beginTime || !session.endTime) return '场次时间待确认'
  const sameDay = String(session.beginTime).slice(0, 10) === String(session.endTime).slice(0, 10)
  if (sameDay) {
    return `${String(session.beginTime).slice(5, 16)} – ${String(session.endTime).slice(11, 16)}`
  }
  return `${String(session.beginTime).slice(5, 16)} – ${String(session.endTime).slice(5, 16)}`
}

function statusMeta(value?: number | string | null): StatusMeta {
  return STATUS_META[String(value ?? '')] || { key: 'unknown', label: '—', tone: 'neutral' }
}

function resolveApplyState(value?: SeckillActivityRecord): ApplyWindowState {
  if (!value?.applyBeginTime || !value.applyEndTime) {
    return { key: 'none', label: '报名未开放', tone: 'neutral' }
  }
  if (now.value < value.applyBeginTime) return { key: 'upcoming', label: '报名未开始', tone: 'info' }
  if (now.value < value.applyEndTime) return { key: 'open', label: '报名中', tone: 'success' }
  return { key: 'closed', label: '报名已结束', tone: 'neutral' }
}

async function openReview(row: ApplyRecord) {
  const token = ++dialogSeq
  dialog.row = row
  dialog.detail = null
  dialog.result = ''
  dialog.auditRemark = ''
  dialog.visible = true
  dialog.loading = true
  try {
    const result = await getSeckillApplyDetail(row.applyId) as unknown as DetailResponse
    if (token !== dialogSeq) return
    dialog.detail = result.data || null
  } catch {
    if (token === dialogSeq) dialog.detail = null
  } finally {
    if (token === dialogSeq) dialog.loading = false
  }
}

function resetDialog() {
  dialogSeq++
  dialog.row = null
  dialog.detail = null
  dialog.result = ''
  dialog.auditRemark = ''
  dialog.loading = false
  dialog.submitting = false
}

function closeDialog() {
  if (dialog.submitting) return
  dialog.visible = false
}

async function submitAudit() {
  if (!isPending.value || !dialog.result || !dialog.detail?.apply) return
  dialog.submitting = true
  try {
    await auditSeckillApply({
      applyId: dialog.detail.apply.id,
      auditStatus: Number(dialog.result),
      auditRemark: dialog.auditRemark.trim(),
    })
    ElMessage.success(dialog.result === '2' ? '报名已审核通过' : '报名已审核驳回')
    dialog.visible = false
    await Promise.all([loadStats(), loadList()])
  } catch {
    // 请求层已提示具体错误，保留弹窗便于调整后重试。
  } finally {
    dialog.submitting = false
  }
}

function formatRange(begin?: string, end?: string) {
  if (!begin && !end) return '待设置'
  if (begin && end) return `${formatDateTime(begin)} 至 ${formatDateTime(end)}`
  if (begin) return `${formatDateTime(begin)} 起（结束时间待设置）`
  return `截至 ${formatDateTime(end)}`
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

function formatMoney(value?: number | string) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `¥${amount.toFixed(2)}`
}

function formatPriceRange(values: Array<number | string | undefined>) {
  const amounts = values.map((value) => Number(value)).filter((value) => Number.isFinite(value))
  if (!amounts.length) return '—'
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  return min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`
}

function storageUrl(key?: string) {
  return key ? getStoragePreviewUrl(key) : ''
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
</script>

<style scoped>
.sa-audit-page {
  --sa-mono: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  --sa-warning: #a06616;
  --sa-warning-soft: #fbf1df;
  --sa-danger: var(--ym-price);
  --sa-danger-soft: #fcf1ef;
  --sa-info: #2f5f8f;
  --sa-info-soft: #eef4fb;
}

.sa-activity-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
  padding: 14px 16px;
  border: 1px solid var(--mall-line);
  border-radius: 8px;
  background: linear-gradient(90deg, #fff 0%, var(--ym-surface-2) 100%);
}

.sa-activity-icon {
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

.sa-activity-icon .el-icon {
  font-size: 22px;
}

.sa-activity-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.sa-activity-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.sa-activity-title h2 {
  margin: 0;
  color: var(--mall-ink);
  font-size: 17px;
  line-height: 1.2;
}

.sa-activity-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  color: var(--mall-muted);
  font-size: 11px;
}

.sa-activity-meta > span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.sa-activity-meta .el-icon {
  color: var(--mall-brand);
  opacity: 0.8;
}

.sa-activity-controls {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

.sa-activity-switch {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--mall-muted);
  font-size: 11px;
  white-space: nowrap;
}

.sa-activity-select {
  width: 210px;
}

.sa-activity-select :deep(.el-select__wrapper) {
  min-height: 32px;
}

.sa-back-link {
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

.sa-back-link:hover {
  border-color: var(--mall-brand);
  background: var(--ym-brand-soft);
}

.sa-status-ticket {
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

.sa-status-ticket.tone-success {
  color: var(--mall-brand);
  border-color: #c7d8de;
  background: var(--mall-brand-soft);
}

.sa-status-ticket.tone-info {
  color: var(--sa-info);
  border-color: #c9d9ea;
  background: var(--sa-info-soft);
}

.sa-status-ticket.tone-warning {
  color: var(--sa-warning);
  border-color: #f0dfc0;
  background: var(--sa-warning-soft);
}

.sa-status-ticket.tone-danger {
  color: var(--sa-danger);
  border-color: #e7bfbb;
  background: var(--sa-danger-soft);
}

.sa-status-ticket.tone-neutral {
  color: var(--mall-muted);
  border-color: var(--mall-line);
  background: var(--ym-paper);
}

.sa-live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: currentColor;
  animation: saLivePulse 1.8s ease-out infinite;
}

@keyframes saLivePulse {
  0% { box-shadow: 0 0 0 0 rgba(36, 99, 79, 0.3); }
  70% { box-shadow: 0 0 0 5px rgba(36, 99, 79, 0); }
  100% { box-shadow: 0 0 0 0 rgba(36, 99, 79, 0); }
}

.sa-queue {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 10px;
  padding: 0 2px;
}

.sa-tabs {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
}

.sa-tabs::-webkit-scrollbar {
  display: none;
}

.sa-tabs button {
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

.sa-tabs button:hover {
  color: var(--mall-ink);
  background: #fff;
}

.sa-tabs button.active {
  color: var(--mall-brand);
  background: var(--mall-brand-soft);
  font-weight: 600;
}

.sa-tab-count {
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

.sa-tabs button[data-status='1'] .sa-tab-count {
  color: var(--sa-warning);
  background: var(--sa-warning-soft);
}

.sa-tabs button[data-status='1'].active {
  color: var(--sa-warning);
  background: var(--sa-warning-soft);
}

.sa-tabs button[data-status='1'].active .sa-tab-count {
  color: #fff;
  background: #c98a2e;
}

.sa-tabs button.active .sa-tab-count {
  color: #fff;
  background: var(--mall-brand);
}

.sa-queue-summary {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 14px;
  color: var(--mall-muted);
  font-size: 11px;
  white-space: nowrap;
}

.sa-queue-summary > span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.sa-queue-summary b {
  color: var(--mall-ink);
  font: 600 13px var(--sa-mono);
}

.sa-queue-summary .el-icon {
  color: var(--mall-brand);
  opacity: 0.8;
}

.sa-queue-summary .is-warning,
.sa-queue-summary .is-warning b {
  color: var(--sa-warning);
}

.sa-filter-merchant {
  width: 260px;
}

.sa-filter-session {
  width: 190px;
}

.sa-table-panel {
  overflow: hidden;
}

.sa-table-intro {
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

.sa-table-intro > span {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.sa-table-intro .el-icon {
  flex: 0 0 auto;
  color: var(--mall-brand);
}

.sa-table-intro.is-open .el-icon {
  color: var(--mall-brand);
}

.sa-table-intro.is-warning {
  color: #8a5a17;
  border-bottom-color: #f0dfc0;
  background: #fffaf0;
}

.sa-table-intro.is-warning .el-icon {
  color: var(--sa-warning);
}

.sa-intro-right {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.sa-intro-right > b {
  color: var(--mall-ink-secondary);
  font-size: 11px;
  font-weight: 600;
}

.sa-pending-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  color: var(--sa-warning);
  border-radius: 4px;
  background: var(--sa-warning-soft);
  font-size: 11px;
}

.sa-table :deep(.el-table__cell) {
  vertical-align: middle;
}

.sa-table :deep(td.el-table__cell) {
  height: 60px;
}

.sa-product-cell {
  display: flex;
  width: 250px;
  max-width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 9px;
  margin: 0 auto;
  text-align: left;
}

.sa-product-art {
  position: relative;
  display: block;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  overflow: hidden;
  border: 1px solid var(--mall-line);
  border-radius: 7px;
  background: var(--ym-row-line);
}

.sa-product-art :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.sa-product-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.sa-product-copy b,
.sa-session-cell b,
.sa-party-cell b {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--mall-ink);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sa-product-copy small,
.sa-session-cell small,
.sa-party-cell small {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--mall-muted);
  font-size: 10px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sa-party-cell,
.sa-session-cell,
.sa-time-cell {
  display: flex;
  width: max-content;
  max-width: 100%;
  margin: 0 auto;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
}

.sa-time-cell b {
  color: var(--mall-ink-secondary);
  font: 600 11px var(--sa-mono);
  white-space: nowrap;
}

.sa-time-cell small {
  color: var(--mall-muted);
  font: 10px var(--sa-mono);
}

.sa-remark {
  display: -webkit-box;
  width: max-content;
  max-width: min(160px, 100%);
  margin: 0 auto;
  overflow: hidden;
  color: var(--mall-ink-secondary);
  font-size: 11px;
  line-height: 1.5;
  text-align: left;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.sa-remark.is-empty {
  color: #9aa59e;
}

.sa-review-link {
  color: var(--mall-brand) !important;
  font-weight: 600;
}

.sa-empty {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  color: var(--mall-muted);
}

.sa-empty .el-icon {
  margin-bottom: 3px;
  color: var(--mall-brand);
  font-size: 28px;
}

.sa-empty strong {
  color: var(--mall-ink);
  font-size: 13px;
}

.sa-empty span {
  font-size: 12px;
}

.sa-audit-page :deep(.mall-pagination) {
  min-height: 52px;
  align-items: center;
  margin: 0;
  padding: 9px 14px;
  border-top: 1px solid var(--mall-line);
}

.sa-page-empty {
  display: flex;
  min-height: 320px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  border: 1px solid var(--mall-line);
  border-radius: 8px;
  background: #fff;
  color: var(--mall-muted);
}

.sa-page-empty-icon {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  color: var(--mall-brand);
  border-radius: 14px;
  background: var(--mall-brand-soft);
  font-size: 26px;
}

.sa-page-empty strong {
  color: var(--mall-ink);
  font-size: 15px;
}

.sa-page-empty span {
  font-size: 12px;
}

.sa-page-empty-action {
  height: 34px;
  margin-top: 2px;
  padding: 0 14px;
  color: #fff;
  border: 0;
  border-radius: 6px;
  background: var(--mall-brand);
  font-size: 12px;
  cursor: pointer;
}

.sa-page-empty-action:hover {
  background: #22576b;
}

.sa-image-fallback {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: #8a978f;
  background: var(--ym-row-line);
  font-size: 16px;
}

/* 审核 / 详情弹窗：内部内容使用 scoped 样式，弹窗根节点样式见文件末尾全局块 */
.sa-dialog-heading span {
  color: var(--ym-brand);
  font: 600 10px var(--sa-mono);
  letter-spacing: 0.12em;
}

.sa-dialog-heading h2 {
  margin: 3px 0 0;
  color: var(--ym-ink);
  font-size: 19px;
  line-height: 1.3;
}

.sa-dialog-content {
  min-height: 220px;
}

.sa-apply-context {
  display: grid;
  grid-template-columns: 1fr 1.15fr 0.95fr 0.85fr;
  margin-top: 12px;
  overflow: hidden;
  border: 1px solid var(--ym-line);
  border-radius: 8px;
  background: var(--ym-row-hover);
}

.sa-context-item {
  min-width: 0;
  padding: 10px 12px;
  border-right: 1px solid var(--ym-line);
}

.sa-context-item:last-child {
  border-right: 0;
}

.sa-context-item > span:first-child {
  display: block;
  margin-bottom: 4px;
  color: var(--ym-muted);
  font-size: 10px;
}

.sa-context-item > b {
  display: block;
  overflow: hidden;
  color: var(--ym-ink);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sa-context-item > small {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  color: var(--ym-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sa-context-item > .sa-status-ticket {
  margin-top: 1px;
}

.sa-product-panel {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  margin-top: 10px;
  padding: 12px;
  border: 1px solid var(--ym-line);
  border-radius: 9px;
  background: #fff;
}

.sa-product-art.large {
  width: 88px;
  height: 88px;
  flex: 0 0 88px;
  border-radius: 9px;
}

.sa-product-art.large .sa-image-fallback {
  font-size: 24px;
}

.sa-product-info {
  min-width: 0;
}

.sa-product-info h3 {
  margin: 0;
  color: var(--ym-ink);
  font-size: 16px;
  line-height: 1.3;
}

.sa-product-info p {
  display: -webkit-box;
  margin: 6px 0 8px;
  overflow: hidden;
  color: var(--ym-muted);
  font-size: 11px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.sa-product-tags {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--ym-muted);
  font-size: 10.5px;
}

.sa-product-tags > span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sa-product-tags .el-icon {
  color: var(--ym-brand);
  opacity: 0.8;
}

.sa-price-panel {
  min-width: 158px;
  padding-left: 16px;
  border-left: 1px dashed var(--ym-line-strong);
  text-align: right;
}

.sa-price-panel > span {
  display: block;
  color: var(--ym-muted);
  font-size: 10px;
}

.sa-price-panel > b {
  display: block;
  margin: 4px 0 3px;
  color: var(--ym-price);
  font: 700 19px var(--sa-mono);
  white-space: nowrap;
}

.sa-price-panel > small {
  display: block;
  color: var(--ym-muted);
  font-size: 10px;
  white-space: nowrap;
}

.sa-apply-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  border: 1px solid #d5e2e7;
  border-radius: 7px;
  background: var(--ym-brand-soft);
}

.sa-apply-note > .el-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--ym-brand);
}

.sa-apply-note b {
  color: var(--ym-ink-secondary);
  font-size: 11px;
}

.sa-apply-note p {
  margin: 3px 0 0;
  color: var(--ym-ink-secondary);
  font-size: 11px;
  line-height: 1.55;
  white-space: pre-wrap;
}

.sa-section {
  margin-top: 12px;
}

.sa-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.sa-section-head b {
  color: var(--ym-ink);
  font-size: 13px;
}

.sa-section-head small {
  color: var(--ym-muted);
  font-size: 10px;
}

.sa-sku-table {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--ym-line);
  border-radius: 8px;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

.sa-sku-table th {
  height: 34px;
  padding: 0 8px;
  color: var(--ym-muted);
  border-bottom: 1px solid var(--ym-line);
  background: var(--ym-surface-2);
  font-size: 10.5px;
  font-weight: 600;
  text-align: center;
}

.sa-sku-table td {
  height: 44px;
  padding: 5px 8px;
  color: var(--ym-ink-secondary);
  border-bottom: 1px solid var(--ym-row-line);
  font-size: 11.5px;
  text-align: center;
}

.sa-sku-table tr:last-child td {
  border-bottom: 0;
}

.sa-sku-table th:nth-child(1) { width: 30%; }
.sa-sku-table th:nth-child(2) { width: 22%; }
.sa-sku-table th:nth-child(3) { width: 12%; }
.sa-sku-table th:nth-child(4) { width: 12%; }
.sa-sku-table th:nth-child(5) { width: 10%; }
.sa-sku-table th:nth-child(6) { width: 14%; }

.sa-sku-name {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  color: var(--ym-ink);
  font-size: 11.5px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.sa-sku-art {
  position: relative;
  display: block;
  width: 32px;
  height: 32px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid var(--ym-line);
  border-radius: 6px;
  background: var(--ym-row-line);
}

.sa-sku-art :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.sa-sku-mono {
  color: var(--ym-muted);
  font-family: var(--sa-mono);
}

.sa-sku-origin {
  color: #9aa59e;
  text-decoration: line-through;
  font-variant-numeric: tabular-nums;
}

.sa-sku-price {
  color: var(--ym-price);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.sa-empty-sku {
  padding: 24px;
  color: var(--ym-muted);
  border: 1px dashed var(--ym-line-strong);
  border-radius: 8px;
  text-align: center;
  font-size: 11px;
}

.sa-richtext-wrap {
  overflow: hidden;
  border: 1px solid var(--ym-line);
  border-radius: 8px;
  background: #fff;
}

.sa-richtext-wrap :deep(.ql-editor) {
  padding: 12px 14px;
  color: var(--ym-ink-secondary);
  font-size: 12px;
  line-height: 1.7;
}

.sa-richtext-wrap :deep(.ql-editor img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

.sa-richtext-wrap :deep(.ql-editor iframe) {
  max-width: 100%;
}

.sa-richtext-wrap :deep(.ql-editor::-webkit-scrollbar) {
  width: 8px;
}

.sa-richtext-wrap :deep(.ql-editor::-webkit-scrollbar-track) {
  background: #f4f7f4;
}

.sa-richtext-wrap :deep(.ql-editor::-webkit-scrollbar-thumb) {
  border-radius: 4px;
  background: #c3d2c8;
}

.sa-richtext-wrap :deep(.ql-editor::-webkit-scrollbar-thumb:hover) {
  background: #9fb8a8;
}

.sa-review-section {
  padding-top: 12px;
  border-top: 1px dashed var(--ym-line-strong);
}

.sa-result-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.sa-result-option {
  display: flex;
  min-height: 62px;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  text-align: left;
  border: 1px solid var(--ym-line-strong);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.sa-result-option:hover {
  border-color: #b9cec1;
  background: var(--ym-row-hover);
}

.sa-result-check {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  place-items: center;
  color: var(--ym-muted);
  border: 1px solid var(--ym-line-strong);
  border-radius: 50%;
  background: #fff;
}

.sa-result-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
  padding-top: 2px;
}

.sa-result-copy b {
  color: var(--ym-ink);
  font-size: 12.5px;
}

.sa-result-copy small {
  color: var(--ym-muted);
  font-size: 10.5px;
  line-height: 1.5;
}

.sa-result-option.is-pass.is-active {
  border-color: var(--ym-brand);
  background: var(--ym-brand-soft);
}

.sa-result-option.is-pass.is-active .sa-result-check {
  color: #fff;
  border-color: var(--ym-brand);
  background: var(--ym-brand);
}

.sa-result-option.is-pass.is-active .sa-result-copy b {
  color: var(--ym-brand);
}

.sa-result-option.is-reject.is-active {
  border-color: var(--ym-price);
  background: #fcf1ef;
}

.sa-result-option.is-reject.is-active .sa-result-check {
  color: #fff;
  border-color: var(--ym-price);
  background: var(--ym-price);
}

.sa-result-option.is-reject.is-active .sa-result-copy b {
  color: var(--ym-price);
}

.sa-remark-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
}

.sa-remark-field > span {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  color: var(--ym-ink-secondary);
  font-size: 12px;
  font-weight: 600;
}

.sa-remark-field > span small {
  color: var(--ym-muted);
  font-size: 10px;
  font-weight: 400;
}

.sa-remark-field :deep(.el-textarea__inner) {
  min-height: 66px;
  padding: 8px 10px;
  color: var(--ym-ink);
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.6;
  box-shadow: 0 0 0 1px var(--ym-line-strong) inset;
}

.sa-remark-field :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--ym-brand) inset, 0 0 0 2px rgba(36, 99, 79, 0.1);
}

.sa-remark-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--ym-muted);
  font-size: 10px;
}

.sa-remark-meta .is-warning {
  color: #a06616;
}

.sa-audit-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: var(--ym-muted);
  font-size: 10.5px;
}

.sa-audit-tip .el-icon {
  flex: 0 0 auto;
  color: #a06616;
}

.sa-audit-result {
  overflow: hidden;
  border: 1px solid var(--ym-line);
  border-radius: 8px;
  background: var(--ym-row-hover);
}

.sa-audit-result.is-passed {
  border-color: #cfe0d7;
}

.sa-audit-result.is-rejected {
  border-color: #edd2cd;
}

.sa-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 13px;
  border-bottom: 1px solid var(--ym-line);
}

.sa-result-head > span:last-child {
  color: var(--ym-muted);
  font-size: 10.5px;
}

.sa-result-head > span:last-child b {
  margin-left: 4px;
  color: var(--ym-ink-secondary);
  font-weight: 600;
}

.sa-result-note {
  padding: 12px 13px;
}

.sa-result-note > span {
  display: block;
  margin-bottom: 5px;
  color: var(--ym-muted);
  font-size: 10px;
}

.sa-result-note p {
  margin: 0;
  color: var(--ym-ink-secondary);
  font-size: 11.5px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.sa-detail-failed {
  display: flex;
  min-height: 150px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: var(--ym-price);
  font-size: 12px;
}

.sa-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1180px) {
  .sa-activity-bar {
    flex-wrap: wrap;
  }

  .sa-activity-controls {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 900px) {
  .sa-apply-context {
    grid-template-columns: 1fr 1fr;
  }

  .sa-context-item:nth-child(2) {
    border-right: 0;
  }

  .sa-context-item:nth-child(-n + 2) {
    border-bottom: 1px solid var(--ym-line);
  }

  .sa-product-panel {
    grid-template-columns: 76px minmax(0, 1fr);
  }

  .sa-product-art.large {
    width: 76px;
    height: 76px;
  }

  .sa-price-panel {
    grid-column: 1 / -1;
    padding-top: 9px;
    padding-left: 0;
    border-top: 1px dashed var(--ym-line-strong);
    border-left: 0;
    text-align: left;
  }

  .sa-result-options {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .sa-filter-merchant,
  .sa-filter-session {
    width: 100%;
  }

  .sa-apply-context {
    grid-template-columns: 1fr;
  }

  .sa-context-item {
    border-right: 0;
    border-bottom: 1px solid var(--ym-line);
  }

  .sa-context-item:last-child {
    border-bottom: 0;
  }
}
</style>

<style>
.sa-audit-dialog.el-dialog {
  --sa-ink: var(--ym-ink);
  --sa-ink-2: var(--ym-ink-secondary);
  --sa-brand: var(--ym-brand);
  --sa-brand-soft: var(--ym-brand-soft);
  --sa-muted: var(--ym-muted);
  --sa-muted-2: #9aa59e;
  --sa-line: var(--ym-line);
  --sa-line-strong: var(--ym-line-strong);
  --sa-price: var(--ym-price);
  --sa-mono: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  --mall-ink: var(--ym-ink);
  --mall-ink-secondary: var(--ym-ink-secondary);
  --mall-brand: var(--ym-brand);
  --mall-brand-soft: var(--ym-brand-soft);
  --mall-muted: var(--ym-muted);
  --mall-line: var(--ym-line);
  --mall-line-strong: var(--ym-line-strong);
  --mall-price: var(--ym-price);
  display: flex;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 60px);
  flex-direction: column;
  margin-bottom: 0;
  padding: 0;
  overflow: hidden;
  border-radius: 12px;
}

.sa-audit-dialog .el-dialog__header {
  flex: 0 0 auto;
  margin-right: 0;
  padding: 18px 22px 12px;
  border-bottom: 1px solid var(--ym-line);
}

.sa-audit-dialog .el-dialog__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 22px 10px;
}

.sa-audit-dialog .el-dialog__footer {
  flex: 0 0 auto;
  padding: 12px 22px 18px;
  border-top: 1px solid var(--ym-line);
}
</style>
