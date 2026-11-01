<template>
  <el-tabs v-model="activeTab" class="settlement-tabs">
    <el-tab-pane label="结算记录" name="ledger"><SettlementManager scope="merchant" /></el-tab-pane>
    <el-tab-pane label="收款账户" name="account"><SettlementAccountForm /></el-tab-pane>
    <el-tab-pane label="独立App支付" name="channel"><MerchantPaymentChannelForm /></el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SettlementManager from '../components/SettlementManager.vue'
import SettlementAccountForm from '../components/SettlementAccountForm.vue'
import MerchantPaymentChannelForm from '../components/MerchantPaymentChannelForm.vue'

defineOptions({ name: 'MerchantSettlementPage' })
const activeTab = ref('ledger')
</script>

<style scoped>
.settlement-tabs { height: 100%; }
.settlement-tabs :deep(.el-tabs__content),
.settlement-tabs :deep(.el-tab-pane) { height: calc(100% - 28px); }
</style>
