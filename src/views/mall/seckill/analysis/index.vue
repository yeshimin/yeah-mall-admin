<template>
  <div class="seckill-analysis app-container">
    <div class="toolbar">
      <el-select v-model="selectedActivityId" placeholder="选择秒杀活动" style="width: 240px" @change="loadAnalysis">
        <el-option v-for="activity in activityList" :key="activity.id" :label="activity.name" :value="activity.id" />
      </el-select>
      <el-button type="primary" :loading="loading" @click="loadAnalysis">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-empty v-if="!loading && !selectedActivityId" description="暂无可分析的秒杀活动" />
    <template v-else>
      <el-row :gutter="16" v-loading="loading">
        <el-col :xs="24" :sm="12" :md="6"><el-card shadow="never"><el-statistic title="成交订单" :value="Number(dashboard.paidOrderCount || 0)" /></el-card></el-col>
        <el-col :xs="24" :sm="12" :md="6"><el-card shadow="never"><el-statistic title="成交会员" :value="Number(dashboard.participantCount || 0)" /></el-card></el-col>
        <el-col :xs="24" :sm="12" :md="6"><el-card shadow="never"><el-statistic title="成交总额" :value="Number(dashboard.salesAmount || 0)" prefix="¥" :precision="2" /></el-card></el-col>
        <el-col :xs="24" :sm="12" :md="6"><el-card shadow="never"><el-statistic title="客单价" :value="averageOrderAmount" prefix="¥" :precision="2" /></el-card></el-col>
      </el-row>

      <el-card class="ranking-card" shadow="never" v-loading="loading">
        <template #header><span>商品成交贡献</span></template>
        <el-table :data="rankingWithShare" empty-text="暂无已支付秒杀订单">
          <el-table-column type="index" label="排名" width="70" />
          <el-table-column prop="name" label="商品名称" min-width="220" />
          <el-table-column prop="salesCount" label="销量" width="100" />
          <el-table-column label="成交额" width="140"><template #default="scope">¥{{ formatAmount(scope.row.salesAmount) }}</template></el-table-column>
          <el-table-column label="成交占比" min-width="180"><template #default="scope"><el-progress :percentage="scope.row.salesShare" /></template></el-table-column>
          <el-table-column prop="remainingStock" label="剩余库存" width="120" />
        </el-table>
      </el-card>
    </template>
    <p class="data-note">成交分析只计算已支付且未关闭的秒杀订单，不混入普通订单或未支付订单。</p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getSeckillAnalysisData, querySeckillActivityList } from '@/api/mall/seckill'

const activityList = ref([])
const selectedActivityId = ref(null)
const loading = ref(false)
const dashboard = reactive({ paidOrderCount: 0, participantCount: 0, salesAmount: 0, productRanking: [] })

const averageOrderAmount = computed(() => {
  const orderCount = Number(dashboard.paidOrderCount || 0)
  return orderCount ? Number(dashboard.salesAmount || 0) / orderCount : 0
})

const rankingWithShare = computed(() => {
  const total = Number(dashboard.salesAmount || 0)
  return (dashboard.productRanking || []).map((product) => ({
    ...product,
    salesShare: total ? Number(((Number(product.salesAmount || 0) / total) * 100).toFixed(2)) : 0
  }))
})

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

async function loadActivities() {
  const response = await querySeckillActivityList({ current: 1, size: 100 })
  activityList.value = response.data?.records || []
  selectedActivityId.value = activityList.value[0]?.id || null
  if (selectedActivityId.value) await loadAnalysis()
}

async function loadAnalysis() {
  if (!selectedActivityId.value) return
  loading.value = true
  try {
    const response = await getSeckillAnalysisData(selectedActivityId.value)
    Object.assign(dashboard, response.data || {})
  } catch (error) {
    ElMessage.error(error.message || '获取秒杀分析数据失败')
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
