<template>
  <div class="mall-page merchant-seckill-page ms-products-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" class="mall-query-form" @submit.prevent="handleSearch">
        <div class="ms-filter-fields ms-products-page-filters">
          <el-form-item label="商品名称" class="ms-filter-field ms-filter-keyword">
            <el-input
              v-model="draft.keyword"
              clearable
              placeholder="搜索报名商品名称"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="所属活动" class="ms-filter-field ms-filter-activity">
            <el-select
              v-model="draft.activityId"
              placeholder="全部活动"
              @change="handleActivityChange"
            >
              <el-option label="全部活动" value="" />
              <el-option
                v-for="item in activityOptions"
                :key="item.id"
                :label="item.name"
                :value="String(item.id)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="活动场次" class="ms-filter-field ms-filter-session">
            <el-select
              v-model="draft.sessionId"
              :disabled="!draft.activityId"
              placeholder="全部场次"
            >
              <el-option label="全部场次" value="" />
              <el-option
                v-for="session in sessionOptions"
                :key="session.id"
                :label="session.name"
                :value="String(session.id)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="审核状态" class="ms-filter-field ms-filter-audit">
            <el-select v-model="draft.auditStatus" placeholder="全部状态">
              <el-option label="全部状态" value="" />
              <el-option v-for="item in AUDIT_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
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
          <el-icon :size="15"><Goods /></el-icon>
          审核通过的商品才会在活动场次中售卖；待审核与驳回商品仅商家可见。
        </span>
        <div class="ms-intro-right">
          <b>共 {{ pagination.total }} 个秒杀商品</b>
        </div>
      </div>

      <el-table data-ym-table="r82" v-loading="loading" :data="products" row-key="id" style="width: 100%">
        <el-table-column label="秒杀商品" min-width="220" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-product-cell">
              <SeckillThumb :src="row.mainImage" :alt="row.name" />
              <span class="ms-product-copy">
                <b :title="row.name">{{ row.name }}</b>
                <small>{{ row.sessionName }} · {{ row.skuCount || 0 }} 个 SKU</small>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="活动 / 场次" min-width="170" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-event-cell">
              <b :title="row.activityName">{{ row.activityName }}</b>
              <small>{{ shortTime(row.sessionBeginTime) }} – {{ clockTime(row.sessionEndTime) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="秒杀价" min-width="130" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-price-cell">
              <b>{{ priceRange(row.minSeckillPrice, row.maxSeckillPrice) }}</b>
              <small>较原价低 {{ money(asNumber(row.minOriginPrice) - asNumber(row.minSeckillPrice)) }} 起</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="原价" min-width="110" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-price-cell is-muted">
              <b>{{ priceRange(row.minOriginPrice, row.maxOriginPrice) }}</b>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="库存 / 已售" min-width="150" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-stock-cell">
              <div class="ms-stock-line">
                <b>已售 {{ row.sales || 0 }}</b>
                <span>/ {{ row.stock || 0 }} 件</span>
                <em>{{ stockPercent(row) }}%</em>
              </div>
              <span class="ms-progress"><i :style="{ width: `${stockPercent(row)}%` }"></i></span>
              <small>剩余 {{ remaining(row) }} 件</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="成交额" min-width="100" align="center" header-align="center">
          <template #default="{ row }">
            <b v-if="row.salesAmount && Number(row.salesAmount) > 0" class="ms-amount">
              {{ money(row.salesAmount) }}
            </b>
            <span v-else class="ms-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" min-width="96" align="center" header-align="center">
          <template #default="{ row }">
            <span class="status-ticket" :class="`tone-${auditMeta(row.auditStatus).tone}`">
              {{ auditMeta(row.auditStatus).label }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center" header-align="center">
          <template #default="{ row }">
            <button type="button" class="ms-link" @click="openDetail(row)">详情</button>
          </template>
        </el-table-column>

        <template #empty>
          <div class="ms-empty">
            <el-icon><Goods /></el-icon>
            <b>没有匹配的秒杀商品</b>
            <span>调整活动、场次或审核状态后重新查询</span>
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
      class="ms-drawer-scope ms-product-drawer"
    >
      <div v-if="detailView" v-loading="detailLoading" class="ms-drawer-content">
        <div class="ms-drawer-head">
          <div>
            <span class="ms-drawer-kicker">SECKILL PRODUCT</span>
            <h2>秒杀商品详情</h2>
          </div>
          <button type="button" class="ms-drawer-close" title="关闭" @click="detailVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="ms-drawer-hero">
          <SeckillThumb :src="detailView.mainImage" :alt="detailView.name" class="ms-drawer-cover" />
          <div class="ms-drawer-hero-copy">
            <div class="ms-drawer-title">
              <h3>{{ detailView.name }}</h3>
              <span class="status-ticket" :class="`tone-${detailAudit.tone}`">{{ detailAudit.label }}</span>
            </div>
            <p class="ms-hero-sub">{{ detailView.activityName }} · {{ detailView.sessionName }}</p>
            <span class="ms-drawer-meta">
              <el-icon><Clock /></el-icon>
              {{ shortTime(detailView.sessionBeginTime) }} – {{ clockTime(detailView.sessionEndTime) }}
            </span>
          </div>
        </div>

        <div class="ms-stat-grid">
          <div class="ms-stat">
            <span>秒杀价</span>
            <b>{{ priceRange(detailView.minSeckillPrice, detailView.maxSeckillPrice) }}</b>
            <small>共 {{ detailView.skuCount || 0 }} 个 SKU</small>
          </div>
          <div class="ms-stat">
            <span>投放库存</span>
            <b>{{ detailView.stock || 0 }}</b>
            <small>剩余 {{ remaining(detailView) }} 件</small>
          </div>
          <div class="ms-stat">
            <span>累计销量</span>
            <b>{{ detailView.sales || 0 }}</b>
            <small>售罄进度 {{ stockPercent(detailView) }}%</small>
          </div>
          <div class="ms-stat">
            <span>成交金额</span>
            <b>{{ money(detailView.salesAmount) }}</b>
            <small>已支付有效订单</small>
          </div>
        </div>

        <div class="ms-description-grid">
          <div><span>所属活动</span><b>{{ detailView.activityName }}</b></div>
          <div><span>活动场次</span><b>{{ detailView.sessionName }}</b></div>
          <div><span>报名时间</span><b>{{ dateTime(detailView.applyTime) }}</b></div>
          <div><span>审核时间</span><b>{{ detailView.auditTime ? dateTime(detailView.auditTime) : '—' }}</b></div>
          <div><span>原价区间</span><b>{{ priceRange(detailView.minOriginPrice, detailView.maxOriginPrice) }}</b></div>
          <div>
            <span>审核状态</span>
            <b>
              <span class="status-ticket is-small" :class="`tone-${detailAudit.tone}`">{{ detailAudit.label }}</span>
            </b>
          </div>
        </div>

        <div class="ms-drawer-section">
          <h3>商品图片</h3>
          <div class="ms-detail-gallery">
            <SeckillThumb
              v-for="(image, index) in detailGallery"
              :key="`${image || 'empty'}-${index}`"
              :src="image"
              :alt="detailView.name"
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
          <div v-if="detailView.skuList.length" class="ms-sku-wrap">
            <table class="ms-sku-table">
              <thead>
                <tr>
                  <th>SKU 名称</th>
                  <th>规格编码</th>
                  <th>原价</th>
                  <th>秒杀价</th>
                  <th>活动库存</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sku in detailView.skuList" :key="sku.id">
                  <td>{{ sku.name }}</td>
                  <td><span class="mono">{{ sku.specCode }}</span></td>
                  <td>{{ money(sku.originPrice) }}</td>
                  <td class="ms-price-text">{{ money(sku.seckillPrice) }}</td>
                  <td>{{ sku.stock ?? 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="ms-empty is-compact">
            <el-icon><Goods /></el-icon>
            <b>暂无 SKU 明细</b>
            <span>秒杀商品的规格信息尚未生成</span>
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
          <button type="button" class="ms-btn primary" @click="goRecords(detailView.activityId)">查看报名记录</button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Clock, Close, Goods, Search } from '@element-plus/icons-vue'
import {
  getMchSeckillSpuDetail,
  queryMchSeckillApplyActivities,
  queryMchSeckillSessionList,
  queryMchSeckillSpuList,
} from '@/api/mall/seckill'
import MallPagination from '@/components/mall/MallPagination.vue'
import SeckillThumb from '../components/SeckillThumb.vue'
import {
  asNumber,
  auditMeta,
  clockTime,
  dateTime,
  money,
  percent,
  priceRange,
  shortTime,
  stripHtml,
} from '../shared'
import '@/assets/yeah-mall-seckill.css'

defineOptions({ name: 'MchSeckillProduct' })

const AUDIT_OPTIONS = [
  { value: '1', label: '待审核' },
  { value: '2', label: '审核通过' },
  { value: '3', label: '审核驳回' },
]

const route = useRoute()
const router = useRouter()

const initialQuery = () => ({
  keyword: '',
  activityId: route.query.activityId ? String(route.query.activityId) : '',
  sessionId: '',
  auditStatus: '',
})

const loading = ref(false)
const products = ref([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const draft = reactive(initialQuery())
const query = reactive(initialQuery())

const activityOptions = ref([])
const sessionOptions = ref([])
const sessionCache = new Map()

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailRow = ref(null)
const detailPayload = ref(null)
let detailToken = 0

const detailView = computed(() => {
  if (!detailRow.value) return null
  const base = detailRow.value
  const payload = detailPayload.value || {}
  const spu = payload.spu || {}
  const images = Array.isArray(payload.images) ? payload.images.filter(Boolean) : []
  const fallbackImages = images.length ? images : (base.mainImage ? [base.mainImage] : [])
  return {
    ...base,
    ...spu,
    activityName: base.activityName,
    sessionName: base.sessionName,
    sessionBeginTime: base.sessionBeginTime,
    sessionEndTime: base.sessionEndTime,
    skuCount: base.skuCount,
    stock: base.stock,
    sales: base.sales,
    salesAmount: base.salesAmount,
    minOriginPrice: base.minOriginPrice,
    maxOriginPrice: base.maxOriginPrice,
    minSeckillPrice: base.minSeckillPrice,
    maxSeckillPrice: base.maxSeckillPrice,
    applyTime: base.applyTime,
    auditTime: base.auditTime,
    applyRemark: base.applyRemark,
    auditRemark: base.auditRemark,
    auditStatus: spu.auditStatus ?? base.auditStatus,
    name: spu.name || base.name,
    mainImage: spu.mainImage || base.mainImage,
    detailDesc: spu.detailDesc ?? base.detailDesc,
    images: fallbackImages,
    skuList: Array.isArray(payload.skuList) ? payload.skuList : [],
  }
})

const detailAudit = computed(() => auditMeta(detailView.value?.auditStatus))
const detailGallery = computed(() => {
  if (!detailView.value) return []
  return detailView.value.images.length ? detailView.value.images : [detailView.value.mainImage || '']
})
const detailDescText = computed(() => stripHtml(detailView.value?.detailDesc) || '暂无商品描述')

function stockPercent(row) {
  return percent(row?.sales, row?.stock)
}

function remaining(row) {
  return Math.max(0, asNumber(row?.stock) - asNumber(row?.sales))
}

async function ensureSessions(activityId) {
  const key = String(activityId)
  if (!sessionCache.has(key)) {
    const promise = queryMchSeckillSessionList({ activityId })
      .then((response) => response?.data || [])
      .catch(() => {
        sessionCache.delete(key)
        return []
      })
    sessionCache.set(key, promise)
  }
  return sessionCache.get(key)
}

async function handleActivityChange() {
  draft.sessionId = ''
  sessionOptions.value = []
  if (!draft.activityId) return
  sessionOptions.value = await ensureSessions(draft.activityId)
}

async function getActivityOptions() {
  try {
    const response = await queryMchSeckillApplyActivities()
    activityOptions.value = response?.data || []
  } catch {
    activityOptions.value = []
  }
}

async function getProducts() {
  loading.value = true
  try {
    const params = {
      current: pagination.current,
      size: pagination.pageSize,
    }
    if (query.keyword) params.spuName = query.keyword
    if (query.activityId) params.activityId = query.activityId
    if (query.sessionId) params.sessionId = query.sessionId
    if (query.auditStatus) params.auditStatus = query.auditStatus
    const response = await queryMchSeckillSpuList(params)
    const data = response?.data || {}
    products.value = data.records || []
    pagination.total = Number(data.total || 0)
    ensureRouteActivityOption()
  } catch {
    products.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

function ensureRouteActivityOption() {
  if (!query.activityId) return
  if (activityOptions.value.some((item) => String(item.id) === query.activityId)) return
  const matched = products.value.find((row) => String(row.activityId) === query.activityId)
  if (matched?.activityName) {
    activityOptions.value = [{ id: query.activityId, name: matched.activityName }, ...activityOptions.value]
  }
}

function applyDraft() {
  query.keyword = draft.keyword.trim()
  query.activityId = draft.activityId
  query.sessionId = draft.sessionId
  query.auditStatus = draft.auditStatus
}

function handleSearch() {
  applyDraft()
  pagination.current = 1
  getProducts()
}

function resetQuery() {
  Object.assign(draft, { keyword: '', activityId: '', sessionId: '', auditStatus: '' })
  Object.assign(query, { keyword: '', activityId: '', sessionId: '', auditStatus: '' })
  sessionOptions.value = []
  pagination.current = 1
  getProducts()
}

function changePage(payload) {
  pagination.current = payload.page
  pagination.pageSize = payload.limit
  getProducts()
}

async function openDetail(row) {
  detailRow.value = row
  detailPayload.value = null
  detailVisible.value = true
  const token = ++detailToken
  detailLoading.value = true
  try {
    const response = await getMchSeckillSpuDetail(row.id)
    if (token !== detailToken) return
    detailPayload.value = response?.data || {}
  } catch {
    if (token === detailToken) ElMessage.error('秒杀商品详情加载失败，请稍后重试')
  } finally {
    if (token === detailToken) detailLoading.value = false
  }
}

function goRecords(activityId) {
  detailVisible.value = false
  if (!activityId) return
  router.push({
    path: '/mall/mch-seckill/apply',
    query: { activityId: String(activityId) },
  })
}

watch(
  () => route.query.activityId,
  (value) => {
    const nextId = value ? String(value) : ''
    if (nextId === query.activityId && nextId === draft.activityId) return
    Object.assign(draft, { keyword: '', activityId: nextId, sessionId: '', auditStatus: '' })
    Object.assign(query, { keyword: '', activityId: nextId, sessionId: '', auditStatus: '' })
    sessionOptions.value = []
    pagination.current = 1
    detailVisible.value = false
    if (nextId) {
      ensureSessions(nextId).then((sessions) => {
        if (draft.activityId === nextId) sessionOptions.value = sessions
      })
    }
    getProducts()
  },
)

onMounted(async () => {
  getProducts()
  getActivityOptions()
  if (draft.activityId) {
    sessionOptions.value = await ensureSessions(draft.activityId)
  }
})
</script>