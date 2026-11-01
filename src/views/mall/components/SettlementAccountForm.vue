<template>
  <div class="merchant-account-form">
    <el-alert
      v-if="current"
      :title="`当前账户状态：${statusText(current.status)}`"
      :type="current.status === '2' ? 'success' : current.status === '3' ? 'error' : 'warning'"
      :description="current.auditRemark || ''"
      :closable="false"
      show-icon
    />
    <el-form label-position="top" class="account-form">
      <el-form-item label="账户类型" required>
        <el-radio-group v-model="form.accountType">
          <el-radio value="1">银行卡</el-radio>
          <el-radio value="2">支付宝</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="收款人/账户名称" required>
        <el-input v-model="form.accountName" maxlength="64" />
      </el-form-item>
      <el-form-item label="收款账号" required>
        <el-input v-model="form.accountNo" maxlength="128" :placeholder="current ? `当前账号 ${current.accountNo}，修改时请重新完整输入` : '请输入完整收款账号'" />
      </el-form-item>
      <el-form-item v-if="form.accountType === '1'" label="开户银行" required>
        <el-input v-model="form.bankName" maxlength="128" placeholder="请输入开户银行及支行" />
      </el-form-item>
      <el-button type="primary" :loading="saving" @click="save">提交审核</el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getMerchantSettlementAccount,
  saveMerchantSettlementAccount,
  type SettlementAccountRecord,
} from '@/api/mall/settlement'
import { getCurrentShop } from '@/utils/shop'
import { getRequestErrorMessage } from '@/utils/error'

const current = ref<SettlementAccountRecord>()
const saving = ref(false)
const form = reactive({ accountType: '1', accountName: '', accountNo: '', bankName: '' })

function statusText(status: string) {
  return ({ '1': '待平台审核', '2': '已审核通过', '3': '审核未通过' } as Record<string, string>)[status] || '未知'
}

async function load() {
  const shopId = getCurrentShop()?.id
  if (!shopId) return
  try {
    const response = await getMerchantSettlementAccount(shopId)
    current.value = response.data || undefined
    if (current.value) {
      form.accountType = current.value.accountType
      form.accountName = current.value.accountName
      form.bankName = current.value.bankName || ''
    }
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载结算账户失败')
  }
}

async function save() {
  const shopId = getCurrentShop()?.id
  if (!shopId) {
    ElMessage.warning('请先选择店铺')
    return
  }
  if (!form.accountName.trim() || !form.accountNo.trim()) {
    ElMessage.warning('请完整填写收款账户')
    return
  }
  if (form.accountType === '1' && !form.bankName.trim()) {
    ElMessage.warning('请输入开户银行')
    return
  }
  saving.value = true
  try {
    const response = await saveMerchantSettlementAccount({
      shopId,
      accountType: form.accountType,
      accountName: form.accountName.trim(),
      accountNo: form.accountNo.trim(),
      bankName: form.accountType === '1' ? form.bankName.trim() : undefined,
    })
    current.value = response.data
    form.accountNo = ''
    ElMessage.success('结算账户已提交审核')
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '保存结算账户失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => void load())
</script>

<style scoped>
.merchant-account-form { max-width: 680px; padding: 20px; }
.account-form { margin-top: 20px; }
</style>
