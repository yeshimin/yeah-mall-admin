<template>
  <div class="mall-page merchant-order-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" class="mall-query-form" @submit.prevent="handleSearch">
        <div class="mo-filter-fields">
          <el-form-item label="订单编号">
            <el-input
              v-model="searchForm.orderNo"
              clearable
              placeholder="订单编号或收货人"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="订单状态">
            <el-select v-model="searchForm.status" placeholder="全部状态">
              <el-option label="全部状态" value="" />
              <el-option v-for="(label, key) in MO_STATUS" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
          <el-form-item label="退款状态">
            <el-select v-model="searchForm.refundStatus" placeholder="全部">
              <el-option label="全部" value="" />
              <el-option label="退款待处理" value="pending" />
              <el-option v-for="key in ['1', '2', '3', '4', '5']" :key="key" :label="MO_REFUND_STATUS[key]" :value="key" />
            </el-select>
          </el-form-item>
          <el-form-item label="售后类型">
            <el-select v-model="searchForm.refundType" placeholder="全部">
              <el-option label="全部" value="" />
              <el-option label="仅退款" value="1" />
              <el-option label="退货退款" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="订单类型">
            <el-select v-model="searchForm.orderType" placeholder="全部类型">
              <el-option label="全部类型" value="" />
              <el-option v-for="(label, key) in MO_TYPE" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
          <el-form-item label="下单时间">
            <span class="mo-date-range">
              <el-date-picker v-model="createStartTime" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" clearable />
              <i class="mo-date-sep">至</i>
              <el-date-picker v-model="createEndTime" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" clearable />
            </span>
          </el-form-item>
          <el-form-item label="支付时间">
            <span class="mo-date-range">
              <el-date-picker v-model="paySuccessStartTime" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" clearable />
              <i class="mo-date-sep">至</i>
              <el-date-picker v-model="paySuccessEndTime" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" clearable />
            </span>
          </el-form-item>
        </div>
        <el-form-item class="mall-query-actions">
          <el-button @click="resetForm">重置</el-button>
          <el-button type="primary" native-type="submit">
            <el-icon><Search /></el-icon>查询
          </el-button>
        </el-form-item>
      </el-form>
      <div class="mall-business-actions">
        <el-button :loading="exporting" @click="exportCsv">
          <el-icon><Document /></el-icon>导出 CSV
        </el-button>
      </div>
    </section>

    <section class="mall-table-panel">
      <el-table
        data-ym-table="r36"
        v-loading="loading"
        :data="orderList"
        row-key="id"
        style="width: 100%"
        :default-sort="{ prop: sortConfig.prop, order: sortConfig.order === 'asc' ? 'ascending' : 'descending' }"
        @sort-change="handleSortChange"
      >
        <el-table-column label="订单编号" width="200" align="center">
          <template #default="{ row }">
            <div class="mo-stack">
              <span class="mono"><CopyableText :value="row.orderNo" label="订单编号" /></span>
              <small class="cell-sub">
                <span class="status-ticket is-small" :class="`tone-${MO_TYPE_TONE[String(row.orderType)] || 'neutral'}`">
                  {{ MO_TYPE[String(row.orderType)] || '普通订单' }}
                </span>
              </small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" prop="createTime" sortable="custom" width="176" align="center">
          <template #default="{ row }">{{ row.createTime || '—' }}</template>
        </el-table-column>
        <el-table-column label="实付金额" width="110" align="center">
          <template #default="{ row }">
            <span class="amount-strong">{{ moMoney(row.finalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="140" align="center">
          <template #default="{ row }">
            <div class="mo-stack">
              <span class="status-ticket" :class="`tone-${MO_STATUS_TONE[String(row.status)] || 'neutral'}`">
                {{ MO_STATUS[String(row.status)] || '—' }}
              </span>
              <small v-if="showProgress(row)" class="cell-sub">
                <span class="status-ticket is-small" :class="`tone-${moProgress(row).tone}`">{{ moProgress(row).label }}</span>
              </small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="售后类型" width="100" align="center">
          <template #default="{ row }">
            <span v-if="hasRefund(row)" class="status-ticket is-small" :class="String(row.refundType) === '2' ? 'tone-warning' : 'tone-info'">
              {{ moRefundType(row.refundType) }}
            </span>
            <template v-else>—</template>
          </template>
        </el-table-column>
        <el-table-column label="买家信息" width="180" align="center">
          <template #default="{ row }">
            <div class="mo-stack">
              <b>{{ row.receiverName || '—' }}</b>
              <small class="cell-sub mono">{{ row.receiverContact || '—' }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="收货地址" min-width="220" align="center">
          <template #default="{ row }">{{ row.receiverFullAddress || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" class-name="mall-actions-column" align="right" header-align="center">
          <template #default="{ row }">
            <div class="mo-row-actions">
              <el-button link type="primary" @click="handleOrderDetail(row)">详情</el-button>
              <el-button v-if="String(row.status) === '2'" link type="primary" @click="handleDeliver(row)">发货</el-button>
              <el-button v-else-if="String(row.status) === '3'" link type="primary" @click="handleDeliver(row)">更新物流</el-button>
              <el-button v-else-if="moCanProcess(row)" link type="primary" @click="handleProcessRefund(row)">售后处理</el-button>
              <el-button v-else-if="moCanReceive(row)" link type="primary" @click="handleReceive(row)">确认收货</el-button>
              <el-dropdown trigger="click" popper-class="mp-row-menu" @command="(cmd) => handleRowCommand(cmd, row)">
                <el-button link type="primary">
                  更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">查看完整详情</el-dropdown-item>
                    <el-dropdown-item v-if="String(row.status) === '2'" command="ship">订单发货</el-dropdown-item>
                    <el-dropdown-item v-if="String(row.status) === '3'" command="ship">更新物流</el-dropdown-item>
                    <el-dropdown-item v-if="moCanProcess(row)" command="process">售后处理</el-dropdown-item>
                    <el-dropdown-item v-if="moCanReceive(row)" command="receive">确认收货</el-dropdown-item>
                    <el-dropdown-item v-if="hasRefund(row)" command="records">退款记录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="mo-empty">
            <el-icon><Tickets /></el-icon>
            <b>没有匹配的订单</b>
            <span>修改筛选条件后重新查询</span>
          </div>
        </template>
      </el-table>

      <MallPagination
        :total="pagination.total"
        :page="pagination.current"
        :limit="pagination.pageSize"
        @pagination="changePage"
      />
    </section>

    <!-- 订单详情抽屉 900px -->
    <el-drawer
      v-model="detailVisible"
      size="900px"
      class="mo-detail-drawer"
      :with-header="false"
      :show-close="false"
      @closed="resetDetail"
    >
      <div v-loading="detailLoading" class="mo-detail-body">
      <template v-if="currentOrder">
        <div class="drawer-head">
          <div>
            <span class="drawer-kicker">ORDER DETAIL</span>
            <h2>订单详情</h2>
          </div>
          <button type="button" class="mo-close-btn" @click="detailVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="order-detail-heading">
          <div>
            <span>订单编号</span>
            <b class="mono"><CopyableText :value="currentOrder.orderNo" label="订单编号" /></b>
          </div>
          <span class="status-ticket" :class="`tone-${MO_STATUS_TONE[String(currentOrder.status)] || 'neutral'}`">
            {{ MO_STATUS[String(currentOrder.status)] || '—' }}
          </span>
        </div>

        <div class="drawer-section">
          <h3>订单信息</h3>
          <div class="description-grid">
            <div><span>订单类型</span><b>{{ MO_TYPE[String(currentOrder.orderType)] || '—' }}</b></div>
            <div><span>下单时间</span><b>{{ currentOrder.createTime || '—' }}</b></div>
            <div><span>支付时间</span><b>{{ currentOrder.paySuccessTime || '—' }}</b></div>
            <div><span>是否已评价</span><b>{{ currentOrder.isReviewed ? '已评价' : '未评价' }}</b></div>
            <div><span>收款模式</span><b>{{ MO_COLLECTION[String(currentOrder.collectionMode)] || '—' }}</b></div>
            <div><span>结算模式</span><b>{{ MO_SETTLEMENT[String(currentOrder.settlementMode)] || '—' }}</b></div>
            <div><span>支付通道</span><b>{{ currentOrder.paymentChannelCode || '—' }}</b></div>
            <div v-if="currentOrder.buyerRemark" class="wide"><span>买家备注</span><b>{{ currentOrder.buyerRemark }}</b></div>
            <div v-if="currentOrder.closeTime" class="wide"><span>关闭信息</span><b>{{ currentOrder.closeTime }} · {{ currentOrder.closeReason }}</b></div>
            <div v-if="currentOrder.groupBuyInfo" class="wide">
              <span>拼团信息</span>
              <b>团号 {{ currentOrder.groupBuyInfo.groupNo }} · {{ MO_GROUP_STATUS[String(currentOrder.groupBuyInfo.groupStatus)] || '—' }} · {{ currentOrder.groupBuyInfo.memberCount }}/{{ currentOrder.groupBuyInfo.minPeople }} 人{{ currentOrder.groupBuyInfo.leader ? ' · 团长' : '' }}</b>
            </div>
          </div>
        </div>

        <div class="drawer-section">
          <h3>金额信息</h3>
          <div class="order-money">
            <span>商品总额<b>{{ moMoney(currentOrder.totalAmount) }}</b></span>
            <span>优惠金额<b>-{{ moMoney(currentOrder.discountAmount) }}</b></span>
            <span>网关扣款<b>{{ moMoney(currentOrder.payAmount) }}</b></span>
            <span class="total">实付金额<b>{{ moMoney(currentOrder.finalAmount) }}</b></span>
          </div>
        </div>

        <div v-if="hasRefund(currentOrder)" class="drawer-section">
          <h3>售后信息</h3>
          <div class="description-grid">
            <div><span>售后类型</span><b>{{ moRefundType(currentOrder.refundType) }}</b></div>
            <div>
              <span>退款状态</span>
              <b><span class="status-ticket is-small" :class="`tone-${MO_REFUND_TONE[String(currentOrder.refundStatus)] || 'neutral'}`">{{ MO_REFUND_STATUS[String(currentOrder.refundStatus)] || '—' }}</span></b>
            </div>
            <div>
              <span>售后进度</span>
              <b><span class="status-ticket is-small" :class="`tone-${moProgress(currentOrder).tone}`">{{ moProgress(currentOrder).label }}</span></b>
            </div>
            <div><span>申请时间</span><b>{{ currentOrder.refundApplyTime || '—' }}</b></div>
            <div class="wide"><span>退款原因</span><b>{{ currentOrder.refundApplyReason || '—' }}</b></div>
            <div v-if="currentOrder.refundApplyDescription" class="wide"><span>补充说明</span><b>{{ currentOrder.refundApplyDescription }}</b></div>
            <div v-if="currentOrder.refundConfirmTime" class="wide"><span>商家同意</span><b>{{ currentOrder.refundConfirmTime }} · {{ currentOrder.refundConfirmRemark || '同意退款' }}</b></div>
            <div v-if="currentOrder.refundRejectTime" class="wide"><span>商家驳回</span><b>{{ currentOrder.refundRejectTime }} · {{ currentOrder.refundRejectReason }}</b></div>
            <div v-if="currentOrder.refundSuccessTime" class="wide"><span>退款成功</span><b>{{ currentOrder.refundSuccessTime }} · {{ currentOrder.refundSummary }}</b></div>
            <div v-if="refundImages.length" class="wide">
              <span>退款凭证</span>
              <b class="mo-evidence">
                <span v-for="(img, i) in refundImages" :key="i" class="mo-evidence-item">
                  <StorageImage :src="img" :width="72" :height="72" />
                </span>
              </b>
            </div>
          </div>

          <div v-if="String(currentOrder.refundType) === '2'" class="mo-return-block">
            <h4>退货物流</h4>
            <div class="description-grid">
              <div><span>快递公司</span><b>{{ currentOrder.returnDeliveryProviderName || '待买家回填' }}</b></div>
              <div><span>退货单号</span><b class="mono">{{ currentOrder.returnTrackingNo || '待买家回填' }}</b></div>
              <div><span>退货发货时间</span><b>{{ currentOrder.returnShipTime || '—' }}</b></div>
              <div><span>商家收货时间</span><b>{{ currentOrder.returnReceiveTime || '—' }}</b></div>
            </div>
            <div v-if="returnTracking.length" class="operation-timeline mo-track">
              <div v-for="(t, i) in returnTracking" :key="i">
                <i></i>
                <span><b>{{ t.content }}</b><small>{{ t.time }}</small></span>
              </div>
            </div>
          </div>

          <div class="mo-timeline-wrap">
            <h4>协商处理记录</h4>
            <div v-if="moTimeline(currentOrder).length" class="operation-timeline">
              <div v-for="(s, i) in moTimeline(currentOrder)" :key="i">
                <i></i>
                <span><b>{{ s.label }}</b><small>{{ s.time }}{{ s.text ? ` · ${s.text}` : '' }}</small></span>
              </div>
            </div>
            <p v-else class="mo-muted">暂无售后协商记录</p>
          </div>
        </div>

        <div class="drawer-section">
          <h3>收货地址</h3>
          <div class="description-grid">
            <div><span>收货人</span><b>{{ currentOrder.receiverName || '—' }}</b></div>
            <div><span>联系方式</span><b class="mono">{{ currentOrder.receiverContact || '—' }}</b></div>
            <div><span>省市区</span><b>{{ currentOrder.receiverProvinceName }} {{ currentOrder.receiverCityName }} {{ currentOrder.receiverDistrictName }}</b></div>
            <div><span>邮政编码</span><b>{{ currentOrder.receiverPostalCode || '—' }}</b></div>
            <div class="wide"><span>详细地址</span><b>{{ currentOrder.receiverDetailAddress || '—' }}</b></div>
          </div>
        </div>

        <div v-if="currentOrder.shipperFullAddress" class="drawer-section">
          <h3>发货地址</h3>
          <div class="description-grid">
            <div><span>发货方</span><b>{{ currentOrder.shipperName || '—' }}</b></div>
            <div><span>联系方式</span><b>{{ currentOrder.shipperContact || '—' }}</b></div>
            <div class="wide"><span>发货地址</span><b>{{ currentOrder.shipperFullAddress }}</b></div>
          </div>
        </div>

        <div class="drawer-section">
          <h3>商品信息</h3>
          <el-table data-ym-table="r37" :data="orderItems" class="mo-items-table" style="width: 100%">
            <el-table-column label="商品图片" width="80" align="center">
              <template #default="{ row }">
                <span class="mo-item-art"><StorageImage :src="row.spuMainImage" :width="56" :height="56" /></span>
              </template>
            </el-table-column>
            <el-table-column label="商品信息" min-width="160" align="center">
              <template #default="{ row }">
                <div class="mo-stack">
                  <b>{{ row.spuName || '—' }}</b>
                  <small class="cell-sub">{{ specText(row) }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="70" align="center">
              <template #default="{ row }">{{ row.quantity }}</template>
            </el-table-column>
            <el-table-column label="单价" width="100" align="center">
              <template #default="{ row }">{{ moMoney(row.price) }}</template>
            </el-table-column>
            <el-table-column label="小计" width="110" align="center">
              <template #default="{ row }">{{ moMoney(Number(row.price || 0) * Number(row.quantity || 0)) }}</template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="currentOrder.trackingNo" class="drawer-section">
          <h3>快递信息</h3>
          <div class="description-grid">
            <div><span>快递公司</span><b>{{ currentOrder.deliveryProviderName || '—' }}</b></div>
            <div><span>快递单号</span><b class="mono">{{ currentOrder.trackingNo }}</b></div>
            <div><span>发货时间</span><b>{{ currentOrder.shipTime || '—' }}</b></div>
            <div><span>签收时间</span><b>{{ currentOrder.receiveTime || '—' }}</b></div>
          </div>
          <div v-if="deliveryTracking.length" class="operation-timeline mo-track">
            <div v-for="(t, i) in deliveryTracking" :key="i">
              <i></i>
              <span><b>{{ t.content }}</b><small>{{ t.time }}</small></span>
            </div>
          </div>
          <el-button class="mo-track-query" :loading="trackingLoading" @click="handleManualQueryDelivery">手动查询快递</el-button>
        </div>

        <div class="drawer-actions">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button v-if="String(currentOrder.status) === '2'" type="primary" @click="openShipFromDetail">发货</el-button>
          <el-button v-if="moCanProcess(currentOrder)" type="primary" @click="openProcessFromDetail">售后处理</el-button>
          <el-button v-if="moCanReceive(currentOrder)" type="primary" @click="openReceiveFromDetail">确认收货</el-button>
          <el-button v-if="hasRefund(currentOrder)" @click="openRecordsFromDetail">退款记录</el-button>
        </div>
      </template>
      </div>
    </el-drawer>

    <!-- 发货 / 更新物流 600px -->
    <el-dialog
      v-model="shipVisible"
      width="600px"
      class="mo-dialog mo-ship-dialog"
      append-to-body
      destroy-on-close
      :show-close="false"
    >
      <template #header>
        <div class="dialog-head">
          <div>
            <span class="drawer-kicker">FULFILLMENT</span>
            <h2>{{ shipAction === 'deliver' ? '订单发货' : '更新物流' }}</h2>
          </div>
          <button type="button" class="mo-close-btn" @click="shipVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>
      <div class="shipping-order"><span>订单编号</span><b class="mono">{{ deliverForm.orderNo }}</b></div>
      <div class="dialog-field">
        <span>快递公司</span>
        <el-select v-model="deliverForm.deliveryCompany" filterable placeholder="选择快递公司" style="width: 100%">
          <el-option v-for="p in providers" :key="p.code" :label="`${p.name} · ${p.code}`" :value="p.code" />
        </el-select>
      </div>
      <div class="dialog-field">
        <span>快递单号</span>
        <el-input v-model="deliverForm.deliveryNo" placeholder="请输入快递单号" />
      </div>
      <div class="dialog-hint">
        <el-icon><Van /></el-icon>
        <span>{{ shipAction === 'deliver' ? '发货后买家将看到物流公司与单号。' : '更新后买家将看到最新物流信息。' }}</span>
      </div>
      <div class="dialog-actions">
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" :loading="deliverLoading" @click="handleSubmitDeliver">
          {{ shipAction === 'deliver' ? '确认发货' : '保存更新' }}
        </el-button>
      </div>
    </el-dialog>

    <!-- 售后处理 600px -->
    <el-dialog
      v-model="processVisible"
      width="600px"
      class="mo-dialog mo-process-dialog"
      append-to-body
      destroy-on-close
      :show-close="false"
    >
      <template #header>
        <div class="dialog-head">
          <div>
            <span class="drawer-kicker">AFTER SALES</span>
            <h2>售后处理</h2>
          </div>
          <button type="button" class="mo-close-btn" @click="processVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>
      <div class="shipping-order"><span>订单编号</span><b class="mono">{{ processForm.orderNo }}</b></div>
      <div v-loading="processDetailLoading" class="description-grid mo-process-context">
        <div><span>售后类型</span><b>{{ moRefundType(processContext.order.refundType) }}</b></div>
        <div><span>实付金额</span><b>{{ moMoney(processContext.order.finalAmount) }}</b></div>
        <div class="wide"><span>退款原因</span><b>{{ processContext.order.refundApplyReason || '—' }}</b></div>
        <div v-if="processContext.order.refundApplyDescription" class="wide"><span>补充说明</span><b>{{ processContext.order.refundApplyDescription }}</b></div>
        <div v-if="processContext.refundImages.length" class="wide">
          <span>退款凭证</span>
          <b class="mo-evidence">
            <span v-for="(img, i) in processContext.refundImages" :key="i" class="mo-evidence-item">
              <StorageImage :src="img" :width="72" :height="72" />
            </span>
          </b>
        </div>
      </div>
      <div v-if="String(processContext.order.refundType) === '2'" class="dialog-hint">
        <el-icon><Van /></el-icon>
        <span>退货退款：同意后将等待买家寄回并回填退货物流，您确认收货后触发退款。</span>
      </div>
      <div class="mo-process-form">
        <div class="dialog-field">
          <span>处理方式</span>
          <el-radio-group v-model="processForm.action" class="mo-radio-group" @change="processForm.remark = ''">
            <el-radio value="confirm">同意退款</el-radio>
            <el-radio value="reject">驳回申请</el-radio>
          </el-radio-group>
        </div>
        <div class="dialog-field">
          <span>{{ processForm.action === 'confirm' ? '处理备注' : '驳回原因' }}</span>
          <el-input
            v-model="processForm.remark"
            type="textarea"
            :rows="3"
            :placeholder="processForm.action === 'confirm' ? '选填，记录处理说明' : '请填写驳回原因'"
          />
        </div>
      </div>
      <div class="dialog-actions">
        <el-button @click="processVisible = false">取消</el-button>
        <el-button v-if="processForm.action === 'confirm'" type="primary" :loading="processLoading" @click="handleSubmitProcess">同意退款</el-button>
        <el-button v-else class="mo-danger-btn" :loading="processLoading" @click="handleSubmitProcess">驳回申请</el-button>
      </div>
    </el-dialog>

    <!-- 确认收货 500px -->
    <el-dialog
      v-model="receiveVisible"
      width="500px"
      class="mo-dialog mo-receive-dialog"
      append-to-body
      destroy-on-close
      :show-close="false"
    >
      <template #header>
        <div class="dialog-head">
          <div>
            <span class="drawer-kicker">RETURN RECEIVE</span>
            <h2>确认收货</h2>
          </div>
          <button type="button" class="mo-close-btn" @click="receiveVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>
      <div class="shipping-order"><span>订单编号</span><b class="mono">{{ receiveForm.orderNo }}</b></div>
      <div class="description-grid mo-process-context">
        <div><span>退货快递公司</span><b>{{ receiveContext.returnDeliveryProviderName || '—' }}</b></div>
        <div><span>退货单号</span><b class="mono">{{ receiveContext.returnTrackingNo || '—' }}</b></div>
        <div><span>退货发货时间</span><b>{{ receiveContext.returnShipTime || '—' }}</b></div>
      </div>
      <div class="dialog-hint">
        <el-icon><Goods /></el-icon>
        <span>确认收到退回商品后将触发退款，退款原路退回买家。</span>
      </div>
      <div class="dialog-field">
        <span>收货备注</span>
        <el-input v-model="receiveForm.remark" type="textarea" :rows="3" placeholder="选填，记录收货说明" />
      </div>
      <div class="dialog-actions">
        <el-button @click="receiveVisible = false">取消</el-button>
        <el-button type="primary" :loading="receiveLoading" @click="handleSubmitReceive">确认收货并退款</el-button>
      </div>
    </el-dialog>

    <!-- 退款记录 900px -->
    <el-dialog
      v-model="recordsVisible"
      width="900px"
      class="mo-dialog mo-records-dialog"
      append-to-body
      destroy-on-close
      :show-close="false"
    >
      <template #header>
        <div class="dialog-head">
          <div>
            <span class="drawer-kicker">REFUND RECORDS</span>
            <h2>退款记录</h2>
          </div>
          <button type="button" class="mo-close-btn" @click="recordsVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>
      <div class="shipping-order">
        <span>订单编号</span>
        <b class="mono"><CopyableText :value="currentRefundOrder.orderNo" label="订单编号" /></b>
      </div>
      <el-table
        data-ym-table="r38"
        v-loading="recordsLoading"
        :data="refundRecords"
        class="mo-records-table"
        style="width: 100%"
      >
        <el-table-column label="退款编号" min-width="150" align="center">
          <template #default="{ row }"><span class="mono">{{ row.refundNo }}</span></template>
        </el-table-column>
        <el-table-column label="总金额" width="80" align="center">
          <template #default="{ row }">{{ moMoney(row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column label="退款金额" width="80" align="center">
          <template #default="{ row }">{{ moMoney(row.refundAmount) }}</template>
        </el-table-column>
        <el-table-column label="退款状态" width="96" align="center">
          <template #default="{ row }">
            <span class="status-ticket is-small" :class="`tone-${MO_REFUND_RECORD_TONE[row.refundStatus] || 'info'}`">
              {{ MO_REFUND_RECORD_STATUS[row.refundStatus] || row.refundStatus }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="退款原因" min-width="112" align="center">
          <template #default="{ row }">{{ row.refundReason || '—' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="138" align="center">
          <template #default="{ row }">{{ row.createTime || '—' }}</template>
        </el-table-column>
        <el-table-column label="成功时间" width="138" align="center">
          <template #default="{ row }">{{ row.successTime || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="70" fixed="right" class-name="mall-actions-column" align="right" header-align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewRefundDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="mo-empty">
            <el-icon><Tickets /></el-icon>
            <b>暂无退款执行记录</b>
            <span>退款同意后由支付网关异步处理</span>
          </div>
        </template>
      </el-table>
      <div class="dialog-actions">
        <el-button @click="recordsVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 退款记录详情 700px -->
    <el-dialog
      v-model="recordDetailVisible"
      width="700px"
      class="mo-dialog mo-record-detail-dialog"
      append-to-body
      destroy-on-close
      :show-close="false"
    >
      <template #header>
        <div class="dialog-head">
          <div>
            <span class="drawer-kicker">REFUND DETAIL</span>
            <h2>退款记录详情</h2>
          </div>
          <button type="button" class="mo-close-btn" @click="recordDetailVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>
      <div v-loading="recordDetailLoading" class="description-grid">
        <div><span>退款编号</span><b class="mono">{{ currentRefundDetail.refundNo }}</b></div>
        <div>
          <span>退款状态</span>
          <b><span class="status-ticket is-small" :class="`tone-${MO_REFUND_RECORD_TONE[currentRefundDetail.refundStatus] || 'info'}`">{{ MO_REFUND_RECORD_STATUS[currentRefundDetail.refundStatus] || currentRefundDetail.refundStatus }}</span></b>
        </div>
        <div><span>总金额</span><b>{{ moMoney(currentRefundDetail.totalAmount) }}</b></div>
        <div><span>退款金额</span><b>{{ moMoney(currentRefundDetail.refundAmount) }}</b></div>
        <div><span>实际总金额</span><b>{{ moMoney(currentRefundDetail.realTotalAmount) }}</b></div>
        <div><span>实际退款金额</span><b>{{ moMoney(currentRefundDetail.realRefundAmount) }}</b></div>
        <div><span>入账账户</span><b>{{ currentRefundDetail.userReceivedAccount || '—' }}</b></div>
        <div><span>创建时间</span><b>{{ currentRefundDetail.createTime || '—' }}</b></div>
        <div><span>成功时间</span><b>{{ currentRefundDetail.successTime || '—' }}</b></div>
        <div class="wide"><span>退款原因</span><b>{{ currentRefundDetail.refundReason || '—' }}</b></div>
        <div class="wide"><span>网关摘要</span><b>{{ currentRefundDetail.summary || '—' }}</b></div>
      </div>
      <div class="dialog-actions">
        <el-button @click="recordDetailVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Document, Close, Tickets, Van, Goods, ArrowDown } from '@element-plus/icons-vue'
import {
  queryOrderList, getOrderDetail, deliverOrder, updateShipInfo, queryTracking,
  confirmRefund, rejectRefund, confirmReturnReceive, queryReturnTracking,
  queryRefundRecords, getRefundDetail
} from '@/api/mall/order'
import { queryDeliveryProviderList } from '@/api/mall/shipping'
import CopyableText from '@/components/mall/CopyableText.vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import StorageImage from '@/components/mall/StorageImage.vue'
import { csvCell } from '../seckill/insight-shared'
import '@/assets/yeah-mall-order.css'

defineOptions({ name: 'MallOrderManage' })

const route = useRoute()
const router = useRouter()

// ===== 与原型 MerchantOrders 一致的口径 =====
const MO_STATUS = { '1': '待付款', '2': '待发货', '3': '待收货', '4': '交易成功', '5': '交易关闭', '6': '退款', '7': '售后', '8': '待成团' }
const MO_STATUS_TONE = { '1': 'warning', '2': 'warning', '3': 'info', '4': 'success', '5': 'neutral', '6': 'danger', '7': 'danger', '8': 'neutral' }
const MO_REFUND_STATUS = { '0': '无', '1': '申请中', '2': '处理中', '3': '退款成功', '4': '已拒绝', '5': '退款失败' }
const MO_REFUND_TONE = { '0': 'neutral', '1': 'warning', '2': 'info', '3': 'success', '4': 'danger', '5': 'danger' }
const MO_TYPE = { '1': '普通订单', '2': '秒杀订单', '3': '拼团订单' }
const MO_TYPE_TONE = { '1': 'neutral', '2': 'danger', '3': 'success' }
const MO_GROUP_STATUS = { '1': '待团长支付', '2': '拼团中', '3': '已成团', '4': '拼团失败', '5': '已关闭' }
const MO_COLLECTION = { '1': '平台普通商户直收', '2': '服务商代子商户收款', '3': '独立店铺普通商户直收' }
const MO_SETTLEMENT = { '1': '平台线下结算', '2': '微信分账', '3': '无需二次结算' }
const MO_REFUND_RECORD_STATUS = { SUCCESS: '退款成功', CLOSED: '退款关闭', PROCESSING: '退款处理中', ABNORMAL: '退款异常' }
const MO_REFUND_RECORD_TONE = { SUCCESS: 'success', CLOSED: 'info', PROCESSING: 'warning', ABNORMAL: 'danger' }

const moRefundType = (t) => String(t) === '2' ? '退货退款' : String(t) === '1' ? '仅退款' : '—'
const moMoney = (n) => `¥${Number(n || 0).toFixed(2)}`
const hasRefund = (o) => !!o && String(o.refundStatus ?? '0') !== '0'
const showProgress = (o) => (String(o.status) === '6' || String(o.status) === '7') && hasRefund(o)
const moCanProcess = (o) => String(o.status) === '6' && (String(o.refundStatus) === '1' || String(o.refundStatus) === '5')
const moCanReceive = (o) => String(o.status) === '6' && String(o.refundType) === '2' && String(o.refundStatus) === '2' && !!o.returnTrackingNo && !o.returnReceiveTime

const moProgress = (o) => {
  const rs = String(o.refundStatus ?? '0')
  if (rs === '1') return { label: '待商家审核', tone: 'warning' }
  if (rs === '4') return { label: '已驳回', tone: 'danger' }
  if (rs === '5') return { label: '退款失败', tone: 'danger' }
  if (rs === '3') return { label: '退款成功', tone: 'success' }
  if (rs === '2') {
    if (String(o.refundType) === '2') {
      if (!o.returnTrackingNo) return { label: '待买家退货', tone: 'info' }
      if (!o.returnReceiveTime) return { label: '待商家确认收货', tone: 'warning' }
      return { label: '退款中', tone: 'info' }
    }
    return { label: '退款中', tone: 'info' }
  }
  return { label: '—', tone: 'neutral' }
}

const moTimeline = (o) => {
  const steps = []
  if (o.refundApplyTime) steps.push({ label: '买家申请售后', time: o.refundApplyTime, text: `${moRefundType(o.refundType)} · ${o.refundApplyReason || ''}` })
  if (o.refundConfirmTime) steps.push({ label: '商家同意', time: o.refundConfirmTime, text: o.refundConfirmRemark || '同意退款' })
  if (o.refundRejectTime) steps.push({ label: '商家驳回', time: o.refundRejectTime, text: o.refundRejectReason || '' })
  if (o.returnShipTime) steps.push({ label: '买家退货', time: o.returnShipTime, text: `${o.returnDeliveryProviderName || ''} ${o.returnTrackingNo || ''}`.trim() })
  if (o.returnReceiveTime) steps.push({ label: '商家确认收货', time: o.returnReceiveTime, text: '已收到退回商品，触发退款' })
  if (o.refundSuccessTime) steps.push({ label: '退款成功', time: o.refundSuccessTime, text: o.refundSummary || '已原路退回' })
  return steps
}

const specText = (row) => (row.specs || []).map((s) => s.optName).filter(Boolean).join(' / ') || '—'

const nowText = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// ===== 列表 =====
const loading = ref(false)
const exporting = ref(false)
const orderList = ref([])
const searchForm = reactive({ orderNo: '', status: '', refundStatus: '', refundType: '', orderType: '' })
const createStartTime = ref('')
const createEndTime = ref('')
const paySuccessStartTime = ref('')
const paySuccessEndTime = ref('')
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const sortConfig = reactive({ prop: 'createTime', order: 'desc' })

const buildQueryParams = () => {
  const isRefundPending = searchForm.refundStatus === 'pending'
  const params = {
    orderNo: searchForm.orderNo || undefined,
    status: searchForm.status || undefined,
    refundStatus: isRefundPending ? undefined : (searchForm.refundStatus || undefined),
    refundPending: isRefundPending ? true : undefined,
    refundType: searchForm.refundType || undefined,
    orderType: searchForm.orderType || undefined,
    conditions_: `${sortConfig.prop}:sort:${sortConfig.order}`
  }
  if (createStartTime.value && createEndTime.value) {
    params['createTime[0]'] = createStartTime.value
    params['createTime[1]'] = createEndTime.value
  }
  if (paySuccessStartTime.value && paySuccessEndTime.value) {
    params['paySuccessTime[0]'] = paySuccessStartTime.value
    params['paySuccessTime[1]'] = paySuccessEndTime.value
  }
  return params
}

const getOrderList = async () => {
  try {
    loading.value = true
    const response = await queryOrderList({
      ...buildQueryParams(),
      current: pagination.current,
      size: pagination.pageSize
    })
    if (response.code === 0 && response.data) {
      orderList.value = response.data.records || []
      pagination.total = parseInt(response.data.total) || 0
    } else {
      orderList.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
    orderList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const applyRouteFilters = () => {
  Object.assign(searchForm, {
    orderNo: '',
    status: typeof route.query.status === 'string' ? route.query.status : '',
    refundStatus: typeof route.query.refundStatus === 'string' ? route.query.refundStatus : '',
    refundType: '',
    orderType: ''
  })
  createStartTime.value = typeof route.query.createStartTime === 'string' ? route.query.createStartTime : ''
  createEndTime.value = typeof route.query.createEndTime === 'string' ? route.query.createEndTime : ''
  paySuccessStartTime.value = typeof route.query.paySuccessStartTime === 'string' ? route.query.paySuccessStartTime : ''
  paySuccessEndTime.value = typeof route.query.paySuccessEndTime === 'string' ? route.query.paySuccessEndTime : ''
  sortConfig.prop = paySuccessStartTime.value && paySuccessEndTime.value ? 'paySuccessTime' : 'createTime'
  sortConfig.order = 'desc'
  pagination.current = 1
  getOrderList()
}

const validateTimeRange = (label, startTime, endTime) => {
  if (!startTime && !endTime) return true
  if (!startTime || !endTime) {
    ElMessage.warning(`请完整选择${label}`)
    return false
  }
  if (startTime > endTime) {
    ElMessage.warning(`${label}开始时间不能晚于结束时间`)
    return false
  }
  return true
}

const handleSearch = () => {
  if (!validateTimeRange('下单时间', createStartTime.value, createEndTime.value)
    || !validateTimeRange('支付时间', paySuccessStartTime.value, paySuccessEndTime.value)) {
    return
  }
  pagination.current = 1
  getOrderList()
}

const resetForm = () => {
  if (route.query.status || route.query.refundStatus || route.query.createStartTime
    || route.query.createEndTime || route.query.paySuccessStartTime || route.query.paySuccessEndTime) {
    router.replace({ path: route.path })
    return
  }
  Object.assign(searchForm, { orderNo: '', status: '', refundStatus: '', refundType: '', orderType: '' })
  createStartTime.value = ''
  createEndTime.value = ''
  paySuccessStartTime.value = ''
  paySuccessEndTime.value = ''
  pagination.current = 1
  getOrderList()
}

const handleSortChange = ({ prop, order }) => {
  if ((prop === 'createTime' || prop === 'paySuccessTime') && order) {
    sortConfig.prop = prop
    sortConfig.order = order === 'ascending' ? 'asc' : 'desc'
    getOrderList()
  }
}

const changePage = ({ page, limit }) => {
  pagination.current = page
  pagination.pageSize = limit
  getOrderList()
}

// ===== 导出 CSV（与原型同口径：13 列 + BOM + 合计行）=====
const exportCsv = async () => {
  if (!pagination.total) {
    ElMessage.warning('当前筛选暂无订单可导出')
    return
  }
  try {
    exporting.value = true
    const response = await queryOrderList({
      ...buildQueryParams(),
      current: 1,
      size: Math.max(pagination.total, 1)
    })
    const rows = response.code === 0 ? (response.data?.records || []) : []
    if (!rows.length) {
      ElMessage.warning('当前筛选暂无订单可导出')
      return
    }
    const header = ['订单编号', '订单类型', '下单时间', '支付时间', '商品总额', '优惠金额', '实付金额', '订单状态', '售后类型', '售后进度', '收货人', '联系方式', '收货地址']
    const lines = [header.join(',')].concat(rows.map((o) => [
      o.orderNo,
      MO_TYPE[String(o.orderType)] || '普通订单',
      o.createTime,
      o.paySuccessTime || '',
      Number(o.totalAmount || 0).toFixed(2),
      Number(o.discountAmount || 0).toFixed(2),
      Number(o.finalAmount || 0).toFixed(2),
      MO_STATUS[String(o.status)] || '',
      hasRefund(o) ? moRefundType(o.refundType) : '—',
      moProgress(o).label,
      o.receiverName,
      o.receiverContact,
      o.receiverFullAddress
    ].map(csvCell).join(',')))
    lines.push('')
    lines.push(['订单数', rows.length, '实付合计', rows.reduce((s, o) => s + Number(o.finalAmount || 0), 0).toFixed(2)].map(csvCell).join(','))
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `商家订单_${nowText().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    ElMessage.success(`已导出 ${rows.length} 笔订单`)
  } catch (error) {
    console.error('导出订单失败:', error)
    ElMessage.error('导出订单失败')
  } finally {
    exporting.value = false
  }
}

// ===== 详情抽屉 =====
const detailVisible = ref(false)
const detailLoading = ref(false)
const trackingLoading = ref(false)
const currentOrder = ref(null)
const orderItems = ref([])
const refundImages = ref([])
const deliveryTracking = ref([])
const returnTracking = ref([])

const mapTracking = (tracking) => {
  if (tracking?.error_code === 0 && tracking.result) {
    return (tracking.result.list || []).map((t) => ({ time: t.datetime || '', content: t.remark || '' }))
  }
  return []
}

const handleOrderDetail = async (row) => {
  detailLoading.value = true
  currentOrder.value = null
  orderItems.value = []
  refundImages.value = []
  deliveryTracking.value = []
  returnTracking.value = []
  detailVisible.value = true
  try {
    const response = await getOrderDetail(row.id)
    if (response.code !== 0 || !response.data?.order) {
      throw new Error(response.message || '订单详情不存在')
    }
    const orderData = response.data.order
    orderData.groupBuyInfo = response.data.groupBuyInfo || null
    refundImages.value = response.data.refundImages || []
    orderItems.value = response.data.shopProducts || []
    deliveryTracking.value = mapTracking(response.data.deliveryTracking)
    currentOrder.value = orderData
    if (String(orderData.refundType) === '2' && orderData.returnTrackingNo) {
      try {
        const res = await queryReturnTracking(orderData.id)
        returnTracking.value = mapTracking(res.code === 0 ? (res.data?.deliveryTracking || res.data) : null)
      } catch {
        returnTracking.value = []
      }
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

const resetDetail = () => {
  currentOrder.value = null
  orderItems.value = []
  refundImages.value = []
  deliveryTracking.value = []
  returnTracking.value = []
}

const handleManualQueryDelivery = async () => {
  if (!currentOrder.value) return
  try {
    trackingLoading.value = true
    const response = await queryTracking(currentOrder.value.id)
    const tracking = response.data?.deliveryTracking || response.data
    const list = mapTracking(tracking)
    if (response.code === 0 && list.length) {
      deliveryTracking.value = list
      ElMessage.success('快递查询成功')
    } else {
      ElMessage.error(response.message || '快递查询失败')
    }
  } catch (error) {
    console.error('快递查询失败:', error)
    ElMessage.error('快递查询失败')
  } finally {
    trackingLoading.value = false
  }
}

// ===== 发货 / 更新物流 =====
const shipVisible = ref(false)
const shipAction = ref('deliver')
const deliverLoading = ref(false)
const providers = ref([])
const deliverForm = reactive({ orderId: '', orderNo: '', deliveryCompany: '', deliveryNo: '' })

const getLogisticsList = async (searchKeyword = '') => {
  try {
    const conditions = []
    if (searchKeyword) conditions.push(`name:like:${searchKeyword}`)
    conditions.push('isPopular:sort:desc')
    conditions.push('updateTime:sort:desc')
    const response = await queryDeliveryProviderList({ size: 100, conditions_: conditions.join(';') })
    if (response.code === 0 && response.data) {
      providers.value = response.data.records || response.data || []
    }
  } catch (error) {
    console.error('获取快递公司失败:', error)
  }
}

const handleDeliver = async (row) => {
  shipAction.value = row.trackingNo || String(row.status) === '3' ? 'update' : 'deliver'
  Object.assign(deliverForm, {
    orderId: row.id,
    orderNo: row.orderNo,
    deliveryCompany: row.deliveryProviderCode || '',
    deliveryNo: row.trackingNo || ''
  })
  await getLogisticsList()
  if (!deliverForm.deliveryCompany) {
    deliverForm.deliveryCompany = providers.value[0]?.code || ''
  }
  shipVisible.value = true
}

const handleSubmitDeliver = async () => {
  if (!deliverForm.deliveryNo.trim()) {
    ElMessage.warning('请输入物流单号')
    return
  }
  if (!deliverForm.deliveryCompany) {
    ElMessage.warning('请选择快递公司')
    return
  }
  try {
    deliverLoading.value = true
    const apiMethod = shipAction.value === 'deliver' ? deliverOrder : updateShipInfo
    const response = await apiMethod({
      orderId: deliverForm.orderId,
      deliveryProviderCode: deliverForm.deliveryCompany,
      trackingNo: deliverForm.deliveryNo.trim()
    })
    if (response.code === 0) {
      shipVisible.value = false
      ElMessage.success(shipAction.value === 'deliver' ? '订单已发货' : '更新发货信息成功')
      getOrderList()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('发货操作失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    deliverLoading.value = false
  }
}

// ===== 售后处理 =====
const processVisible = ref(false)
const processLoading = ref(false)
const processDetailLoading = ref(false)
const processForm = reactive({ orderId: '', orderNo: '', action: 'confirm', remark: '' })
const processContext = ref({ order: {}, refundImages: [] })

const handleProcessRefund = async (row) => {
  Object.assign(processForm, { orderId: row.id, orderNo: row.orderNo, action: 'confirm', remark: '' })
  processContext.value = { order: row, refundImages: [] }
  processVisible.value = true
  processDetailLoading.value = true
  try {
    const response = await getOrderDetail(row.id)
    if (response.code === 0 && response.data?.order) {
      processContext.value = { order: response.data.order, refundImages: response.data.refundImages || [] }
    } else {
      ElMessage.error(response.message || '退款申请信息加载失败')
    }
  } catch (error) {
    console.error('退款申请信息加载失败:', error)
    ElMessage.error('退款申请信息加载失败')
  } finally {
    processDetailLoading.value = false
  }
}

const handleSubmitProcess = async () => {
  if (processForm.action === 'reject' && !processForm.remark.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  try {
    processLoading.value = true
    let response
    if (processForm.action === 'confirm') {
      response = await confirmRefund({ orderId: processForm.orderId, remark: processForm.remark.trim() })
    } else {
      response = await rejectRefund({ orderId: processForm.orderId, reason: processForm.remark.trim() })
    }
    if (response.code === 0) {
      processVisible.value = false
      if (processForm.action === 'confirm') {
        ElMessage.success(String(processContext.value.order.refundType) === '2' ? '已同意，等待买家退货并回填物流' : '已同意退款，退款处理中')
      } else {
        ElMessage.success('已驳回售后申请')
      }
      getOrderList()
    } else {
      ElMessage.error(response.message || '售后处理失败')
    }
  } catch (error) {
    console.error('售后处理失败:', error)
    ElMessage.error('售后处理失败，请重试')
  } finally {
    processLoading.value = false
  }
}

// ===== 确认收货 =====
const receiveVisible = ref(false)
const receiveLoading = ref(false)
const receiveForm = reactive({ orderId: '', orderNo: '', remark: '' })
const receiveContext = ref({})

const handleReceive = (row) => {
  Object.assign(receiveForm, { orderId: row.id, orderNo: row.orderNo, remark: '' })
  receiveContext.value = row
  receiveVisible.value = true
}

const handleSubmitReceive = async () => {
  try {
    receiveLoading.value = true
    const response = await confirmReturnReceive({ orderId: receiveForm.orderId, remark: receiveForm.remark.trim() })
    if (response.code === 0) {
      receiveVisible.value = false
      ElMessage.success('已确认收货，退款成功')
      getOrderList()
    } else {
      ElMessage.error(response.message || '确认收货失败')
    }
  } catch (error) {
    console.error('确认收货失败:', error)
    ElMessage.error('确认收货失败，请重试')
  } finally {
    receiveLoading.value = false
  }
}

// ===== 退款记录 =====
const recordsVisible = ref(false)
const recordsLoading = ref(false)
const currentRefundOrder = ref({})
const refundRecords = ref([])
const recordDetailVisible = ref(false)
const recordDetailLoading = ref(false)
const currentRefundDetail = ref({})

const handleViewRefundRecords = async (row) => {
  currentRefundOrder.value = row
  refundRecords.value = []
  recordsVisible.value = true
  recordsLoading.value = true
  try {
    const response = await queryRefundRecords({ orderId: row.id })
    if (response.code === 0 && response.data) {
      refundRecords.value = response.data.records || response.data || []
    } else {
      refundRecords.value = []
    }
  } catch (error) {
    console.error('获取退款记录失败:', error)
    ElMessage.error('获取退款记录失败')
    refundRecords.value = []
  } finally {
    recordsLoading.value = false
  }
}

const handleViewRefundDetail = async (refundId) => {
  recordDetailLoading.value = true
  try {
    const response = await getRefundDetail(refundId)
    if (response.code === 0 && response.data) {
      currentRefundDetail.value = response.data.data || response.data
      recordDetailVisible.value = true
    } else {
      ElMessage.error('获取退款记录详情失败')
    }
  } catch (error) {
    console.error('获取退款记录详情失败:', error)
    ElMessage.error('获取退款记录详情失败')
  } finally {
    recordDetailLoading.value = false
  }
}

// ===== 行操作 =====
const handleRowCommand = (cmd, row) => {
  if (cmd === 'detail') handleOrderDetail(row)
  else if (cmd === 'ship') handleDeliver(row)
  else if (cmd === 'process') handleProcessRefund(row)
  else if (cmd === 'receive') handleReceive(row)
  else if (cmd === 'records') handleViewRefundRecords(row)
}

const openShipFromDetail = () => {
  const row = currentOrder.value
  detailVisible.value = false
  handleDeliver(row)
}
const openProcessFromDetail = () => {
  const row = currentOrder.value
  detailVisible.value = false
  handleProcessRefund(row)
}
const openReceiveFromDetail = () => {
  const row = currentOrder.value
  detailVisible.value = false
  handleReceive(row)
}
const openRecordsFromDetail = () => {
  const row = currentOrder.value
  detailVisible.value = false
  handleViewRefundRecords(row)
}

watch(() => [route.query.status, route.query.refundStatus, route.query.createStartTime,
  route.query.createEndTime, route.query.paySuccessStartTime, route.query.paySuccessEndTime], () => {
  applyRouteFilters()
})

onMounted(() => {
  applyRouteFilters()
})
</script>