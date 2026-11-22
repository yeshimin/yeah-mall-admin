<template>
  <div class="mall-page groupbuy-page groupbuy-order-page merchant-groupbuy-page">
    <template v-if="activity">
      <div class="ss-activity-bar">
        <span class="ss-activity-icon"><el-icon><Tickets /></el-icon></span>
        <div class="ss-activity-copy">
          <div class="ss-activity-title">
            <h2>{{ activity.name || '未命名活动' }}</h2>
            <span class="status-ticket" :class="`tone-${state.tone}`">
              <span class="ss-status-live">
                <i v-if="state.key === 'ongoing'" class="ss-live-dot"></i>{{ state.label }}
              </span>
            </span>
          </div>
          <div class="ss-activity-meta">
            <span><el-icon><Lightning /></el-icon>活动 {{ activityRangeText }}</span>
            <span><el-icon><Avatar /></el-icon>{{ ruleText }}</span>
            <span><el-icon><Tickets /></el-icon>订单 {{ activityOrders.length }} 单</span>
            <span><el-icon><Tickets /></el-icon>开团 {{ activityGroups.length }} 个</span>
          </div>
        </div>
        <div class="ss-activity-controls">
          <label class="ss-activity-switch">
            <span>切换活动</span>
            <el-select
              :model-value="activityId"
              class="ss-activity-select"
              placeholder="选择活动"
              filterable
              :disabled="activitiesLoading || !activities.length"
              @change="handleActivityChange"
            >
              <el-option
                v-for="item in activities"
                :key="String(item.id)"
                :label="item.name || String(item.id)"
                :value="String(item.id)"
              />
            </el-select>
          </label>
          <button type="button" class="ss-back-link" @click="goBackActivities">
            <el-icon><Back /></el-icon>返回活动列表
          </button>
        </div>
      </div>

      <div class="gb-view-bar">
        <div class="gb-view-toggle" role="tablist" aria-label="拼团订单视图">
          <button type="button" :class="{ active: view === 'orders' }" @click="switchView('orders')">
            <el-icon><Tickets /></el-icon>订单列表
          </button>
          <button type="button" :class="{ active: view === 'groups' }" @click="switchView('groups')">
            <el-icon><Avatar /></el-icon>团概览
          </button>
        </div>
        <span class="gb-view-hint">
          <el-icon><Avatar /></el-icon>
          {{ view === 'orders'
            ? '按订单维度查看本店铺支付与退款状态，点击详情可查看所属团与结算时间线。'
            : '按团维度查看本店铺成团进度与成员，满团后于活动结束统一结算发货。' }}
        </span>
      </div>

      <template v-if="view === 'orders'">
        <div class="ss-queue">
          <div class="ss-tabs">
            <button
              v-for="tab in ORDER_TABS"
              :key="tab.key"
              type="button"
              :data-status="tab.key"
              :class="{ active: orderTab === tab.key }"
              @click="switchOrderTab(tab.key)"
            >
              {{ tab.label }}<span class="ss-tab-count">{{ orderCounts[tab.key] }}</span>
            </button>
          </div>
          <div class="ss-queue-summary">
            <span :class="{ 'is-warning': waitpayOrders > 0 }">
              <i v-if="waitpayOrders > 0" class="ss-live-dot"></i>待支付 <b>{{ waitpayOrders }}</b> 单
            </span>
            <span><el-icon><Avatar /></el-icon>拼团中 <b>{{ formingGroups }}</b> 团</span>
          </div>
        </div>

        <section class="mall-filter-panel">
          <el-form :inline="true" class="mall-query-form" @submit.prevent="search">
            <div class="ms-filter-fields">
              <el-form-item label="订单号 / 会员" class="ms-filter-field ms-filter-order">
                <el-input
                  v-model="filters.keyword"
                  clearable
                  placeholder="搜索订单编号或会员名"
                  @keyup.enter="search"
                />
              </el-form-item>
              <el-form-item label="团编号" class="ms-filter-field ms-filter-group">
                <el-input
                  v-model="filters.secondary"
                  clearable
                  placeholder="搜索所属团编号"
                  @keyup.enter="search"
                />
              </el-form-item>
            </div>
            <el-form-item class="mall-query-actions">
              <el-button @click="resetFilters">重置</el-button>
              <el-button type="primary" native-type="submit">
                <el-icon><Search /></el-icon>查询
              </el-button>
            </el-form-item>
          </el-form>
        </section>

        <section class="mall-table-panel">
          <div class="ss-table-intro">
            <span>
              <el-icon><Tickets /></el-icon>
              仅展示当前店铺订单；拼团订单每人限购 1 件，团长支付后开团，满 {{ minPeople }} 人成团，活动结束统一结算。
            </span>
            <div class="sa-intro-right">
              <b>筛选 {{ filteredOrders.length }} 单</b>
              <span v-if="waitpayOrders > 0" class="sa-pending-chip">待支付 {{ waitpayOrders }}</span>
            </div>
          </div>

          <el-table data-ym-table="r86" v-loading="ordersLoading" :data="pagedOrders" row-key="id" style="width: 100%" class="gb-order-table">
            <el-table-column label="订单编号" width="176" align="center" header-align="center">
              <template #default="{ row }">
                <span class="mono"><CopyableText :value="row.orderNo" label="订单编号" /></span>
              </template>
            </el-table-column>
            <el-table-column label="会员" width="140" align="center" header-align="center">
              <template #default="{ row }">
                <div class="gb-member-cell">
                  <span class="avatar" style="width: 30px; height: 30px">{{ avatarChar(row.memberName) }}</span>
                  <div class="gb-member-copy">
                    <b :title="row.memberName">{{ row.memberName || '—' }}</b>
                    <small :class="{ 'is-leader': row.isLeader }">{{ row.isLeader ? '团长' : '团员' }}</small>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="拼团商品" min-width="220" align="center" header-align="center">
              <template #default="{ row }">
                <div class="sa-product-cell">
                  <span class="sa-product-art">
                    <el-image v-if="row.productImage" :src="getStoragePreviewUrl(row.productImage)" fit="cover">
                      <template #error>
                        <span class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                      </template>
                    </el-image>
                    <span v-else class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                  </span>
                  <div class="sa-product-copy">
                    <b :title="row.productName">{{ row.productName || '—' }}</b>
                    <small>{{ row.groupNo || '—' }}</small>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="拼团价" width="140" align="center" header-align="center">
              <template #default="{ row }">
                <div class="skp-price-cell">
                  <b>{{ seckillMoney(row.groupPrice) }}</b>
                  <small>实付 {{ seckillMoney(row.actualAmount) }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="团编号" width="160" align="center" header-align="center">
              <template #default="{ row }">
                <span class="mono"><CopyableText :value="row.groupNo" label="团编号" /></span>
              </template>
            </el-table-column>
            <el-table-column label="订单状态" width="104" align="center" header-align="center">
              <template #default="{ row }">
                <span class="status-ticket" :class="`tone-${orderStatusMeta(row.orderStatus).tone}`">
                  {{ orderStatusMeta(row.orderStatus).label }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="团状态" width="104" align="center" header-align="center">
              <template #default="{ row }">
                <span class="status-ticket is-small" :class="`tone-${orderGroupMeta(row).tone}`">
                  {{ orderGroupMeta(row).label }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="下单时间" width="122" align="center" header-align="center">
              <template #default="{ row }">
                <div class="sa-time-cell">
                  <b>{{ dateOnly(row.createTime) }}</b>
                  <small>{{ clockText(row.createTime) }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="82" fixed="right" align="center" header-align="center">
              <template #default="{ row }">
                <button type="button" class="ms-link" @click="openOrderDetail(row)">详情</button>
              </template>
            </el-table-column>

            <template #empty>
              <div class="ms-empty">
                <el-icon><Tickets /></el-icon>
                <b>{{ activityOrders.length ? '没有匹配的拼团订单' : '当前活动还没有拼团订单' }}</b>
                <span>{{ activityOrders.length ? '调整订单号、会员或团编号筛选后重试' : '活动开始并有人开团后，订单会出现在这里' }}</span>
              </div>
            </template>
          </el-table>

          <MallPagination
            variant="admin"
            :total="filteredOrders.length"
            :page="page.current"
            :limit="page.size"
            @pagination="changePage"
          />
        </section>
      </template>

      <template v-else>
        <div class="ss-queue">
          <div class="ss-tabs">
            <button
              v-for="tab in GROUP_TABS"
              :key="tab.key"
              type="button"
              :data-status="tab.key"
              :class="{ active: groupTab === tab.key }"
              @click="switchGroupTab(tab.key)"
            >
              {{ tab.label }}<span class="ss-tab-count">{{ groupCounts[tab.key] }}</span>
            </button>
          </div>
          <div class="ss-queue-summary">
            <span :class="{ 'is-warning': formingGroups > 0 }">
              <i v-if="formingGroups > 0" class="ss-live-dot"></i>拼团中 <b>{{ formingGroups }}</b> 团
            </span>
            <span><el-icon><Check /></el-icon>已成团 <b>{{ successGroups }}</b> 团</span>
          </div>
        </div>

        <section class="mall-filter-panel">
          <el-form :inline="true" class="mall-query-form" @submit.prevent="search">
            <div class="ms-filter-fields">
              <el-form-item label="团编号 / 团长" class="ms-filter-field ms-filter-order">
                <el-input
                  v-model="filters.keyword"
                  clearable
                  placeholder="搜索团编号或团长名"
                  @keyup.enter="search"
                />
              </el-form-item>
              <el-form-item label="商品名称" class="ms-filter-field ms-filter-group">
                <el-input
                  v-model="filters.secondary"
                  clearable
                  placeholder="搜索拼团商品名称"
                  @keyup.enter="search"
                />
              </el-form-item>
            </div>
            <el-form-item class="mall-query-actions">
              <el-button @click="resetFilters">重置</el-button>
              <el-button type="primary" native-type="submit">
                <el-icon><Search /></el-icon>查询
              </el-button>
            </el-form-item>
          </el-form>
        </section>

        <section class="mall-table-panel">
          <div class="ss-table-intro">
            <span>
              <el-icon><Avatar /></el-icon>
              仅展示本店铺开团；每团满 {{ minPeople }} 人即成团，开团上限 {{ limitText }}。点击详情可查看成员名单与成团时间线。
            </span>
            <div class="sa-intro-right">
              <b>筛选 {{ filteredGroups.length }} 团</b>
              <span v-if="formingGroups > 0" class="sa-pending-chip">拼团中 {{ formingGroups }}</span>
            </div>
          </div>

          <el-table data-ym-table="r87" v-loading="groupsLoading" :data="pagedGroups" row-key="id" style="width: 100%" class="gb-group-table">
            <el-table-column label="团编号" width="160" align="center" header-align="center">
              <template #default="{ row }">
                <span class="mono"><CopyableText :value="row.groupNo" label="团编号" /></span>
              </template>
            </el-table-column>
            <el-table-column label="拼团商品" min-width="220" align="center" header-align="center">
              <template #default="{ row }">
                <div class="sa-product-cell">
                  <span class="sa-product-art">
                    <el-image v-if="row.productImage" :src="getStoragePreviewUrl(row.productImage)" fit="cover">
                      <template #error>
                        <span class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                      </template>
                    </el-image>
                    <span v-else class="sa-image-fallback"><el-icon><Picture /></el-icon></span>
                  </span>
                  <div class="sa-product-copy">
                    <b :title="row.productName">{{ row.productName || '—' }}</b>
                    <small>团长 {{ row.leaderMemberName || '—' }}</small>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="团长" width="140" align="center" header-align="center">
              <template #default="{ row }">
                <div class="gb-member-cell">
                  <span class="avatar" style="width: 30px; height: 30px">{{ avatarChar(row.leaderMemberName) }}</span>
                  <div class="gb-member-copy">
                    <b :title="row.leaderMemberName">{{ row.leaderMemberName || '—' }}</b>
                    <small class="is-leader">团长</small>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="成团人数" width="96" align="center" header-align="center">
              <template #default="{ row }">
                {{ Number(row.minPeople || 0) }} 人
              </template>
            </el-table-column>
            <el-table-column label="已参团" width="96" align="center" header-align="center">
              <template #default="{ row }">
                {{ memberCountOf(row) }} / {{ reservedCountOf(row) }}
              </template>
            </el-table-column>
            <el-table-column label="成团进度" width="150" align="center" header-align="center">
              <template #default="{ row }">
                <div class="gb-progress" :class="{ 'is-full': progressOf(row).full, 'is-fail': progressOf(row).fail }">
                  <span class="gb-progress-track"><em :style="{ width: `${progressOf(row).percent}%` }"></em></span>
                  <span class="gb-progress-label">
                    <b :class="{ 'is-full': progressOf(row).full }">{{ memberCountOf(row) }}/{{ Number(row.minPeople || 0) }}</b>
                    <span>{{ progressOf(row).text }}</span>
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="团状态" width="104" align="center" header-align="center">
              <template #default="{ row }">
                <span class="status-ticket" :class="`tone-${groupStatusMeta(row.status).tone}`">
                  {{ groupStatusMeta(row.status).label }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="开团时间" width="122" align="center" header-align="center">
              <template #default="{ row }">
                <div class="sa-time-cell">
                  <b>{{ dateOnly(row.createTime) }}</b>
                  <small>{{ clockText(row.createTime) }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="82" fixed="right" align="center" header-align="center">
              <template #default="{ row }">
                <button type="button" class="ms-link" @click="openGroupDetail(row)">详情</button>
              </template>
            </el-table-column>

            <template #empty>
              <div class="ms-empty">
                <el-icon><Avatar /></el-icon>
                <b>{{ activityGroups.length ? '没有匹配的团' : '当前活动店铺还没有开团' }}</b>
                <span>{{ activityGroups.length ? '调整团编号、团长或商品筛选后重试' : '活动开始后用户开团，团会出现在这里' }}</span>
              </div>
            </template>
          </el-table>

          <MallPagination
            variant="admin"
            :total="filteredGroups.length"
            :page="page.current"
            :limit="page.size"
            @pagination="changePage"
          />
        </section>
      </template>
    </template>

    <section v-else-if="activitiesLoading" class="gb-page-empty">
      <span class="gb-page-empty-icon"><el-icon><Tickets /></el-icon></span>
      <strong>正在加载拼团活动</strong>
      <span>请稍候…</span>
    </section>

    <section v-else class="gb-page-empty">
      <span class="gb-page-empty-icon"><el-icon><Tickets /></el-icon></span>
      <strong>暂无可查看的拼团活动</strong>
      <span>平台发布拼团活动后，店铺的拼团订单与开团情况会展示在这里。</span>
      <button type="button" class="gb-page-empty-action" @click="goBackActivities">返回活动列表</button>
    </section>

    <el-drawer
      v-model="orderDrawer.visible"
      size="560px"
      class="gb-scope"
      :with-header="false"
      :show-close="false"
      @closed="resetOrderDrawer"
    >
      <div v-if="orderDrawer.row" class="sk-detail">
        <div class="sk-dialog-head">
          <div>
            <span class="sk-kicker">GROUP BUY ORDER</span>
            <h2>拼团订单详情</h2>
          </div>
          <button type="button" class="sk-close-btn" @click="orderDrawer.visible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="sk-detail-meta">
          <div>
            <span>订单编号</span>
            <b class="mono"><CopyableText :value="orderDrawer.row.orderNo" label="订单编号" /></b>
          </div>
          <div>
            <span>订单状态</span>
            <b>
              <span class="status-ticket" :class="`tone-${orderStatusMeta(orderDrawer.row.orderStatus).tone}`">
                {{ orderStatusMeta(orderDrawer.row.orderStatus).label }}
              </span>
            </b>
          </div>
          <div>
            <span>会员</span>
            <b>{{ orderDrawer.row.memberName || '—' }}{{ orderDrawer.row.isLeader ? '（团长）' : '（团员）' }}</b>
          </div>
          <div>
            <span>拼团商品</span>
            <b>{{ orderDrawer.row.productName || '—' }}</b>
          </div>
          <div>
            <span>拼团价 / 实付</span>
            <b>{{ seckillMoney(orderDrawer.row.groupPrice) }} / {{ seckillMoney(orderDrawer.row.actualAmount) }}</b>
          </div>
          <div>
            <span>下单时间</span>
            <b>{{ dateTimeText(orderDrawer.row.createTime) }}</b>
          </div>
        </div>

        <div v-if="orderGroup" class="gb-group-card">
          <div class="gb-group-card-head">
            <b>{{ orderGroup.groupNo || '—' }}</b>
            <span class="status-ticket" :class="`tone-${groupStatusMeta(orderGroup.status).tone}`">
              {{ groupStatusMeta(orderGroup.status).label }}
            </span>
          </div>
          <div class="gb-group-card-meta">
            <span><el-icon><Avatar /></el-icon>团长 {{ orderGroup.leaderMemberName || '—' }}</span>
            <span><el-icon><Goods /></el-icon>{{ orderGroup.productName || '—' }}</span>
            <span><el-icon><Clock /></el-icon>开团 {{ dateTimeText(orderGroup.createTime) }}</span>
          </div>
          <div class="gb-progress" :class="{ 'is-full': orderGroupProgress?.full, 'is-fail': orderGroupProgress?.fail }">
            <span class="gb-progress-track"><em :style="{ width: `${orderGroupProgress?.percent || 0}%` }"></em></span>
            <span class="gb-progress-label">
              <b :class="{ 'is-full': orderGroupProgress?.full }">{{ memberCountOf(orderGroup) }}/{{ Number(orderGroup.minPeople || 0) }} 人</b>
              <span>{{ orderGroupProgress?.text }}</span>
            </span>
          </div>
        </div>

        <div class="sk-drawer-section">
          <h3>订单时间线</h3>
          <div class="gb-timeline">
            <div
              v-for="(step, index) in orderTimelineSteps"
              :key="index"
              class="gb-timeline-step"
              :class="{ 'is-done': step.done, 'is-muted': step.muted }"
            >
              <span class="gb-timeline-dot"></span>
              <div class="gb-timeline-copy"><b>{{ step.label }}</b><small>{{ step.time }}</small></div>
            </div>
          </div>
        </div>

        <div class="sk-drawer-actions">
          <el-button @click="orderDrawer.visible = false">关闭</el-button>
          <el-button v-if="orderGroup" type="primary" @click="viewGroupFromOrder">查看团详情</el-button>
        </div>
      </div>
    </el-drawer>

    <el-drawer
      v-model="groupDrawer.visible"
      size="560px"
      class="gb-scope"
      :with-header="false"
      :show-close="false"
      @closed="resetGroupDrawer"
    >
      <div v-if="groupDrawer.row" class="sk-detail">
        <div class="sk-dialog-head">
          <div>
            <span class="sk-kicker">GROUP BUY TEAM</span>
            <h2>团详情</h2>
          </div>
          <button type="button" class="sk-close-btn" @click="groupDrawer.visible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="gb-group-card">
          <div class="gb-group-card-head">
            <b>{{ groupDrawer.row.groupNo || '—' }}</b>
            <span class="status-ticket" :class="`tone-${groupStatusMeta(groupDrawer.row.status).tone}`">
              {{ groupStatusMeta(groupDrawer.row.status).label }}
            </span>
          </div>
          <div class="gb-group-card-meta">
            <span><el-icon><Goods /></el-icon>{{ groupDrawer.row.productName || '—' }}</span>
            <span><el-icon><Avatar /></el-icon>团长 {{ groupDrawer.row.leaderMemberName || '—' }}</span>
            <span><el-icon><Clock /></el-icon>开团 {{ dateTimeText(groupDrawer.row.createTime) }}</span>
          </div>
          <div class="gb-progress" :class="{ 'is-full': groupProgress?.full, 'is-fail': groupProgress?.fail }">
            <span class="gb-progress-track"><em :style="{ width: `${groupProgress?.percent || 0}%` }"></em></span>
            <span class="gb-progress-label">
              <b :class="{ 'is-full': groupProgress?.full }">{{ memberCountOf(groupDrawer.row) }}/{{ Number(groupDrawer.row.minPeople || 0) }} 人成团</b>
              <span>{{ groupProgress?.text }}</span>
            </span>
          </div>
        </div>

        <div v-loading="groupDrawer.loading" :style="groupDrawer.loading && !groupDrawer.detail ? 'min-height: 240px' : undefined">
          <template v-if="groupDrawer.detail">
            <div class="sk-drawer-section">
              <h3>成员名单 <small>已参团 {{ groupMemberCount }} 人 · 含待支付共 {{ groupReservedCount }} 人</small></h3>
              <div class="gb-member-list">
                <div v-for="(member, index) in groupMembers" :key="String(member.orderId ?? member.id ?? index)" class="gb-member-row">
                  <span class="avatar" style="width: 34px; height: 34px">{{ avatarChar(member.memberName) }}</span>
                  <div class="gb-member-row-copy">
                    <b>{{ member.memberName || '—' }}<span v-if="member.isLeader" class="gb-leader-chip">团长</span></b>
                    <small>下单 {{ dateTimeText(member.createTime) }}<template v-if="member.payTime"> · 支付 {{ clockText(member.payTime) }}</template></small>
                  </div>
                  <span class="gb-member-row-amount">{{ seckillMoney(member.actualAmount) }}</span>
                  <span class="status-ticket is-small" :class="`tone-${orderStatusMeta(member.orderStatus).tone}`">
                    {{ orderStatusMeta(member.orderStatus).label }}
                  </span>
                </div>
                <div v-if="!groupMembers.length" class="sa-empty-sku">暂无成员订单</div>
              </div>
            </div>

            <div class="sk-drawer-section">
              <h3>成团时间线</h3>
              <div class="gb-timeline">
                <div
                  v-for="(step, index) in groupTimelineSteps"
                  :key="index"
                  class="gb-timeline-step"
                  :class="{ 'is-done': step.done, 'is-muted': step.muted }"
                >
                  <span class="gb-timeline-dot"></span>
                  <div class="gb-timeline-copy"><b>{{ step.label }}</b><small>{{ step.time }}</small></div>
                </div>
              </div>
            </div>
          </template>
          <div v-else-if="!groupDrawer.loading" class="sa-detail-failed">
            <el-icon><WarningFilled /></el-icon>团详情加载失败
          </div>
        </div>

        <div class="sk-drawer-actions">
          <el-button @click="groupDrawer.visible = false">关闭</el-button>
          <el-button type="primary" @click="openGroupOrders">查看该团订单</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script lang="ts">
// LayoutContent 以 fullPath 作 router-view key，切换活动的 query-only replace 会重建本页；
// 用模块级记忆让「订单列表 / 团概览」在同页重建后保持，重新进入页面或刷新时回到默认订单视图。
let merchantOrderViewMemory: { path: string; fullPath: string; view: 'orders' | 'groups' } | null = null
</script>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  Avatar,
  Back,
  Check,
  Clock,
  Close,
  Goods,
  Lightning,
  Picture,
  Search,
  Tickets,
  WarningFilled,
} from '@element-plus/icons-vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import { getStoragePreviewUrl } from '@/utils/storage'
import {
  getMchGroupBuyGroupDetail,
  queryMchGroupBuyApplyList,
  queryMchGroupBuyGroupList,
  queryMchGroupBuyOrderList,
} from '@/api/mall/groupBuy'
import {
  GROUP_TABS,
  ORDER_TABS,
  clockText,
  dateOnly,
  dateTimeText,
  groupStatusMeta,
  groupbuyGroupProgress,
  groupbuyLimitText,
  isPaidOrder,
  loadAllPages,
  mchGroupbuyInsightActivityId,
  normalizeTime,
  orderStatusMeta,
  seckillMoney,
  useMchGroupBuyContext,
  type GroupBuyGroup,
  type GroupBuyGroupDetail,
  type GroupBuyMember,
  type GroupBuyOrder,
  type MchGroupbuyApplyRow,
  type StateMeta,
} from '../shared'
import '@/assets/yeah-mall-seckill.css'
import '@/assets/yeah-mall-seckill-insight.css'

defineOptions({ name: 'MchGroupBuyOrder' })

interface TimelineStep {
  label: string
  time: string
  done?: boolean
  muted?: boolean
}

const {
  route,
  shopId,
  activities,
  activityId,
  activitiesLoading,
  initialized,
  now,
  activity,
  state,
  activityRangeText,
  ruleText,
  loadActivities,
  selectActivity,
  resolveInitialActivityId,
  goBackActivities,
} = useMchGroupBuyContext({ onRouteActivityChange: handleActivitySwitch })

const allOrders = ref<GroupBuyOrder[]>([])
const allApplies = ref<MchGroupbuyApplyRow[]>([])
const groups = ref<GroupBuyGroup[]>([])
const ordersLoading = ref(false)
const groupsLoading = ref(false)

function resolveInitialView(): 'orders' | 'groups' {
  if (
    merchantOrderViewMemory
    && window.history.state?.replaced === true
    && merchantOrderViewMemory.path === route.path
    && merchantOrderViewMemory.fullPath !== route.fullPath
  ) {
    return merchantOrderViewMemory.view
  }
  return 'orders'
}

const view = ref<'orders' | 'groups'>(resolveInitialView())

function rememberView() {
  merchantOrderViewMemory = { path: route.path, fullPath: route.fullPath, view: view.value }
}
rememberView()

const orderTab = ref('all')
const groupTab = ref('all')
const filters = reactive({ keyword: '', secondary: '' })
const applied = reactive({ keyword: '', secondary: '' })
const page = reactive({ current: 1, size: 10 })

const orderDrawer = reactive<{ visible: boolean; row: GroupBuyOrder | null }>({ visible: false, row: null })
const groupDrawer = reactive<{
  visible: boolean
  loading: boolean
  row: GroupBuyGroup | null
  detail: GroupBuyGroupDetail | null
}>({ visible: false, loading: false, row: null, detail: null })

let orderSeq = 0
let applySeq = 0
let groupSeq = 0
let groupDetailSeq = 0

const activityOrders = computed(() => (
  allOrders.value.filter((row) => String(row.activityId ?? '') === String(activity.value?.id ?? ''))
))
const activityGroups = computed(() => groups.value)

const orderBase = computed(() => {
  const keyword = applied.keyword.trim().toLowerCase()
  const secondary = applied.secondary.trim().toLowerCase()
  return activityOrders.value
    .filter((row) => (
      (!keyword || `${row.orderNo || ''}${row.memberName || ''}`.toLowerCase().includes(keyword))
      && (!secondary || String(row.groupNo || '').toLowerCase().includes(secondary))
    ))
    .slice()
    .sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')))
})

const orderCounts = computed(() => {
  const result: Record<string, number> = { all: orderBase.value.length, waitpay: 0, paid: 0, closed: 0, refunding: 0, refunded: 0, refundfail: 0 }
  orderBase.value.forEach((row) => {
    const key = orderStatusMeta(row.orderStatus).key
    if (key in result) result[key] = (result[key] || 0) + 1
  })
  return result
})

const filteredOrders = computed(() => (
  orderTab.value === 'all'
    ? orderBase.value
    : orderBase.value.filter((row) => orderStatusMeta(row.orderStatus).key === orderTab.value)
))

const groupBase = computed(() => {
  const keyword = applied.keyword.trim().toLowerCase()
  const secondary = applied.secondary.trim().toLowerCase()
  return activityGroups.value
    .filter((row) => (
      (!keyword || `${row.groupNo || ''}${row.leaderMemberName || ''}`.toLowerCase().includes(keyword))
      && (!secondary || String(row.productName || '').toLowerCase().includes(secondary))
    ))
    .slice()
    .sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')))
})

const groupCounts = computed(() => {
  const result: Record<string, number> = { all: groupBase.value.length, waitpay: 0, forming: 0, success: 0, failed: 0, closed: 0 }
  groupBase.value.forEach((row) => {
    const key = groupStatusMeta(row.status).key
    if (key in result) result[key] = (result[key] || 0) + 1
  })
  return result
})

const filteredGroups = computed(() => (
  groupTab.value === 'all'
    ? groupBase.value
    : groupBase.value.filter((row) => groupStatusMeta(row.status).key === groupTab.value)
))

const pagedOrders = computed(() => {
  const start = (page.current - 1) * page.size
  return filteredOrders.value.slice(start, start + page.size)
})
const pagedGroups = computed(() => {
  const start = (page.current - 1) * page.size
  return filteredGroups.value.slice(start, start + page.size)
})
const filteredActive = computed(() => (view.value === 'orders' ? filteredOrders.value : filteredGroups.value))

const waitpayOrders = computed(() => activityOrders.value.filter((row) => String(row.orderStatus ?? '') === '1').length)
const formingGroups = computed(() => activityGroups.value.filter((row) => String(row.status ?? '') === '2').length)
const successGroups = computed(() => activityGroups.value.filter((row) => String(row.status ?? '') === '3').length)

const minPeople = computed(() => Number(activity.value?.minPeople || 0))
const limitText = computed(() => groupbuyLimitText(activity.value?.groupLimit))

const orderGroup = computed(() => {
  const row = orderDrawer.row
  if (!row) return null
  return groups.value.find((item) => String(item.id) === String(row.groupId ?? '')) || null
})
const orderGroupProgress = computed(() => (orderGroup.value ? groupbuyGroupProgress(orderGroup.value) : null))
const orderTimelineSteps = computed(() => (
  orderDrawer.row ? buildOrderTimeline(orderDrawer.row, orderGroup.value) : []
))

const groupProgress = computed(() => (groupDrawer.row ? groupbuyGroupProgress(groupDrawer.row) : null))
const groupMembers = computed<GroupBuyMember[]>(() => groupDrawer.detail?.members || [])
const groupMemberCount = computed(() => Number(groupDrawer.detail?.memberCount ?? groupDrawer.row?.memberCount ?? 0))
const groupReservedCount = computed(() => Number(groupDrawer.detail?.reservedMemberCount ?? groupDrawer.row?.reservedMemberCount ?? 0))
const groupTimelineSteps = computed(() => (
  groupDrawer.row ? buildGroupTimeline(groupDrawer.detail || groupDrawer.row, groupMembers.value) : []
))

watch(filteredActive, (rows) => {
  const maxPage = Math.max(1, Math.ceil(rows.length / page.size))
  if (page.current > maxPage) page.current = maxPage
})

onMounted(() => {
  void initialize()
})

async function initialize() {
  await loadActivities()
  if (!activities.value.length) {
    initialized.value = true
    return
  }
  await Promise.all([loadOrders(), loadApplies()])
  resolveInitialActivityId(() => mchGroupbuyInsightActivityId(activities.value, allApplies.value, allOrders.value, now.value))
  await loadGroups()
}

async function loadOrders() {
  if (!shopId.value) {
    allOrders.value = []
    return
  }
  const token = ++orderSeq
  ordersLoading.value = true
  try {
    const rows = await loadAllPages<GroupBuyOrder>((params) => queryMchGroupBuyOrderList({ ...params, shopId: shopId.value }))
    if (token !== orderSeq) return
    allOrders.value = rows
      .filter((row) => row && row.id !== undefined && row.id !== null)
      .map((row) => ({
        ...row,
        createTime: normalizeTime(row.createTime),
        payTime: normalizeTime(row.payTime),
        updateTime: normalizeTime(row.updateTime),
      }))
  } catch {
    if (token === orderSeq) allOrders.value = []
  } finally {
    if (token === orderSeq) ordersLoading.value = false
  }
}

async function loadApplies() {
  if (!shopId.value) {
    allApplies.value = []
    return
  }
  const token = ++applySeq
  try {
    const rows = await loadAllPages<MchGroupbuyApplyRow>((params) => queryMchGroupBuyApplyList({ ...params, shopId: shopId.value }))
    if (token !== applySeq) return
    allApplies.value = rows.filter((row) => row && row.id !== undefined && row.id !== null)
  } catch {
    if (token === applySeq) allApplies.value = []
  }
}

async function loadGroups() {
  const id = activityId.value
  if (!shopId.value || !id) {
    groups.value = []
    return
  }
  const token = ++groupSeq
  groupsLoading.value = true
  try {
    const rows = await loadAllPages<GroupBuyGroup>((params) => queryMchGroupBuyGroupList({
      ...params,
      shopId: shopId.value,
      activityId: id,
    }))
    if (token !== groupSeq) return
    groups.value = rows
      .filter((row) => row && row.id !== undefined && row.id !== null)
      .map((row) => ({
        ...row,
        createTime: normalizeTime(row.createTime),
        successTime: normalizeTime(row.successTime),
        failedTime: normalizeTime(row.failedTime),
      }))
  } catch {
    if (token === groupSeq) groups.value = []
  } finally {
    if (token === groupSeq) groupsLoading.value = false
  }
}

function handleActivitySwitch() {
  orderTab.value = 'all'
  groupTab.value = 'all'
  filters.keyword = ''
  filters.secondary = ''
  applied.keyword = ''
  applied.secondary = ''
  page.current = 1
  orderDrawer.visible = false
  groupDrawer.visible = false
  void loadGroups()
}

function handleActivityChange(value: string) {
  selectActivity(value)
}

function switchView(next: 'orders' | 'groups') {
  view.value = next
  rememberView()
  filters.keyword = ''
  filters.secondary = ''
  applied.keyword = ''
  applied.secondary = ''
  page.current = 1
}

function search() {
  applied.keyword = filters.keyword.trim()
  applied.secondary = filters.secondary.trim()
  page.current = 1
}

function resetFilters() {
  filters.keyword = ''
  filters.secondary = ''
  applied.keyword = ''
  applied.secondary = ''
  orderTab.value = 'all'
  groupTab.value = 'all'
  page.current = 1
}

function switchOrderTab(key: string) {
  orderTab.value = key
  page.current = 1
}

function switchGroupTab(key: string) {
  groupTab.value = key
  page.current = 1
}

function changePage(value: { page: number; limit: number }) {
  page.current = value.page
  page.size = value.limit
}

function orderGroupMeta(row: GroupBuyOrder): StateMeta {
  const group = groups.value.find((item) => String(item.id) === String(row.groupId ?? ''))
  return group ? groupStatusMeta(group.status) : { key: 'none', label: '—', tone: 'neutral' }
}

function memberCountOf(row: GroupBuyGroup): number {
  return Number(row.memberCount || 0)
}

function reservedCountOf(row: GroupBuyGroup): number {
  return Number(row.reservedMemberCount || 0)
}

function progressOf(row: GroupBuyGroup) {
  return groupbuyGroupProgress(row)
}

function openOrderDetail(row: GroupBuyOrder) {
  orderDrawer.row = row
  orderDrawer.visible = true
}

function resetOrderDrawer() {
  orderDrawer.row = null
}

function viewGroupFromOrder() {
  const group = orderGroup.value
  if (!group) return
  orderDrawer.visible = false
  void openGroupDetail(group)
}

async function openGroupDetail(row: GroupBuyGroup) {
  if (!shopId.value) return
  const token = ++groupDetailSeq
  groupDrawer.row = row
  groupDrawer.detail = null
  groupDrawer.visible = true
  groupDrawer.loading = true
  try {
    const response = await getMchGroupBuyGroupDetail({ shopId: shopId.value, id: row.id }) as unknown as { data?: GroupBuyGroupDetail }
    if (token !== groupDetailSeq) return
    const detail = response?.data
    groupDrawer.detail = detail
      ? {
        ...detail,
        createTime: normalizeTime(detail.createTime),
        successTime: normalizeTime(detail.successTime),
        failedTime: normalizeTime(detail.failedTime),
        members: (detail.members || []).map((member) => ({
          ...member,
          createTime: normalizeTime(member.createTime),
          payTime: normalizeTime(member.payTime),
        })),
      }
      : null
  } catch {
    if (token === groupDetailSeq) groupDrawer.detail = null
  } finally {
    if (token === groupDetailSeq) groupDrawer.loading = false
  }
}

function resetGroupDrawer() {
  groupDetailSeq++
  groupDrawer.row = null
  groupDrawer.detail = null
  groupDrawer.loading = false
}

function openGroupOrders() {
  const group = groupDrawer.row
  if (!group) return
  groupDrawer.visible = false
  view.value = 'orders'
  rememberView()
  orderTab.value = 'all'
  filters.keyword = ''
  filters.secondary = String(group.groupNo || '')
  applied.keyword = ''
  applied.secondary = String(group.groupNo || '')
  page.current = 1
}

function buildOrderTimeline(order: GroupBuyOrder, group: GroupBuyGroup | null): TimelineStep[] {
  const paid = isPaidOrder(order.orderStatus)
  const steps: TimelineStep[] = [
    { label: '提交订单', time: dateTimeText(order.createTime), done: true },
    { label: '支付订单', time: paid ? (order.payTime ? dateTimeText(order.payTime) : '已支付') : '等待支付', done: paid, muted: !paid },
  ]
  if (group) {
    const gs = String(group.status ?? '')
    if (gs === '3') steps.push({ label: '拼团成功', time: group.successTime ? dateTimeText(group.successTime) : '已成团', done: true })
    else if (gs === '4') steps.push({ label: '拼团失败', time: group.failedTime ? dateTimeText(group.failedTime) : '未成团', done: true })
    else if (gs === '5') steps.push({ label: '团已关闭', time: group.failedTime ? dateTimeText(group.failedTime) : '已关闭', done: true })
    else if (gs === '2') steps.push({ label: '等待成团', time: `还差 ${Math.max(0, Number(group.minPeople || 0) - Number(group.memberCount || 0))} 人`, muted: true })
    else steps.push({ label: '等待团长支付', time: '待支付', muted: true })
  }
  const os = String(order.orderStatus ?? '')
  if (os === '5') steps.push({ label: '退款完成', time: '已退款', done: true })
  else if (os === '4') steps.push({ label: '退款处理中', time: '退款中' })
  else if (os === '6') steps.push({ label: '退款失败', time: '需人工处理' })
  else if (os === '3') steps.push({ label: '订单已关闭', time: '已关闭', done: true })
  else if (group && String(group.status ?? '') === '3' && paid) steps.push({ label: '待发货', time: '活动结束统一结算发货', muted: true })
  return steps
}

function buildGroupTimeline(group: GroupBuyGroup, members: GroupBuyMember[]): TimelineStep[] {
  const leader = members.find((member) => member.isLeader)
  const leaderPaid = leader ? isPaidOrder(leader.orderStatus) : false
  const member = Number(group.memberCount || 0)
  const min = Number(group.minPeople || 0)
  const gs = String(group.status ?? '')
  const steps: TimelineStep[] = [
    { label: '发起开团', time: dateTimeText(group.createTime), done: true },
    { label: '团长支付', time: leaderPaid ? (leader?.payTime ? dateTimeText(leader.payTime) : '已支付') : '等待团长支付', done: leaderPaid, muted: !leaderPaid },
  ]
  if (gs === '3') steps.push({ label: '满员成团', time: group.successTime ? dateTimeText(group.successTime) : `${member}/${min} 人`, done: true })
  else if (gs === '4') steps.push({ label: '拼团失败', time: group.failedTime ? dateTimeText(group.failedTime) : '超时未成团', done: true })
  else if (gs === '5') steps.push({ label: '团已关闭', time: group.failedTime ? dateTimeText(group.failedTime) : '活动结束关闭', done: true })
  else steps.push({ label: '等待参团', time: `${member}/${min} 人 · 还差 ${Math.max(0, min - member)} 人`, muted: true })
  if (gs === '3') {
    const ended = state.value.key === 'ended'
    steps.push({ label: '统一结算', time: ended ? '满团订单进入待发货' : '活动结束统一结算发货', done: ended, muted: !ended })
  } else if (gs === '4' || gs === '5') {
    steps.push({ label: '退款 / 释放库存', time: '未满团自动退款并释放预留库存', done: true })
  }
  return steps
}

function avatarChar(name?: string) {
  return String(name || '会').slice(0, 1)
}
</script>