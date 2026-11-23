<template>
  <div class="mall-page">
    <section class="mall-filter-panel">
    <el-form :inline="true" class="mall-query-form query-form">
      <el-form-item label="商品 SPU">
        <el-select
          v-model="query.spuId"
          class="remote-select"
          clearable
          filterable
          remote
          reserve-keyword
          :remote-method="searchSpuOptions"
          :loading="spuLoading"
          placeholder="搜索商品名称或 SPU ID"
          @visible-change="handleSpuVisible"
        >
          <el-option
            v-for="spu in spuOptions"
            :key="spu.id"
            :label="spu.name"
            :value="String(spu.id)"
          >
            <div style="display: flex; min-width: 0; flex-direction: column; gap: 2px;">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ spu.name }}</span>
              <small style="color: var(--mall-muted, #65726a); font-size: 10px;">SPU {{ spu.id }}</small>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="店铺">
        <el-select
          v-model="query.shopId"
          class="remote-select"
          clearable
          filterable
          remote
          reserve-keyword
          :remote-method="searchShopOptions"
          :loading="shopLoading"
          placeholder="搜索店铺名称或编号"
          @visible-change="handleShopVisible"
        >
          <el-option
            v-for="shop in shopOptions"
            :key="shop.id"
            :label="shop.shopName"
            :value="String(shop.id)"
          >
            <div style="display: flex; min-width: 0; flex-direction: column; gap: 2px;">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ shop.shopName }}</span>
              <small style="color: var(--mall-muted, #65726a); font-size: 10px;">{{ shop.shopNo || shop.id }}</small>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
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
      <el-form-item class="mall-query-actions">
        <el-button @click="reset">重置</el-button>
        <el-button type="primary" icon="Search" @click="load(true)">查询</el-button>
      </el-form-item>
    </el-form>
    </section>

    <section class="mall-table-panel">
    <el-table data-ym-table="r45" v-loading="loading" :data="records">
      <el-table-column label="商品" min-width="180">
        <template #default="{ row }">
          <div class="review-product-cell">
            <el-image
              v-if="row.spuMainImage"
              :src="getStoragePreviewUrl(row.spuMainImage)"
              :preview-src-list="[getStoragePreviewUrl(row.spuMainImage)]"
              preview-teleported
              fit="cover"
              class="product-image"
            />
            <span v-else class="product-image review-product-placeholder">-</span>
            <div class="review-product-copy">
              <strong>{{ row.spuName || '-' }}</strong>
              <small>SPU {{ row.spuId || '-' }}</small>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="skuName" label="规格" min-width="90" show-overflow-tooltip />
      <el-table-column prop="orderNo" label="订单编号" min-width="162" show-overflow-tooltip />
      <el-table-column prop="nickname" label="用户" min-width="72" show-overflow-tooltip />
      <el-table-column prop="overallRating" label="评分" min-width="56" />
      <el-table-column prop="content" label="评价内容" min-width="180" show-overflow-tooltip />
      <el-table-column label="回复" min-width="88">
        <template #default="{ row }">
          <el-tag :type="row.lastReplySenderType === 1 || !row.isReplied ? 'warning' : 'info'">
            {{ replyStatusText(row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="76">
        <template #default="{ row }"><el-tag :type="row.isVisible ? 'success' : 'info'">{{ row.isVisible ? '公开' : '已隐藏' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="createTime" label="评价时间" min-width="148" />
      <el-table-column label="操作" width="128" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="detail(row)">详情</el-button>
          <el-button link :type="row.isVisible ? 'danger' : 'success'" @click="toggle(row)">{{ row.isVisible ? '隐藏' : '恢复' }}</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <div class="review-empty">
          <el-icon><ChatDotRound /></el-icon>
          <strong>没有匹配的评价</strong>
          <span>调整筛选条件后重试</span>
        </div>
      </template>
    </el-table>

    <div class="pagination-container">
      <el-pagination v-model:current-page="page.current" v-model:page-size="page.size" :page-sizes="[10, 20, 50, 100]" :total="Number(page.total)" layout="total, sizes, prev, pager, next, jumper" @size-change="load(true)" @current-change="load()" />
    </div>
    </section>

    <el-drawer v-model="dialog.visible" size="520px" class="review-detail-drawer">
      <template #header>
        <div class="review-drawer-heading">
          <span>REVIEW DETAIL</span>
          <strong>评价详情</strong>
        </div>
      </template>
      <div v-if="dialog.review" class="review-detail">
        <div class="review-detail-product">
          <el-image
            v-if="dialog.review.spuMainImage"
            :src="getStoragePreviewUrl(dialog.review.spuMainImage)"
            :preview-src-list="[getStoragePreviewUrl(dialog.review.spuMainImage)]"
            preview-teleported
            fit="cover"
            class="review-detail-image"
          />
          <span v-else class="review-detail-image review-product-placeholder">-</span>
          <div class="review-detail-copy">
            <strong>{{ dialog.review.spuName || '-' }}</strong>
            <span>{{ dialog.review.skuName || '-' }} · 订单 {{ dialog.review.orderNo || '-' }}</span>
            <span>{{ dialog.review.nickname || '-' }} · {{ dialog.review.createTime || '-' }}</span>
          </div>
          <el-tag :type="dialog.review.isVisible ? 'success' : 'info'">
            {{ dialog.review.isVisible ? '公开' : '已隐藏' }}
          </el-tag>
        </div>

        <div class="review-detail-content">{{ dialog.review.content || '未填写评价内容' }}</div>

        <div v-if="dialog.review.visibilityRemark" class="review-visibility-remark">
          <span>治理备注</span>{{ dialog.review.visibilityRemark }}
        </div>

        <div v-if="dialog.images.length" class="review-images">
          <el-image
            v-for="image in dialog.images"
            :key="image"
            :src="getStoragePreviewUrl(image)"
            :preview-src-list="dialog.images.map(getStoragePreviewUrl)"
            preview-teleported
            fit="cover"
            class="review-image"
          />
        </div>

        <section class="review-replies">
          <h4>回复记录</h4>
          <div v-if="dialog.replies.length" class="review-reply-list">
            <div v-for="reply in dialog.replies" :key="reply.id" class="review-reply-item">
              <b>{{ reply.senderType === 1 ? '买家回复' : '商家回复' }}</b>
              <p>{{ reply.content }}</p>
              <span>{{ reply.updateTime || reply.createTime }}</span>
            </div>
          </div>
          <p v-else class="review-no-reply">暂无回复记录</p>
        </section>
      </div>
      <template #footer>
        <div class="review-detail-actions">
          <el-button @click="dialog.visible = false">关闭</el-button>
          <el-button
            v-if="dialog.review"
            :type="dialog.review.isVisible ? 'danger' : 'success'"
            @click="toggleFromDetail"
          >
            {{ dialog.review.isVisible ? '隐藏评价' : '恢复公开' }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound } from '@element-plus/icons-vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import { getAdminReviewDetail, queryAdminReviews, updateReviewVisibility } from '@/api/mall/review'
import { queryShops } from '@/api/mall/platform'
import { queryProductSpuOptions, type ProductSpuOption } from '@/api/mall/productSpu'
import type { ShopRecord } from '@/types/mall'

const loading = ref(false)
const records = ref<any[]>([])
const spuOptions = ref<ProductSpuOption[]>([])
const spuLoading = ref(false)
const shopOptions = ref<ShopRecord[]>([])
const shopLoading = ref(false)
let spuRequestId = 0
let shopRequestId = 0
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

async function searchSpuOptions(keyword: string) {
  const requestId = ++spuRequestId
  spuLoading.value = true
  try {
    const response = await queryProductSpuOptions({ keyword: keyword?.trim() || undefined, limit: 20 })
    if (requestId !== spuRequestId) return
    const options = response.data || []
    const selected = spuOptions.value.find((item) => String(item.id) === query.spuId)
    spuOptions.value = selected && !options.some((item) => String(item.id) === query.spuId)
      ? [selected, ...options]
      : options
  } catch {
    if (requestId === spuRequestId) ElMessage.error('加载商品选项失败')
  } finally {
    if (requestId === spuRequestId) spuLoading.value = false
  }
}

function handleSpuVisible(visible: boolean) {
  if (visible && spuOptions.value.length === 0) void searchSpuOptions('')
}

async function searchShopOptions(keyword: string) {
  const requestId = ++shopRequestId
  shopLoading.value = true
  try {
    const response = await queryShops({ keyword: keyword?.trim() || undefined, current: 1, size: 20 })
    if (requestId !== shopRequestId) return
    const options = response.data?.records || []
    const selected = shopOptions.value.find((item) => String(item.id) === query.shopId)
    shopOptions.value = selected && !options.some((item) => String(item.id) === query.shopId)
      ? [selected, ...options]
      : options
  } catch {
    if (requestId === shopRequestId) ElMessage.error('加载店铺选项失败')
  } finally {
    if (requestId === shopRequestId) shopLoading.value = false
  }
}

function handleShopVisible(visible: boolean) {
  if (visible && shopOptions.value.length === 0) void searchShopOptions('')
}

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

async function toggle(row: any): Promise<boolean> {
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
    return true
  } catch {
    // 用户取消操作时不需要提示错误。
    return false
  }
}

async function toggleFromDetail() {
  if (!dialog.review) return
  const success = await toggle(dialog.review)
  if (success) dialog.visible = false
}

onMounted(() => load())
</script>

<style scoped>
.query-form :deep(.el-select) { width: 120px; }
.query-form :deep(.el-select.remote-select) { width: 230px; }
.product-image { width: 52px; height: 52px; flex: 0 0 auto; border-radius: 8px; }
.review-product-cell {
  display: flex;
  width: 240px;
  max-width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  margin: 0 auto;
  padding: 12px 0;
  text-align: left;
}
.review-product-copy { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; gap: 4px; text-align: left; }
.review-product-copy strong { overflow: hidden; color: var(--mall-ink, #17251f); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.review-product-copy small { color: var(--mall-muted, #65726a); font-family: var(--ym-font-mono, monospace); font-size: 10px; }
.review-product-placeholder { display: grid; place-items: center; background: #f4f6f3; color: var(--mall-muted, #65726a); }
.review-empty { display: flex; min-height: 180px; align-items: center; justify-content: center; flex-direction: column; gap: 7px; color: var(--mall-muted, #65726a); }
.review-empty .el-icon { margin-bottom: 3px; color: var(--mall-brand, #24634f); font-size: 28px; }
.review-empty strong { color: var(--mall-ink, #17251f); font-size: 13px; }
.review-empty span { font-size: 12px; }
.pagination-container { display: flex; justify-content: flex-end; }
.review-drawer-heading { display: flex; flex-direction: column; gap: 5px; }
.review-drawer-heading span { color: var(--mall-brand, #24634f); font-family: var(--ym-font-mono, monospace); font-size: 10px; font-weight: 700; letter-spacing: 0.12em; }
.review-drawer-heading strong { color: var(--mall-ink, #17251f); font-size: 19px; }
.review-detail { display: flex; flex-direction: column; gap: 16px; }
.review-detail-product { display: grid; grid-template-columns: 76px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid var(--ym-line, #e4e9e5); }
.review-detail-image { width: 76px; height: 76px; border-radius: 8px; }
.review-detail-copy { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.review-detail-copy strong { overflow: hidden; color: var(--mall-ink, #17251f); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.review-detail-copy span { color: var(--mall-muted, #65726a); font-size: 10px; }
.review-detail-content { color: var(--mall-ink, #17251f); font-size: 13px; line-height: 1.8; }
.review-visibility-remark { padding: 10px 12px; border-radius: 7px; background: #f4f6f3; color: var(--mall-muted, #65726a); font-size: 12px; line-height: 1.6; }
.review-visibility-remark span { margin-right: 8px; color: var(--mall-ink, #17251f); font-weight: 600; }
.review-images { display: flex; flex-wrap: wrap; gap: 10px; }
.review-image { width: 96px; height: 96px; border-radius: 8px; }
.review-replies h4 { margin: 0 0 10px; color: var(--mall-ink, #17251f); font-size: 13px; }
.review-reply-list { display: flex; flex-direction: column; gap: 8px; }
.review-reply-item { padding: 10px 12px; border: 1px solid var(--ym-line, #e4e9e5); border-radius: 8px; background: #fafcfa; line-height: 1.6; }
.review-reply-item b { color: var(--mall-ink, #17251f); font-size: 12px; }
.review-reply-item p { margin: 5px 0; color: var(--mall-ink, #17251f); font-size: 12px; }
.review-reply-item span { display: block; color: var(--mall-muted, #65726a); font-size: 10px; }
.review-no-reply { margin: 0; color: var(--mall-muted, #65726a); font-size: 12px; }
.review-detail-actions { display: flex; justify-content: flex-end; gap: 10px; }
</style>
