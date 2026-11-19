<template>
  <div class="mall-page groupbuy-page groupbuy-audit-page">
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
            <span><el-icon><DocumentChecked /></el-icon>申请 {{ activityApplies.length }} 条</span>
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
            <el-icon><Back /></el-icon>返回活动管理
          </button>
        </div>
      </div>

      <div class="ss-queue">
        <div class="ss-tabs">
          <button
            v-for="tab in APPLY_TABS"
            :key="tab.key"
            type="button"
            :data-status="tab.key"
            :class="{ active: activeTab === tab.key }"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}<span class="ss-tab-count">{{ counts[tab.key] }}</span>
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
          <el-form-item label="申请商家">
            <el-input
              v-model="filters.merchant"
              clearable
              placeholder="商家名称或店铺名称"
              @keyup.enter="search"
            />
          </el-form-item>
          <el-form-item label="商品名称">
            <el-input
              v-model="filters.keyword"
              clearable
              placeholder="搜索报名商品名称"
              @keyup.enter="search"
            />
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

      <section class="mall-table-panel">
        <div class="ss-table-intro" :class="tableIntroTone">
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

        <el-table data-ym-table="r72" v-loading="loading" :data="pagedRows" row-key="id" style="width: 100%">
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
          <el-table-column label="商家 / 店铺" width="150">
            <template #default="{ row }">
              <div class="sa-party-cell">
                <b :title="row.mchName">{{ row.mchName || '—' }}</b>
                <small :title="row.shopName">{{ row.shopName || '—' }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="拼团价" width="170">
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
          <el-table-column label="报名时间" width="128">
            <template #default="{ row }">
              <div class="sa-time-cell">
                <b>{{ dateOnly(row.createTime) }}</b>
                <small>{{ clockOnly(row.createTime) }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="审核状态" width="104">
            <template #default="{ row }">
              <span class="status-ticket" :class="`tone-${applyStatusMeta(row.auditStatus).tone}`">
                {{ applyStatusMeta(row.auditStatus).label }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="申请备注" min-width="150">
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
          <el-table-column label="审核备注" min-width="150">
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
          <el-table-column label="操作" width="82" fixed="right" class-name="mall-actions-column" align="right" header-align="center">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                :class="{ 'gb-review-link': Number(row.auditStatus) === 1 }"
                @click="openReview(row)"
              >
                {{ Number(row.auditStatus) === 1 ? '审核' : '查看' }}
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <div class="gb-empty">
              <el-icon><DocumentChecked /></el-icon>
              <b>{{ emptyTitle }}</b>
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

    <section v-else-if="activitiesLoading" class="gb-page-empty">
      <span class="gb-page-empty-icon"><el-icon><DocumentChecked /></el-icon></span>
      <strong>正在加载拼团活动</strong>
      <span>请稍候…</span>
    </section>

    <section v-else class="gb-page-empty">
      <span class="gb-page-empty-icon"><el-icon><DocumentChecked /></el-icon></span>
      <strong>暂无可管理的拼团活动</strong>
      <span>请先在活动管理中创建并发布拼团活动，再回来审核商家报名。</span>
      <button type="button" class="gb-page-empty-action" @click="goBackActivities">前往活动管理</button>
    </section>

    <el-dialog
      v-model="dialog.visible"
      width="880px"
      top="4vh"
      class="sa-audit-dialog gb-scope"
      :close-on-click-modal="false"
      :close-on-press-escape="!dialog.submitting"
      :show-close="!dialog.submitting"
      @closed="resetDialog"
    >
      <template #header>
        <div class="sa-dialog-heading">
          <span>{{ isPending ? 'APPLY REVIEW' : 'APPLY DETAIL' }}</span>
          <h2>{{ isPending ? '申请审核' : '申请详情' }}</h2>
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
            <span>活动 / 成团规则</span>
            <b :title="activity?.name">{{ activity?.name || dialog.row.activityName || '—' }}</b>
            <small>{{ ruleText }}</small>
          </div>
          <div class="sa-context-item">
            <span>报名时间</span>
            <b>{{ dialogApplyTime }}</b>
            <small>{{ auditTimeLine }}</small>
          </div>
          <div class="sa-context-item">
            <span>审核状态</span>
            <span class="status-ticket" :class="`tone-${dialogStatusMeta.tone}`">
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
              <span>拼团价</span>
              <b>{{ groupPriceText }}</b>
              <small>原价 {{ originPriceText }}</small>
            </div>
          </div>

          <div class="sa-apply-note">
            <el-icon><ChatDotRound /></el-icon>
            <div>
              <b>商家申请备注</b>
              <p>{{ dialogApplyRemark || '未填写申请备注' }}</p>
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
                  <th>拼团价</th>
                  <th>库存</th>
                  <th>SKU 图片</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(sku, index) in skuRows" :key="`${sku.specCode || 'sku'}-${index}`">
                  <td><div class="sa-cb"><b class="sa-sku-name" :title="sku.name">{{ sku.name || '—' }}</b></div></td>
                  <td><div class="sa-cb"><span class="sa-sku-mono">{{ sku.specCode || '—' }}</span></div></td>
                  <td><div class="sa-cb"><span class="sa-sku-origin">{{ seckillMoney(sku.originPrice) }}</span></div></td>
                  <td><div class="sa-cb"><span class="sa-sku-price">{{ seckillMoney(sku.groupPrice) }}</span></div></td>
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
              <small>{{ isPending ? '审核结果将同步至拼团商品池' : '审核记录仅供查看，不可再次提交' }}</small>
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
                    <small>商品资料与拼团价符合要求，活动开始时预留库存并进入拼团商品池。</small>
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
                    <small>商品资料或拼团价不符合要求，商家可调整后重新申请。</small>
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
                  :placeholder="dialog.result === '3' ? '建议说明驳回原因，便于商家调整后重新申请' : '可补充审核说明，最多 200 字'"
                />
                <div class="sa-remark-meta">
                  <small>{{ dialog.auditRemark.length }}/200</small>
                  <small v-if="dialog.result === '3'" class="is-warning">驳回时建议填写原因</small>
                </div>
              </div>

              <div class="sa-audit-tip">
                <el-icon><WarningFilled /></el-icon>
                审核结果提交后不可修改，请先核对商品、拼团价与库存信息。
              </div>
            </template>

            <div v-else class="sa-audit-result" :class="`is-${dialogStatusMeta.key}`">
              <div class="sa-result-head">
                <span class="status-ticket" :class="`tone-${dialogStatusMeta.tone}`">
                  {{ dialogStatusMeta.label }}
                </span>
                <span>审核时间 <b>{{ dialogAuditTime }}</b></span>
              </div>
              <div class="sa-result-note">
                <span>审核备注</span>
                <p>{{ dialogAuditRemark || '未填写审核备注' }}</p>
              </div>
            </div>
          </div>
        </template>

        <div v-else-if="!dialog.loading" class="sa-detail-failed">
          <el-icon><WarningFilled /></el-icon>
          <span>申请详情加载失败，请关闭弹窗后重试。</span>
        </div>
      </div>

      <template #footer>
        <div class="sa-dialog-actions">
          <template v-if="isPending">
            <el-button :disabled="dialog.submitting" @click="closeDialog">取消</el-button>
            <el-button
              type="primary"
              :loading="dialog.submitting"
              :disabled="!dialog.result || dialog.loading || !dialog.detail"
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Avatar,
  Back,
  Calendar,
  ChatDotRound,
  Check,
  Clock,
  Close,
  DocumentChecked,
  Goods,
  Lightning,
  Picture,
  Refresh,
  Search,
  Tickets,
  WarningFilled,
} from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import RichTextEditor from '@/components/mall/RichTextEditor.vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import {
  auditGroupBuyApply,
  getGroupBuyApplyDetail,
  queryGroupBuyApplyList,
} from '@/api/mall/groupBuy'
import {
  applyStatusMeta,
  dateOnly,
  dateTimeText,
  hasRichContent,
  richTextToPlain,
  seckillDiscount,
  seckillMoney,
  seckillRange,
  type PageResponse,
} from '../../seckill/insight-shared'
import {
  APPLY_TABS,
  groupbuyAuditDefaultActivityId,
  useGroupBuyContext,
  type GroupBuyApply,
  type GroupBuyApplyDetail,
  type GroupBuySku,
} from '../groupbuy-shared'
import '@/assets/yeah-mall-seckill-insight.css'

defineOptions({ name: 'MallGroupBuyAuditManage' })

const {
  activities,
  activityId,
  activitiesLoading,
  initialized,
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
} = useGroupBuyContext({ onRouteActivityChange: handleActivitySwitch })

const allApplies = ref<GroupBuyApply[]>([])
const loading = ref(false)
const activeTab = ref('all')
const filters = reactive({ merchant: '', keyword: '' })
const applied = reactive({ merchant: '', keyword: '' })
const page = reactive({ current: 1, size: 10, total: 0 })

let applySeq = 0
let dialogSeq = 0

const dialog = reactive<{
  visible: boolean
  loading: boolean
  submitting: boolean
  row: GroupBuyApply | null
  detail: GroupBuyApplyDetail | null
  result: '' | '2' | '3'
  auditRemark: string
}>({
  visible: false,
  loading: false,
  submitting: false,
  row: null,
  detail: null,
  result: '',
  auditRemark: '',
})

const activityApplies = computed(() => (
  allApplies.value.filter((row) => String(row.activityId ?? '') === String(activity.value?.id ?? ''))
))

const baseRows = computed(() => {
  const merchant = applied.merchant.trim().toLowerCase()
  const keyword = applied.keyword.trim().toLowerCase()
  return activityApplies.value
    .filter((row) => (
      (!merchant || `${row.mchName || ''}${row.shopName || ''}`.toLowerCase().includes(merchant))
      && (!keyword || String(row.spuName || '').toLowerCase().includes(keyword))
    ))
    .slice()
    .sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')))
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
    return `报名进行中，截止 ${end}；仅待审核记录可执行审核，通过后商品进入拼团商品池。`
  }
  if (applyState.value.key === 'upcoming') {
    return `报名将于 ${begin} 开始；当前可提前核对活动规则。`
  }
  if (applyState.value.key === 'none') {
    return '报名时间待设置；当前仅可查看历史审核记录。'
  }
  if (pendingInActivity.value) {
    return `报名已于 ${end} 结束，仍有 ${pendingInActivity.value} 条待审核；未通过的申请不会进入拼团商品池。`
  }
  return `报名已于 ${end} 结束；历史审核记录仅可查看。`
})

const emptyTitle = computed(() => (
  activityApplies.value.length ? '没有匹配的申请记录' : '当前活动还没有申请记录'
))

const emptyDescription = computed(() => {
  if (activityApplies.value.length) return '调整申请商家或商品名称筛选后重试'
  return applyState.value.key === 'upcoming'
    ? '报名开始后，商家提交的记录会出现在这里'
    : '商家提交申请后，记录会出现在这里'
})

const dialogStatusMeta = computed(() => applyStatusMeta(dialog.detail?.auditStatus ?? dialog.row?.auditStatus))
const isPending = computed(() => dialogStatusMeta.value.key === 'pending')
const dialogApplyTime = computed(() => dateTimeText(dialog.detail?.createTime || dialog.row?.createTime))
const dialogAuditTime = computed(() => dateTimeText(dialog.detail?.updateTime || dialog.row?.updateTime))
const auditTimeLine = computed(() => (
  dialogAuditTime.value === '—' ? '等待平台审核' : `审核 ${dialogAuditTime.value}`
))
const dialogApplyRemark = computed(() => dialog.detail?.applyRemark || dialog.row?.applyRemark || '')
const dialogAuditRemark = computed(() => dialog.detail?.auditRemark || dialog.row?.auditRemark || '')
const statusHint = computed(() => {
  if (isPending.value) return '当前可提交审核结果'
  return dialogAuditRemark.value ? '已填写审核备注' : '未填写审核备注'
})
const productImageKey = computed(() => dialog.detail?.mainImage || dialog.row?.mainImage || '')
const productName = computed(() => dialog.detail?.spuName || dialog.row?.spuName || '—')
const productDetailHtml = computed(() => dialog.detail?.detailDesc || '')
const productDescription = computed(() => richTextToPlain(productDetailHtml.value) || '暂无商品描述')
const productDetailHasContent = computed(() => hasRichContent(productDetailHtml.value))
const skuRows = computed<GroupBuySku[]>(() => dialog.detail?.skus || [])

const skuSummary = computed(() => {
  const skus = skuRows.value
  const stock = skus.length
    ? skus.reduce((total, sku) => total + Number(sku.stock || 0), 0)
    : Number(dialog.row?.groupStock || 0)
  return { skuCount: skus.length, stock }
})

const groupPriceText = computed(() => skuPriceRange('groupPrice', dialog.row?.minGroupPrice, dialog.row?.maxGroupPrice))
const originPriceText = computed(() => skuPriceRange('originPrice', dialog.row?.minOriginPrice, dialog.row?.maxOriginPrice))

watch(filtered, (rows) => {
  page.total = rows.length
  const maxPage = Math.max(1, Math.ceil(rows.length / page.size))
  if (page.current > maxPage) page.current = maxPage
}, { immediate: true })

onMounted(() => {
  void initialize()
})

async function initialize() {
  await loadActivities()
  if (!activities.value.length) {
    initialized.value = true
    return
  }
  await loadApplies()
  resolveInitialActivityId(() => groupbuyAuditDefaultActivityId(activities.value, allApplies.value, now.value))
}

async function loadApplies() {
  const token = ++applySeq
  loading.value = true
  try {
    const result = await queryGroupBuyApplyList({ current: 1, size: 500 }) as unknown as PageResponse<GroupBuyApply>
    if (token !== applySeq) return
    allApplies.value = (result.data?.records || [])
      .filter((row) => row && row.id !== undefined && row.id !== null)
      .map((row) => ({
        ...row,
        createTime: normalizeTime(row.createTime),
        updateTime: normalizeTime(row.updateTime),
      }))
  } catch {
    if (token === applySeq) allApplies.value = []
  } finally {
    if (token === applySeq) loading.value = false
  }
}

function handleActivitySwitch() {
  activeTab.value = 'all'
  filters.merchant = ''
  filters.keyword = ''
  applied.merchant = ''
  applied.keyword = ''
  page.current = 1
}

function handleActivityChange(value: string) {
  selectActivity(value)
}

function search() {
  applied.merchant = filters.merchant.trim()
  applied.keyword = filters.keyword.trim()
  page.current = 1
}

function resetFilters() {
  filters.merchant = ''
  filters.keyword = ''
  applied.merchant = ''
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

async function openReview(row: GroupBuyApply) {
  const token = ++dialogSeq
  dialog.row = row
  dialog.detail = null
  dialog.result = ''
  dialog.auditRemark = ''
  dialog.visible = true
  dialog.loading = true
  try {
    const result = await getGroupBuyApplyDetail(row.id) as unknown as { data?: GroupBuyApplyDetail }
    if (token !== dialogSeq) return
    const detail = result.data
    dialog.detail = detail
      ? { ...detail, createTime: normalizeTime(detail.createTime), updateTime: normalizeTime(detail.updateTime) }
      : null
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
  if (!isPending.value || !dialog.result || !dialog.detail) return
  dialog.submitting = true
  try {
    await auditGroupBuyApply({
      applyId: dialog.detail.id ?? dialog.row?.id,
      auditStatus: Number(dialog.result),
      auditRemark: dialog.auditRemark.trim(),
    })
    ElMessage.success(dialog.result === '2' ? '申请已审核通过，商品进入拼团商品池' : '申请已审核驳回')
    dialog.visible = false
    await loadApplies()
  } catch {
    // 请求错误已由全局拦截器提示，保留弹窗便于调整后重试。
  } finally {
    dialog.submitting = false
  }
}

function skuPriceRange(
  field: 'groupPrice' | 'originPrice',
  fallbackMin?: number | string,
  fallbackMax?: number | string,
) {
  const values = skuRows.value.map((sku) => Number(sku[field])).filter((value) => Number.isFinite(value))
  if (!values.length) return seckillRange(fallbackMin, fallbackMax)
  return seckillRange(Math.min(...values), Math.max(...values))
}

function normalizeTime(value?: string) {
  return value ? String(value).replace('T', ' ') : value
}

function clockOnly(value?: string) {
  return value && String(value).length >= 16 ? String(value).replace('T', ' ').slice(11, 16) : '—'
}

function storageUrl(key?: string) {
  return key ? getStoragePreviewUrl(key) : ''
}
</script>