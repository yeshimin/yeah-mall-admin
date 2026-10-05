<template>
  <div class="seckill-manage">
    <div class="activity-selector mb8">
      <el-select v-model="selectedActivityId" placeholder="选择活动" @change="handleActivityChange" style="width: 200px">
        <el-option v-for="activity in activityList" :key="activity.id" :label="activity.name" :value="activity.id" />
      </el-select>
    </div>

      <!-- 监控概览 -->
      <div class="monitor-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-card">
                <div class="stat-label">总访问量</div>
                <div class="stat-value">{{ monitorData.totalViews }}</div>
                <div class="stat-change" :class="monitorData.viewsChange >= 0 ? 'positive' : 'negative'">
                  {{ monitorData.viewsChange >= 0 ? '+' : '' }}{{ monitorData.viewsChange }}%
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-card">
                <div class="stat-label">参与人数</div>
                <div class="stat-value">{{ monitorData.participantCount }}</div>
                <div class="stat-change" :class="monitorData.participantChange >= 0 ? 'positive' : 'negative'">
                  {{ monitorData.participantChange >= 0 ? '+' : '' }}{{ monitorData.participantChange }}%
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-card">
                <div class="stat-label">成交订单</div>
                <div class="stat-value">{{ monitorData.orderCount }}</div>
                <div class="stat-change" :class="monitorData.orderChange >= 0 ? 'positive' : 'negative'">
                  {{ monitorData.orderChange >= 0 ? '+' : '' }}{{ monitorData.orderChange }}%
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-card">
                <div class="stat-label">成交金额</div>
                <div class="stat-value">¥{{ monitorData.salesAmount.toFixed(2) }}</div>
                <div class="stat-change" :class="monitorData.salesChange >= 0 ? 'positive' : 'negative'">
                  {{ monitorData.salesChange >= 0 ? '+' : '' }}{{ monitorData.salesChange }}%
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 实时数据 -->
      <div class="monitor-realtime mt-4">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>实时数据</span>
              <el-button type="primary" @click="refreshData" plain size="small">
                <el-icon><Refresh /></el-icon>
                刷新数据
              </el-button>
            </div>
          </template>
          <div class="realtime-data">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="realtime-item">
                  <div class="realtime-label">当前在线人数</div>
                  <div class="realtime-value">{{ realtimeData.onlineCount }}</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="realtime-item">
                  <div class="realtime-label">5分钟内访问量</div>
                  <div class="realtime-value">{{ realtimeData.visits5min }}</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="realtime-item">
                  <div class="realtime-label">5分钟内订单数</div>
                  <div class="realtime-value">{{ realtimeData.orders5min }}</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>

      <!-- 商品销售排行 -->
      <div class="product-ranking mt-4">
        <el-card>
          <template #header>
            <span>商品销售排行</span>
          </template>
          <el-table :data="productRanking" style="width: 100%">
            <el-table-column label="排名" width="80">
              <template #default="scope">
                <div class="rank-number" :class="scope.$index < 3 ? 'top-rank' : ''">
                  {{ scope.$index + 1 }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品名称" width="200" />
            <el-table-column prop="salesCount" label="销量" width="100" />
            <el-table-column prop="salesAmount" label="销售额" width="120">
              <template #default="scope">
                ¥{{ scope.row.salesAmount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="stock" label="库存" width="100" />
            <el-table-column prop="stockRate" label="库存率" width="120">
              <template #default="scope">
                <el-progress :percentage="scope.row.stockRate" :color="getStockColor(scope.row.stockRate)" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 访问趋势 -->
      <div class="visit-trend mt-4">
        <el-card>
          <template #header>
            <span>访问趋势</span>
          </template>
          <div class="trend-chart">
            <el-empty description="访问趋势图表" style="height: 300px" />
          </div>
        </el-card>
      </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

// 响应式数据
const selectedActivityId = ref(1)
const monitorData = reactive({
  totalViews: 12580,
  viewsChange: 15.2,
  participantCount: 3256,
  participantChange: 8.7,
  orderCount: 892,
  orderChange: 12.5,
  salesAmount: 785420.50,
  salesChange: 18.3
})

const realtimeData = reactive({
  onlineCount: 1258,
  visits5min: 320,
  orders5min: 45
})

// 活动列表
const activityList = ref([
  { id: 1, name: '春节秒杀活动' },
  { id: 2, name: '情人节秒杀' },
  { id: 3, name: '元宵节秒杀' }
])

// 商品销售排行
const productRanking = ref([
  {
    id: 1,
    name: 'iPhone 15 Pro',
    salesCount: 256,
    salesAmount: 2054464,
    stock: 44,
    stockRate: 44
  },
  {
    id: 2,
    name: 'AirPods Pro 2',
    salesCount: 520,
    salesAmount: 670800,
    stock: 148,
    stockRate: 74
  },
  {
    id: 3,
    name: 'MacBook Air M3',
    salesCount: 89,
    salesAmount: 667411,
    stock: 31,
    stockRate: 62
  },
  {
    id: 4,
    name: 'Apple Watch Series 9',
    salesCount: 156,
    salesAmount: 389424,
    stock: 24,
    stockRate: 30
  },
  {
    id: 5,
    name: 'iPad Air 5',
    salesCount: 98,
    salesAmount: 392000,
    stock: 52,
    stockRate: 52
  }
])

// 初始化
onMounted(() => {
  loadMonitorData()
})

// 加载监控数据
function loadMonitorData() {
  // 模拟API调用
  setTimeout(() => {
    // 模拟数据更新
    realtimeData.onlineCount = Math.floor(Math.random() * 2000) + 500
    realtimeData.visits5min = Math.floor(Math.random() * 500) + 100
    realtimeData.orders5min = Math.floor(Math.random() * 100) + 10
  }, 500)
}

// 活动切换
function handleActivityChange() {
  loadMonitorData()
  ElMessage.success('切换活动成功')
}

// 刷新数据
function refreshData() {
  loadMonitorData()
  ElMessage.success('数据刷新成功')
}

// 获取库存颜色
function getStockColor(rate) {
  if (rate < 20) {
    return '#F56C6C'
  } else if (rate < 50) {
    return '#E6A23C'
  } else {
    return '#67C23A'
  }
}
</script>

<style lang="scss" scoped>
.seckill-manage {
  padding: 20px;
}

.mb8 {
  margin-bottom: 8px;
}

.activity-selector {
  margin-bottom: 20px;
}

.monitor-overview {
  margin-bottom: 20px;
}

.stat-card {
  padding: 20px;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-change {
  font-size: 12px;
}

.stat-change.positive {
  color: #67C23A;
}

.stat-change.negative {
  color: #F56C6C;
}

.monitor-realtime {
  margin-bottom: 20px;
}

.realtime-data {
  padding: 20px;
}

.realtime-item {
  text-align: center;
  padding: 10px;
  background-color: #f9fafc;
  border-radius: 8px;
}

.realtime-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.realtime-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.product-ranking {
  margin-bottom: 20px;
}

.rank-number {
  font-size: 16px;
  font-weight: bold;
  text-align: center;
}

.rank-number.top-rank {
  color: #F56C6C;
}

.visit-trend {
  margin-bottom: 20px;
}

.trend-chart {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mt-4 {
  margin-top: 20px;
}
</style>