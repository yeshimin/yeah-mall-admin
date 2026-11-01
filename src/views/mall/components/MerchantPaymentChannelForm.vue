<template>
  <div class="payment-form-wrap">
    <el-alert
      title="独立小程序将使用本店普通商户号直接收款；平台多商户小程序不受这里的配置影响。"
      type="info"
      :closable="false"
      show-icon
    />
    <el-form label-position="top" class="payment-form">
      <el-form-item label="通道名称" required>
        <el-input v-model="form.channelName" maxlength="64" />
      </el-form-item>
      <div class="form-grid">
        <el-form-item label="小程序 AppID" required><el-input v-model="form.appId" /></el-form-item>
        <el-form-item label="小程序 AppSecret" required>
          <el-input v-model="form.appSecret" show-password :placeholder="secretPlaceholder(current?.hasAppSecret)" />
        </el-form-item>
        <el-form-item label="微信支付商户号" required><el-input v-model="form.mchId" /></el-form-item>
        <el-form-item label="商户API证书序列号" required><el-input v-model="form.certificateSerialNo" /></el-form-item>
        <el-form-item label="微信支付公钥ID" required><el-input v-model="form.wechatPayPublicKeyId" /></el-form-item>
        <el-form-item label="APIv3密钥" required>
          <el-input v-model="form.apiV3Key" show-password :placeholder="secretPlaceholder(current?.hasApiV3Key)" />
        </el-form-item>
      </div>
      <el-form-item label="商户API私钥" required>
        <el-input v-model="form.privateKeyRaw" type="textarea" :rows="5" :placeholder="secretPlaceholder(current?.hasPrivateKey)" />
      </el-form-item>
      <el-form-item label="微信支付公钥" required>
        <el-input v-model="form.wechatPayPublicKeyRaw" type="textarea" :rows="5" :placeholder="secretPlaceholder(current?.hasWechatPayPublicKey)" />
      </el-form-item>
      <div class="form-grid">
        <el-form-item label="支付回调地址" required><el-input v-model="form.payNotifyUrl" /></el-form-item>
        <el-form-item label="退款回调地址" required><el-input v-model="form.refundNotifyUrl" /></el-form-item>
      </div>
      <el-form-item label="启用通道"><el-switch v-model="form.isEnabled" /></el-form-item>
      <el-button type="primary" :loading="saving" @click="save">保存支付配置</el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getMerchantPaymentChannel,
  saveMerchantPaymentChannel,
  type PaymentChannelRecord,
  type PaymentChannelSaveData,
} from '@/api/mall/settlement'
import { getCurrentShop } from '@/utils/shop'
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

function secretPlaceholder(configured?: boolean) {
  return configured ? '已配置，留空表示保持不变' : '请输入完整配置'
}

async function load() {
  const shop = getCurrentShop()
  if (!shop?.id) return
  try {
    const response = await getMerchantPaymentChannel(shop.id)
    current.value = response.data || undefined
    Object.assign(form, emptyForm(), current.value || {}, {
      shopId: shop.id,
      appTarget: '',
      collectionMode: '3',
      appSecret: '', subAppSecret: '', privateKeyRaw: '', wechatPayPublicKeyRaw: '', apiV3Key: '',
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
  saving.value = true
  try {
    const response = await saveMerchantPaymentChannel({ ...form, id: current.value?.id, shopId: shop.id })
    current.value = response.data
    ElMessage.success('支付配置已保存')
    await load()
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '保存支付配置失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => void load())
</script>

<style scoped>
.payment-form-wrap { padding: 20px; }
.payment-form { max-width: 980px; margin-top: 20px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 20px; }
@media (max-width: 760px) { .form-grid { grid-template-columns: 1fr; } }
</style>
