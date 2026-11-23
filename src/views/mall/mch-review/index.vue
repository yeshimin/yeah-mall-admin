<template>
  <div class="mall-page merchant-review-page">
    <div class="review-metrics">
      <article>
        <span>好评（4-5 星）</span>
        <b>{{ stats.goodCount }}</b>
        <small>占比 {{ pct(stats.goodCount) }}%</small>
      </article>
      <article>
        <span>中评（3 星）</span>
        <b>{{ stats.middleCount }}</b>
        <small>占比 {{ pct(stats.middleCount) }}%</small>
      </article>
      <article>
        <span>差评（1-2 星）</span>
        <b>{{ stats.badCount }}</b>
        <small>占比 {{ pct(stats.badCount) }}%</small>
      </article>
      <article :class="stats.pendingCount ? 'attention' : ''">
        <span>待回复</span>
        <b>{{ stats.pendingCount }}</b>
        <small :class="stats.pendingCount ? 'attention' : ''">及时回复可提升买家体验</small>
      </article>
    </div>

    <div class="mr-tabs">
      <button
        v-for="item in TABS"
        :key="item"
        :class="activeTab === item ? 'active' : ''"
        @click="switchTab(item)"
      >
        {{ item }}<i>{{ tabCount(item) }}</i>
      </button>
    </div>

    <section class="mall-filter-panel">
      <el-form :inline="true" class="mall-query-form" @submit.prevent="handleSearch">
        <div class="mr-filter-fields">
          <el-form-item label="关键词">
            <el-input
              v-model="draft.keyword"
              class="mr-keyword"
              clearable
              placeholder="商品名称、订单编号或用户昵称"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="评价等级">
            <el-select v-model="draft.ratingType" placeholder="全部等级">
              <el-option label="全部等级" value="" />
              <el-option label="好评" value="good" />
              <el-option label="中评" value="middle" />
              <el-option label="差评" value="bad" />
            </el-select>
          </el-form-item>
          <el-form-item label="评价图片">
            <el-select v-model="draft.hasImage" placeholder="全部">
              <el-option label="全部" value="" />
              <el-option label="有图" :value="true" />
              <el-option label="无图" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item label="评价时间">
            <span class="mr-date-range">
              <el-date-picker v-model="draft.beginDate" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" clearable />
              <i class="mr-date-sep">至</i>
              <el-date-picker v-model="draft.endDate" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" clearable />
            </span>
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
      <el-table data-ym-table="r76" v-loading="loading" :data="records" row-key="id" style="width: 100%">
        <el-table-column label="商品" min-width="210" align="center" header-align="center">
          <template #default="{ row }">
            <div class="mr-product">
              <el-image
                v-if="row.spuMainImage"
                class="mr-art"
                :src="getStoragePreviewUrl(row.spuMainImage)"
                :preview-src-list="[getStoragePreviewUrl(row.spuMainImage)]"
                preview-teleported
                fit="cover"
              />
              <span v-else class="mr-art mr-art-empty">—</span>
              <div class="mr-product-info">
                <b :title="row.spuName">{{ row.spuName || '—' }}</b>
                <small>{{ row.skuName || '—' }}</small>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="订单编号" min-width="150" align="center" header-align="center">
          <template #default="{ row }">
            <CopyableText :value="row.orderNo" label="订单编号" />
          </template>
        </el-table-column>
        <el-table-column label="评价用户" min-width="80" align="center" header-align="center">
          <template #default="{ row }">{{ row.nickname || '—' }}</template>
        </el-table-column>
        <el-table-column label="评分" min-width="60" align="center" header-align="center">
          <template #default="{ row }">
            <b class="rv-rating" :class="ratingTone(row.overallRating)">{{ `${row.overallRating} 星` }}</b>
          </template>
        </el-table-column>
        <el-table-column label="评价内容" min-width="210" align="center" header-align="center">
          <template #default="{ row }">
            <span class="mr-content" :title="row.content">{{ row.content || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="回复状态" min-width="90" align="center" header-align="center">
          <template #default="{ row }">
            <span class="status-ticket" :class="isPending(row) ? 'tone-warning' : 'tone-info'">
              {{ isPending(row) ? '待商家回复' : '待买家回复' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="评价时间" min-width="136" align="center" header-align="center">
          <template #default="{ row }">{{ row.createTime || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="132" fixed="right" align="right" header-align="center">
          <template #default="{ row }">
            <div class="mr-row-actions">
              <el-button link type="primary" @click="openReply(row)">{{ replyActionText(row) }}</el-button>
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="mr-empty">
            <el-icon :size="28"><ChatDotRound /></el-icon>
            <b>没有匹配的评价</b>
            <span>调整筛选条件后重试</span>
          </div>
        </template>
      </el-table>

      <MallPagination
        :total="pagination.total"
        :page="pagination.current"
        :limit="pagination.pageSize"
        @pagination="changePage"
      />
    </section>

    <el-dialog
      v-model="replyDialog.visible"
      width="600px"
      class="mr-reply-dialog"
      :close-on-click-modal="false"
      append-to-body
    >
      <template #header>
        <div class="mr-dialog-head">
          <span>REPLY</span>
          <h2>{{ replyDialogTitle }}</h2>
        </div>
      </template>
      <div v-if="replyDialog.review" class="mr-review-quote">
        <b>{{ replyDialog.review.spuName }}</b>
        <small>{{ replyDialog.review.nickname }} · {{ replyDialog.review.overallRating }} 星 · {{ replyDialog.review.createTime }}</small>
        <p>{{ replyDialog.review.content || '未填写评价内容' }}</p>
      </div>
      <div v-if="replyDialog.replies.length" class="mr-thread">
        <div v-for="item in replyDialog.replies" :key="item.id" class="mr-reply-item">
          <b>{{ item.senderType === 1 ? '买家回复' : '商家回复' }}</b>
          <p>{{ item.content }}</p>
          <span>{{ item.updateTime || item.createTime }}</span>
        </div>
      </div>
      <div class="mr-hint">
        <el-icon><ChatDotRound /></el-icon>
        <span>{{ replyDialogTip }}</span>
      </div>
      <div class="mr-field">
        <span>回复内容 <small>500 字以内</small></span>
        <el-input
          v-model="replyDialog.content"
          type="textarea"
          :rows="4"
          maxlength="500"
          resize="none"
          placeholder="输入对买家评价的公开回复"
        />
        <em class="mr-counter">{{ replyDialog.content.length }}/500</em>
      </div>
      <template #footer>
        <el-button @click="replyDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="replying" @click="submitReply">保存回复</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialog.visible" width="640px" class="mr-detail-dialog" append-to-body>
      <template #header>
        <div class="mr-dialog-head">
          <span>REVIEW DETAIL</span>
          <h2>评价详情</h2>
        </div>
      </template>
      <template v-if="detailDialog.review">
        <div class="description-grid">
          <div class="wide"><span>商品</span><b>{{ detailDialog.review.spuName }} · {{ detailDialog.review.skuName }}</b></div>
          <div><span>订单编号</span><b class="mono">{{ detailDialog.review.orderNo }}</b></div>
          <div><span>评分</span><b class="rv-rating" :class="ratingTone(detailDialog.review.overallRating)">{{ `${detailDialog.review.overallRating} 星` }}</b></div>
          <div><span>评价用户</span><b>{{ detailDialog.review.nickname }}</b></div>
          <div><span>评价时间</span><b>{{ detailDialog.review.createTime }}</b></div>
          <div class="wide"><span>评价内容</span><b>{{ detailDialog.review.content || '未填写评价内容' }}</b></div>
        </div>
        <div v-if="detailDialog.images.length" class="mr-evidence">
          <el-image
            v-for="(image, index) in detailDialog.images"
            :key="index"
            class="mr-evidence-item"
            :src="getStoragePreviewUrl(image)"
            :preview-src-list="detailDialog.images.map(getStoragePreviewUrl)"
            :initial-index="index"
            preview-teleported
            fit="cover"
          />
        </div>
        <div v-if="detailDialog.replies.length" class="mr-thread mr-thread-detail">
          <div v-for="item in detailDialog.replies" :key="item.id" class="mr-reply-item">
            <b>{{ item.senderType === 1 ? '买家回复' : '商家回复' }}</b>
            <p>{{ item.content }}</p>
            <span>{{ item.updateTime || item.createTime }}</span>
          </div>
        </div>
        <p v-else class="mr-empty-reply">暂无回复记录</p>
      </template>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="replyFromDetail">{{ detailReplyActionText }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, ChatDotRound } from '@element-plus/icons-vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { getCurrentShop } from '@/utils/shop'
import { getMchReviewDetail, getMchReviewStats, queryMchReviews, replyMchReview } from '@/api/mall/review'
import CopyableText from '@/components/mall/CopyableText.vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import '@/assets/yeah-mall-review.css'

defineOptions({ name: 'MallMchReviewManage' })

const TABS = ['全部评价', '待回复', '已回复']
const route = useRoute()

const loading = ref(false)
const replying = ref(false)
const records = ref<any[]>([])
const stats = reactive({ total: 0, goodCount: 0, middleCount: 0, badCount: 0, pendingCount: 0, repliedCount: 0 })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const emptyDraft = () => ({ keyword: '', ratingType: '', hasImage: '' as boolean | '', beginDate: '', endDate: '' })
const draft = reactive(emptyDraft())
const query = reactive(emptyDraft())

function initialTab() {
  const requested = String(route.query.tab || '')
  if (TABS.includes(requested)) return requested
  return route.query.isReplied === 'false' ? '待回复' : '全部评价'
}
const activeTab = ref(initialTab())

const replyDialog = reactive({
  visible: false,
  id: '',
  mode: 'initial' as 'initial' | 'continue' | 'edit',
  content: '',
  replies: [] as any[],
  review: null as any,
})

const detailDialog = reactive({ visible: false, review: null as any, images: [] as string[], replies: [] as any[] })

const shopId = () => getCurrentShop()?.id

function pct(value: number) {
  return stats.total ? Math.round((value * 1000) / stats.total) / 10 : 0
}

function tabCount(item: string) {
  if (item === '待回复') return stats.pendingCount
  if (item === '已回复') return stats.repliedCount
  return stats.total
}

function ratingTone(rating: number) {
  if (rating >= 4) return 'good'
  if (rating === 3) return 'middle'
  return 'bad'
}

function isPending(row: any) {
  return !row.isReplied || row.lastReplySenderType === 1
}

function replyActionText(row: any) {
  if (!row.isReplied) return '回复'
  return row.lastReplySenderType === 1 ? '继续回复' : '修改回复'
}

const detailReplyActionText = computed(() => {
  const list = detailDialog.replies
  return !list.length || list[list.length - 1].senderType === 1 ? (list.length ? '继续回复' : '回复') : '修改回复'
})

const replyDialogTitle = computed(() => {
  if (replyDialog.mode === 'edit') return '修改最新回复'
  return replyDialog.mode === 'initial' ? '回复评价' : '继续回复评价'
})

const replyDialogTip = computed(() => {
  if (replyDialog.mode === 'edit') return '买家尚未回复，可修改你的最新回复。'
  if (replyDialog.mode === 'initial') return '这是商家对买家首评的第一条公开回复。'
  return '本次将作为下一轮商家回复发送；同一方不能连续新增回复。'
})

async function loadStats() {
  const currentShopId = shopId()
  if (!currentShopId) return
  try {
    const result: any = await getMchReviewStats({ shopId: currentShopId })
    const data = result.data || {}
    stats.total = Number(data.total || 0)
    stats.goodCount = Number(data.goodCount || 0)
    stats.middleCount = Number(data.middleCount || 0)
    stats.badCount = Number(data.badCount || 0)
    stats.pendingCount = Number(data.pendingCount || 0)
    stats.repliedCount = Number(data.repliedCount || 0)
  } catch {
    // 错误提示由 request 拦截器统一处理
  }
}

async function load(reset = false) {
  const currentShopId = shopId()
  if (!currentShopId) return
  if (reset) pagination.current = 1
  loading.value = true
  try {
    const replyState = activeTab.value === '待回复' ? 'pending' : activeTab.value === '已回复' ? 'done' : undefined
    const result: any = await queryMchReviews({
      keyword: query.keyword || undefined,
      ratingType: query.ratingType || undefined,
      hasImage: query.hasImage === '' ? undefined : query.hasImage,
      replyState,
      beginTime: query.beginDate ? `${query.beginDate} 00:00:00` : undefined,
      endTime: query.endDate ? `${query.endDate} 23:59:59` : undefined,
      shopId: currentShopId,
      current: pagination.current,
      size: pagination.pageSize,
    })
    records.value = result.data?.records || []
    pagination.total = Number(result.data?.total || 0)
  } catch {
    records.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

function applyDraft() {
  query.keyword = draft.keyword.trim()
  query.ratingType = draft.ratingType
  query.hasImage = draft.hasImage
  query.beginDate = draft.beginDate
  query.endDate = draft.endDate
}

function handleSearch() {
  applyDraft()
  load(true)
}

function resetQuery() {
  Object.assign(draft, emptyDraft())
  Object.assign(query, emptyDraft())
  load(true)
}

function switchTab(item: string) {
  if (activeTab.value === item) return
  activeTab.value = item
  load(true)
}

function changePage(payload: { page: number; limit: number }) {
  pagination.current = payload.page
  pagination.pageSize = payload.limit
  load()
}

async function openReply(row: any) {
  const currentShopId = shopId()
  if (!currentShopId) return
  const result: any = await getMchReviewDetail({ shopId: currentShopId, id: row.id })
  const replies = result.data?.replies || []
  const latestReply = replies[replies.length - 1]
  replyDialog.id = row.id
  replyDialog.review = row
  replyDialog.replies = replies
  replyDialog.mode = !latestReply ? 'initial' : latestReply.senderType === 2 ? 'edit' : 'continue'
  replyDialog.content = replyDialog.mode === 'edit' ? latestReply.content : ''
  replyDialog.visible = true
}

async function submitReply() {
  const currentShopId = shopId()
  const content = replyDialog.content.trim()
  if (!currentShopId || !content) {
    ElMessage.warning('请输入回复内容')
    return
  }
  replying.value = true
  try {
    await replyMchReview(currentShopId, { id: replyDialog.id, replyContent: content })
    ElMessage.success('回复已保存')
    replyDialog.visible = false
    await Promise.all([loadStats(), load()])
  } finally {
    replying.value = false
  }
}

async function openDetail(row: any) {
  const currentShopId = shopId()
  if (!currentShopId) return
  const result: any = await getMchReviewDetail({ shopId: currentShopId, id: row.id })
  detailDialog.review = result.data?.review || null
  detailDialog.images = result.data?.images || []
  detailDialog.replies = result.data?.replies || []
  detailDialog.visible = true
}

function replyFromDetail() {
  const row = detailDialog.review
  detailDialog.visible = false
  if (row) openReply(row)
}

onMounted(() => {
  loadStats()
  load()
})
</script>