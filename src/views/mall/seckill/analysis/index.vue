<template>
  <div class="seckill-manage">
    <div class="activity-selector mb8">
      <el-select v-model="selectedActivityId" placeholder="选择活动" @change="handleActivityChange" style="width: 200px">
        <el-option v-for="activity in activityList" :key="activity.id" :label="activity.name" :value="activity.id" />
      </el-select>
    </div>

      <!-- 数据概览 -->
      <div class="data-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-card">
                <div class="stat-label">活动总销售额</div>
                <div class="stat-value">¥{{ analysisData.totalSales.toFixed(2) }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-card">
                <div class="stat-label">活动总订单数</div>
                <div class="stat-value">{{ analysisData.totalOrders }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-card">
                <div class="stat-label">活动转化率</div>
                <div class="stat-value">{{ analysisData.conversionRate }}%</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-card">
                <div class="stat-label">客单价</div>
                <div class="stat-value">¥{{ analysisData.averageOrderValue.toFixed(2) }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 销售趋势 -->
      <div class="sales-trend mt-4">
        <el-card>
          <template #header>
            <span>销售趋势</span>
          </template>
          <div class="trend-chart">
            <el-empty description="销售趋势图表" style="height: 300px" />
          </div>
        </el-card>
      </div>

      <!-- 商品销售分析 -->
      <div class="product-analysis mt-4">
        <el-card>
          <template #header>
            <span>商品销售分析</span>
          </template>
          <el-table :data="productAnalysisData" style="width: 100%">
            <el-table-column prop="name" label="商品名称" width="200" />
            <el-table-column prop="salesCount" label="销量" width="100" />
            <el-table-column prop="salesAmount" label="销售额" width="150">
              <template #default="scope">
                ¥{{ scope.row.salesAmount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="salesPercentage" label="销售占比" width="150">
              <template #default="scope">
                <el-progress :percentage="scope.row.salesPercentage" />
              </template>
            </el-table-column>
            <el-table-column prop="averagePrice" label="平均价格" width="120">
              <template #default="scope">
                ¥{{ scope.row.averagePrice.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="stock" label="库存" width="100" />
            <el-table-column prop="soldOut" label="是否售罄" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.soldOut ? 'success' : 'info'">
                  {{ scope.row.soldOut ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 用户分析 -->
      <div class="user-analysis mt-4">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>用户地域分布</span>
              </template>
              <div class="user-chart">
                <el-empty description="地域分布图表" style="height: 300px" />
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>用户购买时间分布</span>
              </template>
              <div class="user-chart">
                <el-empty description="购买时间分布图表" style="height: 300px" />
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 活动效果评估 -->
      <div class="activity-evaluation mt-4">
        <el-card>
          <template #header>
            <span>活动效果评估</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="活动目标完成率">{{ analysisData.targetCompletionRate }}%</el-descriptions-item>
            <el-descriptions-item label="活动ROI">{{ analysisData.roi }}:1</el-descriptions-item>
            <el-descriptions-item label="新用户占比">{{ analysisData.newUserPercentage }}%</el-descriptions-item>
            <el-descriptions-item label="复购率">{{ analysisData.repurchaseRate }}%</el-descriptions-item>
            <el-descriptions-item label="活动热度" :span="2">
              <el-rate v-model="analysisData.activityHeat" disabled :max="5" />
            </el-descriptions-item>
            <el-descriptions-item label="活动总结" :span="2">{{ analysisData.activitySummary }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const selectedActivityId = ref(1)
const analysisData = reactive({
  totalSales: 1258000.50,
  totalOrders: 1560,
  conversionRate: 12.5,
  averageOrderValue: 806.41,
  targetCompletionRate: 125.8,
  roi: 5.2,
  newUserPercentage: 35.2,
  repurchaseRate: 28.7,
  activityHeat: 4.5,
  activitySummary: '本次秒杀活动取得了圆满成功，销售额达到了预期目标的125.8%，吸引了大量新用户参与，活动热度高，用户反馈良好。建议在后续活动中增加更多热门商品，优化活动时间安排，进一步提升活动效果。'
})

// 活动列表
const activityList = ref([
  { id: 1, name: '春节秒杀活动' },
  { id: 2, name: '情人节秒杀' },
  { id: 3, name: '元宵节秒杀' }
])

// 商品销售分析数据
const productAnalysisData = ref([
  {
    id: 1,
    name: 'iPhone 15 Pro',
    salesCount: 320,
    salesAmount: 2556800,
    salesPercentage: 45,
    averagePrice: 7990,
    stock: 0,
    soldOut: true
  },
  {
    id: 2,
    name: 'MacBook Air M3',
    salesCount: 150,
    salesAmount: 1124850,
    salesPercentage: 20,
    averagePrice: 7499,
    stock: 10,
    soldOut: false
  },
  {
    id: 3,
    name: 'AirPods Pro 2',
    salesCount: 500,
    salesAmount: 649500,
    salesPercentage: 11.5,
    averagePrice: 1299,
    stock: 148,
    soldOut: false
  },
  {
    id: 4,
    name: 'Apple Watch Series 9',
    salesCount: 156,
    salesAmount: 392064,
    salesPercentage: 8.8,
    averagePrice: 2499,
    stock: 24,
    soldOut: false
  },
  {
    id: 5,
    name: 'iPad Air 5',
    salesCount: 98,
    salesAmount: 392000,
    salesPercentage: 10.6,
    averagePrice: 3998,
    stock: 52,
    soldOut: false
  },
  {
    id: 6,
    name: 'AirPods 3',
    salesCount: 240,
    salesAmount: 239760,
    salesPercentage: 4.2,
    averagePrice: 999,
    stock: 60,
    soldOut: false
  }
])

// 初始化
onMounted(() => {
  loadAnalysisData()
})

// 加载分析数据
function loadAnalysisData() {
  // 模拟API调用
  setTimeout(() => {
    console.log('Analysis data loaded')
  }, 500)
}

// 活动切换
function handleActivityChange() {
  loadAnalysisData()
  ElMessage.success('切换活动成功')
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

.data-overview {
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
}

.sales-trend {
  margin-bottom: 20px;
}

.trend-chart {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-analysis {
  margin-bottom: 20px;
}

.user-analysis {
  margin-bottom: 20px;
}

.user-chart {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-evaluation {
  margin-bottom: 20px;
}

.mt-4 {
  margin-top: 20px;
}
</style>