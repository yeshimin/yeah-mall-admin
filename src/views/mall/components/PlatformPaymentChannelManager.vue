<template>
  <div class="settlement-page mall-page">
    <div class="settlement-channel-actions">
      <el-button type="primary" @click="openCreateMaster('1')">新增平台普通商户通道</el-button>
      <el-button @click="openCreateMaster('2')">新增服务商主通道</el-button>
      <el-button @click="openCreateRoute('1')">新增普通商户路由</el-button>
      <el-button @click="openCreateRoute('2')">新增子商户路由</el-button>
    </div>
    <div class="settlement-batch-guide">
      <el-icon><Warning /></el-icon>
      <span>同一店铺在同一 App 目标下仅可启用一个通道；停用平台主通道时，其下店铺路由会同步停用。</span>
    </div>

    <section class="mall-table-panel">
      <el-table class="settlement-channel-table" data-ym-table="r3" v-loading="loading" :data="pagedRecords" height="100%">
        <el-table-column label="通道名称" min-width="150">
          <template #default="{ row }">
            <CopyableText :value="row.channelName" label="通道名称" />
          </template>
        </el-table-column>
        <el-table-column label="适用范围" min-width="118">
          <template #default="{ row }">{{ scopeText(row) }}</template>
        </el-table-column>
        <el-table-column label="收款模式" min-width="176">
          <template #default="{ row }">
            <span class="settlement-cell-stack">
              <span>{{ modeText(row.collectionMode) }}</span>
              <small v-if="parentOf(row)" class="settlement-cell-sub">继承：{{ parentOf(row)?.channelName }}</small>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="App 目标" min-width="88">
          <template #default="{ row }">
            <CopyableText :value="row.appTarget" label="App目标" />
          </template>
        </el-table-column>
        <el-table-column label="AppID" min-width="152">
          <template #default="{ row }">
            <span class="settlement-mono">
              <CopyableText :value="row.appId || parentOf(row)?.appId || '-'" label="AppID" />
            </span>
          </template>
        </el-table-column>
        <el-table-column label="商户号" min-width="110">
          <template #default="{ row }">
            <span class="settlement-mono">{{ row.mchId || parentOf(row)?.mchId || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="子商户号" min-width="112">
          <template #default="{ row }">
            <span class="settlement-mono">{{ row.subMchId || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="70">
          <template #default="{ row }">
            <el-tag class="settlement-status-tag" :type="row.isEnabled ? 'success' : 'info'" effect="light">
              {{ row.isEnabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="96" fixed="right">
          <template #default="{ row }">
            <span class="table-row-actions">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="primary" @click="toggleChannel(row)">
                {{ row.isEnabled ? '停用' : '启用' }}
              </el-button>
            </span>
          </template>
        </el-table-column>
        <template #empty>
          <div class="settlement-empty">
            <el-icon><Money /></el-icon>
            <b>还没有支付通道</b>
            <span>先创建平台主通道，再为店铺配置路由</span>
          </div>
        </template>
      </el-table>
      <MallPagination
        variant="admin"
        :total="records.length"
        :page="page.current"
        :limit="page.size"
        @pagination="changePage"
      />
    </section>

    <el-dialog
      v-model="dialogVisible"
      width="760px"
      class="channel-dialog"
      @closed="resetDialog"
    >
      <template #header>
        <div class="settlement-dialog-head">
          <span>PAYMENT CHANNEL</span>
          <h2>{{ form.id ? '编辑支付通道' : '新增支付通道' }}</h2>
        </div>
      </template>
      <el-form label-position="top" require-asterisk-position="right">
        <div class="settlement-form-grid">
          <el-form-item label="通道名称" required>
            <el-input v-model="form.channelName" maxlength="64" placeholder="请输入通道名称" />
          </el-form-item>
          <el-form-item label="收款模式" required>
            <el-select v-model="form.collectionMode" :disabled="Boolean(form.id)" @change="handleModeChange">
              <el-option label="平台普通商户直收" value="1" />
              <el-option label="服务商代子商户收款" value="2" />
              <el-option label="独立店铺普通商户直收" value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="适用店铺" required>
            <el-select v-model="form.shopId" :disabled="Boolean(form.id)" @change="handleShopChange">
              <el-option label="平台主通道" value="0" />
              <el-option
                v-for="shop in shops"
                :key="shop.id"
                :label="shop.shopName"
                :value="String(shop.id)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="App 目标" required>
            <el-input
              v-model="form.appTarget"
              :disabled="isPlatformMaster || form.collectionMode === '3'"
              :placeholder="isPlatformMaster || form.collectionMode === '3' ? 'platform' : 'platform 或当前店铺编号'"
            />
          </el-form-item>
          <el-form-item v-if="isShopRoute" :label="form.collectionMode === '2' ? '服务商主通道' : '普通商户主通道'" required>
            <el-select v-model="form.parentId">
              <el-option
                v-for="item in parentOptions"
                :key="item.id"
                :label="item.channelName"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="启用通道">
            <el-switch v-model="form.isEnabled" />
          </el-form-item>
        </div>

        <template v-if="isShopRoute">
          <div class="settlement-form-section-title">路由说明</div>
          <div class="settlement-route-note">
            <el-icon><Connection /></el-icon>
            <span>
              {{ form.collectionMode === '2'
                ? '服务商路由只保存子商户信息，签名与回调凭据继承服务商主通道。'
                : '普通商户路由仅绑定适用店铺，支付凭据继承平台普通商户主通道。' }}
            </span>
          </div>
        </template>

        <template v-if="isPartnerRoute">
          <div class="settlement-form-section-title">子商户配置</div>
          <div class="settlement-form-grid">
            <el-form-item label="子商户号" required>
              <el-input v-model="form.subMchId" placeholder="请输入子商户号" />
            </el-form-item>
            <template v-if="form.appTarget !== 'platform'">
              <el-form-item label="子商户应用 AppID" required>
                <el-input v-model="form.subAppId" placeholder="请输入子商户应用 AppID" />
              </el-form-item>
              <el-form-item label="子商户应用 AppSecret" required>
                <el-input
                  v-model="form.subAppSecret"
                  show-password
                  :placeholder="secretPlaceholder(editing?.hasSubAppSecret, '请输入子商户应用 AppSecret')"
                />
              </el-form-item>
            </template>
          </div>
        </template>

        <template v-if="showsCredential">
          <div class="settlement-form-section-title">微信支付凭据</div>
          <div class="settlement-form-grid">
            <el-form-item label="应用 AppID" required>
              <el-input v-model="form.appId" placeholder="请输入应用 AppID" />
            </el-form-item>
            <el-form-item label="应用 AppSecret" required>
              <el-input
                v-model="form.appSecret"
                show-password
                :placeholder="secretPlaceholder(editing?.hasAppSecret, '请输入应用 AppSecret')"
              />
            </el-form-item>
            <el-form-item label="商户号" required>
              <el-input v-model="form.mchId" placeholder="请输入商户号" />
            </el-form-item>
            <el-form-item label="商户 API 证书序列号" required>
              <el-input v-model="form.certificateSerialNo" placeholder="请输入证书序列号" />
            </el-form-item>
            <el-form-item label="微信支付公钥 ID" required>
              <el-input v-model="form.wechatPayPublicKeyId" placeholder="请输入公钥 ID" />
            </el-form-item>
            <el-form-item label="APIv3 密钥" required>
              <el-input
                v-model="form.apiV3Key"
                show-password
                :placeholder="secretPlaceholder(editing?.hasApiV3Key, '请输入 APIv3 密钥')"
              />
            </el-form-item>
            <el-form-item class="wide" label="商户 API 私钥" required>
              <el-input
                v-model="form.privateKeyRaw"
                type="textarea"
                :rows="4"
                :placeholder="secretPlaceholder(editing?.hasPrivateKey, '请输入商户 API 私钥')"
              />
            </el-form-item>
            <el-form-item class="wide" label="微信支付公钥" required>
              <el-input
                v-model="form.wechatPayPublicKeyRaw"
                type="textarea"
                :rows="4"
                :placeholder="secretPlaceholder(editing?.hasWechatPayPublicKey, '请输入微信支付公钥')"
              />
            </el-form-item>
            <el-form-item label="支付回调地址" required>
              <el-input v-model="form.payNotifyUrl" placeholder="https://" />
            </el-form-item>
            <el-form-item label="退款回调地址" required>
              <el-input v-model="form.refundNotifyUrl" placeholder="https://" />
            </el-form-item>
          </div>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection, Money, Warning } from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import { queryShops } from '@/api/mall/platform'
import {
  queryPlatformPaymentChannels,
  savePlatformPaymentChannel,
  type PaymentChannelRecord,
  type PaymentChannelSaveData,
} from '@/api/mall/settlement'
import { getRequestErrorMessage } from '@/utils/error'

interface ShopOption { id: string; shopNo: string; shopName: string }

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const records = ref<PaymentChannelRecord[]>([])
const shops = ref<ShopOption[]>([])
const editing = ref<PaymentChannelRecord>()
const form = reactive<PaymentChannelSaveData>(emptyForm())
const page = reactive({ current: 1, size: 10 })

const directMasters = computed(() => records.value.filter((item) => item.shopId === '0' && item.collectionMode === '1'))
const partnerMasters = computed(() => records.value.filter((item) => item.shopId === '0' && item.collectionMode === '2'))
const isPlatformMaster = computed(() => form.shopId === '0')
const isShopRoute = computed(() => form.shopId !== '0' && form.collectionMode !== '3')
const isPartnerRoute = computed(() => form.collectionMode === '2' && form.shopId !== '0')
const showsCredential = computed(() => form.shopId === '0' || form.collectionMode === '3')
const parentOptions = computed(() => form.collectionMode === '2' ? partnerMasters.value : directMasters.value)
const pagedRecords = computed(() => {
  const start = (page.current - 1) * page.size
  return records.value.slice(start, start + page.size)
})

function emptyForm(): PaymentChannelSaveData {
  return {
    channelName: '', shopId: '0', appTarget: 'platform', collectionMode: '1', parentId: '',
    appId: '', appSecret: '', mchId: '', subAppId: '', subAppSecret: '', subMchId: '',
    certificateSerialNo: '', privateKeyRaw: '', wechatPayPublicKeyId: '', wechatPayPublicKeyRaw: '',
    apiV3Key: '', payNotifyUrl: '', refundNotifyUrl: '', isEnabled: true,
  }
}

function modeText(mode: string) {
  return ({
    '1': '平台普通商户直收',
    '2': '服务商代子商户收款',
    '3': '独立店铺普通商户直收',
  } as Record<string, string>)[mode] || mode
}

function scopeText(row: PaymentChannelRecord) {
  return row.shopId === '0' ? '平台主通道' : row.shopName || '未知店铺'
}

function parentOf(row: PaymentChannelRecord) {
  return row.parentId ? records.value.find((item) => item.id === row.parentId) : undefined
}

function secretPlaceholder(configured: boolean | undefined, fallback: string) {
  return configured ? '已配置，留空表示保持不变' : fallback
}

async function load() {
  loading.value = true
  try {
    const [channelResponse, shopResponse] = await Promise.all([
      queryPlatformPaymentChannels(),
      queryShops({ current: 1, size: 500 }),
    ])
    records.value = channelResponse.data || []
    shops.value = (shopResponse.data?.records || []).map((item) => ({
      id: String(item.id), shopNo: item.shopNo || '', shopName: item.shopName,
    }))
    const maxPage = Math.max(1, Math.ceil(records.value.length / page.size))
    if (page.current > maxPage) page.current = maxPage
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载支付通道失败')
  } finally {
    loading.value = false
  }
}

function changePage(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
}

function openCreateMaster(mode: string) {
  editing.value = undefined
  Object.assign(form, emptyForm(), { collectionMode: mode, shopId: '0', appTarget: 'platform' })
  dialogVisible.value = true
}

function openCreateRoute(mode: string) {
  const masters = mode === '2' ? partnerMasters.value : directMasters.value
  if (!masters.length) {
    ElMessage.warning(mode === '2' ? '请先创建并启用服务商主通道' : '请先创建并启用平台普通商户主通道')
    return
  }
  const shop = shops.value[0]
  if (!shop) {
    ElMessage.warning('暂无可配置的店铺')
    return
  }
  editing.value = undefined
  Object.assign(form, emptyForm(), {
    collectionMode: mode,
    shopId: shop.id,
    appTarget: 'platform',
    parentId: masters[0]?.id,
  })
  dialogVisible.value = true
}

function openEdit(row: PaymentChannelRecord) {
  editing.value = row
  Object.assign(form, emptyForm(), row, {
    shopId: String(row.shopId),
    parentId: row.parentId || '',
    appTarget: row.appTarget || 'platform',
    appSecret: '',
    subAppSecret: '',
    privateKeyRaw: '',
    wechatPayPublicKeyRaw: '',
    apiV3Key: '',
  })
  dialogVisible.value = true
}

function handleModeChange() {
  if (form.collectionMode === '3') {
    form.parentId = ''
    form.appTarget = shops.value.find((item) => item.id === form.shopId)?.shopNo || ''
    return
  }
  if (form.shopId === '0') {
    form.appTarget = 'platform'
    return
  }
  form.appTarget = 'platform'
  const masters = form.collectionMode === '2' ? partnerMasters.value : directMasters.value
  if (!masters.some((item) => item.id === form.parentId)) {
    form.parentId = masters[0]?.id || ''
  }
}

function handleShopChange(shopId: string) {
  if (shopId === '0') {
    form.parentId = ''
    form.appTarget = 'platform'
    return
  }
  if (form.collectionMode === '3') {
    form.appTarget = shops.value.find((item) => item.id === shopId)?.shopNo || ''
    return
  }
  form.appTarget = 'platform'
  const masters = form.collectionMode === '2' ? partnerMasters.value : directMasters.value
  if (!masters.some((item) => item.id === form.parentId)) {
    form.parentId = masters[0]?.id || ''
  }
}

function resetDialog() {
  editing.value = undefined
  Object.assign(form, emptyForm())
}

function validate() {
  if (!form.channelName.trim() || !form.shopId || !form.appTarget?.trim()) {
    return '请填写通道名称并选择适用范围'
  }
  if (isShopRoute.value && !form.parentId) {
    return '店铺路由必须关联对应的平台主通道'
  }
  if (isPartnerRoute.value) {
    if (!form.subMchId?.trim()) return '请输入子商户号'
    if (form.appTarget !== 'platform') {
      if (!form.subAppId?.trim()) return '独立App路由必须填写子商户应用 AppID'
      if (!form.subAppSecret?.trim() && !editing.value?.hasSubAppSecret) return '请输入子商户应用 AppSecret'
    }
  }
  if (showsCredential.value) {
    if (!form.appId?.trim() || !form.mchId?.trim() || !form.certificateSerialNo?.trim()
      || !form.wechatPayPublicKeyId?.trim() || !form.payNotifyUrl?.trim() || !form.refundNotifyUrl?.trim()) {
      return '请完整填写微信支付凭据与回调地址'
    }
    if (!form.appSecret?.trim() && !editing.value?.hasAppSecret) return '请输入应用 AppSecret'
    if (!form.apiV3Key?.trim() && !editing.value?.hasApiV3Key) return '请输入 APIv3 密钥'
    if (!form.privateKeyRaw?.trim() && !editing.value?.hasPrivateKey) return '请输入商户 API 私钥'
    if (!form.wechatPayPublicKeyRaw?.trim() && !editing.value?.hasWechatPayPublicKey) return '请输入微信支付公钥'
  }
  return ''
}

function buildPayload(): PaymentChannelSaveData {
  const credential = showsCredential.value
  const partnerRoute = isPartnerRoute.value
  return {
    ...form,
    id: form.id || undefined,
    parentId: isShopRoute.value ? form.parentId : undefined,
    appTarget: form.collectionMode === '3'
      ? shops.value.find((item) => item.id === form.shopId)?.shopNo || ''
      : form.appTarget?.trim(),
    appId: credential ? form.appId?.trim() : undefined,
    appSecret: credential ? form.appSecret : undefined,
    mchId: credential ? form.mchId?.trim() : undefined,
    certificateSerialNo: credential ? form.certificateSerialNo?.trim() : undefined,
    wechatPayPublicKeyId: credential ? form.wechatPayPublicKeyId?.trim() : undefined,
    privateKeyRaw: credential ? form.privateKeyRaw : undefined,
    wechatPayPublicKeyRaw: credential ? form.wechatPayPublicKeyRaw : undefined,
    apiV3Key: credential ? form.apiV3Key : undefined,
    payNotifyUrl: credential ? form.payNotifyUrl?.trim() : undefined,
    refundNotifyUrl: credential ? form.refundNotifyUrl?.trim() : undefined,
    subMchId: partnerRoute ? form.subMchId?.trim() : undefined,
    subAppId: partnerRoute && form.appTarget !== 'platform' ? form.subAppId?.trim() : undefined,
    subAppSecret: partnerRoute && form.appTarget !== 'platform' ? form.subAppSecret : undefined,
  }
}

async function save() {
  const message = validate()
  if (message) {
    ElMessage.warning(message)
    return
  }
  saving.value = true
  try {
    await savePlatformPaymentChannel(buildPayload())
    ElMessage.success('支付通道已保存')
    dialogVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '保存支付通道失败')
  } finally {
    saving.value = false
  }
}

async function toggleChannel(row: PaymentChannelRecord) {
  if (!row.isEnabled && row.parentId) {
    const parent = parentOf(row)
    if (parent && !parent.isEnabled) {
      ElMessage.warning('父通道已停用，请先启用父通道')
      return
    }
  }
  const payload: PaymentChannelSaveData = {
    ...emptyForm(),
    ...row,
    id: row.id,
    shopId: String(row.shopId),
    parentId: row.parentId || '',
    appTarget: row.appTarget,
    isEnabled: !row.isEnabled,
    appSecret: '',
    subAppSecret: '',
    privateKeyRaw: '',
    wechatPayPublicKeyRaw: '',
    apiV3Key: '',
  }
  try {
    await savePlatformPaymentChannel(payload)
    ElMessage.success(row.isEnabled ? '支付通道已停用，关联路由同步停用' : '支付通道已启用')
    await load()
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '切换支付通道状态失败')
  }
}

onMounted(() => void load())
</script>