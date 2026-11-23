<template>
  <div class="settlement-form-page mall-page">
    <section class="settlement-editor">
      <div class="settlement-editor-head">
        <div>
          <b>独立 App 支付通道</b>
          <span>配置当前店铺独立 App 的微信支付信息；平台多商户小程序不受影响</span>
        </div>
        <el-tag
          class="settlement-status-tag"
          :type="current ? (current.isEnabled ? 'success' : 'info') : 'info'"
          effect="light"
        >
          {{ current ? (current.isEnabled ? '已启用' : '已停用') : '未配置' }}
        </el-tag>
      </div>
      <div class="settlement-editor-body">
        <el-form label-position="top" require-asterisk-position="right">
          <div class="settlement-form-section-title">基础配置</div>
          <div class="settlement-form-grid">
            <el-form-item label="通道名称" required>
              <el-input v-model="form.channelName" maxlength="64" placeholder="请输入通道名称" />
            </el-form-item>
            <el-form-item label="小程序 AppID" required>
              <el-input v-model="form.appId" placeholder="请输入小程序 AppID" />
            </el-form-item>
            <el-form-item label="小程序 AppSecret" required>
              <el-input
                v-model="form.appSecret"
                show-password
                :placeholder="secretPlaceholder(current?.hasAppSecret, '请输入小程序 AppSecret')"
              />
            </el-form-item>
            <el-form-item label="微信支付商户号" required>
              <el-input v-model="form.mchId" placeholder="请输入微信支付商户号" />
            </el-form-item>
          </div>

          <div class="settlement-form-section-title">微信支付凭据</div>
          <div class="settlement-form-grid">
            <el-form-item label="商户 API 证书序列号" required>
              <el-input v-model="form.certificateSerialNo" placeholder="请输入商户 API 证书序列号" />
            </el-form-item>
            <el-form-item label="微信支付公钥 ID" required>
              <el-input v-model="form.wechatPayPublicKeyId" placeholder="请输入微信支付公钥 ID" />
            </el-form-item>
            <el-form-item label="APIv3 密钥" required>
              <el-input
                v-model="form.apiV3Key"
                show-password
                :placeholder="secretPlaceholder(current?.hasApiV3Key, '请输入 APIv3 密钥')"
              />
            </el-form-item>
            <el-form-item class="wide" label="商户 API 私钥" required>
              <el-input
                v-model="form.privateKeyRaw"
                type="textarea"
                :rows="4"
                :placeholder="secretPlaceholder(current?.hasPrivateKey, '请输入商户 API 私钥')"
              />
            </el-form-item>
            <el-form-item class="wide" label="微信支付公钥" required>
              <el-input
                v-model="form.wechatPayPublicKeyRaw"
                type="textarea"
                :rows="4"
                :placeholder="secretPlaceholder(current?.hasWechatPayPublicKey, '请输入微信支付公钥')"
              />
            </el-form-item>
          </div>

          <div class="settlement-form-section-title">回调地址</div>
          <div class="settlement-form-grid">
            <el-form-item label="支付回调地址" required>
              <el-input v-model="form.payNotifyUrl" placeholder="https://" />
            </el-form-item>
            <el-form-item label="退款回调地址" required>
              <el-input v-model="form.refundNotifyUrl" placeholder="https://" />
            </el-form-item>
          </div>

          <div class="settlement-switch-row">
            <span>
              <b>启用通道</b>
              <small>停用后独立 App 将无法发起微信支付</small>
            </span>
            <el-switch v-model="form.isEnabled" />
          </div>
        </el-form>
      </div>
      <div class="settlement-save-bar">
        <span>敏感凭据仅在保存时提交，页面不回显明文</span>
        <el-button type="primary" :loading="saving" @click="save">保存支付配置</el-button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getMerchantPaymentChannel,
  saveMerchantPaymentChannel,
  type PaymentChannelRecord,
  type PaymentChannelSaveData,
} from '@/api/mall/settlement'
import { getCurrentShop, SHOP_CONTEXT_CHANGED } from '@/utils/shop'
import { getRequestErrorMessage } from '@/utils/error'

const current = ref<PaymentChannelRecord>()
const saving = ref(false)
const form = reactive<PaymentChannelSaveData>(emptyForm())

function emptyForm(): PaymentChannelSaveData {
  return {
    channelName: '', shopId: '', appTarget: '', collectionMode: '3', appId: '', appSecret: '',
    mchId: '', certificateSerialNo: '', privateKeyRaw: '', wechatPayPublicKeyId: '',
    wechatPayPublicKeyRaw: '', apiV3Key: '', payNotifyUrl: '', refundNotifyUrl: '', isEnabled: true,
  }
}

function secretPlaceholder(configured: boolean | undefined, fallback: string) {
  return configured ? '已配置，留空表示保持不变' : fallback
}

async function load() {
  const shop = getCurrentShop()
  if (!shop?.id) {
    current.value = undefined
    return
  }
  try {
    const response = await getMerchantPaymentChannel(shop.id)
    current.value = response.data || undefined
    Object.assign(form, emptyForm(), current.value || {}, {
      shopId: shop.id,
      appTarget: '',
      collectionMode: '3',
      appSecret: '',
      subAppSecret: '',
      privateKeyRaw: '',
      wechatPayPublicKeyRaw: '',
      apiV3Key: '',
    })
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载支付配置失败')
  }
}

async function save() {
  const shop = getCurrentShop()
  if (!shop?.id) {
    ElMessage.warning('请先选择店铺')
    return
  }
  if (!form.channelName?.trim() || !form.appId?.trim() || !form.mchId?.trim()) {
    ElMessage.warning('请完整填写支付通道基础信息')
    return
  }
  if (!form.certificateSerialNo?.trim() || !form.wechatPayPublicKeyId?.trim()) {
    ElMessage.warning('请完整填写微信支付凭据')
    return
  }
  if (!form.appSecret?.trim() && !current.value?.hasAppSecret) {
    ElMessage.warning('请输入小程序 AppSecret')
    return
  }
  if (!form.apiV3Key?.trim() && !current.value?.hasApiV3Key) {
    ElMessage.warning('请输入 APIv3 密钥')
    return
  }
  if (!form.privateKeyRaw?.trim() && !current.value?.hasPrivateKey) {
    ElMessage.warning('请输入商户 API 私钥')
    return
  }
  if (!form.wechatPayPublicKeyRaw?.trim() && !current.value?.hasWechatPayPublicKey) {
    ElMessage.warning('请输入微信支付公钥')
    return
  }
  if (!form.payNotifyUrl?.trim() || !form.refundNotifyUrl?.trim()) {
    ElMessage.warning('请填写支付与退款回调地址')
    return
  }
  saving.value = true
  try {
    const response = await saveMerchantPaymentChannel({
      ...form,
      id: current.value?.id,
      shopId: shop.id,
      appTarget: '',
      collectionMode: '3',
    })
    current.value = response.data
    ElMessage.success('支付配置已保存')
    await load()
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '保存支付配置失败')
  } finally {
    saving.value = false
  }
}

function handleShopContextChanged() {
  void load()
}

onMounted(() => {
  window.addEventListener(SHOP_CONTEXT_CHANGED, handleShopContextChanged)
  void load()
})

onBeforeUnmount(() => {
  window.removeEventListener(SHOP_CONTEXT_CHANGED, handleShopContextChanged)
})
</script>

<style scoped>
.settlement-form-page { height: 100%; overflow: auto; }
</style>