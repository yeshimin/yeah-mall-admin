<template>
  <div class="mall-page">
    <el-form :inline="true" class="query-form">
      <el-form-item label="商品 SPU"><el-input v-model="query.spuId" placeholder="请输入 SPU ID" clearable /></el-form-item>
      <el-form-item label="评价等级">
        <el-select v-model="query.ratingType" placeholder="全部" clearable>
          <el-option label="好评" value="good" /><el-option label="中评" value="middle" /><el-option label="差评" value="bad" />
        </el-select>
      </el-form-item>
      <el-form-item label="评价图片">
        <el-select v-model="query.hasImage" placeholder="全部" clearable>
          <el-option label="有图" :value="true" /><el-option label="无图" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="回复状态">
        <el-select v-model="query.isReplied" placeholder="全部" clearable>
          <el-option label="已回复" :value="true" /><el-option label="未回复" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="评价时间">
        <el-date-picker v-model="query.timeRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" start-placeholder="开始时间" end-placeholder="结束时间" />
      </el-form-item>
      <el-button type="primary" @click="load(true)">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </el-form>

    <el-table v-loading="loading" :data="records">
      <el-table-column label="商品" width="82">
        <template #default="{ row }">
          <el-image v-if="row.spuMainImage" :src="getStoragePreviewUrl(row.spuMainImage)" :preview-src-list="[getStoragePreviewUrl(row.spuMainImage)]" preview-teleported fit="cover" class="product-image" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="spuName" label="商品名称" min-width="150" show-overflow-tooltip />
      <el-table-column prop="skuName" label="规格" min-width="120" show-overflow-tooltip />
      <el-table-column prop="orderNo" label="订单编号" min-width="150" show-overflow-tooltip />
      <el-table-column prop="nickname" label="用户" width="110" show-overflow-tooltip />
      <el-table-column prop="overallRating" label="评分" width="80" />
      <el-table-column prop="content" label="评价内容" min-width="220" show-overflow-tooltip />
      <el-table-column label="回复状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.lastReplySenderType === 1 || !row.isReplied ? 'warning' : 'info'">
            {{ replyStatusText(row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="评价时间" width="180" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openReply(row)">{{ replyActionText(row) }}</el-button>
          <el-button link @click="detail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination v-model:current-page="page.current" v-model:page-size="page.size" :page-sizes="[10, 20, 50, 100]" :total="page.total" layout="total, sizes, prev, pager, next, jumper" @size-change="load(true)" @current-change="load()" />
    </div>

    <el-dialog v-model="replyDialog.visible" :title="replyDialogTitle" width="560px" destroy-on-close>
      <div v-if="replyDialog.replies.length" class="reply-dialog-thread">
        <div v-for="reply in replyDialog.replies" :key="reply.id" class="review-reply-item">
          <b>{{ reply.senderType === 1 ? '买家回复' : '商家回复' }}：</b>{{ reply.content }}
          <span>{{ reply.updateTime || reply.createTime }}</span>
        </div>
      </div>
      <el-alert :title="replyDialogTip" type="info" :closable="false" class="reply-rule-tip" />
      <el-input v-model="replyDialog.content" type="textarea" :rows="4" maxlength="500" show-word-limit />
      <template #footer>
        <el-button @click="replyDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="replying" @click="submitReply">保存回复</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialog.visible" title="评价详情" width="640px">
      <el-descriptions v-if="detailDialog.review" :column="2" border>
        <el-descriptions-item label="商品">{{ detailDialog.review.spuName }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ detailDialog.review.skuName }}</el-descriptions-item>
        <el-descriptions-item label="订单编号">{{ detailDialog.review.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="评分">{{ detailDialog.review.overallRating }} 分</el-descriptions-item>
        <el-descriptions-item label="用户">{{ detailDialog.review.nickname }}</el-descriptions-item>
        <el-descriptions-item label="评价时间">{{ detailDialog.review.createTime }}</el-descriptions-item>
        <el-descriptions-item label="评价内容" :span="2">{{ detailDialog.review.content || '未填写评价内容' }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="detailDialog.replies.length" class="review-replies">
        <div v-for="reply in detailDialog.replies" :key="reply.id" class="review-reply-item">
          <b>{{ reply.senderType === 1 ? '买家回复' : '商家回复' }}：</b>{{ reply.content }}
          <span>{{ reply.updateTime || reply.createTime }}</span>
        </div>
      </div>
      <div v-if="detailDialog.images.length" class="review-images">
        <el-image v-for="image in detailDialog.images" :key="image" :src="getStoragePreviewUrl(image)" :preview-src-list="detailDialog.images.map(getStoragePreviewUrl)" preview-teleported fit="cover" class="review-image" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getStoragePreviewUrl } from '@/utils/storage'
import { getCurrentShop } from '@/utils/shop'
import { getMchReviewDetail, queryMchReviews, replyMchReview } from '@/api/mall/review'

const loading = ref(false)
const replying = ref(false)
const records = ref<any[]>([])
const query = reactive({
  spuId: '',
  ratingType: undefined as string | undefined,
  hasImage: undefined as boolean | undefined,
  isReplied: undefined as boolean | undefined,
  timeRange: [] as string[]
})
const page = reactive({ current: 1, size: 10, total: 0 })
const replyDialog = reactive({ visible: false, id: '', content: '', replies: [] as any[], mode: 'initial' as 'initial' | 'continue' | 'edit' })
const detailDialog = reactive({ visible: false, review: null as any, images: [] as string[], replies: [] as any[] })
const shopId = () => getCurrentShop()?.id

async function load(reset = false) {
  const currentShopId = shopId()
  if (!currentShopId) return
  if (reset) page.current = 1
  loading.value = true
  try {
    const [beginTime, endTime] = query.timeRange
    const result: any = await queryMchReviews({
      ...query,
      timeRange: undefined,
      beginTime,
      endTime,
      shopId: currentShopId,
      current: page.current,
      size: page.size
    })
    records.value = result.data?.records || []
    page.total = Number(result.data?.total || 0)
  } finally {
    loading.value = false
  }
}

function reset() {
  query.spuId = ''
  query.ratingType = undefined
  query.hasImage = undefined
  query.isReplied = undefined
  query.timeRange = []
  load(true)
}

function replyStatusText(row: any) {
  if (!row.isReplied) return '待商家回复'
  return row.lastReplySenderType === 1 ? '待商家回复' : '待买家回复'
}

function replyActionText(row: any) {
  if (!row.isReplied || row.lastReplySenderType === 1) return row.isReplied ? '继续回复' : '回复'
  return '修改回复'
}

const replyDialogTitle = computed(() => {
  if (replyDialog.mode === 'edit') return '修改最新回复'
  return replyDialog.mode === 'initial' ? '回复评价' : '继续回复评价'
})

const replyDialogTip = computed(() => {
  if (replyDialog.mode === 'edit') return '买家尚未回复，可修改你的最新回复。'
  if (replyDialog.mode === 'initial') return '这是商家对买家首评的第一条公开回复。'
  return '本次将作为下一轮商家回复发送；同一方不能连续新增回复。'
})

async function openReply(row: any) {
  const currentShopId = shopId()
  if (!currentShopId) return
  const result: any = await getMchReviewDetail({ shopId: currentShopId, id: row.id })
  const replies = result.data?.replies || []
  const latestReply = replies[replies.length - 1]
  replyDialog.id = row.id
  replyDialog.replies = replies
  replyDialog.mode = !latestReply ? 'initial' : (latestReply.senderType === 2 ? 'edit' : 'continue')
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
    load()
  } finally {
    replying.value = false
  }
}

async function detail(row: any) {
  const currentShopId = shopId()
  if (!currentShopId) return
  const result: any = await getMchReviewDetail({ shopId: currentShopId, id: row.id })
  detailDialog.review = result.data?.review || null
  detailDialog.images = result.data?.images || []
  detailDialog.replies = result.data?.replies || []
  detailDialog.visible = true
}

onMounted(() => load())
</script>

<style scoped>
.query-form :deep(.el-select) { width: 120px; }
.product-image { width: 52px; height: 52px; border-radius: 4px; }
.pagination-container { display: flex; justify-content: flex-end; margin-top: 20px; }
.review-images { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.review-image { width: 96px; height: 96px; border-radius: 4px; }
.review-replies { margin-top: 16px; }
.review-reply-item { padding: 10px 12px; margin-top: 8px; background: #f7f7f7; border-radius: 4px; line-height: 1.6; }
.review-reply-item span { display: block; margin-top: 4px; color: #909399; font-size: 12px; }
.reply-dialog-thread { max-height: 220px; padding-right: 4px; margin-bottom: 14px; overflow-y: auto; }
.reply-rule-tip { margin: 12px 0; }
</style>
