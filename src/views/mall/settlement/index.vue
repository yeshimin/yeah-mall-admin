<template>
  <div class="mall-page settlement-page-shell">
  <el-tabs v-model="activeTab" class="settlement-tabs">
    <el-tab-pane label="结算台账" name="ledger"><SettlementManager scope="platform" /></el-tab-pane>
    <el-tab-pane label="账户审核" name="account"><SettlementAccountManager /></el-tab-pane>
    <el-tab-pane label="支付通道" name="channel"><PlatformPaymentChannelManager /></el-tab-pane>
  </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SettlementManager from '../components/SettlementManager.vue'
import SettlementAccountManager from '../components/SettlementAccountManager.vue'
import PlatformPaymentChannelManager from '../components/PlatformPaymentChannelManager.vue'

defineOptions({ name: 'PlatformSettlementPage' })
const activeTab = ref('ledger')
</script>

<style scoped>
.settlement-page-shell { padding-top: 10px; }
.settlement-tabs { height: 100%; }
.settlement-tabs :deep(.el-tabs__content),
.settlement-tabs :deep(.el-tab-pane) { height: calc(100% - 28px); }
.settlement-tabs :deep(.mall-page) { min-height: 0; padding: 0; background: transparent; }
</style>
