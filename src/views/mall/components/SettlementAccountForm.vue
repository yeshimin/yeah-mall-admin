<template>
  <div class="settlement-form-page mall-page">
    <section class="settlement-editor">
      <div class="settlement-editor-head">
        <div>
          <b>收款账户</b>
          <span>平台线下结算将打款到审核通过的账户</span>
        </div>
        <el-tag class="settlement-status-tag" :type="statusType(current?.status)" effect="light">
          {{ current ? statusText(current.status) : '未提交' }}
        </el-tag>
      </div>
      <div class="settlement-editor-body">
        <div class="settlement-account-state">
          <div>
            <span>当前账号</span>
            <b>{{ current?.accountNo || '-' }}</b>
          </div>
          <div>
            <span>审核时间</span>
            <b>{{ dateTimeText(current?.auditTime) }}</b>
          </div>
          <div class="wide">
            <span>审核备注</span>
            <b>{{ current?.auditRemark || '-' }}</b>
          </div>
        </div>
        <el-form label-position="top" require-asterisk-position="right">
          <div class="settlement-form-grid">
            <el-form-item label="账户类型" required>
              <el-select v-model="form.accountType" @change="handleTypeChange">
                <el-option label="银行卡" value="1" />
                <el-option label="支付宝" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="收款人 / 账户名称" required>
              <el-input v-model="form.accountName" maxlength="64" placeholder="请输入收款人 / 账户名称" />
            </el-form-item>
            <el-form-item label="收款账号" required>
              <el-input
                v-model="form.accountNo"
                maxlength="128"
                :placeholder="current ? `当前账号 ${current.accountNo}，修改时请重新完整输入` : '请输入完整收款账号'"
              />
            </el-form-item>
            <el-form-item v-if="form.accountType === '1'" label="开户银行" required>
              <el-input v-model="form.bankName" maxlength="128" placeholder="请输入开户银行及支行" />
            </el-form-item>
          </div>
        </el-form>
      </div>
      <div class="settlement-save-bar">
        <span>修改账户资料并提交后，将重新进入平台审核</span>
        <el-button type="primary" :loading="saving" @click="save">提交审核</el-button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getMerchantSettlementAccount,
  saveMerchantSettlementAccount,
  type SettlementAccountRecord,
} from '@/api/mall/settlement'
import { getCurrentShop, SHOP_CONTEXT_CHANGED } from '@/utils/shop'
import { getRequestErrorMessage } from '@/utils/error'

const current = ref<SettlementAccountRecord>()
const saving = ref(false)
const form = reactive({ accountType: '1', accountName: '', accountNo: '', bankName: '' })

function statusText(status: string) {
  return ({ '1': '待审核', '2': '已通过', '3': '已拒绝' } as Record<string, string>)[status] || '未知'
}

function statusType(status?: string) {
  return status === '2' ? 'success' : status === '3' ? 'danger' : 'warning'
}

function dateTimeText(value?: string) {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 16)
}

function handleTypeChange(value: string) {
  if (value !== '1') form.bankName = ''
}

async function load() {
  const shopId = getCurrentShop()?.id
  if (!shopId) {
    current.value = undefined
    return
  }
  try {
    const response = await getMerchantSettlementAccount(shopId)
    current.value = response.data || undefined
    if (current.value) {
      form.accountType = current.value.accountType
      form.accountName = current.value.accountName
      form.bankName = current.value.bankName || ''
      form.accountNo = ''
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
  if (!form.accountName.trim()) {
    ElMessage.warning('请输入收款人 / 账户名称')
    return
  }
  if (!form.accountNo.trim()) {
    ElMessage.warning('请重新输入完整收款账号')
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
    ElMessage.success('收款账户已提交审核')
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '保存结算账户失败')
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