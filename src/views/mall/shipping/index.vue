<template>
  <div class="mall-page merchant-shop-page merchant-shipping-page">
    <div class="mchs-tabs">
      <button
        v-for="item in TABS"
        :key="item.value"
        type="button"
        :class="{ active: activeTab === item.value }"
        @click="goTab(item.value)"
      >{{ item.label }}</button>
    </div>

    <template v-if="activeTab === 'providers'">
      <section class="mall-filter-panel">
        <el-form :inline="true" class="mall-query-form" @submit.prevent="handleProviderSearch">
          <div class="mchs-filter-fields">
            <el-form-item label="物流公司" class="mchs-filter-field mchs-filter-keyword">
              <el-input
                v-model="providerDraft.keyword"
                clearable
                placeholder="公司名称、编码或备注"
                @keyup.enter="handleProviderSearch"
              />
            </el-form-item>
            <el-form-item label="常用状态" class="mchs-filter-field mchs-filter-status">
              <el-select v-model="providerDraft.popular" placeholder="全部">
                <el-option label="全部" value="all" />
                <el-option label="常用" value="popular" />
                <el-option label="普通" value="normal" />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item class="mall-query-actions">
            <el-button @click="resetProviderQuery">重置</el-button>
            <el-button type="primary" native-type="submit">
              <el-icon><Search /></el-icon>查询
            </el-button>
          </el-form-item>
        </el-form>
        <div class="mall-business-actions">
          <el-button :icon="Refresh" :loading="syncing" @click="syncDialogVisible = true">同步快递公司</el-button>
          <el-button type="primary" icon="Plus" @click="openProviderCreate">新增物流公司</el-button>
        </div>
      </section>

      <section class="mall-table-panel">
        <div class="mchs-intro">
          <span>
            <el-icon :size="15"><Van /></el-icon>
            维护本店可选的快递公司；常用公司会优先出现在发货选择列表，默认公司用于自动填充。
          </span>
          <div class="mchs-intro-right">
            <span class="mchs-intro-chip is-soft">
              <el-icon :size="12"><Star /></el-icon>
              默认 {{ defaultProvider?.name || '未设置' }}
            </span>
            <b>常用 {{ popularCount }} / 共 {{ providers.length }}</b>
          </div>
        </div>

        <el-table
          data-ym-table="r91"
          v-loading="providersLoading"
          :data="pagedProviders"
          row-key="id"
          style="width: 100%"
        >
          <el-table-column label="物流公司" min-width="226" align="center" header-align="center">
            <template #default="{ row }">
              <div class="mchs-provider-cell">
                <span class="mchs-provider-avatar">{{ (row.name || '?').slice(0, 1) }}</span>
                <span>
                  <b :title="row.name">{{ row.name }}</b>
                  <small>{{ row.code }}</small>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="240" align="center" header-align="center">
            <template #default="{ row }">
              <span :class="['mchs-remark', { 'is-empty': !row.remark }]" :title="row.remark">{{ row.remark || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="是否常用" min-width="104" align="center" header-align="center">
            <template #default="{ row }">
              <button
                type="button"
                class="mchs-state-toggle"
                :class="{ 'is-on': row.isPopular }"
                :aria-pressed="!!row.isPopular"
                :disabled="popularLoadingId === row.id"
                @click="togglePopular(row)"
              >
                <i />
                <span>{{ row.isPopular ? '常用' : '普通' }}</span>
              </button>
            </template>
          </el-table-column>
          <el-table-column label="默认物流公司" min-width="124" align="center" header-align="center">
            <template #default="{ row }">
              <span v-if="row.isDefault" class="status-ticket tone-success">默认</span>
              <button
                v-else
                type="button"
                class="mchs-default-action"
                :disabled="defaultLoadingId === row.id"
                @click="setDefaultProvider(row)"
              >设为默认</button>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" min-width="138" align="center" header-align="center">
            <template #default="{ row }">
              <span class="mchs-time">{{ displayTime(row.updateTime || row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="148" fixed="right" align="center" header-align="center">
            <template #default="{ row }">
              <div class="mchs-actions">
                <button type="button" class="mchs-link" @click="openProviderEdit(row)">编辑</button>
                <button type="button" class="mchs-link danger" @click="openProviderDelete(row)">删除</button>
              </div>
            </template>
          </el-table-column>

          <template #empty>
            <div class="mchs-empty">
              <el-icon><Van /></el-icon>
              <b>没有匹配的物流公司</b>
              <span>调整物流公司名称或常用状态后重新查询</span>
            </div>
          </template>
        </el-table>

        <MallPagination
          :total="filteredProviders.length"
          :page="providerPage.current"
          :limit="providerPage.size"
          variant="admin"
          @pagination="handleProviderPagination"
        />
      </section>
    </template>

    <div v-else class="mchs-delivery-layout">
      <div v-loading="infoLoading" class="mchs-delivery-card">
        <div class="mchs-section-title">
          <span class="shelf-mark" />
          <div>
            <b>发货信息</b>
            <small>用于订单发货时自动填充发货人与地址，仅作用于当前登录店铺</small>
          </div>
          <span class="status-ticket" :class="`tone-${infoComplete ? 'success' : 'warning'}`">
            {{ infoComplete ? '已完善' : '待完善' }}
          </span>
        </div>
        <div class="mchs-delivery-form">
          <label class="mchs-field">
            <span>发货人姓名 <em>*</em></span>
            <input v-model="infoForm.name" maxlength="16" placeholder="请输入发货人姓名" />
          </label>
          <label class="mchs-field">
            <span>联系电话 <em>*</em></span>
            <input v-model="infoForm.contact" maxlength="16" placeholder="手机号或固话" />
          </label>
          <label class="mchs-field">
            <span>省份 <em>*</em></span>
            <select :value="infoForm.provinceCode" @change="changeProvince(($event.target as HTMLSelectElement).value)">
              <option value="">请选择省份</option>
              <option v-for="province in provinces" :key="province.code" :value="province.code">{{ province.name }}</option>
            </select>
          </label>
          <label class="mchs-field">
            <span>城市 <em>*</em></span>
            <select
              :value="infoForm.cityCode"
              :disabled="!infoForm.provinceCode"
              @change="changeCity(($event.target as HTMLSelectElement).value)"
            >
              <option value="">请选择城市</option>
              <option v-for="city in cities" :key="city.code" :value="city.code">{{ city.name }}</option>
            </select>
          </label>
          <label class="mchs-field">
            <span>区 / 县 <em>*</em></span>
            <select
              :value="infoForm.districtCode"
              :disabled="!infoForm.cityCode"
              @change="changeDistrict(($event.target as HTMLSelectElement).value)"
            >
              <option value="">请选择区/县</option>
              <option v-for="district in districts" :key="district.code" :value="district.code">{{ district.name }}</option>
            </select>
          </label>
          <label class="mchs-field wide">
            <span>详细地址 <em>*</em></span>
            <input v-model="infoForm.detailAddress" maxlength="255" placeholder="街道、门牌号、仓库名称等" />
          </label>
          <label class="mchs-field">
            <span>邮政编码</span>
            <input
              :value="infoForm.postalCode"
              maxlength="6"
              placeholder="选填，6 位数字"
              @input="updatePostalCode(($event.target as HTMLInputElement).value)"
            />
          </label>
          <div class="mchs-delivery-preview">
            <span>发货地址预览</span>
            <b>{{ fullAddress || '完成省市区和详细地址后自动生成' }}</b>
          </div>
        </div>
        <div class="mchs-settings-savebar">
          <span>修改后仅影响后续发货单</span>
          <div>
            <button type="button" @click="resetInfoForm">重置</button>
            <button type="button" class="primary" :disabled="savingInfo" @click="saveInfoForm">保存发货信息</button>
          </div>
        </div>
      </div>

      <aside class="mchs-delivery-side">
        <div class="mchs-side-card">
          <h3><el-icon :size="16"><Van /></el-icon>填写说明</h3>
          <ul>
            <li>发货信息用于订单发货、电子面单和退货地址的自动填充。</li>
            <li>修改后仅影响新发货的订单，已发货订单不会变更。</li>
            <li>省市区需与详细地址保持一致，邮编为选填项。</li>
          </ul>
        </div>
        <div class="mchs-side-card">
          <h3><el-icon :size="16"><Shop /></el-icon>物流配置</h3>
          <div class="mchs-side-metric">
            <span>默认物流公司</span>
            <b>{{ defaultProvider?.name || '未设置' }}</b>
          </div>
          <div class="mchs-side-metric">
            <span>常用物流公司</span>
            <b>{{ popularCount }} 家</b>
          </div>
          <button type="button" class="mchs-side-link" @click="goTab('providers')">
            去管理物流公司<el-icon :size="14"><ArrowRight /></el-icon>
          </button>
        </div>
      </aside>
    </div>

    <el-dialog
      v-model="providerDialogVisible"
      class="mchs-dialog mchs-provider-dialog"
      width="520px"
      :show-close="false"
      :with-header="false"
      append-to-body
      destroy-on-close
    >
      <div class="mchs-dialog-head">
        <div>
          <span class="mchs-dialog-kicker">{{ providerForm.id ? 'EDIT' : 'CREATE' }}</span>
          <h2>{{ providerForm.id ? '编辑物流公司' : '新增物流公司' }}</h2>
        </div>
        <button type="button" class="mchs-dialog-close" aria-label="关闭" @click="providerDialogVisible = false">×</button>
      </div>
      <div class="mchs-provider-form">
        <label class="mchs-field">
          <span>物流公司名称 <em>*</em></span>
          <input v-model="providerForm.name" maxlength="64" placeholder="例如：顺丰速运" />
        </label>
        <label class="mchs-field">
          <span>物流公司编码 <em>*</em></span>
          <input
            :value="providerForm.code"
            maxlength="32"
            placeholder="例如：SF"
            @input="updateProviderCode(($event.target as HTMLInputElement).value)"
          />
          <small>编码用于发货接口识别，保存后建议不要修改。</small>
        </label>
        <label class="mchs-field wide">
          <span>备注</span>
          <textarea v-model="providerForm.remark" rows="3" maxlength="255" placeholder="选填，例如适用线路、时效说明" />
        </label>
        <label class="mchs-field">
          <span>是否常用</span>
          <button
            type="button"
            class="mchs-state-toggle is-boxed"
            :class="{ 'is-on': providerForm.isPopular }"
            :aria-pressed="providerForm.isPopular"
            @click="providerForm.isPopular = !providerForm.isPopular"
          >
            <i />
            <span>{{ providerForm.isPopular ? '常用' : '普通' }}</span>
          </button>
          <small>常用公司会优先展示在发货选择列表。</small>
        </label>
      </div>
      <p class="mchs-dialog-tip">默认物流公司在物流公司列表的“设为默认”中维护，每个店铺只能有一个默认公司。</p>
      <div class="mchs-dialog-actions">
        <button type="button" @click="providerDialogVisible = false">取消</button>
        <button type="button" class="primary" :disabled="providerSubmitting" @click="saveProvider">保存物流公司</button>
      </div>
    </el-dialog>

    <el-dialog
      v-model="deleteDialogVisible"
      class="mchs-dialog mchs-confirm-dialog"
      width="500px"
      :show-close="false"
      :with-header="false"
      append-to-body
      destroy-on-close
    >
      <div class="mchs-dialog-head">
        <div>
          <span class="mchs-dialog-kicker danger-kicker">DELETE</span>
          <h2>删除物流公司</h2>
        </div>
        <button type="button" class="mchs-dialog-close" aria-label="关闭" @click="deleteDialogVisible = false">×</button>
      </div>
      <div class="mchs-danger-confirm">
        <el-icon :size="22"><Van /></el-icon>
        <div>
          <b>确定删除“{{ deleteTarget?.name }}”吗？</b>
          <span>编码 {{ deleteTarget?.code }}{{ deleteTarget?.isDefault ? ' · 默认物流公司' : '' }}</span>
          <small v-if="deleteTarget?.isDefault">默认物流公司不可直接删除，请先在列表中切换默认物流公司。</small>
          <small v-else>删除后发货时将无法再选择该物流公司，已发货订单不受影响。</small>
        </div>
      </div>
      <div class="mchs-dialog-actions">
        <button type="button" @click="deleteDialogVisible = false">取消</button>
        <button type="button" class="danger-solid" :disabled="deleteSubmitting" @click="confirmProviderDelete">确认删除</button>
      </div>
    </el-dialog>

    <el-dialog
      v-model="syncDialogVisible"
      class="mchs-dialog mchs-confirm-dialog"
      width="500px"
      :show-close="false"
      :with-header="false"
      append-to-body
      destroy-on-close
    >
      <div class="mchs-dialog-head">
        <div>
          <span class="mchs-dialog-kicker">SYNC</span>
          <h2>同步快递公司</h2>
        </div>
        <button type="button" class="mchs-dialog-close" aria-label="关闭" @click="syncDialogVisible = false">×</button>
      </div>
      <div class="mchs-sync-body">
        <el-icon :size="22"><Refresh /></el-icon>
        <div>
          <b>从快递服务平台同步最新公司信息</b>
          <span>同步会更新公司名称、编码等基础信息，不会删除自定义备注、常用和默认设置。</span>
        </div>
      </div>
      <div class="mchs-dialog-actions">
        <button type="button" @click="syncDialogVisible = false">取消</button>
        <button type="button" class="primary" :disabled="syncing" @click="confirmSync">开始同步</button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, Refresh, Search, Shop, Star, Van } from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import {
  createDeliveryProvider,
  deleteDeliveryProvider,
  getAreaTree,
  getShippingInfo,
  queryDeliveryProviderList,
  saveShippingInfo,
  setDefaultDeliveryProvider,
  setPopularDeliveryProvider,
  syncExpCompany,
  updateDeliveryProvider,
} from '@/api/mall/shipping'
import { buildConditions } from '@/utils/query'
import { getCurrentShop } from '@/utils/shop'
import '@/assets/yeah-mall-shop.css'

defineOptions({ name: 'MerchantShippingPage' })

type TabValue = 'providers' | 'info'

interface AreaNode {
  code: string
  name: string
  children?: AreaNode[]
}

interface ProviderRow {
  id: string
  name: string
  code: string
  remark?: string
  isPopular?: boolean
  isDefault?: boolean
  createTime?: string
  updateTime?: string
}

interface DeliveryInfo {
  name: string
  contact: string
  provinceCode: string
  provinceName: string
  cityCode: string
  cityName: string
  districtCode: string
  districtName: string
  detailAddress: string
  postalCode: string
}

const TABS: { label: string; value: TabValue }[] = [
  { label: '物流公司', value: 'providers' },
  { label: '发货信息', value: 'info' },
]

const route = useRoute()
const router = useRouter()
const activeTab = ref<TabValue>(String(route.query.tab || '') === '发货信息' ? 'info' : 'providers')

const providers = ref<ProviderRow[]>([])
const providersLoading = ref(false)
const providerDraft = reactive({ keyword: '', popular: 'all' })
const providerQuery = reactive({ keyword: '', popular: 'all' })
const providerPage = reactive({ current: 1, size: 10 })
const popularLoadingId = ref('')
const defaultLoadingId = ref('')

const providerDialogVisible = ref(false)
const providerSubmitting = ref(false)
const providerForm = reactive({
  id: '',
  name: '',
  code: '',
  remark: '',
  isPopular: false,
})

const deleteDialogVisible = ref(false)
const deleteSubmitting = ref(false)
const deleteTarget = ref<ProviderRow | null>(null)

const syncDialogVisible = ref(false)
const syncing = ref(false)

const areaTree = ref<AreaNode[]>([])
const infoLoading = ref(false)
const savingInfo = ref(false)
const infoForm = reactive<DeliveryInfo>(emptyInfo())
const savedInfo = ref<DeliveryInfo>(emptyInfo())

const defaultProvider = computed(() => providers.value.find((item) => item.isDefault))
const popularCount = computed(() => providers.value.filter((item) => item.isPopular).length)
const filteredProviders = computed(() => {
  const keyword = providerQuery.keyword.trim()
  return providers.value
    .filter((item) => {
      const keywordMatch = !keyword || `${item.name}${item.code}${item.remark || ''}`.includes(keyword)
      const popularMatch =
        providerQuery.popular === 'all' ||
        (providerQuery.popular === 'popular' ? !!item.isPopular : !item.isPopular)
      return keywordMatch && popularMatch
    })
    .sort(
      (a, b) =>
        Number(!!b.isDefault) - Number(!!a.isDefault) ||
        Number(!!b.isPopular) - Number(!!a.isPopular) ||
        String(a.code).localeCompare(String(b.code)),
    )
})
const pagedProviders = computed(() => {
  const start = (providerPage.current - 1) * providerPage.size
  return filteredProviders.value.slice(start, start + providerPage.size)
})

const provinces = computed(() => areaTree.value)
const cities = computed(
  () => areaTree.value.find((item) => item.code === infoForm.provinceCode)?.children || [],
)
const districts = computed(
  () => cities.value.find((item) => item.code === infoForm.cityCode)?.children || [],
)
const infoComplete = computed(() =>
  ['name', 'contact', 'provinceCode', 'cityCode', 'districtCode', 'detailAddress'].every((key) =>
    String(infoForm[key as keyof DeliveryInfo] || '').trim(),
  ),
)
const fullAddress = computed(() =>
  `${infoForm.provinceName || ''}${infoForm.cityName || ''}${infoForm.districtName || ''}${infoForm.detailAddress || ''}`.trim(),
)

function emptyInfo(): DeliveryInfo {
  return {
    name: '',
    contact: '',
    provinceCode: '',
    provinceName: '',
    cityCode: '',
    cityName: '',
    districtCode: '',
    districtName: '',
    detailAddress: '',
    postalCode: '',
  }
}

function goTab(tab: TabValue) {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab: tab === 'info' ? '发货信息' : '物流公司' } })
}

function displayTime(value?: string) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '—'
}

async function loadProviders() {
  const shopId = getCurrentShop()?.id
  if (!shopId) {
    providers.value = []
    return
  }
  providersLoading.value = true
  try {
    const response = await queryDeliveryProviderList({
      current: 1,
      size: 200,
      conditions_: buildConditions([
        { field: 'isDefault', operator: 'sort', value: 'desc' },
        { field: 'isPopular', operator: 'sort', value: 'desc' },
        { field: 'code', operator: 'sort', value: 'asc' },
      ]),
    })
    providers.value = response.data?.records || []
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    providersLoading.value = false
  }
}

async function loadAreas() {
  try {
    const response = await getAreaTree(3)
    areaTree.value = response.data || []
  } catch {
    // 请求错误已由全局拦截器提示
  }
}

async function loadInfo() {
  const shopId = getCurrentShop()?.id
  if (!shopId) return
  infoLoading.value = true
  try {
    const response = await getShippingInfo()
    const data = response.data || {}
    const next: DeliveryInfo = {
      name: data.name || '',
      contact: data.contact || '',
      provinceCode: data.provinceCode || '',
      provinceName: data.provinceName || '',
      cityCode: data.cityCode || '',
      cityName: data.cityName || '',
      districtCode: data.districtCode || '',
      districtName: data.districtName || '',
      detailAddress: data.detailAddress || '',
      postalCode: data.postalCode || '',
    }
    Object.assign(infoForm, next)
    savedInfo.value = { ...next }
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    infoLoading.value = false
  }
}

function handleProviderSearch() {
  providerQuery.keyword = providerDraft.keyword
  providerQuery.popular = providerDraft.popular
  providerPage.current = 1
}

function resetProviderQuery() {
  providerDraft.keyword = ''
  providerDraft.popular = 'all'
  providerQuery.keyword = ''
  providerQuery.popular = 'all'
  providerPage.current = 1
}

function handleProviderPagination(payload: { page: number; limit: number }) {
  providerPage.current = payload.page
  providerPage.size = payload.limit
}

function openProviderCreate() {
  providerForm.id = ''
  providerForm.name = ''
  providerForm.code = ''
  providerForm.remark = ''
  providerForm.isPopular = false
  providerDialogVisible.value = true
}

function openProviderEdit(row: ProviderRow) {
  providerForm.id = row.id
  providerForm.name = row.name
  providerForm.code = row.code
  providerForm.remark = row.remark || ''
  providerForm.isPopular = !!row.isPopular
  providerDialogVisible.value = true
}

function updateProviderCode(value: string) {
  providerForm.code = value.toUpperCase()
}

async function saveProvider() {
  const name = providerForm.name.trim()
  const code = providerForm.code.trim().toUpperCase()
  if (!name) {
    ElMessage.warning('请输入物流公司名称')
    return
  }
  if (!code) {
    ElMessage.warning('请输入物流公司编码')
    return
  }
  if (providers.value.some((item) => item.code === code && item.id !== providerForm.id)) {
    ElMessage.warning(`编码 ${code} 已被其他物流公司使用`)
    return
  }
  providerSubmitting.value = true
  try {
    const payload = {
      name,
      code,
      remark: providerForm.remark.trim(),
      isPopular: providerForm.isPopular,
    }
    if (providerForm.id) {
      await updateDeliveryProvider({ id: providerForm.id, ...payload })
      ElMessage.success('物流公司已更新')
    } else {
      await createDeliveryProvider(payload)
      ElMessage.success('物流公司已新增')
    }
    providerDialogVisible.value = false
    await loadProviders()
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    providerSubmitting.value = false
  }
}

async function togglePopular(row: ProviderRow) {
  const next = !row.isPopular
  popularLoadingId.value = row.id
  try {
    await setPopularDeliveryProvider(row.id, next)
    await loadProviders()
    ElMessage.success(next ? '已设为常用物流公司' : '已取消常用')
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    popularLoadingId.value = ''
  }
}

async function setDefaultProvider(row: ProviderRow) {
  defaultLoadingId.value = row.id
  try {
    await setDefaultDeliveryProvider(row.id, true)
    await loadProviders()
    ElMessage.success('已设为默认物流公司')
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    defaultLoadingId.value = ''
  }
}

function openProviderDelete(row: ProviderRow) {
  deleteTarget.value = row
  deleteDialogVisible.value = true
}

async function confirmProviderDelete() {
  const target = deleteTarget.value
  if (!target) return
  if (target.isDefault) {
    ElMessage.warning('默认物流公司不可删除，请先切换默认物流公司')
    return
  }
  deleteSubmitting.value = true
  try {
    await deleteDeliveryProvider(target.id)
    deleteDialogVisible.value = false
    ElMessage.success('物流公司已删除')
    await loadProviders()
    const lastPage = Math.max(1, Math.ceil(filteredProviders.value.length / providerPage.size))
    providerPage.current = Math.min(providerPage.current, lastPage)
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    deleteSubmitting.value = false
  }
}

async function confirmSync() {
  syncing.value = true
  try {
    await syncExpCompany()
    syncDialogVisible.value = false
    await loadProviders()
    ElMessage.success(`已同步 ${providers.value.length} 家快递公司`)
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    syncing.value = false
  }
}

function changeProvince(code: string) {
  const province = provinces.value.find((item) => item.code === code)
  infoForm.provinceCode = code
  infoForm.provinceName = province?.name || ''
  infoForm.cityCode = ''
  infoForm.cityName = ''
  infoForm.districtCode = ''
  infoForm.districtName = ''
}

function changeCity(code: string) {
  const city = cities.value.find((item) => item.code === code)
  infoForm.cityCode = code
  infoForm.cityName = city?.name || ''
  infoForm.districtCode = ''
  infoForm.districtName = ''
}

function changeDistrict(code: string) {
  const district = districts.value.find((item) => item.code === code)
  infoForm.districtCode = code
  infoForm.districtName = district?.name || ''
}

function updatePostalCode(value: string) {
  infoForm.postalCode = value.replace(/\D/g, '').slice(0, 6)
}

function resetInfoForm() {
  Object.assign(infoForm, savedInfo.value)
}

async function saveInfoForm() {
  const required: [keyof DeliveryInfo, string][] = [
    ['name', '发货人姓名'],
    ['contact', '联系电话'],
    ['provinceCode', '省份'],
    ['cityCode', '城市'],
    ['districtCode', '区/县'],
    ['detailAddress', '详细地址'],
  ]
  const missing = required.find(([key]) => !String(infoForm[key] || '').trim())
  if (missing) {
    ElMessage.warning(`请填写${missing[1]}`)
    return
  }
  if (infoForm.postalCode && !/^\d{6}$/.test(infoForm.postalCode)) {
    ElMessage.warning('邮政编码需为 6 位数字')
    return
  }
  savingInfo.value = true
  try {
    await saveShippingInfo({ ...infoForm })
    savedInfo.value = { ...infoForm }
    ElMessage.success('发货信息已保存')
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    savingInfo.value = false
  }
}

onMounted(() => {
  loadAreas()
  loadProviders()
  loadInfo()
})
</script>