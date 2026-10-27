<template>
  <div class="seckill-monitor mall-page">
    <div class="toolbar">
      <el-select v-model="selectedActivityId" placeholder="选择秒杀活动" style="width: 240px" @change="loadDashboard">
        <el-option v-for="activity in activityList" :key="activity.id" :label="activity.name" :value="activity.id" />
      </el-select>
      <el-button type="primary" :loading="loading" @click="loadDashboard">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-empty v-if="!loading && !selectedActivityId" description="暂无可统计的秒杀活动" />
    <template v-else>
      <el-row :gutter="16" v-loading="loading">
        <el-col :xs="24" :sm="12" :md="6"><el-card shadow="never"><el-statistic title="已支付订单" :value="Number(dashboard.paidOrderCount || 0)" /></el-card></el-col>
        <el-col :xs="24" :sm="12" :md="6"><el-card shadow="never"><el-statistic title="参与会员" :value="Number(dashboard.participantCount || 0)" /></el-card></el-col>
        <el-col :xs="24" :sm="12" :md="6"><el-card shadow="never"><el-statistic title="成交金额" :value="Number(dashboard.salesAmount || 0)" prefix="¥" :precision="2" /></el-card></el-col>
        <el-col :xs="24" :sm="12" :md="6"><el-card shadow="never"><el-statistic title="剩余秒杀库存" :value="Number(dashboard.remainingStock || 0)" /></el-card></el-col>
      </el-row>

      <el-card class="ranking-card" shadow="never" v-loading="loading">
        <template #header><span>商品实时排行</span></template>
        <el-table :data="dashboard.productRanking || []" empty-text="暂无已审核秒杀商品">
          <el-table-column type="index" label="排名" width="70" />
          <el-table-column prop="name" label="商品名称" min-width="220" />
          <el-table-column prop="salesCount" label="已售数量" width="120" />
          <el-table-column label="成交金额" width="140"><template #default="scope">¥{{ formatAmount(scope.row.salesAmount) }}</template></el-table-column>
          <el-table-column prop="remainingStock" label="剩余库存" width="120" />
        </el-table>
      </el-card>
    </template>
    <p class="data-note">数据仅统计已支付且未关闭的秒杀订单；访问量和在线人数需接入埋点后另行提供。</p>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getSeckillMonitorData, querySeckillActivityList } from '@/api/mall/seckill'

const activityList = ref([])
const selectedActivityId = ref(null)
const loading = ref(false)
const dashboard = reactive({ paidOrderCount: 0, participantCount: 0, salesAmount: 0, remainingStock: 0, productRanking: [] })

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

async function loadActivities() {
  const response = await querySeckillActivityList({ current: 1, size: 100 })
  activityList.value = response.data?.records || []
  selectedActivityId.value = activityList.value[0]?.id || null
  if (selectedActivityId.value) await loadDashboard()
}

async function loadDashboard() {
  if (!selectedActivityId.value) return
  loading.value = true
  try {
    const response = await getSeckillMonitorData(selectedActivityId.value)
    Object.assign(dashboard, response.data || {})
  } catch (error) {
    ElMessage.error(error.message || '获取秒杀监控数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadActivities().catch((error) => ElMessage.error(error.message || '获取秒杀活动失败'))
})
</script>

<style scoped>
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.ranking-card { margin-top: 16px; }
.data-note { margin-top: 12px; color: #909399; font-size: 12px; text-align: center; }
</style>
