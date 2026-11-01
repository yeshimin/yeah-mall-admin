<template>
  <div class="channel-manager">
    <div class="toolbar">
      <el-button type="primary" @click="openCreateMaster('1')">新增平台普通商户通道</el-button>
      <el-button @click="openCreateMaster('2')">新增服务商主通道</el-button>
      <el-button @click="openCreatePartnerRoute">新增子商户路由</el-button>
    </div>

    <el-table v-loading="loading" :data="records" stripe>
      <el-table-column prop="channelName" label="通道名称" min-width="170" />
      <el-table-column prop="shopName" label="适用范围" min-width="150" />
      <el-table-column label="收款模式" width="170">
        <template #default="{ row }">{{ modeText(row.collectionMode) }}</template>
      </el-table-column>
      <el-table-column prop="appTarget" label="App目标" min-width="130" />
      <el-table-column prop="appId" label="AppID" min-width="170" show-overflow-tooltip />
      <el-table-column prop="mchId" label="商户号" min-width="140" />
      <el-table-column prop="subMchId" label="子商户号" min-width="140" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><el-tag :type="row.isEnabled ? 'success' : 'info'">{{ row.isEnabled ? '启用' : '停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }"><el-button link type="primary" @click="openEdit(row)">编辑</el-button></template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑支付通道' : '新增支付通道'" width="860px" destroy-on-close>
      <el-form label-position="top">
        <div class="form-grid">
          <el-form-item label="通道名称" required><el-input v-model="form.channelName" /></el-form-item>
          <el-form-item label="收款模式" required>
            <el-select v-model="form.collectionMode" :disabled="Boolean(form.id)" style="width:100%">
              <el-option label="平台普通商户直收" value="1" />
              <el-option label="服务商代子商户收款" value="2" />
              <el-option label="独立店铺普通商户直收" value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="适用店铺" required>
            <el-select v-model="form.shopId" :disabled="Boolean(form.id)" style="width:100%" @change="handleShopChange">
              <el-option label="平台主通道" value="0" />
              <el-option v-for="shop in shops" :key="shop.id" :label="shop.shopName" :value="String(shop.id)" />
            </el-select>
          </el-form-item>
          <el-form-item label="App目标" required><el-input v-model="form.appTarget" /></el-form-item>
          <el-form-item v-if="isPartnerRoute" label="服务商主通道" required>
            <el-select v-model="form.parentId" style="width:100%">
              <el-option v-for="item in partnerMasters" :key="item.id" :label="item.channelName" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="启用通道"><el-switch v-model="form.isEnabled" /></el-form-item>
        </div>

        <template v-if="isPartnerRoute">
          <el-divider content-position="left">子商户配置</el-divider>
          <div class="form-grid">
            <el-form-item label="子商户号" required><el-input v-model="form.subMchId" /></el-form-item>
            <el-form-item label="子商户应用AppID"><el-input v-model="form.subAppId" placeholder="留空时使用服务商AppID" /></el-form-item>
            <el-form-item v-if="form.subAppId" label="子商户应用AppSecret">
              <el-input v-model="form.subAppSecret" show-password :placeholder="secretPlaceholder(editing?.hasSubAppSecret)" />
            </el-form-item>
          </div>
        </template>

        <template v-if="showsCredential">
          <el-divider content-position="left">微信支付凭据</el-divider>
          <div class="form-grid">
            <el-form-item label="应用AppID" required><el-input v-model="form.appId" /></el-form-item>
            <el-form-item label="应用AppSecret" required><el-input v-model="form.appSecret" show-password :placeholder="secretPlaceholder(editing?.hasAppSecret)" /></el-form-item>
            <el-form-item label="商户号" required><el-input v-model="form.mchId" /></el-form-item>
            <el-form-item label="商户API证书序列号" required><el-input v-model="form.certificateSerialNo" /></el-form-item>
            <el-form-item label="微信支付公钥ID" required><el-input v-model="form.wechatPayPublicKeyId" /></el-form-item>
            <el-form-item label="APIv3密钥" required><el-input v-model="form.apiV3Key" show-password :placeholder="secretPlaceholder(editing?.hasApiV3Key)" /></el-form-item>
          </div>
          <el-form-item label="商户API私钥" required><el-input v-model="form.privateKeyRaw" type="textarea" :rows="4" :placeholder="secretPlaceholder(editing?.hasPrivateKey)" /></el-form-item>
          <el-form-item label="微信支付公钥" required><el-input v-model="form.wechatPayPublicKeyRaw" type="textarea" :rows="4" :placeholder="secretPlaceholder(editing?.hasWechatPayPublicKey)" /></el-form-item>
          <div class="form-grid">
            <el-form-item label="支付回调地址" required><el-input v-model="form.payNotifyUrl" /></el-form-item>
            <el-form-item label="退款回调地址" required><el-input v-model="form.refundNotifyUrl" /></el-form-item>
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
const partnerMasters = computed(() => records.value.filter(item => item.shopId === '0' && item.collectionMode === '2'))
const isPartnerRoute = computed(() => form.collectionMode === '2' && form.shopId !== '0')
const showsCredential = computed(() => form.shopId === '0' || form.collectionMode === '3')

function emptyForm(): PaymentChannelSaveData {
  return { channelName: '', shopId: '0', appTarget: 'platform', collectionMode: '1', isEnabled: true }
}

function modeText(mode: string) {
  return ({ '1': '平台普通商户直收', '2': '服务商代子商户收款', '3': '独立店铺直收' } as Record<string, string>)[mode] || mode
}

function secretPlaceholder(configured?: boolean) {
  return configured ? '已配置，留空表示保持不变' : '请输入完整配置'
}

async function load() {
  loading.value = true
  try {
    const [channelResponse, shopResponse] = await Promise.all([
      queryPlatformPaymentChannels(),
      queryShops({ current: 1, size: 500 }),
    ])
    records.value = channelResponse.data || []
    shops.value = (shopResponse.data?.records || []).map(item => ({
      id: String(item.id), shopNo: item.shopNo || '', shopName: item.shopName,
    }))
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载支付通道失败')
  } finally {
    loading.value = false
  }
}

function openCreateMaster(mode: string) {
  editing.value = undefined
  Object.assign(form, emptyForm(), { collectionMode: mode, shopId: '0', appTarget: 'platform' })
  dialogVisible.value = true
}

function openCreatePartnerRoute() {
  editing.value = undefined
  Object.assign(form, emptyForm(), {
    collectionMode: '2', shopId: shops.value[0]?.id || '', appTarget: 'platform',
    parentId: partnerMasters.value[0]?.id,
  })
  dialogVisible.value = true
}

function openEdit(row: PaymentChannelRecord) {
  editing.value = row
  Object.assign(form, emptyForm(), row, {
    shopId: String(row.shopId), appSecret: '', subAppSecret: '', privateKeyRaw: '',
    wechatPayPublicKeyRaw: '', apiV3Key: '',
  })
  dialogVisible.value = true
}

function handleShopChange(shopId: string) {
  if (shopId === '0') {
    form.appTarget = 'platform'
    return
  }
  if (form.collectionMode === '3') {
    form.appTarget = shops.value.find(item => item.id === shopId)?.shopNo || ''
  }
}

async function save() {
  if (!form.channelName.trim() || !form.shopId || !form.appTarget.trim()) {
    ElMessage.warning('请完整填写通道基础信息')
    return
  }
  saving.value = true
  try {
    await savePlatformPaymentChannel({ ...form })
    ElMessage.success('支付通道已保存')
    dialogVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '保存支付通道失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => void load())
</script>

<style scoped>
.channel-manager { height: 100%; display: flex; flex-direction: column; gap: 14px; }
.toolbar { display: flex; gap: 10px; flex-wrap: wrap; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }
@media (max-width: 760px) { .form-grid { grid-template-columns: 1fr; } }
</style>
