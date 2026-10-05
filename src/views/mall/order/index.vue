<template>
  <div class="order-manage">
    <div class="page-header">
      <h2>订单管理</h2>
    </div>

    <el-card class="search-card">
      <el-form ref="searchFormRef" :model="searchForm" label-position="left" label-width="80px" inline>
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单编号" clearable style="width: 200px;"></el-input>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择订单状态" clearable style="width: 200px;">
            <el-option label="待付款" value="1"></el-option>
            <el-option label="待发货" value="2"></el-option>
            <el-option label="待收货" value="3"></el-option>
            <el-option label="交易成功" value="4"></el-option>
            <el-option label="交易关闭" value="5"></el-option>
            <el-option label="退款" value="6"></el-option>
            <el-option label="售后" value="7"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="退款状态">
          <el-select v-model="searchForm.refundStatus" placeholder="请选择退款状态" clearable style="width: 200px;">
            <el-option label="无" value="0"></el-option>
            <el-option label="申请中" value="1"></el-option>
            <el-option label="处理中" value="2"></el-option>
            <el-option label="退款成功" value="3"></el-option>
            <el-option label="已拒绝" value="4"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="售后状态">
          <el-select v-model="searchForm.afterSaleStatus" placeholder="请选择售后状态" clearable style="width: 200px;">
            <el-option label="无" value="0"></el-option>
            <el-option label="申请中" value="1"></el-option>
            <el-option label="处理中" value="2"></el-option>
            <el-option label="售后完成" value="3"></el-option>
            <el-option label="已驳回" value="4"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="订单类型">
          <el-select v-model="searchForm.orderType" placeholder="请选择订单类型" clearable style="width: 200px;">
            <el-option label="普通订单" value="1"></el-option>
            <el-option label="秒杀订单" value="2"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 300px;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <h3>订单列表</h3>
        </div>
      </template>
      <el-table v-loading="loading" :data="orderList" style="width: 100%" @sort-change="handleSortChange">
        <el-table-column prop="orderNo" label="订单编号" min-width="180"></el-table-column>
        <el-table-column prop="createTime" label="下单时间" min-width="180" sortable="custom"></el-table-column>
        <el-table-column prop="paySuccessTime" label="支付时间" min-width="180" sortable="custom"></el-table-column>
        <el-table-column prop="totalAmount" label="订单金额" min-width="120" align="right">
          <template #default="scope">
            <span>¥{{ scope.row.totalAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderType" label="订单类型" min-width="120">
          <template #default="scope">
            <el-tag :type="getOrderTypeTagType(scope.row.orderType)">{{ getOrderTypeText(scope.row.orderType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" min-width="150">
          <template #default="scope">
            <div class="status-container">
              <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
              <el-tag v-if="scope.row.status === '6' || scope.row.status === 6" :type="getRefundStatusType(scope.row.refundStatus)" size="small" style="margin-left: 5px;">
                {{ getRefundStatusText(scope.row.refundStatus) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="买家信息" min-width="200">
          <template #default="scope">
            <div class="buyer-info">
              <div class="buyer-name">{{ scope.row.receiverName }}</div>
              <div class="buyer-contact">{{ scope.row.receiverContact }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="收货地址" min-width="250">
          <template #default="scope">
            <div class="address-info">
              {{ scope.row.receiverFullAddress }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="400" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleOrderDetail(scope.row)">详情</el-button>
            <el-button size="small" type="primary" v-if="scope.row.status === '2' || scope.row.status === 2" @click="handleDeliver(scope.row)">发货</el-button>
            <el-button size="small" type="primary" v-if="scope.row.status === '3' || scope.row.status === 3" @click="handleDeliver(scope.row)">更新发货信息</el-button>
            <el-button size="small" type="warning" v-if="(scope.row.status === '6' || scope.row.status === 6) && ((scope.row.refundStatus === '1' || scope.row.refundStatus === 1) || (scope.row.refundStatus === '5' || scope.row.refundStatus === 5))" @click="handleProcessRefund(scope.row)">处理退款</el-button>
            <el-button size="small" type="info" v-if="scope.row.refundStatus && scope.row.refundStatus !== '0' && scope.row.refundStatus !== 0" @click="handleViewRefundRecords(scope.row)">退款记录</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container" style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="订单详情" width="900px">
      <el-collapse v-model="activeCollapseNames">
        <el-collapse-item title="订单信息" name="order">
          <div class="detail-section">
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">订单编号：</span>
                <span class="value">{{ currentOrder.orderNo }}</span>
              </div>
              <div class="detail-item">
                <span class="label">订单金额：</span>
                <span class="value amount">¥{{ currentOrder.totalAmount.toFixed(2) }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">订单状态：</span>
                <el-tag :type="getStatusType(currentOrder.status)">{{ getStatusText(currentOrder.status) }}</el-tag>
              </div>
              <div class="detail-item">
                <span class="label">售后状态：</span>
                <el-tag :type="getAfterSaleStatusType(currentOrder.afterSaleStatus)">{{ getAfterSaleStatusText(currentOrder.afterSaleStatus) }}</el-tag>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">下单时间：</span>
                <span class="value">{{ currentOrder.createTime }}</span>
              </div>
              <div class="detail-item">
                <span class="label">支付时间：</span>
                <span class="value">{{ currentOrder.paySuccessTime || '-' }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">支付超时时间：</span>
                <span class="value">{{ currentOrder.payExpireTime || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">是否已评价：</span>
                <span class="value">{{ currentOrder.reviewed ? '是' : '否' }}</span>
              </div>
            </div>
            <div class="detail-row" v-if="currentOrder.closeTime || currentOrder.closeReason">
              <div class="detail-item">
                <span class="label">订单关闭时间：</span>
                <span class="value">{{ currentOrder.closeTime || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">订单关闭原因：</span>
                <span class="value">{{ currentOrder.closeReason || '-' }}</span>
              </div>
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item title="退款信息" name="refund">
          <div class="detail-section">
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">退款状态：</span>
                <el-tag :type="getRefundStatusType(currentOrder.refundStatus)">{{ getRefundStatusText(currentOrder.refundStatus) }}</el-tag>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">退款申请时间：</span>
                <span class="value">{{ currentOrder.refundApplyTime || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">退款申请原因：</span>
                <span class="value">{{ currentOrder.refundApplyReason || '-' }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">退款确认时间：</span>
                <span class="value">{{ currentOrder.refundConfirmTime || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">退款确认备注：</span>
                <span class="value">{{ currentOrder.refundConfirmRemark || '-' }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">拒绝退款时间：</span>
                <span class="value">{{ currentOrder.refundRejectTime || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">拒绝退款原因：</span>
                <span class="value">{{ currentOrder.refundRejectReason || '-' }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">第三方退款成功时间：</span>
                <span class="value">{{ currentOrder.refundSuccessTime || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">第三方退款摘要：</span>
                <span class="value">{{ currentOrder.refundSummary || '-' }}</span>
              </div>
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item title="收货地址" name="receiver">
          <div class="detail-section">
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">收货人：</span>
                <span class="value">{{ currentOrder.receiverName }} {{ currentOrder.receiverContact }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item full-width">
                <span class="label">收货地址：</span>
                <span class="value">{{ currentOrder.receiverFullAddress || (currentOrder.receiverProvinceName + currentOrder.receiverCityName + currentOrder.receiverDistrictName + currentOrder.receiverDetailAddress) }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">邮政编码：</span>
                <span class="value">{{ currentOrder.receiverPostalCode || '-' }}</span>
              </div>
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item title="发货地址" name="shipper" v-if="currentOrder.shipperName || currentOrder.shipperFullAddress">
          <div class="detail-section">
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">发货人：</span>
                <span class="value">{{ currentOrder.shipperName }} {{ currentOrder.shipperContact }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item full-width">
                <span class="label">发货地址：</span>
                <span class="value">{{ currentOrder.shipperFullAddress || (currentOrder.shipperProvinceName + currentOrder.shipperCityName + currentOrder.shipperDistrictName + currentOrder.shipperDetailAddress) }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">邮政编码：</span>
                <span class="value">{{ currentOrder.shipperPostalCode || '-' }}</span>
              </div>
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item title="商品信息" name="products">
          <el-table :data="orderItems" style="width: 100%">
            <el-table-column label="商品图片" width="80">
              <template #default="scope">
                <image-preview :image-list="[{ url: getFullImageUrl(scope.row.spuMainImage) }]">
                  <el-image
                    :src="getFullImageUrl(scope.row.spuMainImage)"
                    fit="cover"
                    style="width: 60px; height: 60px; cursor: pointer;"
                  ></el-image>
                </image-preview>
              </template>
            </el-table-column>
            <el-table-column label="商品信息" min-width="300">
              <template #default="scope">
                <div class="product-info">
                  <div class="product-name">{{ scope.row.spuName }}</div>
                  <div class="product-specs" v-if="scope.row.specs && scope.row.specs.length">
                    <span v-for="(spec, index) in scope.row.specs" :key="spec.specId" class="spec-item">
                      {{ spec.specName }}: {{ spec.optName }}
                      <span v-if="index < scope.row.specs.length - 1" class="spec-separator">|</span>
                    </span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" align="center"></el-table-column>
            <el-table-column prop="price" label="单价" width="100" align="right">
              <template #default="scope">
                <span>¥{{ scope.row.price.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="小计" width="100" align="right">
              <template #default="scope">
                <span>¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>

          <div class="order-summary" style="margin-top: 10px; text-align: right;">
            <div class="summary-item">
              <span>商品总价：</span>
              <span class="amount">¥{{ currentOrder.totalAmount.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <span>运费：</span>
              <span class="amount">¥0.00</span>
            </div>
            <div class="summary-item total">
              <span>实付金额：</span>
              <span class="amount">¥{{ currentOrder.totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item title="快递信息" name="delivery">
          <div v-if="currentOrder.deliveryProviderCode || currentOrder.trackingNo || currentOrder.shipTime" class="detail-section">
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">快递单号：</span>
                <span class="value">{{ currentOrder.trackingNo || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">快递公司：</span>
                <span class="value">
                  {{ (deliveryList.find(item => item.code === currentOrder.deliveryProviderCode)?.name || currentOrder.deliveryProviderCode || '-') }}
                </span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">发货时间：</span>
                <span class="value">{{ currentOrder.shipTime || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">签收时间：</span>
                <span class="value">{{ currentOrder.receiveTime || '-' }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">查询状态：</span>
                <el-tag :type="getQueryStatusType(currentOrder.deliveryQueryStatus)" size="small">
                  {{ getQueryStatusText(currentOrder.deliveryQueryStatus) }}
                </el-tag>
              </div>
              <div class="detail-item">
                <span class="label">快递状态：</span>
                <el-tag :type="getTrackingStatusType(currentOrder.trackingStatusDetail)" size="small">
                  {{ getTrackingStatusText(currentOrder.trackingStatusDetail) }}
                </el-tag>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-item">
                <span class="label">签收超时时间：</span>
                <span class="value">{{ currentOrder.receiveExpireTime || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">最后查询：</span>
                <span class="value">{{ currentOrder.lastQueryTime || '未查询' }}</span>
              </div>
            </div>
            <div class="detail-row" v-if="currentOrder.receiveRemark">
              <div class="detail-item full-width">
                <span class="label">签收备注：</span>
                <span class="value">{{ currentOrder.receiveRemark }}</span>
              </div>
            </div>
            <div style="margin-top: 10px;">
              <el-button
                type="primary"
                size="small"
                @click="handleManualQueryDelivery"
                :loading="queryDeliveryLoading"
              >
                手动查询快递
              </el-button>
            </div>

            <div class="delivery-tracking" style="margin-top: 20px;">
              <h5>快递轨迹</h5>
              <div v-if="deliveryTracking.length > 0" class="tracking-list">
                <div v-for="(track, index) in deliveryTracking" :key="index" :class="['tracking-item', { 'current-node': index === 0 }]">
                  <div class="tracking-time">{{ track.time }}</div>
                  <div class="tracking-content">{{ track.content }}</div>
                </div>
              </div>
              <div v-else class="no-tracking">
                <span>暂无物流轨迹信息</span>
              </div>
            </div>
          </div>
          <div v-else class="no-delivery">
            <span>暂无快递信息</span>
          </div>
        </el-collapse-item>
      </el-collapse>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="deliverDialogVisible" :title="currentDeliverAction === 'deliver' ? '订单发货' : '更新发货信息'" width="600px">
      <el-form ref="deliverFormRef" :model="deliverForm" label-width="100px">
        <el-form-item label="订单编号">
          <el-input v-model="deliverForm.orderNo" disabled></el-input>
        </el-form-item>
        <el-form-item label="快递公司" prop="deliveryCompany" required>
          <el-select v-model="deliverForm.deliveryCompany" placeholder="请选择快递公司" filterable :filter-method="handleDeliveryFilter">
            <el-option v-for="delivery in deliveryList" :key="delivery.code" :label="delivery.name" :value="delivery.code"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号" prop="deliveryNo" required>
          <el-input v-model="deliverForm.deliveryNo" placeholder="请输入快递单号"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deliverDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitDeliver" :loading="deliverLoading">{{ currentDeliverAction === 'deliver' ? '确认发货' : '更新发货信息' }}</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="confirmRefundDialogVisible" title="确认退款" width="600px">
      <el-form ref="confirmRefundFormRef" :model="confirmRefundForm" label-width="100px">
        <el-form-item label="订单编号">
          <el-input v-model="confirmRefundForm.orderNo" disabled></el-input>
        </el-form-item>
        <el-form-item label="退款备注" prop="remark">
          <el-input v-model="confirmRefundForm.remark" type="textarea" placeholder="请输入退款备注" rows="4"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmRefundDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitConfirmRefund" :loading="confirmRefundLoading">确认退款</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="processRefundDialogVisible" title="处理退款" width="600px">
      <el-form ref="processRefundFormRef" :model="processRefundForm" label-width="100px">
        <el-form-item label="订单编号">
          <el-input v-model="processRefundForm.orderNo" disabled></el-input>
        </el-form-item>
        <el-form-item label="处理方式" prop="action" required>
          <el-radio-group v-model="processRefundForm.action">
            <el-radio label="confirm">确认退款</el-radio>
            <el-radio label="reject">拒绝退款</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="processRefundForm.action === 'confirm' ? '退款备注' : '拒绝原因'" prop="remark">
          <el-input v-model="processRefundForm.remark" type="textarea" :placeholder="processRefundForm.action === 'confirm' ? '请输入退款备注' : '请输入拒绝原因'" rows="4"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="processRefundDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitProcessRefund" :loading="processRefundLoading">提交处理</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="refundRecordsDialogVisible" title="退款记录" width="900px">
      <div v-loading="refundRecordsLoading">
        <el-table v-if="refundRecords.length > 0" :data="refundRecords" style="width: 100%">
          <el-table-column prop="refundNo" label="退款编号" min-width="180"></el-table-column>
          <el-table-column prop="totalAmount" label="总金额" min-width="100" align="right">
            <template #default="scope">
              <span>¥{{ scope.row.totalAmount.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="refundAmount" label="退款金额" min-width="100" align="right">
            <template #default="scope">
              <span>¥{{ scope.row.refundAmount.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="refundStatus" label="退款状态" min-width="120">
            <template #default="scope">
              <el-tag :type="getRefundRecordStatusType(scope.row.refundStatus)">{{ getRefundRecordStatusText(scope.row.refundStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="refundReason" label="退款原因" min-width="200"></el-table-column>
          <el-table-column prop="createTime" label="创建时间" min-width="180"></el-table-column>
          <el-table-column prop="successTime" label="成功时间" min-width="180">
            <template #default="scope">
              <span>{{ scope.row.successTime || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="120" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="handleViewRefundDetail(scope.row.id)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="no-refund-records">
          <span>暂无退款记录</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="refundRecordsDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="refundDetailDialogVisible" title="退款记录详情" width="700px">
      <div v-loading="refundDetailLoading" class="refund-detail">
        <div v-if="currentRefundDetail && Object.keys(currentRefundDetail).length > 0" class="detail-section">
          <div class="detail-row">
            <div class="detail-item">
              <span class="label">退款编号：</span>
              <span class="value">{{ currentRefundDetail.refundNo || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">订单编号：</span>
              <span class="value">{{ currentRefundDetail.orderNo || '-' }}</span>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-item">
              <span class="label">总金额：</span>
              <span class="value amount">¥{{ currentRefundDetail.totalAmount ? currentRefundDetail.totalAmount.toFixed(2) : '0.00' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">退款金额：</span>
              <span class="value amount">¥{{ currentRefundDetail.refundAmount ? currentRefundDetail.refundAmount.toFixed(2) : '0.00' }}</span>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-item">
              <span class="label">退款状态：</span>
              <el-tag :type="getRefundRecordStatusType(currentRefundDetail.refundStatus)">{{ getRefundRecordStatusText(currentRefundDetail.refundStatus) }}</el-tag>
            </div>
            <div class="detail-item">
              <span class="label">退款原因：</span>
              <span class="value">{{ currentRefundDetail.refundReason || '-' }}</span>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-item">
              <span class="label">创建时间：</span>
              <span class="value">{{ currentRefundDetail.createTime || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">成功时间：</span>
              <span class="value">{{ currentRefundDetail.successTime || '-' }}</span>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-item">
              <span class="label">退款入账账户：</span>
              <span class="value">{{ currentRefundDetail.userReceivedAccount || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">微信支付摘要：</span>
              <span class="value">{{ currentRefundDetail.summary || '-' }}</span>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-item">
              <span class="label">实际总金额：</span>
              <span class="value">{{ currentRefundDetail.realTotalAmount ? `¥${currentRefundDetail.realTotalAmount.toFixed(2)}` : '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">实际退款金额：</span>
              <span class="value">{{ currentRefundDetail.realRefundAmount ? `¥${currentRefundDetail.realRefundAmount.toFixed(2)}` : '-' }}</span>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-item">
              <span class="label">创建人：</span>
              <span class="value">{{ currentRefundDetail.createBy || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">更新人：</span>
              <span class="value">{{ currentRefundDetail.updateBy || '-' }}</span>
            </div>
          </div>
        </div>
        <div v-else class="no-data">
          <span>暂无退款详情数据</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="refundDetailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getStoragePreviewUrl } from '@/utils/storage'
import { ElMessage, ElMessageBox } from 'element-plus';
import { queryOrderList, getOrderDetail, deliverOrder, updateShipInfo, queryTracking, confirmRefund, rejectRefund, queryRefundRecords, getRefundDetail } from '@/api/mall/order';
import { queryDeliveryProviderList } from '@/api/mall/shipping';
import ImagePreview from '@/components/ImagePreview/index.vue';

function getFullImageUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

const loading = ref(false);
const deliverLoading = ref(false);

const searchForm = reactive({
  orderNo: '',
  status: '',
  refundStatus: '',
  afterSaleStatus: '',
  orderType: '',
  startDate: '',
  endDate: ''
});

const dateRange = ref([]);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

const sortConfig = reactive({
  prop: 'createTime',
  order: 'desc'
});

const orderList = ref([]);

const detailDialogVisible = ref(false);
const currentOrder = ref(null);
const orderItems = ref([]);

const activeCollapseNames = ref(['order', 'refund', 'receiver', 'products', 'delivery']);

const deliverDialogVisible = ref(false);
const deliverFormRef = ref(null);
const deliverForm = reactive({
  orderId: '',
  orderNo: '',
  deliveryCompany: '',
  deliveryNo: ''
});
const currentDeliverAction = ref('deliver');

const confirmRefundDialogVisible = ref(false);
const confirmRefundFormRef = ref(null);
const confirmRefundForm = reactive({
  orderId: '',
  orderNo: '',
  remark: ''
});
const confirmRefundLoading = ref(false);

const processRefundDialogVisible = ref(false);
const processRefundFormRef = ref(null);
const processRefundForm = reactive({
  orderId: '',
  orderNo: '',
  action: 'confirm',
  remark: ''
});
const processRefundLoading = ref(false);

const refundRecordsDialogVisible = ref(false);
const refundRecordsLoading = ref(false);
const refundRecords = ref([]);
const currentRefundOrder = ref(null);

const refundDetailDialogVisible = ref(false);
const refundDetailLoading = ref(false);
const currentRefundDetail = ref({});

const deliveryList = ref([]);

const queryDeliveryLoading = ref(false);
const deliveryTracking = ref([]);

const getLogisticsList = async (searchKeyword = '') => {
  try {
    const conditions = [];

    if (searchKeyword) {
      conditions.push(`name:like:${searchKeyword}`);
    }

    conditions.push('isPopular:sort:desc');
    conditions.push('updateTime:sort:desc');

    const response = await queryDeliveryProviderList({
      size: 100,
      conditions_: conditions.join(';')
    });
    if (response.code === 0 && response.data) {
      deliveryList.value = (response.data.records || []).map(delivery => ({
        ...delivery
      }));
    }
  } catch (error) {
    console.error('获取物流商列表失败:', error);
  }
};

let deliverySearchTimer = null;

const handleDeliveryFilter = (value) => {
  if (deliverySearchTimer) {
    clearTimeout(deliverySearchTimer);
  }

  deliverySearchTimer = setTimeout(() => {
    getLogisticsList(value);
  }, 300);
};

const handleSortChange = ({ prop, order }) => {
  if ((prop === 'createTime' || prop === 'paySuccessTime') && order) {
    sortConfig.prop = prop;
    sortConfig.order = order === 'ascending' ? 'asc' : 'desc';
    getOrderList();
  }
};

const getOrderList = async () => {
  try {
    loading.value = true;

    const sortField = sortConfig.prop;
    const sortOrder = sortConfig.order;
    const conditions_ = `${sortField}:sort:${sortOrder}`;

    const params = {
      ...searchForm,
      current: pagination.current,
      size: pagination.pageSize,
      conditions_
    };

    const response = await queryOrderList(params);
    if (response.code === 0 && response.data) {
      orderList.value = response.data.records || [];
      pagination.total = parseInt(response.data.total) || 0;
    } else {
      orderList.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    console.error('获取订单列表失败:', error);
    ElMessage.error('获取订单列表失败');
    orderList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    searchForm.startDate = dateRange.value[0];
    searchForm.endDate = dateRange.value[1];
  } else {
    searchForm.startDate = '';
    searchForm.endDate = '';
  }
  pagination.current = 1;
  getOrderList();
};

const resetForm = () => {
  Object.assign(searchForm, {
    orderNo: '',
    status: '',
    refundStatus: '',
    afterSaleStatus: '',
    orderType: '',
    startDate: '',
    endDate: ''
  });
  dateRange.value = [];
  pagination.current = 1;
  getOrderList();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  getOrderList();
};

const handleCurrentChange = (current) => {
  pagination.current = current;
  getOrderList();
};

const handleOrderDetail = async (row) => {
  try {
    deliveryTracking.value = [];
    currentOrder.value = null;
    orderItems.value = [];
    detailDialogVisible.value = false;

    const response = await getOrderDetail(row.id);
    if (response.code !== 0 || !response.data?.order) {
      throw new Error(response.message || '订单详情不存在');
    }

    const orderData = response.data.order;
    const itemsData = response.data.shopProducts || [];
    const tracking = response.data.deliveryTracking;

    if (tracking?.error_code === 0 && tracking.result) {
      deliveryTracking.value = (tracking.result.list || []).map(track => ({
        time: track.datetime || '',
        content: track.remark || ''
      })).reverse();
      orderData.deliveryQueryStatus = '2';
      orderData.trackingStatusDetail = tracking.result.status_detail || 'UNKNOWN';
    } else if (tracking) {
      orderData.deliveryQueryStatus = '3';
    }

    currentOrder.value = orderData;
    orderItems.value = itemsData;
    activeCollapseNames.value = ['order', 'refund', 'receiver', 'products', 'delivery'];
    detailDialogVisible.value = true;
  } catch (error) {
    console.error('获取订单详情失败:', error);
    ElMessage.error('获取订单详情失败');
  }
};

const handleDeliver = async (row) => {
  currentDeliverAction.value = row.trackingNo || row.status === '3' ? 'update' : 'deliver';

  const deliveryProviderCode = row.deliveryProviderCode || '';

  Object.assign(deliverForm, {
    orderId: row.id,
    orderNo: row.orderNo,
    deliveryCompany: deliveryProviderCode,
    deliveryNo: row.trackingNo || ''
  });

  await getLogisticsList();
  deliverDialogVisible.value = true;
};

const handleSubmitDeliver = async () => {
  try {
    const valid = await deliverFormRef.value.validate();
    if (valid) {
      deliverLoading.value = true;

      const currentRow = orderList.value.find(item => item.id === deliverForm.orderId);
      const apiMethod = currentRow?.trackingNo ? updateShipInfo : deliverOrder;
      const successMessage = currentRow?.trackingNo ? '更新发货信息成功' : '发货成功';

      const response = await apiMethod({
        orderId: deliverForm.orderId,
        deliveryProviderCode: deliverForm.deliveryCompany,
        trackingNo: deliverForm.deliveryNo
      });

      if (response.code === 0) {
        deliverDialogVisible.value = false;
        deliverLoading.value = false;
        ElMessage.success(successMessage);
        getOrderList();
      } else {
        deliverLoading.value = false;
        ElMessage.error(response.message || '操作失败');
      }
    }
  } catch (error) {
    deliverLoading.value = false;
    console.error('操作失败:', error);
    ElMessage.error('操作失败，请重试');
  }
};

const getStatusText = (status) => {
  const statusMap = {
    '1': '待付款',
    '2': '待发货',
    '3': '待收货',
    '4': '交易成功',
    '5': '交易关闭',
    '6': '退款',
    '7': '售后'
  };
  return statusMap[status] || '-';
};

const getStatusType = (status) => {
  const typeMap = {
    '1': 'warning',
    '2': 'primary',
    '3': 'info',
    '4': 'success',
    '5': 'danger',
    '6': 'warning',
    '7': 'warning'
  };
  return typeMap[status] || 'info';
};

const getOrderTypeText = (orderType) => {
  const typeMap = {
    '1': '普通订单',
    '2': '秒杀订单'
  };
  return typeMap[orderType] || '-';
};

const getOrderTypeTagType = (orderType) => {
  const typeMap = {
    '1': 'info',
    '2': 'danger'
  };
  return typeMap[orderType] || 'info';
};

const getRefundStatusText = (status) => {
  const statusMap = {
    '0': '无',
    '1': '申请中',
    '2': '处理中',
    '3': '退款成功',
    '4': '已拒绝',
    '5': '退款失败'
  };
  return statusMap[status] || '-';
};

const getRefundStatusType = (status) => {
  const typeMap = {
    '0': 'info',
    '1': 'warning',
    '2': 'primary',
    '3': 'success',
    '4': 'danger',
    '5': 'danger'
  };
  return typeMap[status] || 'info';
};

const getAfterSaleStatusText = (status) => {
  const statusMap = {
    '0': '无',
    '1': '申请中',
    '2': '处理中',
    '3': '售后完成',
    '4': '已驳回'
  };
  return statusMap[status] || '-';
};

const getAfterSaleStatusType = (status) => {
  const typeMap = {
    '0': 'info',
    '1': 'warning',
    '2': 'primary',
    '3': 'success',
    '4': 'danger'
  };
  return typeMap[status] || 'info';
};

const getQueryStatusText = (status) => {
  const statusMap = {
    '0': '未查询',
    '1': '查询中',
    '2': '查询成功',
    '3': '查询失败',
    '4': '无轨迹',
    '5': '已签收'
  };
  return statusMap[status] || '-';
};

const getQueryStatusType = (status) => {
  const typeMap = {
    '0': 'info',
    '1': 'warning',
    '2': 'success',
    '3': 'danger',
    '4': 'info',
    '5': 'success'
  };
  return typeMap[status] || 'info';
};

const getTrackingStatusText = (status) => {
  const statusMap = {
    'WAIT_ACCEPT': '待揽收',
    'IN_TRANSIT': '运输中',
    'DELIVERING': '派送中',
    'SIGNED': '已签收',
    'EXCEPTION': '异常',
    'RETURNING': '退回中',
    'RETURNED': '已退回',
    'UNKNOWN': '未知'
  };
  return statusMap[status] || '未知';
};

const getTrackingStatusType = (status) => {
  const typeMap = {
    'WAIT_ACCEPT': 'info',
    'IN_TRANSIT': 'warning',
    'DELIVERING': 'primary',
    'SIGNED': 'success',
    'EXCEPTION': 'danger',
    'RETURNING': 'warning',
    'RETURNED': 'danger',
    'UNKNOWN': 'info'
  };
  return typeMap[status] || 'info';
};

const getRefundRecordStatusText = (status) => {
  const statusMap = {
    'SUCCESS': '退款成功',
    'CLOSED': '退款关闭',
    'PROCESSING': '退款处理中',
    'ABNORMAL': '退款异常'
  };
  return statusMap[status] || status || '-';
};

const getRefundRecordStatusType = (status) => {
  const typeMap = {
    'SUCCESS': 'success',
    'CLOSED': 'info',
    'PROCESSING': 'warning',
    'ABNORMAL': 'danger'
  };
  return typeMap[status] || 'info';
};

const handleManualQueryDelivery = async () => {
  try {
    queryDeliveryLoading.value = true;
    const response = await queryTracking(currentOrder.value.id);
    if (response.code === 0) {
      const trackingData = response.data.deliveryTracking || response.data;
      if (trackingData && trackingData.error_code === 0 && trackingData.result) {
        if (currentOrder.value) {
          currentOrder.value.deliveryQueryStatus = '2';
          currentOrder.value.trackingStatusDetail = trackingData.result.status_detail || 'UNKNOWN';
        }

        deliveryTracking.value = (trackingData.result.list || []).map(track => ({
          time: track.datetime || '',
          content: track.remark || ''
        })).reverse();
        ElMessage.success('快递查询成功');
      } else {
        if (currentOrder.value) {
          currentOrder.value.deliveryQueryStatus = '3';
        }
        ElMessage.error(trackingData.reason || response.message || '快递查询失败');
      }
    } else {
      if (currentOrder.value) {
        currentOrder.value.deliveryQueryStatus = '3';
      }
      ElMessage.error(response.message || '快递查询失败');
    }
  } catch (error) {
    if (currentOrder.value) {
      currentOrder.value.deliveryQueryStatus = '3';
    }
    console.error('快递查询失败:', error);
    ElMessage.error('快递查询失败，请重试');
  } finally {
    queryDeliveryLoading.value = false;
  }
};

const handleConfirmRefund = (row) => {
  Object.assign(confirmRefundForm, {
    orderId: row.id,
    orderNo: row.orderNo,
    remark: ''
  });
  confirmRefundDialogVisible.value = true;
};

const handleProcessRefund = (row) => {
  Object.assign(processRefundForm, {
    orderId: row.id,
    orderNo: row.orderNo,
    action: 'confirm',
    remark: ''
  });
  processRefundDialogVisible.value = true;
};

const handleViewRefundRecords = async (row) => {
  currentRefundOrder.value = row;
  refundRecords.value = [];
  refundRecordsDialogVisible.value = true;
  refundRecordsLoading.value = true;

  try {
    const response = await queryRefundRecords({
      orderId: row.id,
      conditions_: 'id:sort:desc'
    });

    if (response.code === 0 && response.data) {
      refundRecords.value = response.data.records || response.data;
    } else {
      refundRecords.value = [];
    }
  } catch (error) {
    console.error('获取退款记录失败:', error);
    ElMessage.error('获取退款记录失败');
    refundRecords.value = [];
  } finally {
    refundRecordsLoading.value = false;
  }
};

const handleViewRefundDetail = async (refundId) => {
  refundDetailLoading.value = true;

  try {
    const response = await getRefundDetail(refundId);

    if (response.code === 0 && response.data) {
      // 正确处理API响应，退款详情在response.data.data中
      currentRefundDetail.value = response.data.data || response.data;
      // 确保数据获取成功后再打开对话框
      refundDetailDialogVisible.value = true;
    } else {
      ElMessage.error('获取退款记录详情失败');
    }
  } catch (error) {
    console.error('获取退款记录详情失败:', error);
    ElMessage.error('获取退款记录详情失败');
  } finally {
    refundDetailLoading.value = false;
  }
};

const handleSubmitConfirmRefund = async () => {
  try {
    const valid = await confirmRefundFormRef.value.validate();
    if (valid) {
      confirmRefundLoading.value = true;

      const response = await confirmRefund({
        orderId: confirmRefundForm.orderId,
        remark: confirmRefundForm.remark
      });

      if (response.code === 0) {
        confirmRefundDialogVisible.value = false;
        confirmRefundLoading.value = false;
        ElMessage.success('确认退款成功');
        getOrderList();
      } else {
        confirmRefundLoading.value = false;
        ElMessage.error(response.message || '确认退款失败');
      }
    }
  } catch (error) {
    confirmRefundLoading.value = false;
    console.error('确认退款失败:', error);
    ElMessage.error('确认退款失败，请重试');
  }
};

const handleSubmitProcessRefund = async () => {
  try {
    const valid = await processRefundFormRef.value.validate();
    if (valid) {
      processRefundLoading.value = true;

      let response;
      if (processRefundForm.action === 'confirm') {
        response = await confirmRefund({
          orderId: processRefundForm.orderId,
          remark: processRefundForm.remark
        });
      } else {
        response = await rejectRefund({
          orderId: processRefundForm.orderId,
          reason: processRefundForm.remark
        });
      }

      if (response.code === 0) {
        processRefundDialogVisible.value = false;
        processRefundLoading.value = false;
        ElMessage.success(processRefundForm.action === 'confirm' ? '确认退款成功' : '拒绝退款成功');
        getOrderList();
      } else {
        processRefundLoading.value = false;
        ElMessage.error(response.message || '处理退款失败');
      }
    }
  } catch (error) {
    processRefundLoading.value = false;
    console.error('处理退款失败:', error);
    ElMessage.error('处理退款失败，请重试');
  }
};

onMounted(async () => {
  await getOrderList();
});
</script>

<style lang="scss" scoped>
.order-manage {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.buyer-info {
  display: flex;
  flex-direction: column;
}

.buyer-name {
  font-weight: bold;
}

.product-info {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.product-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.spec-item {
  font-size: 12px;
  color: #606266;
}

.spec-separator {
  margin: 0 5px;
  color: #ccc;
}

.detail-section {
  padding: 10px;
}

.detail-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.detail-item {
  display: flex;
  align-items: center;
  min-width: 250px;
  margin-right: 20px;
}

.detail-item.full-width {
  min-width: 100%;
  margin-right: 0;
}

.detail-item .label {
  width: 110px;
  font-weight: bold;
  color: #606266;
  flex-shrink: 0;
}

.detail-item .value {
  color: #333;
  word-break: break-all;
}

.detail-item .amount {
  font-weight: bold;
  color: #f56c6c;
}

.delivery-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.delivery-item {
  display: flex;
  align-items: center;
}

.delivery-item .label {
  width: 100px;
  font-weight: bold;
  color: #606266;
}

.tracking-list {
  margin-top: 10px;
  border-left: 2px solid #e6e6e6;
  padding-left: 20px;
}

.tracking-item {
  margin-bottom: 15px;
  position: relative;
  &:before {
    content: '';
    position: absolute;
    left: -25px;
    top: 5px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #e6e6e6;
    border: 2px solid #fff;
    box-shadow: 0 0 0 2px #e6e6e6;
  }
  &:last-child {
    margin-bottom: 0;
  }
  &.current-node {
    &:before {
      background-color: #409eff;
      box-shadow: 0 0 0 2px #c6e2ff;
    }
    .tracking-time {
      color: #409eff;
      font-weight: bold;
    }
    .tracking-content {
      color: #409eff;
      font-weight: bold;
    }
  }
}

.tracking-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.tracking-content {
  font-size: 14px;
  color: #606266;
}

.no-tracking,
.no-delivery,
.no-refund-records {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

.order-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-item.total {
  font-weight: bold;
  font-size: 16px;
  margin-top: 10px;
}

.amount {
  font-weight: bold;
  color: #f56c6c;
}

:deep(.el-collapse-item__header) {
  font-size: 16px;
  font-weight: bold;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 20px;
}

.refund-detail {
  max-height: 500px;
  overflow-y: auto;
}
</style>
