<template>
  <div class="mall-page merchant-seckill-page ms-records-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" class="mall-query-form" @submit.prevent="handleSearch">
        <div class="ms-filter-fields">
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
          <el-icon :size="15"><DocumentChecked /></el-icon>
          报名提交后由平台审核；驳回后可更换商品或场次重新报名。
        </span>
        <div class="ms-intro-right">
          <b>共 {{ pagination.total }} 条报名记录</b>
        </div>
      </div>

      <el-table data-ym-table="r81" v-loading="loading" :data="records" row-key="applyId" style="width: 100%">
        <el-table-column label="报名商品" min-width="230" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-product-cell">
              <SeckillThumb :src="row.mainImage" :alt="row.spuName" />
              <span class="ms-product-copy">
                <b :title="row.spuName">{{ row.spuName }}</b>
                <small>报名编号 <CopyableText :value="row.applyId" label="报名编号" /></small>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="活动 / 场次" min-width="180" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-event-cell">
              <b :title="applyActivityName(row)">{{ applyActivityName(row) }}</b>
              <small>{{ applySessionName(row) }} · {{ shortTime(row.sessionBeginTime) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" min-width="110" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-audit-cell">
              <span class="status-ticket" :class="`tone-${auditMeta(row.auditStatus).tone}`">
                {{ auditMeta(row.auditStatus).label }}
              </span>
              <small v-if="row.auditStatus === 3 && row.auditRemark" title="已填写驳回原因">已填写驳回原因</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报名时间" min-width="136" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-time-text" :title="dateTime(row.applyTime)">{{ dateTime(row.applyTime) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="审核时间" min-width="136" align="center" header-align="center">
          <template #default="{ row }">
            <div class="ms-time-text" :title="row.auditTime ? dateTime(row.auditTime) : '—'">
              {{ row.auditTime ? dateTime(row.auditTime) : '—' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="申请备注" min-width="200" align="center" header-align="center">
          <template #default="{ row }">
            <span class="ms-remark" :class="{ 'is-empty': !row.applyRemark }" :title="row.applyRemark || '未填写'">
              {{ row.applyRemark || '未填写' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="89" fixed="right" align="center" header-align="center">
          <template #default="{ row }">
            <button type="button" class="ms-link" @click="openDetail(row)">详情</button>
          </template>
        </el-table-column>

        <template #empty>
          <div class="ms-empty">
            <el-icon><DocumentChecked /></el-icon>
            <b>没有匹配的报名记录</b>
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
      class="ms-drawer-scope ms-record-drawer"
    >
      <div v-if="detailView" v-loading="detailLoading" class="ms-drawer-content">
        <div class="ms-drawer-head">
          <div>
            <span class="ms-drawer-kicker">SECKILL APPLICATION</span>
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
            <p class="ms-hero-sub">报名编号 <CopyableText :value="detailView.applyId" label="报名编号" /></p>
            <span class="ms-drawer-meta">
              <el-icon><Calendar /></el-icon>
              {{ applyActivityName(detailView) }} · {{ applySessionName(detailView) }}
            </span>
          </div>
        </div>

        <div v-if="detailView.auditStatus === 3" class="ms-audit-banner">
          <el-icon :size="16"><WarningFilled /></el-icon>
          <div>
            <b>审核驳回</b>
            <span>{{ detailView.auditRemark || '平台未填写驳回原因' }}</span>
          </div>
        </div>

        <div class="ms-description-grid">
          <div><span>所属活动</span><b>{{ applyActivityName(detailView) }}</b></div>
          <div><span>活动场次</span><b>{{ applySessionName(detailView) }}</b></div>
          <div><span>报名时间</span><b>{{ dateTime(detailView.applyTime) }}</b></div>
          <div><span>审核时间</span><b>{{ detailView.auditTime ? dateTime(detailView.auditTime) : '—' }}</b></div>
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
            v-if="detailView.seckillSpuId"
            type="button"
            class="ms-btn primary"
            @click="goProducts(detailView.activityId)"
          >查看秒杀商品</button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Calendar, Close, DocumentChecked, Goods, Search, WarningFilled } from '@element-plus/icons-vue'
import {
  getMchSeckillApplyDetail,
  queryMchSeckillApplyActivities,
  queryMchSeckillApplyList,
  queryMchSeckillSessionList,
} from '@/api/mall/seckill'
import CopyableText from '@/components/mall/CopyableText.vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import SeckillThumb from '../components/SeckillThumb.vue'
import {
  auditMeta,
  dateTime,
  money,
  shortTime,
  stripHtml,
} from '../shared'
import '@/assets/yeah-mall-seckill.css'

defineOptions({ name: 'MchSeckillApply' })

const AUDIT_OPTIONS = [
  { value: '1', label: '待审核' },
  { value: '2', label: '审核通过' },
  { value: '3', label: '审核驳回' },
]

const route = useRoute()
const router = useRouter()

const initialQuery = () => ({
  activityId: route.query.activityId ? String(route.query.activityId) : '',
  sessionId: '',
  auditStatus: '',
})

const loading = ref(false)
const records = ref([])
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
  const apply = payload.apply || {}
  const spu = payload.spu || {}
  const images = Array.isArray(payload.images) ? payload.images.filter(Boolean) : []
  const fallbackImages = images.length ? images : (base.mainImage ? [base.mainImage] : [])
  return {
    ...base,
    ...apply,
    applyId: apply.applyId || apply.id || base.applyId,
    activityName: base.activityName || applyActivityName(base),
    sessionName: base.sessionName || applySessionName(base),
    applyRemark: apply.applyRemark ?? base.applyRemark,
    auditRemark: apply.auditRemark ?? base.auditRemark,
    applyTime: apply.applyTime ?? base.applyTime,
    auditTime: apply.auditTime ?? base.auditTime,
    auditStatus: apply.auditStatus ?? base.auditStatus,
    seckillSpuId: apply.seckillSpuId ?? base.seckillSpuId,
    spuName: spu.name || base.spuName,
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

function applyActivityName(row) {
  if (!row) return '—'
  if (row.activityName) return row.activityName
  const found = activityOptions.value.find((item) => String(item.id) === String(row.activityId))
  return found?.name || '—'
}

function applySessionName(row) {
  if (!row) return '—'
  if (row.sessionName) return row.sessionName
  const sessions = sessionCache.get(String(row.activityId))
  return sessions?.find?.((item) => String(item.id) === String(row.sessionId))?.name || '—'
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

async function getRecords() {
  loading.value = true
  try {
    const params = {
      current: pagination.current,
      size: pagination.pageSize,
    }
    if (query.activityId) params.activityId = query.activityId
    if (query.sessionId) params.sessionId = query.sessionId
    if (query.auditStatus) params.auditStatus = query.auditStatus
    const response = await queryMchSeckillApplyList(params)
    const data = response?.data || {}
    records.value = data.records || []
    pagination.total = Number(data.total || 0)
    ensureRouteActivityOption()
  } catch {
    records.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

function ensureRouteActivityOption() {
  if (!query.activityId) return
  if (activityOptions.value.some((item) => String(item.id) === query.activityId)) return
  const matched = records.value.find((row) => String(row.activityId) === query.activityId)
  if (matched?.activityName) {
    activityOptions.value = [{ id: query.activityId, name: matched.activityName }, ...activityOptions.value]
  }
}

function applyDraft() {
  query.activityId = draft.activityId
  query.sessionId = draft.sessionId
  query.auditStatus = draft.auditStatus
}

function handleSearch() {
  applyDraft()
  pagination.current = 1
  getRecords()
}

function resetQuery() {
  Object.assign(draft, { activityId: '', sessionId: '', auditStatus: '' })
  Object.assign(query, { activityId: '', sessionId: '', auditStatus: '' })
  sessionOptions.value = []
  pagination.current = 1
  getRecords()
}

function changePage(payload) {
  pagination.current = payload.page
  pagination.pageSize = payload.limit
  getRecords()
}

async function openDetail(row) {
  detailRow.value = row
  detailPayload.value = null
  detailVisible.value = true
  const token = ++detailToken
  detailLoading.value = true
  try {
    const response = await getMchSeckillApplyDetail(row.applyId)
    if (token !== detailToken) return
    detailPayload.value = response?.data || {}
  } catch {
    if (token === detailToken) ElMessage.error('报名详情加载失败，请稍后重试')
  } finally {
    if (token === detailToken) detailLoading.value = false
  }
}

function goProducts(activityId) {
  detailVisible.value = false
  if (!activityId) return
  router.push({
    path: '/mall/mch-seckill/product',
    query: { activityId: String(activityId) },
  })
}

watch(
  () => route.query.activityId,
  (value) => {
    const nextId = value ? String(value) : ''
    if (nextId === query.activityId && nextId === draft.activityId) return
    Object.assign(draft, { activityId: nextId, sessionId: '', auditStatus: '' })
    Object.assign(query, { activityId: nextId, sessionId: '', auditStatus: '' })
    sessionOptions.value = []
    pagination.current = 1
    detailVisible.value = false
    if (nextId) {
      ensureSessions(nextId).then((sessions) => {
        if (draft.activityId === nextId) sessionOptions.value = sessions
      })
    }
    getRecords()
  },
)

onMounted(async () => {
  getRecords()
  getActivityOptions()
  if (draft.activityId) {
    sessionOptions.value = await ensureSessions(draft.activityId)
  }
})
</script>