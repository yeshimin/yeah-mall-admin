<template>
  <div class="mall-page merchant-coupon-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" class="mall-query-form" @submit.prevent="handleSearch">
        <div class="mc-filter-fields">
          <el-form-item label="优惠券名称">
            <el-input
              v-model="draft.keyword"
              class="mc-keyword"
              clearable
              placeholder="请输入优惠券名称"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="优惠券类型">
            <el-select v-model="draft.type" class="mc-type-select" placeholder="全部类型">
              <el-option label="全部类型" value="" />
              <el-option label="满减券" value="1" />
              <el-option label="折扣券" value="2" />
              <el-option label="无门槛券" value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="使用范围">
            <el-select v-model="draft.useRange" class="mc-range-select" placeholder="全部范围">
              <el-option label="全部范围" value="" />
              <el-option label="店铺通用" value="1" />
              <el-option label="指定商品" value="2" />
              <el-option label="指定分类" value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="draft.status" class="mc-status-select" placeholder="全部状态">
              <el-option label="全部状态" value="" />
              <el-option label="启用" value="1" />
              <el-option label="停用" value="0" />
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
      <div class="mall-business-actions">
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>新增优惠券
        </el-button>
      </div>
    </section>

    <section class="mall-table-panel">
      <el-table data-ym-table="r77" v-loading="loading" :data="coupons" row-key="id" style="width: 100%">
        <el-table-column label="优惠券" min-width="248" align="center" header-align="center">
          <template #default="{ row }">
            <div class="mc-coupon-cell">
              <span class="mc-type-icon" :class="`t${row.type}`">
                <el-icon :size="18"><Ticket /></el-icon>
              </span>
              <span class="mc-coupon-info">
                <b :title="row.name">{{ row.name }}</b>
                <small :title="row.description || typeText(row.type)">{{ row.description || typeText(row.type) }}</small>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="优惠内容" min-width="125" align="center" header-align="center">
          <template #default="{ row }">
            <div class="mc-value-cell">
              <b class="mc-value">{{ valueText(row) }}</b>
              <small>{{ conditionText(row) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="使用范围" min-width="155" align="center" header-align="center">
          <template #default="{ row }">
            <div class="mc-scope">
              <b>{{ rangeText(row.useRange) }}</b>
              <small :title="scopeDetail(row)">{{ scopeDetail(row) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="145" align="center" header-align="center">
          <template #default="{ row }">
            <div class="mc-validity">
              <b>{{ shortDate(row.beginTime) }}</b>
              <small>至 {{ shortDate(row.endTime) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="发行 / 领取 / 核销" min-width="165" align="center" header-align="center">
          <template #default="{ row }">
            <div class="mc-stock">
              <div class="mc-stock-line">
                <b>{{ row.received || 0 }}</b>
                <span>/ {{ row.quantity || 0 }} 张</span>
                <em>{{ receivePct(row) }}%</em>
              </div>
              <span class="mc-progress"><i :style="{ width: `${receivePct(row)}%` }"></i></span>
              <small>已核销 {{ row.used || 0 }} 张 · 剩余 {{ remaining(row) }} 张</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="领取规则" min-width="140" align="center" header-align="center">
          <template #default="{ row }">
            <div class="mc-rules">
              <b>每人限领 {{ row.perLimit }} 张</b>
              <small class="mc-badges">
                <span v-if="row.isSupportGroupBuy" class="mc-badge group">支持拼团</span>
                <span v-if="row.isPointsExchangeEnabled" class="mc-badge points">积分兑换</span>
                <span v-if="!row.isSupportGroupBuy && !row.isPointsExchangeEnabled" class="mc-badge muted">普通领取</span>
              </small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="80" align="center" header-align="center">
          <template #default="{ row }">
            <div class="mc-status-cell">
              <span class="status-ticket" :class="`tone-${couponState(row).tone}`">{{ couponState(row).label }}</span>
              <small v-if="row.isEnabled && couponState(row).label !== '已停用'" class="cell-sub">
                {{ couponState(row).label === '进行中' ? '启用中' : '已启用' }}
              </small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right" align="center" header-align="center">
          <template #default="{ row }">
            <div class="mc-row-actions">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-dropdown trigger="click" popper-class="mp-row-menu" @command="(command) => handleCommand(command, row)">
                <el-button link type="primary">
                  更多<el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="toggle-status">{{ row.isEnabled ? '停用优惠券' : '启用优惠券' }}</el-dropdown-item>
                    <el-dropdown-item command="receive">查看领取记录</el-dropdown-item>
                    <el-dropdown-item command="usage">查看使用记录</el-dropdown-item>
                    <el-dropdown-item command="delete" divided class="mp-danger-action">删除优惠券</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <div class="mc-empty">
            <el-icon :size="28"><Ticket /></el-icon>
            <b>没有匹配的优惠券</b>
            <span>调整筛选条件后重新查询</span>
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

    <el-dialog v-model="editor.visible" width="940px" class="mc-dialog" align-center>
      <template #header>
        <div class="mc-dialog-head">
          <span>{{ editor.mode === 'edit' ? 'EDIT COUPON' : 'CREATE COUPON' }}</span>
          <h2>{{ editor.mode === 'edit' ? '编辑优惠券' : '新增优惠券' }}</h2>
        </div>
      </template>

      <div class="mc-form-layout">
        <div class="mc-form-main">
          <div class="mc-form-grid">
            <label class="dialog-field wide">
              <span>优惠券名称 <em class="mc-required">*</em></span>
              <el-input v-model="form.name" maxlength="40" placeholder="例如：全店满 199 减 20" />
            </label>

            <div class="dialog-field wide">
              <span>优惠券类型</span>
              <div class="mc-type-seg">
                <button
                  v-for="item in TYPE_OPTIONS"
                  :key="item.value"
                  type="button"
                  :class="form.type === item.value ? 'active' : ''"
                  @click="switchType(item.value)"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <label class="dialog-field">
              <span>{{ form.type === '2' ? '折扣力度' : '优惠金额' }} <em class="mc-required">*</em></span>
              <el-input v-if="form.type === '2'" v-model="form.discount" type="number" min="0.1" max="9.9" step="0.1" placeholder="请输入折扣">
                <template #suffix>折</template>
              </el-input>
              <el-input v-else v-model="form.amount" type="number" min="0.01" step="0.01" placeholder="请输入优惠金额">
                <template #prefix>¥</template>
              </el-input>
            </label>

            <label class="dialog-field">
              <span>使用门槛 {{ form.type === '3' ? '（无门槛）' : '' }} <em v-if="form.type !== '3'" class="mc-required">*</em></span>
              <el-input v-model="form.minAmount" type="number" min="0" step="0.01" :disabled="form.type === '3'" placeholder="请输入使用门槛">
                <template #prefix>¥</template>
              </el-input>
            </label>

            <label class="dialog-field">
              <span>发行总量 <em class="mc-required">*</em></span>
              <el-input v-model="form.quantity" type="number" min="1" step="1" placeholder="请输入发行总量" />
            </label>

            <label class="dialog-field">
              <span>每人限领 <em class="mc-required">*</em></span>
              <el-input v-model="form.perLimit" type="number" min="1" step="1" placeholder="请输入每人限领数量" />
            </label>

            <label class="dialog-field" :class="{ wide: form.useRange === '1' }">
              <span>使用范围</span>
              <el-select v-model="form.useRange" @change="handleRangeChange">
                <el-option label="店铺通用" value="1" />
                <el-option label="指定商品" value="2" />
                <el-option label="指定分类" value="3" />
              </el-select>
            </label>

            <label v-if="form.useRange === '2'" class="dialog-field">
              <span>适用商品 <em class="mc-required">*</em></span>
              <el-select
                v-model="form.targetId"
                filterable
                remote
                :remote-method="searchProductOptions"
                :loading="productLoading"
                placeholder="请选择商品"
              >
                <el-option v-for="item in productOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </label>

            <label v-if="form.useRange === '3'" class="dialog-field">
              <span>适用分类 <em class="mc-required">*</em></span>
              <el-select v-model="form.targetId" filterable placeholder="请选择分类">
                <el-option v-for="item in categoryOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </label>

            <label class="dialog-field">
              <span>开始时间 <em class="mc-required">*</em></span>
              <el-date-picker
                v-model="form.beginTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                format="YYYY-MM-DD HH:mm"
                placeholder="选择开始时间"
              />
            </label>

            <label class="dialog-field">
              <span>结束时间 <em class="mc-required">*</em></span>
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                format="YYYY-MM-DD HH:mm"
                placeholder="选择结束时间"
              />
            </label>

            <label class="dialog-field wide">
              <span>使用说明</span>
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                maxlength="200"
                placeholder="选填，买家在领券中心和优惠券详情中可见"
              />
            </label>

            <div class="mc-switch-lines wide">
              <label class="mc-switch-line">
                <span><b>支持拼团</b><small>允许在拼团订单中使用本券</small></span>
                <span class="mc-switch" :class="{ 'is-on': form.isSupportGroupBuy }">
                  <input v-model="form.isSupportGroupBuy" type="checkbox" />
                  <i></i>
                </span>
              </label>
              <label class="mc-switch-line">
                <span><b>积分兑换</b><small>允许在积分商城使用积分兑换本券</small></span>
                <span class="mc-switch" :class="{ 'is-on': form.isPointsExchangeEnabled }">
                  <input v-model="form.isPointsExchangeEnabled" type="checkbox" />
                  <i></i>
                </span>
              </label>
              <label class="mc-switch-line">
                <span><b>立即启用</b><small>启用后买家可在领券中心看到并领取</small></span>
                <span class="mc-switch" :class="{ 'is-on': form.isEnabled }">
                  <input v-model="form.isEnabled" type="checkbox" />
                  <i></i>
                </span>
              </label>
            </div>
          </div>

          <div v-if="editor.error" class="mc-form-error">
            <el-icon :size="15"><Warning /></el-icon>
            <span>{{ editor.error }}</span>
          </div>
        </div>

        <aside class="mc-form-aside">
          <span class="mc-preview-label">领券中心展示预览</span>
          <div class="mc-preview-ticket">
            <div class="mc-preview-brand">
              <el-icon :size="14"><Shop /></el-icon>
              <span>{{ shopName }}</span>
              <em>{{ typeText(form.type) }}</em>
            </div>
            <div class="mc-preview-value">
              <b>{{ previewValue }}</b>
              <span>{{ previewCondition }}</span>
            </div>
            <div class="mc-preview-dash"></div>
            <b class="mc-preview-name">{{ form.name.trim() || '优惠券名称' }}</b>
            <span class="mc-preview-desc">{{ form.description.trim() || '使用说明将展示在这里' }}</span>
            <div class="mc-preview-meta">
              <span>{{ previewScope }}</span>
              <span>{{ shortDate(form.beginTime) || '开始日期' }} 至 {{ shortDate(form.endTime) || '结束日期' }}</span>
              <span>发行 {{ Number(form.quantity || 0) || '—' }} 张 · 每人限领 {{ Number(form.perLimit || 0) || '—' }} 张</span>
            </div>
            <div class="mc-preview-badges">
              <span v-if="form.isSupportGroupBuy">支持拼团</span>
              <span v-if="form.isPointsExchangeEnabled">积分兑换</span>
              <span>{{ form.isEnabled ? '启用中' : '停用' }}</span>
            </div>
          </div>
          <p class="mc-preview-note">会员领取后会生成优惠券快照，后续修改或删除本券不会影响已领取的券。</p>
        </aside>
      </div>

      <div class="mc-dialog-actions">
        <el-button @click="editor.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">{{ editor.mode === 'edit' ? '保存修改' : '确认创建' }}</el-button>
      </div>
    </el-dialog>

    <el-dialog v-model="deleteState.visible" width="460px" class="mc-confirm-dialog" align-center>
      <template #header>
        <div class="mc-dialog-head">
          <span>DELETE COUPON</span>
          <h2>删除优惠券</h2>
        </div>
      </template>
      <p v-if="deleteState.row" class="mc-confirm-text">
        确定删除「<b>{{ deleteState.row.name }}</b>」吗？删除后买家将无法继续领取。
      </p>
      <div v-if="deleteState.row && deleteState.row.received > 0" class="mc-confirm-warning">
        该券已被领取 {{ deleteState.row.received }} 张，其中已核销 {{ deleteState.row.used }} 张。会员已领取的券不会被收回，仍可在有效期内使用。
      </div>
      <div class="mc-dialog-actions">
        <el-button @click="deleteState.visible = false">取消</el-button>
        <el-button type="danger" :loading="deleteState.loading" @click="confirmDelete">确认删除</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, Plus, Search, Shop, Ticket, Warning } from '@element-plus/icons-vue'
import { getCategoryTree } from '@/api/mall/category'
import {
  createMchCoupon,
  deleteMchCoupon,
  getMchCouponList,
  getSpuDetail,
  updateMchCoupon,
  updateMchCouponStatus,
} from '@/api/mall/mchCoupon'
import { queryMchSpuList } from '@/api/mall/seckill'
import { getCurrentShop } from '@/utils/shop'
import MallPagination from '@/components/mall/MallPagination.vue'
import '@/assets/yeah-mall-coupon.css'

defineOptions({ name: 'MchCouponList' })

const TYPE_OPTIONS = [
  { value: '1', label: '满减券' },
  { value: '2', label: '折扣券' },
  { value: '3', label: '无门槛券' },
]
const TYPE_TEXT = { 1: '满减券', 2: '折扣券', 3: '无门槛券' }
const RANGE_TEXT = { 1: '店铺通用', 2: '指定商品', 3: '指定分类' }

const router = useRouter()
const shopName = getCurrentShop()?.name || '当前店铺'

const loading = ref(false)
const saving = ref(false)
const coupons = ref([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })

const emptyQuery = () => ({ keyword: '', type: '', useRange: '', status: '' })
const draft = reactive(emptyQuery())
const query = reactive(emptyQuery())

const editor = reactive({ visible: false, mode: 'create', origin: null, error: '' })
const form = reactive({})
const deleteState = reactive({ visible: false, row: null, loading: false })

const productOptions = ref([])
const baseProductOptions = ref([])
const productLoading = ref(false)
const productNames = reactive(new Map())
const categoryOptions = ref([])
const categoryNames = reactive(new Map())
const pendingSpuIds = new Set()
let productLoadPromise = null
let categoryLoadPromise = null
let productSearchSeq = 0

const shopId = () => getCurrentShop()?.id || ''

function pad(value) {
  return String(value).padStart(2, '0')
}

function dateText(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function defaultForm() {
  const today = new Date()
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 40)
  return {
    id: '',
    name: '',
    description: '',
    type: '1',
    amount: '20',
    discount: '9',
    minAmount: '199',
    quantity: '100',
    perLimit: '1',
    useRange: '1',
    targetId: '',
    beginTime: `${dateText(today)} 00:00:00`,
    endTime: `${dateText(end)} 23:59:59`,
    isEnabled: true,
    isSupportGroupBuy: false,
    isPointsExchangeEnabled: false,
  }
}

Object.assign(form, defaultForm())

watch(
  form,
  () => {
    if (editor.error) editor.error = ''
  },
  { deep: true },
)

function toTime(value) {
  if (!value) return 0
  const parsed = new Date(String(value).replace(' ', 'T')).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function toDbTime(value) {
  if (!value) return ''
  const text = String(value).replace('T', ' ').slice(0, 19)
  return text.length === 16 ? `${text}:00` : text
}

function shortDate(value) {
  return String(value || '').replace('T', ' ').slice(0, 10)
}

function typeText(type) {
  return TYPE_TEXT[Number(type)] || '—'
}

function rangeText(range) {
  return RANGE_TEXT[Number(range)] || '—'
}

function valueText(row) {
  if (Number(row.type) === 2) {
    return `${Number((Number(row.discount || 0) * 10).toFixed(2))} 折`
  }
  return `¥${Number(row.amount || 0)}`
}

function conditionText(row) {
  if (Number(row.type) === 3) return '无门槛'
  return Number(row.minAmount || 0) > 0 ? `满 ¥${Number(row.minAmount)} 可用` : '无门槛'
}

function scopeDetail(row) {
  const range = Number(row.useRange)
  if (range === 1) return '全部商品可用'
  const id = String(row.targetId || '')
  const name = (range === 2 ? productNames.get(id) : categoryNames.get(id)) || ''
  return name || '—'
}

function receivePct(row) {
  return Math.min(100, Math.round((Number(row.received || 0) * 100) / Math.max(1, Number(row.quantity || 0))))
}

function remaining(row) {
  return Math.max(0, Number(row.quantity || 0) - Number(row.received || 0))
}

function couponState(row) {
  if (!row.isEnabled) return { label: '已停用', tone: 'neutral' }
  const now = Date.now()
  const begin = toTime(row.beginTime)
  const end = toTime(row.endTime)
  if (begin && now < begin) return { label: '未开始', tone: 'info' }
  if (end && now > end) return { label: '已结束', tone: 'neutral' }
  if (Number(row.received || 0) >= Number(row.quantity || 0)) return { label: '已领完', tone: 'warning' }
  return { label: '进行中', tone: 'success' }
}

const previewValue = computed(() => {
  if (form.type === '2') return `${Number(form.discount || 0) || '—'} 折`
  return `¥${Number(form.amount || 0) || '—'}`
})

const previewCondition = computed(() => {
  if (form.type === '3') return '无门槛'
  return `满 ¥${Number(form.minAmount || 0) || '—'} 可用`
})

const previewScope = computed(() => {
  const range = rangeText(form.useRange)
  if (form.useRange === '1') return range
  const id = String(form.targetId || '')
  const name =
    (form.useRange === '2' ? productNames.get(id) : categoryNames.get(id)) ||
    [...productOptions.value, ...categoryOptions.value].find((item) => item.id === id)?.name ||
    ''
  return name ? `${range} · ${name}` : range
})

async function getList() {
  const currentShopId = shopId()
  if (!currentShopId) {
    ElMessage.warning('请先选择店铺')
    return
  }
  loading.value = true
  try {
    let conditions = 'createTime:sort:desc'
    const keyword = query.keyword.trim().replace(/;/g, '')
    if (keyword) conditions += `;name:like:${keyword}`
    if (query.type) conditions += `;type:eq:${query.type}`
    if (query.useRange) conditions += `;useRange:eq:${query.useRange}`
    if (query.status) conditions += `;isEnabled:eq:${query.status}`

    const result = await getMchCouponList({
      shopId: currentShopId,
      conditions_: conditions,
      current: pagination.current,
      size: pagination.pageSize,
    })
    coupons.value = result.data?.records || []
    pagination.total = Number(result.data?.total || 0)
    resolveRowTargets(coupons.value)
  } catch {
    // 接口层已统一提示错误。
  } finally {
    loading.value = false
  }
}

function applyDraft() {
  Object.assign(query, {
    keyword: draft.keyword.trim(),
    type: draft.type,
    useRange: draft.useRange,
    status: draft.status,
  })
}

function handleSearch() {
  applyDraft()
  pagination.current = 1
  getList()
}

function resetQuery() {
  Object.assign(draft, emptyQuery())
  Object.assign(query, emptyQuery())
  pagination.current = 1
  getList()
}

function changePage(payload) {
  pagination.current = payload.page
  pagination.pageSize = payload.limit
  getList()
}

function flattenCategories(nodes, parentPath = '') {
  ;(nodes || []).forEach((node) => {
    const path = parentPath ? `${parentPath} / ${node.name}` : node.name
    const id = String(node.id)
    categoryNames.set(id, path)
    categoryOptions.value.push({ id, name: path })
    if (node.children?.length) flattenCategories(node.children, path)
  })
}

function ensureCategories() {
  if (categoryOptions.value.length) return Promise.resolve()
  if (categoryLoadPromise) return categoryLoadPromise
  const currentShopId = shopId()
  if (!currentShopId) return Promise.resolve()
  categoryLoadPromise = getCategoryTree({ shopId: currentShopId })
    .then((response) => {
      flattenCategories(response.data || [])
    })
    .catch(() => {})
    .finally(() => {
      categoryLoadPromise = null
    })
  return categoryLoadPromise
}

function mergeProductName(id, name) {
  const key = String(id || '')
  if (!key || !name) return
  productNames.set(key, name)
  if (!productOptions.value.some((item) => item.id === key)) {
    productOptions.value.push({ id: key, name })
  }
}

function mergeProductOption(option) {
  if (!option?.id) return
  if (!productOptions.value.some((item) => item.id === option.id)) {
    productOptions.value.push(option)
  }
}

function ensureProductOption(id) {
  const key = String(id || '')
  if (!key) return Promise.resolve()
  const known = productNames.get(key)
  if (known) {
    mergeProductOption({ id: key, name: known })
    return Promise.resolve()
  }
  if (pendingSpuIds.has(key)) return Promise.resolve()
  pendingSpuIds.add(key)
  return getSpuDetail(key)
    .then((response) => {
      if (response.data) mergeProductName(key, response.data.name)
    })
    .catch(() => {})
    .finally(() => {
      pendingSpuIds.delete(key)
    })
}

function resolveRowTargets(rows) {
  rows.forEach((row) => {
    if (Number(row.useRange) !== 2) return
    const id = String(row.targetId || '')
    if (id && !productNames.has(id)) ensureProductOption(id)
  })
}

function loadInitialProducts() {
  if (baseProductOptions.value.length) return Promise.resolve()
  if (productLoadPromise) return productLoadPromise
  const currentShopId = shopId()
  if (!currentShopId) return Promise.resolve()
  productLoadPromise = queryMchSpuList({ shopId: currentShopId, size: 100, current: 1 })
    .then((response) => {
      const options = (response.data?.records || []).map((item) => {
        productNames.set(String(item.id), item.name)
        return { id: String(item.id), name: item.name }
      })
      baseProductOptions.value = options
      productOptions.value = [...options]
    })
    .catch(() => {})
    .finally(() => {
      productLoadPromise = null
    })
  return productLoadPromise
}

function prepareProductOptions() {
  return loadInitialProducts().then(() => {
    const selectedId = String(form.targetId || '')
    const selected = productOptions.value.find((item) => item.id === selectedId)
    productOptions.value = [...baseProductOptions.value]
    if (selected && !productOptions.value.some((item) => item.id === selected.id)) {
      productOptions.value.unshift(selected)
    }
    if (selectedId) ensureProductOption(selectedId)
  })
}

async function searchProductOptions(keyword) {
  if (!keyword) {
    await prepareProductOptions()
    return
  }
  const currentShopId = shopId()
  if (!currentShopId) return
  const seq = ++productSearchSeq
  productLoading.value = true
  try {
    const response = await queryMchSpuList({
      shopId: currentShopId,
      size: 100,
      current: 1,
      name: keyword,
    })
    if (seq !== productSearchSeq) return
    const selectedId = String(form.targetId || '')
    const selected = productOptions.value.find((item) => item.id === selectedId)
    const next = (response.data?.records || []).map((item) => {
      productNames.set(String(item.id), item.name)
      return { id: String(item.id), name: item.name }
    })
    if (selected && !next.some((item) => item.id === selected.id)) next.unshift(selected)
    productOptions.value = next
  } catch {
    if (seq === productSearchSeq) productOptions.value = []
  } finally {
    if (seq === productSearchSeq) productLoading.value = false
  }
}

function openCreate() {
  Object.assign(form, defaultForm())
  editor.mode = 'create'
  editor.origin = null
  editor.error = ''
  editor.visible = true
}

function openEdit(row) {
  const type = String(row.type)
  Object.assign(form, {
    id: String(row.id),
    name: row.name || '',
    description: row.description || '',
    type,
    amount: row.amount === null || row.amount === undefined ? '' : String(row.amount),
    discount: String(Number((Number(row.discount || 0) * 10).toFixed(2))),
    minAmount: String(Number(row.minAmount || 0)),
    quantity: String(row.quantity ?? ''),
    perLimit: String(row.perLimit ?? ''),
    useRange: String(row.useRange || 1),
    targetId: String(row.targetId || ''),
    beginTime: toDbTime(row.beginTime),
    endTime: toDbTime(row.endTime),
    isEnabled: Boolean(row.isEnabled),
    isSupportGroupBuy: Boolean(row.isSupportGroupBuy),
    isPointsExchangeEnabled: Boolean(row.isPointsExchangeEnabled),
  })
  editor.mode = 'edit'
  editor.origin = row
  editor.error = ''
  editor.visible = true
  if (form.useRange === '2') prepareProductOptions()
  if (form.useRange === '3') ensureCategories()
}

function switchType(type) {
  form.type = type
  if (type === '2') {
    if (!(Number(form.discount) > 0)) form.discount = '9'
    if (!(Number(form.minAmount) > 0)) form.minAmount = '99'
  }
  if (type === '3') form.minAmount = '0'
  if (type === '1' && !(Number(form.minAmount) > 0)) form.minAmount = '199'
  editor.error = ''
}

function handleRangeChange(range) {
  form.targetId = ''
  if (range === '2') prepareProductOptions()
  if (range === '3') ensureCategories()
}

function formError() {
  const name = String(form.name || '').trim()
  if (!name) return '请输入优惠券名称'
  if (name.length > 40) return '优惠券名称不能超过 40 个字符'
  const type = Number(form.type)
  const amount = Number(form.amount || 0)
  const discount = Number(form.discount || 0)
  const minAmount = type === 3 ? 0 : Number(form.minAmount || 0)
  if (type === 1) {
    if (!(amount > 0)) return '满减券的优惠金额必须大于 0'
    if (!(minAmount > 0)) return '满减券的使用门槛必须大于 0'
    if (minAmount < amount) return '使用门槛不能小于优惠金额'
  }
  if (type === 2) {
    if (!(discount > 0 && discount < 10)) return '折扣券的折扣必须在 0.1–9.9 折之间'
    if (!(minAmount > 0)) return '折扣券的使用门槛必须大于 0'
  }
  if (type === 3 && !(amount > 0)) return '无门槛券的优惠金额必须大于 0'
  const quantity = Number(form.quantity)
  const perLimit = Number(form.perLimit)
  if (!Number.isInteger(quantity) || quantity < 1) return '发行总量必须为正整数'
  if (!Number.isInteger(perLimit) || perLimit < 1) return '每人限领必须为正整数'
  if (perLimit > quantity) return '每人限领不能大于发行总量'
  if (editor.origin && quantity < Number(editor.origin.received || 0)) {
    return `发行总量不能小于已领取数量（${editor.origin.received} 张）`
  }
  if (form.useRange !== '1' && !form.targetId) {
    return form.useRange === '2' ? '请选择适用商品' : '请选择适用分类'
  }
  if (!form.beginTime || !form.endTime) return '请选择优惠券有效期'
  if (toDbTime(form.beginTime) >= toDbTime(form.endTime)) return '结束时间必须晚于开始时间'
  return ''
}

async function save() {
  const error = formError()
  if (error) {
    editor.error = error
    return
  }
  const currentShopId = shopId()
  if (!currentShopId) {
    ElMessage.warning('请先选择店铺')
    return
  }
  const type = Number(form.type)
  const payload = {
    shopId: currentShopId,
    name: form.name.trim(),
    description: form.description.trim(),
    type,
    amount: type === 2 ? null : Number(form.amount || 0),
    discount: type === 2 ? Number((Number(form.discount || 0) / 10).toFixed(2)) : null,
    minAmount: type === 3 ? 0 : Number(form.minAmount || 0),
    quantity: Number(form.quantity),
    perLimit: Number(form.perLimit),
    useRange: Number(form.useRange),
    targetId: form.useRange === '1' ? currentShopId : form.targetId,
    beginTime: toDbTime(form.beginTime),
    endTime: toDbTime(form.endTime),
    isEnabled: Boolean(form.isEnabled),
    isSupportGroupBuy: Boolean(form.isSupportGroupBuy),
    isPointsExchangeEnabled: Boolean(form.isPointsExchangeEnabled),
  }
  if (editor.mode === 'edit') payload.id = form.id

  saving.value = true
  try {
    if (editor.mode === 'edit') {
      await updateMchCoupon(payload)
      ElMessage.success('优惠券已保存')
    } else {
      await createMchCoupon(payload)
      ElMessage.success('优惠券已创建')
    }
    editor.visible = false
    await getList()
  } catch {
    // 接口层已统一提示错误。
  } finally {
    saving.value = false
  }
}

async function toggleStatus(row) {
  const currentShopId = shopId()
  if (!currentShopId) {
    ElMessage.warning('请先选择店铺')
    return
  }
  const wasEnabled = Boolean(row.isEnabled)
  try {
    await updateMchCouponStatus({ id: row.id, isEnabled: !wasEnabled })
    if (wasEnabled) {
      ElMessage.success('优惠券已停用，已领取的券仍可在有效期内使用')
    } else if (Date.now() > toTime(row.endTime)) {
      ElMessage.success('优惠券已启用，但已过有效期，需调整有效期后才会重新发放')
    } else {
      ElMessage.success('优惠券已启用')
    }
    await getList()
  } catch {
    // 接口层已统一提示错误。
  }
}

function requestDelete(row) {
  deleteState.row = row
  deleteState.visible = true
}

async function confirmDelete() {
  const row = deleteState.row
  if (!row) return
  deleteState.loading = true
  try {
    await deleteMchCoupon([row.id])
    deleteState.visible = false
    const received = Number(row.received || 0)
    ElMessage.success(received ? `已删除「${row.name}」，已领取的 ${received} 张券不受影响` : `已删除「${row.name}」`)
    await getList()
  } catch {
    // 接口层已统一提示错误。
  } finally {
    deleteState.loading = false
  }
}

function handleCommand(command, row) {
  if (command === 'toggle-status') toggleStatus(row)
  else if (command === 'receive') router.push({ path: '/mall/mch-coupon/receive', query: { couponId: row.id } })
  else if (command === 'usage') router.push({ path: '/mall/mch-coupon/record', query: { couponId: row.id } })
  else if (command === 'delete') requestDelete(row)
}

onMounted(() => {
  getList()
  loadInitialProducts()
  ensureCategories()
})
</script>