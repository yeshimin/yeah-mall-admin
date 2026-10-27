<template>
  <div class="mall-page">
    <el-form :inline="true" class="query-form">
      <el-form-item label="商品 SPU"><el-input v-model="query.spuId" placeholder="请输入 SPU ID" clearable /></el-form-item>
      <el-form-item label="店铺 ID"><el-input v-model="query.shopId" placeholder="请输入店铺 ID" clearable /></el-form-item>
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
      <el-form-item label="公开状态">
        <el-select v-model="query.isVisible" placeholder="全部" clearable>
          <el-option label="公开" :value="true" /><el-option label="已隐藏" :value="false" />
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
      <el-table-column label="回复" width="90">
        <template #default="{ row }">
          <el-tag :type="row.lastReplySenderType === 1 || !row.isReplied ? 'warning' : 'info'">
            {{ replyStatusText(row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><el-tag :type="row.isVisible ? 'success' : 'info'">{{ row.isVisible ? '公开' : '已隐藏' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="createTime" label="评价时间" width="180" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="detail(row)">详情</el-button>
          <el-button link :type="row.isVisible ? 'danger' : 'success'" @click="toggle(row)">{{ row.isVisible ? '隐藏' : '恢复' }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination v-model:current-page="page.current" v-model:page-size="page.size" :page-sizes="[10, 20, 50, 100]" :total="page.total" layout="total, sizes, prev, pager, next, jumper" @size-change="load(true)" @current-change="load()" />
    </div>

    <el-dialog v-model="dialog.visible" title="评价详情" width="640px">
      <el-descriptions v-if="dialog.review" :column="2" border>
        <el-descriptions-item label="商品">{{ dialog.review.spuName }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ dialog.review.skuName }}</el-descriptions-item>
        <el-descriptions-item label="订单编号">{{ dialog.review.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="评分">{{ dialog.review.overallRating }} 分</el-descriptions-item>
        <el-descriptions-item label="用户">{{ dialog.review.nickname }}</el-descriptions-item>
        <el-descriptions-item label="评价时间">{{ dialog.review.createTime }}</el-descriptions-item>
        <el-descriptions-item label="评价内容" :span="2">{{ dialog.review.content || '未填写评价内容' }}</el-descriptions-item>
        <el-descriptions-item v-if="dialog.review.visibilityRemark" label="治理备注" :span="2">{{ dialog.review.visibilityRemark }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="dialog.replies.length" class="review-replies">
        <div v-for="reply in dialog.replies" :key="reply.id" class="review-reply-item">
          <b>{{ reply.senderType === 1 ? '买家回复' : '商家回复' }}：</b>{{ reply.content }}
          <span>{{ reply.updateTime || reply.createTime }}</span>
        </div>
      </div>
      <div v-if="dialog.images.length" class="review-images">
        <el-image v-for="image in dialog.images" :key="image" :src="getStoragePreviewUrl(image)" :preview-src-list="dialog.images.map(getStoragePreviewUrl)" preview-teleported fit="cover" class="review-image" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStoragePreviewUrl } from '@/utils/storage'
import { getAdminReviewDetail, queryAdminReviews, updateReviewVisibility } from '@/api/mall/review'

const loading = ref(false)
const records = ref<any[]>([])
const query = reactive({
  spuId: '',
  shopId: '',
  ratingType: undefined as string | undefined,
  hasImage: undefined as boolean | undefined,
  isReplied: undefined as boolean | undefined,
  isVisible: undefined as boolean | undefined,
  timeRange: [] as string[]
})
const page = reactive({ current: 1, size: 10, total: 0 })
const dialog = reactive({ visible: false, review: null as any, images: [] as string[], replies: [] as any[] })

async function load(reset = false) {
  if (reset) page.current = 1
  loading.value = true
  try {
    const [beginTime, endTime] = query.timeRange
    const result: any = await queryAdminReviews({
      ...query,
      timeRange: undefined,
      beginTime,
      endTime,
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
  query.shopId = ''
  query.ratingType = undefined
  query.hasImage = undefined
  query.isReplied = undefined
  query.isVisible = undefined
  query.timeRange = []
  load(true)
}

function replyStatusText(row: any) {
  if (!row.isReplied) return '待商家回复'
  return row.lastReplySenderType === 1 ? '待商家回复' : '待买家回复'
}

async function detail(row: any) {
  const result: any = await getAdminReviewDetail(row.id)
  dialog.review = result.data?.review || null
  dialog.images = result.data?.images || []
  dialog.replies = result.data?.replies || []
  dialog.visible = true
}

async function toggle(row: any) {
  const visible = !row.isVisible
  try {
    let remark = '平台恢复公开'
    if (visible) {
      await ElMessageBox.confirm('确认恢复该评价为公开状态？', '恢复评价', { type: 'warning' })
    } else {
      const result = await ElMessageBox.prompt('请输入隐藏原因，买家和商家可据此理解处理结果。', '隐藏评价', {
        confirmButtonText: '确认隐藏',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入处理原因',
        inputValidator: (value) => Boolean(value?.trim()) || '隐藏原因不能为空'
      })
      remark = result.value.trim()
    }
    await updateReviewVisibility({ id: row.id, isVisible: visible, visibilityRemark: remark })
    ElMessage.success('操作成功')
    load()
  } catch {
    // 用户取消操作时不需要提示错误。
  }
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
</style>
