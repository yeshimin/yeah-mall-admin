<template>
  <el-dialog
    v-model="visible"
    class="ms-apply-dialog"
    :show-close="false"
    :with-header="false"
    append-to-body
    destroy-on-close
  >
    <div class="ms-dialog-head">
      <div>
        <span class="ms-drawer-kicker">SECKILL APPLICATION</span>
        <h2>申请参加「{{ activity?.name || '' }}」</h2>
      </div>
      <button type="button" class="ms-drawer-close" title="关闭" @click="close">
        <el-icon><Close /></el-icon>
      </button>
    </div>

    <div v-loading="initialLoading" class="ms-apply-layout">
      <div class="ms-apply-main">
        <section class="ms-form-section">
          <div class="ms-section-head">
            <span>01</span>
            <div>
              <b>选择活动场次</b>
              <small>报名商品将参与所选场次的秒杀，请确认场次时间</small>
            </div>
          </div>
          <div class="ms-session-options">
            <button
              v-for="session in sessions"
              :key="session.id"
              type="button"
              :disabled="!session.isEnabled"
              :class="{ active: sameId(sessionId, session.id) }"
              @click="pickSession(session)"
            >
              <span class="ms-option-radio"><i></i></span>
              <span class="ms-option-copy">
                <b>{{ session.name }}</b>
                <small>{{ shortTime(session.beginTime) }} – {{ clockTime(session.endTime) }} · {{ weekday(session.beginTime) }}</small>
              </span>
              <span v-if="!session.isEnabled" class="status-ticket tone-neutral is-small">停用</span>
            </button>
          </div>
        </section>

        <section class="ms-form-section">
          <div class="ms-section-head">
            <span>02</span>
            <div>
              <b>选择报名商品</b>
              <small>仅可选择当前店铺已上架且存在可售 SKU 的商品</small>
            </div>
          </div>
          <div v-if="spu" class="ms-picked-product">
            <SeckillThumb :src="spu.mainImage" :alt="spu.name" class="ms-picked-art" />
            <div class="ms-picked-copy">
              <b>{{ spu.name }}</b>
              <small>{{ spu.categoryName || '未分类' }} · {{ skus.length }} 个 SKU · 可售 {{ availableStock }} 件</small>
              <em v-if="blockedNow">该商品在当前场次已报名</em>
            </div>
            <button type="button" @click="openPicker">更换商品</button>
          </div>
          <button v-else type="button" class="ms-pick-empty" @click="openPicker">
            <el-icon :size="18"><Plus /></el-icon>
            <span>
              <b>选择店铺商品</b>
              <small>从当前店铺已上架商品中选择一个 SPU</small>
            </span>
          </button>
        </section>

        <section class="ms-form-section">
          <div class="ms-section-head">
            <span>03</span>
            <div>
              <b>报名商品信息</b>
              <small>买家将在秒杀活动页看到以下内容</small>
            </div>
          </div>
          <div class="ms-form-grid">
            <label class="ms-form-field wide">
              <span>报名商品名称 <i class="ms-required">*</i></span>
              <input v-model="spuName" :disabled="!spu" placeholder="选择商品后自动带入，可修改" />
            </label>
            <div class="ms-form-field wide">
              <span>商品主图</span>
              <div class="ms-cover-row">
                <SeckillThumb :src="spu?.mainImage" :alt="spu?.name" class="ms-cover-preview" />
                <div>
                  <b>沿用店铺商品主图</b>
                  <small>提交报名时会一并标记图片为已使用，避免被清理任务回收。</small>
                </div>
              </div>
            </div>
            <label class="ms-form-field wide">
              <span>商品描述 <i class="ms-required">*</i></span>
              <textarea v-model="detailDesc" :disabled="!spu" placeholder="请输入秒杀商品描述"></textarea>
            </label>
            <div class="ms-form-field wide">
              <span>轮播图 <i class="ms-required">*</i><small>至少 1 张，最多 5 张</small></span>
              <div class="ms-image-list">
                <span v-for="(image, index) in images" :key="`${image}-${index}`" class="ms-image-chip">
                  <img v-if="image" :src="previewUrl(image)" alt="" />
                  <span v-else class="ms-image-fallback"><el-icon><Picture /></el-icon></span>
                  <button type="button" title="移除" @click="removeImage(index)">×</button>
                </span>
                <el-upload
                  v-if="spu && images.length < 5"
                  class="ms-image-upload"
                  :action="uploadUrl"
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  accept="image/*"
                  :before-upload="beforeImageUpload"
                  :on-success="handleImageUploaded"
                >
                  <span class="ms-image-add">
                    <el-icon :size="18"><Plus /></el-icon>
                    <span>添加</span>
                  </span>
                </el-upload>
              </div>
            </div>
          </div>
        </section>

        <section class="ms-form-section">
          <div class="ms-section-head">
            <span>04</span>
            <div>
              <b>选择参与秒杀的 SKU</b>
              <small>秒杀价需低于原价，活动库存不可超过当前可售库存</small>
            </div>
          </div>
          <div v-if="spu" class="ms-sku-editor-wrap">
            <table v-if="skus.length" class="ms-sku-editor">
              <thead>
                <tr>
                  <th class="ms-check">
                    <input type="checkbox" :checked="allChecked" :disabled="!selectableSkus.length" @change="toggleAll" />
                  </th>
                  <th>SKU 名称</th>
                  <th>规格编码</th>
                  <th>原价</th>
                  <th>秒杀价</th>
                  <th>活动库存</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="sku in skus"
                  :key="sku.id"
                  :class="{ 'is-checked': isChosen(sku.id), 'is-soldout': skuStock(sku) <= 0 }"
                >
                  <td class="ms-check">
                    <input
                      type="checkbox"
                      :checked="isChosen(sku.id)"
                      :disabled="skuStock(sku) <= 0"
                      @change="toggleSku(sku.id, $event)"
                    />
                  </td>
                  <td>
                    <div class="ms-sku-name">
                      <b :title="sku.name">{{ sku.name }}</b>
                      <small>可售 {{ skuStock(sku) }} 件{{ skuStock(sku) <= 0 ? ' · 已售罄' : '' }}</small>
                    </div>
                  </td>
                  <td>
                    <input
                      class="ms-sku-input"
                      :value="draftOf(sku.id).specCode || ''"
                      :disabled="!isChosen(sku.id)"
                      @input="updateDraft(sku.id, { specCode: $event.target.value })"
                    />
                  </td>
                  <td>
                    <span class="ms-price-input">
                      <i>¥</i>
                      <input
                        :value="draftOf(sku.id).originPrice ?? ''"
                        :disabled="!isChosen(sku.id)"
                        inputmode="decimal"
                        @input="updateDraft(sku.id, { originPrice: $event.target.value })"
                      />
                    </span>
                  </td>
                  <td>
                    <span class="ms-price-input is-dark">
                      <i>¥</i>
                      <input
                        :value="draftOf(sku.id).seckillPrice ?? ''"
                        :disabled="!isChosen(sku.id)"
                        inputmode="decimal"
                        @input="updateDraft(sku.id, { seckillPrice: $event.target.value })"
                      />
                    </span>
                  </td>
                  <td>
                    <div>
                      <input
                        type="number"
                        min="1"
                        :max="skuStock(sku)"
                        class="ms-stock-input"
                        :value="draftOf(sku.id).stock ?? ''"
                        :disabled="!isChosen(sku.id)"
                        @input="updateDraft(sku.id, { stock: Number($event.target.value) })"
                      />
                      <small class="cell-sub">上限 {{ skuStock(sku) }}</small>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="!skus.length" class="ms-empty is-compact">
              <b>该商品暂无 SKU</b>
              <span>请先在商品管理中配置 SKU 后再报名</span>
            </div>
          </div>
          <div v-else class="ms-sku-placeholder">
            <el-icon><Goods /></el-icon>
            <b>请先选择报名商品</b>
            <span>选择商品后可勾选参与秒杀的 SKU 并设置活动价与库存</span>
          </div>
        </section>

        <section class="ms-form-section">
          <div class="ms-section-head">
            <span>05</span>
            <div>
              <b>申请备注</b>
              <small>选填，可向平台说明活动准备情况</small>
            </div>
          </div>
          <label class="ms-form-field">
            <span>备注内容 <small>{{ applyRemark.length }}/200</small></span>
            <textarea
              v-model="applyRemark"
              maxlength="200"
              placeholder="例如：活动库存已备货完成，希望主推标准版"
            ></textarea>
          </label>
        </section>
      </div>

      <aside class="ms-apply-aside">
        <div class="ms-summary-panel">
          <span class="ms-summary-kicker">APPLICATION SUMMARY</span>
          <h3>报名确认</h3>
          <div class="ms-summary-product">
            <template v-if="spu">
              <SeckillThumb :src="spu.mainImage" :alt="spu.name" class="ms-summary-art" />
              <div>
                <b>{{ spuName || spu.name }}</b>
                <small>{{ spu.categoryName || '未分类' }} · {{ chosenSkuIds.length }}/{{ skus.length }} 个 SKU</small>
              </div>
            </template>
            <div v-else class="ms-summary-empty">尚未选择商品</div>
          </div>
          <div class="ms-summary-rows">
            <div><span>活动</span><b>{{ activity?.name || '—' }}</b></div>
            <div>
              <span>场次</span>
              <b>{{ selectedSession ? `${selectedSession.name} · ${shortTime(selectedSession.beginTime)}` : '待选择' }}</b>
            </div>
            <div><span>秒杀价</span><b>{{ minPrice ? priceRange(minPrice, maxPrice) : '待设置' }}</b></div>
            <div><span>活动库存</span><b>{{ totalStock }} 件</b></div>
          </div>
          <div class="ms-summary-notice">
            <el-icon><Warning /></el-icon>
            <span>提交后由平台审核，审核通过后商品才会进入秒杀活动。同一场次同一商品仅可报名一次。</span>
          </div>
        </div>
      </aside>
    </div>

    <div v-if="error" class="ms-dialog-error">
      <el-icon><Warning /></el-icon>
      <span>{{ error }}</span>
    </div>
    <div class="ms-apply-actions">
      <button type="button" class="ms-btn" @click="close">取消</button>
      <button type="button" class="ms-btn primary" :disabled="submitting" @click="submit">
        {{ submitting ? '提交中…' : '提交报名' }}
      </button>
    </div>

    <el-dialog
      v-model="pickerVisible"
      class="ms-picker-dialog"
      :show-close="false"
      :with-header="false"
      append-to-body
      destroy-on-close
    >
      <div class="ms-dialog-head">
        <div>
          <span class="ms-drawer-kicker">SELECT PRODUCT</span>
          <h2>选择报名商品</h2>
        </div>
        <button type="button" class="ms-drawer-close" title="关闭" @click="pickerVisible = false">
          <el-icon><Close /></el-icon>
        </button>
      </div>
      <div class="ms-picker-toolbar">
        <label>
          <el-icon><Search /></el-icon>
          <input v-model="pickerKeyword" placeholder="搜索商品名称" />
        </label>
        <span>仅展示当前店铺已上架商品</span>
      </div>
      <div v-loading="catalogLoading" class="ms-picker-frame">
        <table v-if="filteredPickerProducts.length" class="ms-picker-table">
          <thead>
            <tr>
              <th class="ms-check"></th>
              <th>商品</th>
              <th>分类</th>
              <th>SKU / 可售库存</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="product in filteredPickerProducts"
              :key="product.id"
              :class="{ 'is-disabled': pickerDisabled(product) }"
              @click="selectPickerProduct(product)"
            >
              <td class="ms-check">
                <input
                  type="radio"
                  name="ms-picker-product"
                  :checked="sameId(pickerCandidate, product.id)"
                  :disabled="pickerDisabled(product)"
                  @change="pickerCandidate = String(product.id)"
                />
              </td>
              <td>
                <div class="ms-picker-product">
                  <SeckillThumb :src="product.mainImage" :alt="product.name" class="ms-picker-thumb" />
                  <span>
                    <b>{{ product.name }}</b>
                    <small v-if="product.subtitle">{{ product.subtitle }}</small>
                    <em v-if="isBlocked(sessionId, product.id)">当前场次已报名</em>
                  </span>
                </div>
              </td>
              <td>{{ product.categoryName || '未分类' }}</td>
              <td>
                <div class="ms-picker-cell-stack">
                  <b>{{ skusOf(product.id).length }} 个 SKU</b>
                  <small>可售 {{ availableOf(product.id) }} 件</small>
                </div>
              </td>
              <td>
                <span
                  v-if="pickerDisabled(product)"
                  class="status-ticket tone-neutral is-small"
                >{{ isBlocked(sessionId, product.id) ? '本场次已报名' : '暂无可售 SKU' }}</span>
                <span v-else class="status-ticket tone-success is-small">可报名</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="ms-empty">
          <el-icon><Goods /></el-icon>
          <b>没有匹配的商品</b>
          <span>调整商品名称后重新搜索</span>
        </div>
      </div>
      <div class="ms-picker-actions">
        <button type="button" class="ms-btn" @click="pickerVisible = false">取消</button>
        <button
          type="button"
          class="ms-btn primary"
          :disabled="!pickerCandidateProduct || pickerCandidateBlocked"
          @click="confirmPicker"
        >确认选择</button>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, Goods, Picture, Plus, Search, Warning } from '@element-plus/icons-vue'
import {
  queryMchSeckillApplyList,
  queryMchSeckillSessionList,
  submitSeckillApply,
} from '@/api/mall/seckill'
import { listSpu } from '@/api/mall/spu'
import { listSpuImages } from '@/api/mall/spuImage'
import request from '@/utils/request'
import { getCurrentShop } from '@/utils/shop'
import { getStoragePreviewUrl } from '@/utils/storage'
import { resolveApiUrl } from '@/utils/download'
import { getToken } from '@/utils/auth'
import SeckillThumb from './SeckillThumb.vue'
import {
  asNumber,
  blockKey,
  clockTime,
  priceRange,
  shortTime,
  stripHtml,
  weekday,
} from '../shared'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  activity: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'submitted'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const uploadUrl = resolveApiUrl('/mch/storage/upload')
const uploadHeaders = { Authorization: `Bearer ${getToken()}` }

const sessions = ref([])
const sessionId = ref('')
const applies = ref([])
const initialLoading = ref(false)

const spu = ref(null)
const spuName = ref('')
const detailDesc = ref('')
const images = ref([])
const skuDrafts = reactive({})
const chosenSkuIds = ref([])
const applyRemark = ref('')
const error = ref('')
const submitting = ref(false)

const pickerVisible = ref(false)
const pickerKeyword = ref('')
const pickerCandidate = ref('')
const catalogLoading = ref(false)
const allProducts = ref([])
const allSkus = ref([])
let catalogPromise = null
let imageLoadToken = 0

const shopId = () => getCurrentShop()?.id || ''
const sameId = (left, right) => String(left ?? '') === String(right ?? '')

const selectedSession = computed(() => sessions.value.find((session) => sameId(session.id, sessionId.value)) || null)
const blockedKeys = computed(() => {
  return new Set(
    applies.value
      .filter((apply) => Number(apply.auditStatus) === 1 || Number(apply.auditStatus) === 2)
      .map((apply) => blockKey(apply.sessionId, apply.spuId)),
  )
})

function isBlocked(targetSessionId, targetSpuId) {
  return blockedKeys.value.has(blockKey(targetSessionId, targetSpuId))
}

const blockedNow = computed(() => Boolean(spu.value && sessionId.value && isBlocked(sessionId.value, spu.value.id)))

function skusOf(productId) {
  return allSkus.value.filter((sku) => sameId(sku.spuId, productId))
}

const skus = computed(() => (spu.value ? skusOf(spu.value.id) : []))
const selectableSkus = computed(() => skus.value.filter((sku) => skuStock(sku) > 0))
const allChecked = computed(
  () => selectableSkus.value.length > 0 && selectableSkus.value.every((sku) => isChosen(sku.id)),
)
const availableStock = computed(() => skus.value.reduce((sum, sku) => sum + skuStock(sku), 0))

function skuStock(sku) {
  return Math.max(0, Number(sku?.stock || 0))
}

function availableOf(productId) {
  return skusOf(productId).reduce((sum, sku) => sum + skuStock(sku), 0)
}

function draftOf(skuId) {
  return skuDrafts[skuId] || {}
}

function isChosen(skuId) {
  return chosenSkuIds.value.some((id) => sameId(id, skuId))
}

const chosenRows = computed(() => {
  return skus.value
    .filter((sku) => isChosen(sku.id))
    .map((sku) => ({ sku, draft: draftOf(sku.id) }))
})

const minPrice = computed(() => {
  const values = chosenRows.value
    .map((row) => Number(row.draft.seckillPrice || 0))
    .filter((value) => value > 0)
  return values.length ? Math.min(...values) : 0
})
const maxPrice = computed(() => {
  const values = chosenRows.value
    .map((row) => Number(row.draft.seckillPrice || 0))
    .filter((value) => value > 0)
  return values.length ? Math.max(...values) : 0
})
const totalStock = computed(() => chosenRows.value.reduce((sum, row) => sum + Number(row.draft.stock || 0), 0))

const filteredPickerProducts = computed(() => {
  const keyword = pickerKeyword.value.trim()
  return allProducts.value.filter((product) => {
    if (product.isEnabled === false) return false
    if (!keyword) return true
    return `${product.name}${product.subtitle || ''}`.includes(keyword)
  })
})

const pickerCandidateProduct = computed(() => {
  return filteredPickerProducts.value.find((product) => sameId(product.id, pickerCandidate.value)) || null
})
const pickerCandidateBlocked = computed(
  () => Boolean(pickerCandidateProduct.value && isBlocked(sessionId.value, pickerCandidateProduct.value.id)),
)

function pickerDisabled(product) {
  return isBlocked(sessionId.value, product.id) || availableOf(product.id) <= 0
}

function previewUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

function resetState() {
  sessions.value = []
  sessionId.value = ''
  applies.value = []
  spu.value = null
  spuName.value = ''
  detailDesc.value = ''
  images.value = []
  Object.keys(skuDrafts).forEach((key) => delete skuDrafts[key])
  chosenSkuIds.value = []
  applyRemark.value = ''
  error.value = ''
  pickerVisible.value = false
  pickerKeyword.value = ''
  pickerCandidate.value = ''
  allProducts.value = []
  allSkus.value = []
  catalogPromise = null
  imageLoadToken += 1
}

async function fetchAllApplies(activityId) {
  const rows = []
  let current = 1
  const size = 200
  for (let guard = 0; guard < 10; guard += 1) {
    const response = await queryMchSeckillApplyList({ activityId, current, size })
    const data = response?.data || {}
    const records = data.records || []
    rows.push(...records)
    const total = Number(data.total || 0)
    if (!records.length || rows.length >= total) break
    current += 1
  }
  return rows
}

async function initialize() {
  resetState()
  if (!props.activity?.id) return
  initialLoading.value = true
  try {
    const [sessionResponse, applyRows] = await Promise.all([
      queryMchSeckillSessionList({ activityId: props.activity.id }),
      fetchAllApplies(props.activity.id).catch(() => []),
    ])
    sessions.value = sessionResponse?.data || []
    applies.value = applyRows || []
    const firstEnabled = sessions.value.find((session) => session.isEnabled)
    sessionId.value = firstEnabled?.id || sessions.value[0]?.id || ''
  } catch {
    // 接口层已统一提示错误。
  } finally {
    initialLoading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) initialize()
  },
)

function close() {
  visible.value = false
}

function pickSession(session) {
  if (!session.isEnabled) return
  sessionId.value = session.id
  error.value = ''
}

async function fetchAllProducts() {
  const products = []
  let current = 1
  const size = 500
  for (let guard = 0; guard < 10; guard += 1) {
    const response = await listSpu({ shopId: shopId(), isEnabled: true, current, size })
    const data = response?.data || {}
    const records = data.records || []
    products.push(...records)
    const total = Number(data.total || 0)
    if (!records.length || products.length >= total) break
    current += 1
  }
  return products
}

async function fetchAllSkus() {
  const rows = []
  let current = 1
  const size = 500
  for (let guard = 0; guard < 10; guard += 1) {
    const response = await request({
      url: '/mch/productSku/crud/query',
      method: 'get',
      params: { shopId: shopId(), current, size },
    })
    const data = response?.data || {}
    const records = data.records || []
    rows.push(...records)
    const total = Number(data.total || 0)
    if (!records.length || rows.length >= total) break
    current += 1
  }
  return rows
}

function ensureCatalog() {
  if (catalogPromise) return catalogPromise
  catalogLoading.value = true
  catalogPromise = Promise.all([fetchAllProducts(), fetchAllSkus()])
    .then(([products, skusList]) => {
      allProducts.value = products
      allSkus.value = skusList
    })
    .catch(() => {
      catalogPromise = null
    })
    .finally(() => {
      catalogLoading.value = false
    })
  return catalogPromise
}

async function openPicker() {
  if (!sessionId.value) {
    error.value = '请先选择活动场次'
    return
  }
  pickerKeyword.value = ''
  pickerCandidate.value = spu.value?.id ? String(spu.value.id) : ''
  pickerVisible.value = true
  await ensureCatalog()
}

function pickerDisabledProduct(product) {
  return pickerDisabled(product)
}

function selectPickerProduct(product) {
  if (pickerDisabledProduct(product)) return
  pickerCandidate.value = String(product.id)
}

async function confirmPicker() {
  if (!pickerCandidateProduct.value || pickerCandidateBlocked.value) return
  chooseProduct(pickerCandidateProduct.value)
  pickerVisible.value = false
}

async function loadProductImages(product) {
  const token = ++imageLoadToken
  try {
    const response = await listSpuImages({
      shopId: shopId(),
      spuId: product.id,
      current: 1,
      size: 100,
    })
    const records = response?.data?.records || []
    const urls = [...new Set(records.map((item) => item.imageUrl).filter(Boolean))]
    if (!urls.length) return
    if (token !== imageLoadToken || !sameId(spu.value?.id, product.id)) return
    images.value = urls.slice(0, 5)
  } catch {
    // 接口层已统一提示错误，保留主图兜底。
  }
}

function chooseProduct(product) {
  const mainImage = product.mainImage || ''
  spu.value = product
  spuName.value = product.name || ''
  detailDesc.value = stripHtml(product.detailDesc)
  images.value = mainImage ? [mainImage] : []
  imageLoadToken += 1

  Object.keys(skuDrafts).forEach((key) => delete skuDrafts[key])
  const productSkus = skusOf(product.id)
  productSkus.forEach((sku) => {
    const price = Number(sku.price || 0)
    skuDrafts[sku.id] = {
      specCode: sku.specCode || '',
      originPrice: price,
      seckillPrice: (price * 0.8).toFixed(2),
      stock: Math.min(skuStock(sku), 10),
    }
  })
  chosenSkuIds.value = productSkus.filter((sku) => skuStock(sku) > 0).map((sku) => sku.id)
  error.value = ''
  loadProductImages(product)
}

function updateDraft(skuId, patch) {
  skuDrafts[skuId] = { ...(skuDrafts[skuId] || {}), ...patch }
}

function toggleAll(event) {
  const checked = Boolean(event?.target?.checked)
  chosenSkuIds.value = checked ? selectableSkus.value.map((sku) => sku.id) : []
}

function toggleSku(skuId, event) {
  const checked = Boolean(event?.target?.checked)
  const sku = skus.value.find((item) => sameId(item.id, skuId))
  if (!sku || skuStock(sku) <= 0) return
  if (checked) {
    if (!isChosen(skuId)) chosenSkuIds.value = [...chosenSkuIds.value, skuId]
  } else {
    chosenSkuIds.value = chosenSkuIds.value.filter((id) => !sameId(id, skuId))
  }
}

function removeImage(index) {
  images.value = images.value.filter((_, itemIndex) => itemIndex !== index)
}

function beforeImageUpload(file) {
  if (!file.type?.startsWith('image/')) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (file.size / 1024 / 1024 >= 2) {
    ElMessage.error('上传图片大小不能超过 2MB!')
    return false
  }
  return true
}

function handleImageUploaded(response) {
  if (response?.code === 0 && response?.data?.fileKey) {
    if (images.value.length < 5) images.value = [...images.value, response.data.fileKey]
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(`图片上传失败: ${response?.message || '未知错误'}`)
  }
}

async function submit() {
  error.value = ''
  if (!sessionId.value) return setError('请选择活动场次')
  if (!spu.value) return setError('请选择要报名的店铺商品')
  if (blockedNow.value) return setError('该商品在当前场次已报名且正在审核或已通过，请更换场次或商品')
  if (!spuName.value.trim()) return setError('请输入报名商品名称')
  if (!detailDesc.value.trim()) return setError('请输入商品描述')
  if (!images.value.length) return setError('请至少保留 1 张轮播图')
  if (!chosenSkuIds.value.length) return setError('请至少选择 1 个参与秒杀的 SKU')

  for (const { sku, draft } of chosenRows.value) {
    const origin = Number(draft.originPrice)
    const price = Number(draft.seckillPrice)
    const stock = Number(draft.stock)
    if (!String(draft.specCode || '').trim()) return setError(`请填写「${sku.name}」的规格编码`)
    if (!(origin > 0)) return setError(`请填写「${sku.name}」的有效原价`)
    if (!(price > 0)) return setError(`请填写「${sku.name}」的有效秒杀价`)
    if (price >= origin) return setError(`「${sku.name}」的秒杀价需低于原价`)
    if (!Number.isInteger(stock) || stock < 1) return setError(`「${sku.name}」的活动库存需为正整数`)
    if (stock > skuStock(sku)) return setError(`「${sku.name}」的活动库存不可超过当前可售 ${skuStock(sku)} 件`)
  }

  const mainImage = spu.value.mainImage || images.value[0] || ''
  if (!mainImage) return setError('当前商品缺少主图，请先在商品管理中设置主图')

  const payload = {
    sessionId: sessionId.value,
    spuId: spu.value.id,
    name: spuName.value.trim(),
    mainImage,
    detailDesc: detailDesc.value.trim(),
    images: [...images.value],
    applyRemark: applyRemark.value.trim(),
    skuList: chosenRows.value.map(({ sku, draft }) => ({
      skuId: sku.id,
      name: sku.name,
      specCode: String(draft.specCode).trim(),
      originPrice: Number(Number(draft.originPrice).toFixed(2)),
      seckillPrice: Number(Number(draft.seckillPrice).toFixed(2)),
      stock: Number(draft.stock),
      mainImage: sku.mainImage || mainImage,
    })),
  }

  submitting.value = true
  try {
    await submitSeckillApply(payload)
    ElMessage.success('报名已提交，等待平台审核')
    emit('submitted')
    close()
  } catch (err) {
    setError(err?.message || '报名提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

function setError(message) {
  error.value = message
}
</script>