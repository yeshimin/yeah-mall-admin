<template>
  <div class="home-page">
    <section class="welcome-card">
      <div>
        <p class="welcome-date">{{ currentDate }}</p>
        <h1>{{ greeting }}，{{ authStore.displayName }}</h1>
        <p class="welcome-description">欢迎使用管理后台，你可以从下方快捷入口开始处理工作。</p>
      </div>
      <el-button type="primary" @click="openProfile">
        <el-icon><User /></el-icon>
        个人中心
      </el-button>
    </section>

    <template v-if="merchantDashboard">
      <section class="merchant-heading">
        <div>
          <p>店铺经营</p>
          <h2>{{ currentShop?.name }}</h2>
        </div>
        <el-button :loading="dashboardLoading" @click="loadMerchantDashboard">刷新数据</el-button>
      </section>

      <section class="merchant-grid">
        <button type="button" class="merchant-card ship-card" @click="openOrderList({ status: '2' })">
          <span>待发货</span>
          <strong>{{ merchantDashboard.waitShipCount }}</strong>
          <small>及时处理订单履约</small>
        </button>
        <button type="button" class="merchant-card refund-card" @click="openOrderList({ status: '6', refundStatus: 'pending' })">
          <span>退款待处理</span>
          <strong>{{ merchantDashboard.refundPendingCount }}</strong>
          <small>申请中或处理中退款</small>
        </button>
        <button type="button" class="merchant-card stock-card" @click="openStockWarningList">
          <span>库存预警</span>
          <strong>{{ merchantDashboard.stockWarningCount }}</strong>
          <small>库存不高于 {{ merchantDashboard.stockWarningThreshold }} 件</small>
        </button>
        <button type="button" class="merchant-card order-card" @click="openTodayOrderList">
          <span>今日订单</span>
          <strong>{{ merchantDashboard.todayOrderCount }}</strong>
          <small>今日已支付有效订单</small>
        </button>
        <button type="button" class="merchant-card sales-card" @click="openTodayOrderList">
          <span>今日销售额</span>
          <strong>¥{{ formatAmount(merchantDashboard.todaySalesAmount) }}</strong>
          <small>按优惠后应付金额统计</small>
        </button>
      </section>

      <el-card shadow="never" class="stock-warning-card">
        <template #header>
          <div class="card-header">
            <h2>低库存商品</h2>
            <p>展示库存最低的 {{ merchantDashboard.stockWarnings?.length || 0 }} 个 SKU</p>
          </div>
        </template>
        <el-table :data="merchantDashboard.stockWarnings || []" size="small">
          <el-table-column prop="spuName" label="商品名称" min-width="180" />
          <el-table-column prop="skuName" label="SKU" min-width="160" />
          <el-table-column prop="stock" label="当前库存" width="110">
            <template #default="{ row }">
              <el-tag type="danger">{{ row.stock }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!merchantDashboard.stockWarnings?.length" description="暂无库存预警" :image-size="70" />
      </el-card>
    </template>

    <section class="overview-grid">
      <el-card shadow="never" class="overview-card">
        <div class="overview-icon role-icon"><Key /></div>
        <div>
          <div class="overview-value">{{ roleCount }}</div>
          <div class="overview-label">当前角色</div>
        </div>
      </el-card>
      <el-card shadow="never" class="overview-card">
        <div class="overview-icon org-icon"><OfficeBuilding /></div>
        <div>
          <div class="overview-value">{{ orgCount }}</div>
          <div class="overview-label">所属组织</div>
        </div>
      </el-card>
      <el-card shadow="never" class="overview-card">
        <div class="overview-icon menu-icon"><Grid /></div>
        <div>
          <div class="overview-value">{{ accessibleEntries.length }}</div>
          <div class="overview-label">可访问模块</div>
        </div>
      </el-card>
    </section>

    <el-card shadow="never" class="quick-card">
      <template #header>
        <div class="card-header">
          <h2>快捷入口</h2>
          <p>根据当前账号拥有的菜单权限生成</p>
        </div>
      </template>

      <div v-if="quickEntries.length" class="quick-grid">
        <button
          v-for="entry in quickEntries"
          :key="entry.id"
          type="button"
          class="quick-entry"
          @click="openEntry(entry.path)"
        >
          <span>{{ entry.name }}</span>
          <el-icon><ArrowRight /></el-icon>
        </button>
      </div>
      <el-empty v-else description="当前账号暂无可访问的业务菜单" :image-size="80" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Grid, Key, OfficeBuilding, User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import type { ResourceTreeNode } from '@/types/upms'
import { getCurrentShop, type CurrentShop } from '@/utils/shop'
import { queryMerchantDashboard } from '@/api/mall/dashboard'

interface QuickEntry {
  id: number
  name: string
  path: string
}

const router = useRouter()
const authStore = useAuthStore()
const currentShop = ref<CurrentShop | null>(getCurrentShop())
const dashboardLoading = ref(false)
const merchantDashboard = ref<any>(null)

const currentDate = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) {
    return '夜深了'
  }
  if (hour < 12) {
    return '上午好'
  }
  if (hour < 18) {
    return '下午好'
  }
  return '晚上好'
})

const roleCount = computed(() => authStore.mine?.roles?.length || 0)
const orgCount = computed(() => authStore.mine?.orgs?.length || 0)
const accessibleEntries = computed(() => collectQuickEntries(authStore.sidebarMenus))
const quickEntries = computed(() => accessibleEntries.value.slice(0, 8))

function collectQuickEntries(nodes: ResourceTreeNode[], entries: QuickEntry[] = []) {
  nodes.forEach((node) => {
    if (node.children?.length) {
      collectQuickEntries(node.children, entries)
      return
    }
    if (!node.isLink && node.path) {
      entries.push({
        id: node.id,
        name: node.name,
        path: node.path,
      })
    }
  })
  return entries
}

function openProfile() {
  router.push('/profile')
}

function openEntry(path: string) {
  router.push(path)
}

function formatAmount(value: unknown) {
  return Number(value || 0).toFixed(2)
}

async function loadMerchantDashboard() {
  currentShop.value = getCurrentShop()
  if (!currentShop.value) {
    merchantDashboard.value = null
    return
  }
  dashboardLoading.value = true
  try {
    const response = await queryMerchantDashboard(currentShop.value.id)
    merchantDashboard.value = response.data
  } finally {
    dashboardLoading.value = false
  }
}

function openOrderList(query: Record<string, string>) {
  router.push({
    path: '/mall/order',
    query,
  })
}

function openStockWarningList() {
  const threshold = Number(merchantDashboard.value?.stockWarningThreshold)
  router.push({
    path: '/mall/sku',
    query: Number.isFinite(threshold) ? { stockMax: String(threshold) } : {},
  })
}

function openTodayOrderList() {
  const beginTime = merchantDashboard.value?.todayBeginTime
  const endTime = merchantDashboard.value?.todayEndTime
  if (!beginTime || !endTime) {
    return
  }
  openOrderList({
    paySuccessStartTime: String(beginTime).replace('T', ' '),
    paySuccessEndTime: String(endTime).replace('T', ' '),
  })
}

onMounted(() => {
  void loadMerchantDashboard()
})
</script>

<style scoped>
.home-page {
  min-height: 100%;
  padding: 24px;
}

.welcome-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 32px;
  border: 1px solid #d9ecff;
  border-radius: 12px;
  background: linear-gradient(135deg, #ecf5ff 0%, #f5f7fa 65%, #fff 100%);
}

.welcome-date {
  margin: 0 0 10px;
  color: #409eff;
  font-size: 14px;
}

.welcome-card h1 {
  margin: 0;
  color: #303133;
  font-size: 28px;
  line-height: 1.4;
}

.welcome-description {
  margin: 10px 0 0;
  color: #606266;
  line-height: 1.6;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.merchant-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-top: 20px;
}

.merchant-heading p {
  margin: 0 0 6px;
  color: #909399;
  font-size: 13px;
}

.merchant-heading h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
}

.merchant-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  margin-top: 14px;
}

.merchant-card {
  display: flex;
  min-height: 122px;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  border: 0;
  border-radius: 12px;
  color: #fff;
  text-align: left;
}

button.merchant-card { cursor: pointer; }
button.merchant-card:hover { transform: translateY(-2px); filter: brightness(1.03); }
.merchant-card span { font-size: 14px; opacity: .9; }
.merchant-card strong { margin: 10px 0 8px; font-size: 30px; line-height: 1; }
.merchant-card small { font-size: 12px; opacity: .78; }
.ship-card { background: linear-gradient(135deg, #3478f6, #5ba2ff); }
.refund-card { background: linear-gradient(135deg, #ed7b4a, #f5a26e); }
.stock-card { background: linear-gradient(135deg, #d65b53, #ed8a7e); }
.order-card { background: linear-gradient(135deg, #4f9b79, #79b895); }
.sales-card { background: linear-gradient(135deg, #7867b7, #a28bda); }
.stock-warning-card { margin-top: 16px; }

.overview-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px;
}

.overview-icon {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 24px;
}

.role-icon {
  color: #409eff;
  background-color: #ecf5ff;
}

.org-icon {
  color: #67c23a;
  background-color: #f0f9eb;
}

.menu-icon {
  color: #e6a23c;
  background-color: #fdf6ec;
}

.overview-value {
  color: #303133;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
}

.overview-label {
  margin-top: 6px;
  color: #909399;
  font-size: 14px;
}

.quick-card {
  margin-top: 20px;
}

.card-header h2 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.card-header p {
  margin: 6px 0 0;
  color: #909399;
  font-size: 13px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.quick-entry {
  display: flex;
  min-width: 0;
  height: 54px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 18px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background-color: #fff;
  color: #606266;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.quick-entry span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-entry:hover {
  border-color: #409eff;
  color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgb(64 158 255 / 12%);
}

@media (max-width: 960px) {
  .merchant-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .home-page {
    padding: 16px;
  }

  .welcome-card {
    align-items: flex-start;
    flex-direction: column;
    padding: 24px;
  }

  .overview-grid,
  .merchant-grid,
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
