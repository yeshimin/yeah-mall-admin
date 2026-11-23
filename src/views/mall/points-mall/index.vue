<template>
  <div class="mall-page points-mall-page">
    <el-tabs v-model="activeTab" @tab-change="loadActiveTab">
      <el-tab-pane label="商品分类" name="category">
        <div class="points-category-toolbar">
          <el-button type="primary" icon="Plus" @click="openCategoryDialog()">新增分类</el-button>
        </div>
        <section class="mall-table-panel">
          <el-table data-ym-table="r40" v-loading="loading" :data="categories" row-key="id">
            <el-table-column label="分类名称" min-width="180">
              <template #default="{ row }"><span class="points-category-name">{{ row.name }}</span></template>
            </el-table-column>
            <el-table-column prop="parentId" label="父分类" min-width="160">
              <template #default="{ row }">{{ categoryName(row.parentId) }}</template>
            </el-table-column>
            <el-table-column label="图标" width="90">
              <template #default="{ row }">
                <el-image v-if="row.icon" :src="previewUrl(row.icon)" fit="cover" class="table-image" />
                <span v-else class="muted">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" min-width="90" />
            <el-table-column label="状态" min-width="100">
              <template #default="{ row }">
                <el-tag :type="row.isEnabled ? 'success' : 'info'">{{ row.isEnabled ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" min-width="180" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openCategoryDialog(row)">编辑</el-button>
                <el-button link type="danger" @click="removeCategory(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <div class="points-mall-empty">
                <el-icon><Goods /></el-icon>
                <strong>暂无积分分类</strong>
                <span>点击右上角新增分类</span>
              </div>
            </template>
          </el-table>
        </section>
      </el-tab-pane>

      <el-tab-pane label="积分商品" name="product">
        <section class="mall-filter-panel">
          <el-form :inline="true" class="mall-query-form" @submit.prevent="loadProducts(true)">
            <el-form-item label="商品名称">
              <el-input v-model="productQuery.name" clearable placeholder="搜索积分商品" />
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="productQuery.categoryId" clearable placeholder="全部分类">
                <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="productQuery.isEnabled" clearable placeholder="全部状态">
                <el-option label="已上架" :value="true" />
                <el-option label="已下架" :value="false" />
              </el-select>
            </el-form-item>
            <el-form-item class="mall-query-actions">
              <el-button @click="resetProductQuery">重置</el-button>
              <el-button type="primary" native-type="submit">
                <el-icon><Search /></el-icon>
                查询
              </el-button>
            </el-form-item>
          </el-form>
          <div class="mall-business-actions">
            <el-button type="primary" icon="Plus" @click="openProductDialog()">新增商品</el-button>
          </div>
        </section>
        <section class="mall-table-panel">
          <el-table data-ym-table="r41" v-loading="loading" :data="products">
            <el-table-column label="商品" min-width="250">
              <template #default="{ row }">
                <div class="product-cell">
                  <el-image v-if="row.mainImage" :src="previewUrl(row.mainImage)" fit="cover" class="product-image" />
                  <span v-else class="product-image image-placeholder"><el-icon><Picture /></el-icon></span>
                  <div class="product-cell-copy">
                    <strong>{{ row.name }}</strong>
                    <p>{{ row.subtitle || '暂无副标题' }}</p>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="分类" min-width="120">
              <template #default="{ row }">{{ categoryName(row.categoryId) }}</template>
            </el-table-column>
            <el-table-column label="类型 / 履约" min-width="160">
              <template #default="{ row }">
                <div class="points-cell-stack">
                  <span>{{ productTypeText(row.productType) }}</span>
                  <small class="muted">{{ fulfillmentText(row.fulfillmentType) }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="兑换时间" min-width="170">
              <template #default="{ row }">
                <div class="points-cell-stack">
                  <span>{{ formatDate(row.beginTime) }}</span>
                  <small class="points-mall-time-sub">至 {{ formatDate(row.endTime) }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="每人限兑" min-width="90">
              <template #default="{ row }">{{ row.perMemberLimit > POINTS_UNLIMITED_PER_MEMBER_LIMIT ? row.perMemberLimit : '不限' }}</template>
            </el-table-column>
            <el-table-column label="状态" min-width="120">
              <template #default="{ row }">
                <div class="status-switch-cell">
                  <el-switch
                    :model-value="Boolean(row.isEnabled)"
                    :loading="productStatusUpdatingId === row.id"
                    @change="changeProductStatus(row, $event)"
                  />
                  <span>{{ row.isEnabled ? '已上架' : '已下架' }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="190" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openProductDialog(row)">编辑</el-button>
                <el-button link type="warning" @click="openSkuDialog(row)">SKU管理</el-button>
                <el-button link type="danger" @click="removeProduct(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <div class="points-mall-empty">
                <el-icon><Goods /></el-icon>
                <strong>没有匹配的积分商品</strong>
                <span>调整筛选条件后重试</span>
              </div>
            </template>
          </el-table>
          <MallPagination
            :total="productPage.total"
            :page="productPage.current"
            :limit="productPage.size"
            @pagination="changeProductPage"
          />
        </section>
      </el-tab-pane>

      <el-tab-pane label="兑换订单" name="order">
        <section class="mall-filter-panel">
          <el-form :inline="true" class="mall-query-form" @submit.prevent="loadOrders(true)">
            <el-form-item label="订单编号">
              <el-input v-model="orderQuery.orderNo" clearable placeholder="兑换订单编号" />
            </el-form-item>
            <el-form-item label="会员 ID">
              <el-input v-model="orderQuery.memberId" clearable placeholder="会员 ID" />
            </el-form-item>
            <el-form-item label="订单状态">
              <el-select v-model="orderQuery.status" clearable placeholder="全部状态">
                <el-option v-for="item in orderStatuses" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item class="mall-query-actions">
              <el-button @click="resetOrderQuery">重置</el-button>
              <el-button type="primary" native-type="submit">
                <el-icon><Search /></el-icon>
                查询
              </el-button>
            </el-form-item>
          </el-form>
        </section>
        <section class="mall-table-panel">
          <el-table data-ym-table="r42" v-loading="loading" :data="orders">
            <el-table-column label="订单编号" min-width="135" show-overflow-tooltip>
              <template #default="{ row }">
                <CopyableText :value="row.orderNo" label="订单编号" />
              </template>
            </el-table-column>
            <el-table-column label="会员ID" min-width="125">
              <template #default="{ row }">
                <CopyableText :value="row.memberId" label="会员ID" />
              </template>
            </el-table-column>
            <el-table-column label="商品" min-width="210">
              <template #default="{ row }">
                <div class="product-cell compact">
                  <el-image v-if="row.productImage" :src="previewUrl(row.productImage)" fit="cover" class="table-image" />
                  <span v-else class="table-image image-placeholder"><el-icon><Picture /></el-icon></span>
                  <div class="product-cell-copy"><strong>{{ row.productName }}</strong><p>{{ row.skuName }}</p></div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="兑换" min-width="120">
              <template #default="{ row }">
                <div class="points-cell-stack">
                  <span>{{ row.pointsPrice }} 积分 × {{ row.quantity }}</span>
                  <small class="muted">合计 {{ row.totalPoints }} 积分</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="履约方式" min-width="95">
              <template #default="{ row }">{{ fulfillmentText(row.fulfillmentType) }}</template>
            </el-table-column>
            <el-table-column label="状态" min-width="90">
              <template #default="{ row }">
                <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="兑换时间" min-width="130">
              <template #default="{ row }">
                <div class="points-cell-stack">
                  <span class="points-mall-time">{{ formatDate(row.createTime) }}</span>
                  <small class="points-mall-time-sub">{{ formatTime(row.createTime) }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="190" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openOrderDetail(row)">详情</el-button>
                <el-button v-if="canShip(row)" link type="success" @click="openOrderAction(row, POINTS_ORDER_ACTION.SHIP)">发货</el-button>
                <el-button v-if="canFulfill(row)" link type="success" @click="openOrderAction(row, POINTS_ORDER_ACTION.FULFILL)">完成履约</el-button>
                <el-button v-if="canCancel(row)" link type="danger" @click="openOrderAction(row, POINTS_ORDER_ACTION.CANCEL)">取消</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <div class="points-mall-empty">
                <el-icon><Tickets /></el-icon>
                <strong>没有匹配的兑换订单</strong>
                <span>调整筛选条件后重试</span>
              </div>
            </template>
          </el-table>
          <MallPagination
            :total="orderPage.total"
            :page="orderPage.current"
            :limit="orderPage.size"
            @pagination="changeOrderPage"
          />
        </section>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="categoryDialog.visible" width="520px">
      <template #header>
        <div class="points-dialog-kicker-head">
          <span class="drawer-kicker">POINTS CATEGORY</span>
          <h2>{{ categoryDialog.form.id ? '编辑分类' : '新增分类' }}</h2>
        </div>
      </template>
      <el-form ref="categoryFormRef" :model="categoryDialog.form" :rules="categoryRules" label-position="top">
        <el-form-item label="父分类" prop="parentId">
          <el-select v-model="categoryDialog.form.parentId" style="width: 100%">
            <el-option label="一级分类" :value="POINTS_ROOT_CATEGORY_ID" />
            <el-option
              v-for="item in parentCategoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分类名称" prop="name"><el-input v-model="categoryDialog.form.name" /></el-form-item>
        <el-form-item label="分类图标">
          <image-uploader v-model="categoryDialog.form.icon" />
        </el-form-item>
        <el-form-item label="排序" prop="sort"><el-input-number v-model="categoryDialog.form.sort" :min="0" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="categoryDialog.form.isEnabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitCategory">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="productDialog.visible" width="760px" class="points-product-dialog">
      <template #header>
        <div class="points-dialog-kicker-head">
          <span class="drawer-kicker">POINTS PRODUCT</span>
          <h2>{{ productDialog.form.id ? '编辑积分商品' : '新增积分商品' }}</h2>
        </div>
      </template>
      <el-alert v-if="!productDialog.form.id" title="请先下架保存商品，再配置 SKU，最后编辑上架。" type="info" :closable="false" show-icon />
      <el-form ref="productFormRef" :model="productDialog.form" :rules="productRules" label-position="top" class="dialog-form points-form-grid">
        <el-form-item label="商品分类" prop="categoryId">
          <el-select v-model="productDialog.form.categoryId" style="width: 100%">
            <el-option v-for="item in productCategoryOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品名称" prop="name"><el-input v-model="productDialog.form.name" maxlength="64" /></el-form-item>
        <el-form-item label="商品副标题" class="wide"><el-input v-model="productDialog.form.subtitle" maxlength="128" /></el-form-item>
        <el-form-item label="商品主图" prop="mainImage" class="wide"><image-uploader v-model="productDialog.form.mainImage" /></el-form-item>
        <el-form-item label="商品类型" prop="productType">
          <el-radio-group v-model="productDialog.form.productType" @change="syncFulfillmentType">
            <el-radio :label="POINTS_PRODUCT_TYPE.PHYSICAL">实物商品</el-radio>
            <el-radio :label="POINTS_PRODUCT_TYPE.COUPON">优惠券</el-radio>
            <el-radio :label="POINTS_PRODUCT_TYPE.BENEFIT">虚拟权益</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="履约方式">
          <el-input :model-value="fulfillmentText(productDialog.form.fulfillmentType)" disabled />
        </el-form-item>
        <el-form-item v-if="productDialog.form.productType === POINTS_PRODUCT_TYPE.COUPON" label="兑换优惠券" prop="couponId" class="wide">
          <el-select v-model="productDialog.form.couponId" filterable style="width: 100%" placeholder="选择已开放积分兑换的优惠券">
            <el-option
              v-for="coupon in coupons"
              :key="coupon.id"
              :label="`${coupon.name}（剩余 ${coupon.quantity - coupon.received}）`"
              :value="coupon.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="兑换时间" prop="exchangeTime" class="wide">
          <el-date-picker
            v-model="productDialog.form.exchangeTime"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="每人限兑" prop="perMemberLimit">
          <el-input-number v-model="productDialog.form.perMemberLimit" :min="0" />
          <span class="form-tip">0 表示不限</span>
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="productDialog.form.sort" :min="0" /></el-form-item>
        <el-form-item label="商品详情" class="wide"><el-input v-model="productDialog.form.detailDesc" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="上架" class="wide"><el-switch v-model="productDialog.form.isEnabled" :disabled="!productDialog.form.id" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitProduct">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="skuDialog.visible" width="820px">
      <template #header>
        <div class="points-dialog-kicker-head">
          <span class="drawer-kicker">POINTS SKU</span>
          <h2>{{ skuDialog.product?.name || '' }} · SKU 管理</h2>
        </div>
      </template>
      <el-form ref="skuFormRef" :model="skuEdit.form" :rules="skuRules" class="sku-inline-form" label-position="top">
        <div class="sku-inline-main">
          <el-form-item label="SKU名称" prop="name"><el-input v-model="skuEdit.form.name" placeholder="请输入 SKU 名称" /></el-form-item>
          <el-form-item label="积分价格" prop="pointsPrice"><el-input-number v-model="skuEdit.form.pointsPrice" :min="1" controls-position="right" /></el-form-item>
          <el-form-item label="可用库存" prop="stock"><el-input-number v-model="skuEdit.form.stock" :min="0" controls-position="right" /></el-form-item>
          <el-form-item>
            <template #label>SKU 图片 <small class="sku-label-tip">可选，为空使用商品主图</small></template>
            <image-uploader v-model="skuEdit.form.mainImage" clearable compact />
          </el-form-item>
          <el-form-item class="sku-inline-actions">
            <el-button type="primary" icon="Plus" @click="submitSku">{{ skuEdit.form.id ? '保存 SKU' : '新增 SKU' }}</el-button>
          </el-form-item>
        </div>
      </el-form>
      <el-table data-ym-table="r43" v-loading="skuDialog.loading" :data="skuDialog.rows">
        <el-table-column prop="name" label="SKU名称" min-width="160" />
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image
              v-if="row.mainImage || skuDialog.product?.mainImage"
              :src="previewUrl(row.mainImage || skuDialog.product?.mainImage)"
              fit="cover"
              class="table-image"
            />
            <span v-else class="table-image image-placeholder"><el-icon><Picture /></el-icon></span>
          </template>
        </el-table-column>
        <el-table-column prop="pointsPrice" label="积分价格" min-width="90" />
        <el-table-column prop="stock" label="可用库存" min-width="90" />
        <el-table-column prop="totalStock" label="累计库存" min-width="90" />
        <el-table-column label="状态" min-width="80">
          <template #default="{ row }"><el-tag :type="row.isEnabled ? 'success' : 'info'">{{ row.isEnabled ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openSkuEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="removeSku(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="skuDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="orderDetail.visible" class="points-order-drawer" size="620px">
      <template #header>
        <div class="points-order-drawer-heading">
          <span>POINTS ORDER</span>
          <strong>兑换订单详情</strong>
        </div>
      </template>
      <template v-if="orderDetail.data">
        <div class="points-order-detail-head">
          <div><span>订单编号</span><b class="points-order-no">{{ orderDetail.data.orderNo }}</b></div>
          <el-tag :type="statusTag(orderDetail.data.status)">{{ statusText(orderDetail.data.status) }}</el-tag>
        </div>
        <div class="points-order-summary">
          <el-image
            v-if="orderDetail.data.productImage"
            :src="previewUrl(orderDetail.data.productImage)"
            fit="cover"
            class="points-order-product-image"
          />
          <div class="points-order-summary-copy">
            <strong>{{ orderDetail.data.productName }}</strong>
            <span>{{ orderDetail.data.skuName }} × {{ orderDetail.data.quantity }}</span>
            <span>合计 {{ orderDetail.data.totalPoints }} 积分</span>
          </div>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="会员ID">{{ orderDetail.data.memberId }}</el-descriptions-item>
          <el-descriptions-item label="履约方式">{{ fulfillmentText(orderDetail.data.fulfillmentType) }}</el-descriptions-item>
          <el-descriptions-item label="兑换时间" :span="2">{{ orderDetail.data.createTime }}</el-descriptions-item>
          <el-descriptions-item v-if="orderDetail.data.receiverName" label="收货人" :span="2">
            {{ orderDetail.data.receiverName }} {{ orderDetail.data.receiverContact }}
          </el-descriptions-item>
          <el-descriptions-item v-if="orderDetail.data.receiverFullAddress" label="收货地址" :span="2">
            {{ orderDetail.data.receiverFullAddress }}
          </el-descriptions-item>
          <el-descriptions-item v-if="orderDetail.data.trackingNo" label="物流信息" :span="2">
            {{ deliveryProviderName(orderDetail.data.deliveryProviderCode) }} / {{ orderDetail.data.trackingNo }}
          </el-descriptions-item>
          <el-descriptions-item v-if="orderDetail.data.fulfillmentRemark" label="履约说明" :span="2">
            {{ orderDetail.data.fulfillmentRemark }}
          </el-descriptions-item>
          <el-descriptions-item v-if="orderDetail.data.cancelReason" label="取消原因" :span="2">
            {{ orderDetail.data.cancelReason }}
          </el-descriptions-item>
        </el-descriptions>
        <h3 class="timeline-title">状态记录</h3>
        <el-timeline v-if="orderDetail.logs.length">
          <el-timeline-item v-for="item in orderDetail.logs" :key="item.id" :timestamp="item.createTime">
            {{ statusText(item.statusTo) }} · {{ item.remark }}
          </el-timeline-item>
        </el-timeline>
        <p v-else class="muted">暂无状态记录</p>
      </template>
      <template #footer>
        <div class="points-order-drawer-actions">
          <el-button @click="orderDetail.visible = false">关闭</el-button>
          <el-button
            v-if="orderDetail.data && canShip(orderDetail.data)"
            type="success"
            @click="openOrderActionFromDetail(orderDetail.data, POINTS_ORDER_ACTION.SHIP)"
          >发货</el-button>
          <el-button
            v-if="orderDetail.data && canFulfill(orderDetail.data)"
            type="success"
            @click="openOrderActionFromDetail(orderDetail.data, POINTS_ORDER_ACTION.FULFILL)"
          >完成履约</el-button>
          <el-button
            v-if="orderDetail.data && canCancel(orderDetail.data)"
            type="danger"
            @click="openOrderActionFromDetail(orderDetail.data, POINTS_ORDER_ACTION.CANCEL)"
          >取消订单</el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="orderAction.visible" width="520px">
      <template #header>
        <div class="points-dialog-kicker-head">
          <span class="drawer-kicker">ORDER ACTION</span>
          <h2>{{ orderActionTitle }}</h2>
        </div>
      </template>
      <el-form label-position="top">
        <template v-if="orderAction.type === POINTS_ORDER_ACTION.SHIP">
          <el-form-item label="物流公司">
            <el-select
              v-model="orderAction.providerCode"
              filterable
              remote
              reserve-keyword
              :remote-method="loadDeliveryProviders"
              :loading="deliveryProviderLoading"
              placeholder="请选择物流公司"
              style="width: 100%"
            >
              <el-option
                v-for="provider in deliveryProviders"
                :key="provider.code"
                :label="provider.name"
                :value="provider.code"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="物流单号"><el-input v-model="orderAction.trackingNo" /></el-form-item>
        </template>
        <el-form-item v-else :label="orderAction.type === POINTS_ORDER_ACTION.FULFILL ? '履约说明' : '取消原因'">
          <el-input v-model="orderAction.remark" type="textarea" :rows="4" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderAction.visible = false">取消</el-button>
        <el-button type="primary" @click="submitOrderAction">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElButton, ElIcon, ElImage, ElMessage, ElMessageBox, ElUpload, type FormInstance } from 'element-plus'
import { Goods, Picture, Search, Tickets } from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import { uploadStorageFile } from '@/api/storage'
import { getStoragePreviewUrl } from '@/utils/storage'
import {
  getDefaultPointsFulfillmentType,
  getPointsFulfillmentText,
  getPointsOrderStatusTag,
  getPointsOrderStatusText,
  getPointsProductTypeText,
  POINTS_FULFILLMENT_TYPE,
  POINTS_ORDER_ACTION,
  POINTS_ORDER_STATUS,
  POINTS_ORDER_STATUS_OPTIONS,
  POINTS_PRODUCT_TYPE,
  POINTS_ROOT_CATEGORY_ID,
  POINTS_UNLIMITED_PER_MEMBER_LIMIT,
} from '@/constants/pointsMall'
import {
  cancelPointsOrder,
  deletePointsCategory,
  deletePointsProduct,
  deletePointsSku,
  fulfillPointsOrder,
  queryPointsCategories,
  queryPointsCoupons,
  queryPointsDeliveryProviders,
  queryPointsOrderDetail,
  queryPointsOrderLogs,
  queryPointsOrders,
  queryPointsProducts,
  queryPointsSkus,
  savePointsCategory,
  savePointsProduct,
  savePointsSku,
  shipPointsOrder,
  updatePointsProductStatus,
} from '@/api/mall/pointsMall'

const ImageUploader = defineComponent({
  props: {
    modelValue: { type: String, default: '' },
    clearable: { type: Boolean, default: false },
    compact: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const uploading = ref(false)
    async function upload(options: any) {
      uploading.value = true
      try {
        const response: any = await uploadStorageFile({ file: options.file, isPublic: true, isUsed: true })
        emit('update:modelValue', response.data.fileKey)
        options.onSuccess(response.data)
      } catch (error) {
        options.onError(error)
      } finally {
        uploading.value = false
      }
    }
    return () => h('div', { class: ['image-uploader', { 'image-uploader-compact': props.compact }] }, [
      props.modelValue
        ? h(ElImage, { src: getStoragePreviewUrl(props.modelValue), fit: 'cover', class: 'upload-preview' })
        : props.compact
          ? h('span', { class: 'upload-preview upload-preview-empty' }, [h(ElIcon, null, () => h(Picture))])
          : null,
      h(ElUpload, { httpRequest: upload, showFileList: false, accept: 'image/*' }, () =>
        h(ElButton, { type: 'primary', plain: true, loading: uploading.value }, () => props.modelValue ? '更换图片' : props.compact ? '选择图片' : '上传图片')),
      props.modelValue && props.clearable
        ? h(ElButton, { link: true, type: 'danger', onClick: () => emit('update:modelValue', '') }, () => '清除')
        : null,
    ])
  },
})

const route = useRoute()
function resolveTab(value: unknown) {
  const name = Array.isArray(value) ? value[0] : value
  return name === '积分商品' || name === 'product' ? 'product'
    : name === '兑换订单' || name === 'order' ? 'order'
      : 'category'
}
const activeTab = ref(resolveTab(route.query.tab))
const loading = ref(false)
const categories = ref<any[]>([])
const products = ref<any[]>([])
const productStatusUpdatingId = ref('')
const coupons = ref<any[]>([])
const deliveryProviders = ref<any[]>([])
const deliveryProviderLoading = ref(false)
const orders = ref<any[]>([])
const categoryFormRef = ref<FormInstance>()
const productFormRef = ref<FormInstance>()
const skuFormRef = ref<FormInstance>()

const productQuery = reactive({ name: '', categoryId: '', isEnabled: '' as boolean | string })
const productPage = reactive({ current: 1, size: 10, total: 0 })
const orderQuery = reactive({ orderNo: '', memberId: '', status: '' })
const orderPage = reactive({ current: 1, size: 10, total: 0 })
const orderStatuses = POINTS_ORDER_STATUS_OPTIONS

const categoryDialog = reactive({ visible: false, form: emptyCategory() })
const productDialog = reactive({ visible: false, form: emptyProduct() })
const skuDialog = reactive({ visible: false, loading: false, product: null as any, rows: [] as any[] })
const skuEdit = reactive({ form: emptySku() })
const orderDetail = reactive({ visible: false, data: null as any, logs: [] as any[] })
const orderAction = reactive({ visible: false, type: '', order: null as any, providerCode: '', trackingNo: '', remark: '' })

const categoryRules = { name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] }
const productRules = {
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  mainImage: [{ required: true, message: '请上传商品主图', trigger: 'change' }],
  productType: [{ required: true, message: '请选择商品类型', trigger: 'change' }],
  exchangeTime: [{ required: true, message: '请选择兑换时间', trigger: 'change' }],
}
const skuRules = {
  name: [{ required: true, message: '请输入SKU名称', trigger: 'blur' }],
  pointsPrice: [{ required: true, message: '请输入积分价格', trigger: 'change' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'change' }],
}

const productCategoryOptions = computed(() => categories.value.filter(
  (item) => item.isEnabled || item.id === productDialog.form.categoryId
))
const parentCategoryOptions = computed(() => categories.value.filter((item) => item.id !== categoryDialog.form.id))
const orderActionTitle = computed(() => {
  const titles: Record<string, string> = {
    [POINTS_ORDER_ACTION.SHIP]: '订单发货',
    [POINTS_ORDER_ACTION.FULFILL]: '完成人工履约',
    [POINTS_ORDER_ACTION.CANCEL]: '取消积分订单',
  }
  return titles[orderAction.type] || '订单操作'
})

function emptyCategory() { return { id: '', parentId: POINTS_ROOT_CATEGORY_ID, name: '', icon: '', sort: 1, isEnabled: true } }
function emptyProduct(): Record<string, any> { return { id: '', categoryId: '', name: '', subtitle: '', productType: POINTS_PRODUCT_TYPE.PHYSICAL, fulfillmentType: POINTS_FULFILLMENT_TYPE.LOGISTICS, mainImage: '', detailDesc: '', couponId: '', perMemberLimit: POINTS_UNLIMITED_PER_MEMBER_LIMIT, exchangeTime: [] as string[], isEnabled: false, sort: 1 } }
function emptySku() { return { id: '', spuId: '', name: '', pointsPrice: 1, stock: 0, mainImage: '', isEnabled: true, sort: 1 } }
function previewUrl(key?: string) { return key ? getStoragePreviewUrl(key) : '' }
function categoryName(id: string) { return !id || Number(id) === POINTS_ROOT_CATEGORY_ID ? '一级分类' : categories.value.find((item) => item.id === id)?.name || '-' }
function productTypeText(value: number) { return getPointsProductTypeText(value) }
function fulfillmentText(value: number) { return getPointsFulfillmentText(value) }
function deliveryProviderName(code?: string) { return deliveryProviders.value.find((item) => item.code === code)?.name || code || '-' }
function statusText(value: string) { return getPointsOrderStatusText(value) }
function statusTag(value: string) { return getPointsOrderStatusTag(value) }
function formatDate(value?: string) { return value ? value.slice(0, 10) : '-' }
function formatTime(value?: string) { return value && value.length > 10 ? value.slice(11) : '' }
function canShip(row: any) {
  return row.status === POINTS_ORDER_STATUS.PENDING_FULFILLMENT
    && row.fulfillmentType === POINTS_FULFILLMENT_TYPE.LOGISTICS
}
function canFulfill(row: any) {
  return row.status === POINTS_ORDER_STATUS.PENDING_FULFILLMENT
    && row.fulfillmentType === POINTS_FULFILLMENT_TYPE.MANUAL
}
function canCancel(row: any) {
  return row.status === POINTS_ORDER_STATUS.PENDING_FULFILLMENT
    && row.fulfillmentType !== POINTS_FULFILLMENT_TYPE.AUTO_COUPON
}

async function loadCategories() {
  const response: any = await queryPointsCategories()
  categories.value = response.data || []
}
async function loadProducts(reset = false) {
  if (reset) productPage.current = 1
  loading.value = true
  try {
    const response: any = await queryPointsProducts({ ...productQuery, current: productPage.current, size: productPage.size })
    products.value = response.data?.records || []
    productPage.total = Number(response.data?.total || 0)
  } finally { loading.value = false }
}
async function loadOrders(reset = false) {
  if (reset) orderPage.current = 1
  loading.value = true
  try {
    const response: any = await queryPointsOrders({ ...orderQuery, current: orderPage.current, size: orderPage.size })
    orders.value = response.data?.records || []
    orderPage.total = Number(response.data?.total || 0)
  } finally { loading.value = false }
}
async function loadActiveTab() {
  if (!categories.value.length) await loadCategories()
  if (activeTab.value === 'product') await loadProducts()
  if (activeTab.value === 'order') await loadOrders()
}

function openCategoryDialog(row?: any) { categoryDialog.form = row ? { ...row, parentId: Number(row.parentId || POINTS_ROOT_CATEGORY_ID) } : emptyCategory(); categoryDialog.visible = true }
async function submitCategory() {
  await categoryFormRef.value?.validate()
  await savePointsCategory({ ...categoryDialog.form, parentId: categoryDialog.form.parentId ?? POINTS_ROOT_CATEGORY_ID })
  ElMessage.success('分类保存成功'); categoryDialog.visible = false; await loadCategories()
}
async function removeCategory(row: any) {
  if (categories.value.some((item) => String(item.parentId) === String(row.id))) {
    ElMessage.warning('该分类下仍有子分类或商品，暂不可删除')
    return
  }
  const productResponse = await queryPointsProducts({ categoryId: row.id, current: 1, size: 1 }) as { data?: { total?: number | string } }
  if (Number(productResponse.data?.total || 0) > 0) {
    ElMessage.warning('该分类下仍有子分类或商品，暂不可删除')
    return
  }
  await ElMessageBox.confirm(`确认删除分类“${row.name}”？`, '删除确认', { type: 'warning' })
  await deletePointsCategory(row.id); ElMessage.success('删除成功'); await loadCategories()
}

async function openProductDialog(row?: any) {
  if (!coupons.value.length) { const response: any = await queryPointsCoupons(); coupons.value = response.data || [] }
  productDialog.form = row ? { ...row, exchangeTime: [row.beginTime, row.endTime] } : emptyProduct()
  productDialog.visible = true
}
function syncFulfillmentType() {
  productDialog.form.fulfillmentType = getDefaultPointsFulfillmentType(productDialog.form.productType)
  if (productDialog.form.productType !== POINTS_PRODUCT_TYPE.COUPON) productDialog.form.couponId = ''
}
async function submitProduct() {
  await productFormRef.value?.validate()
  if (productDialog.form.productType === POINTS_PRODUCT_TYPE.COUPON && !productDialog.form.couponId) { ElMessage.warning('请选择兑换优惠券'); return }
  const [beginTime, endTime] = productDialog.form.exchangeTime
  await savePointsProduct({ ...productDialog.form, beginTime, endTime, exchangeTime: undefined, couponId: productDialog.form.couponId || null })
  ElMessage.success('商品保存成功'); productDialog.visible = false; await loadProducts()
}
async function changeProductStatus(row: any, value: string | number | boolean) {
  const isEnabled = Boolean(value)
  if (Boolean(row.isEnabled) === isEnabled || productStatusUpdatingId.value) return
  productStatusUpdatingId.value = row.id
  try {
    await updatePointsProductStatus({ id: row.id, isEnabled })
    row.isEnabled = isEnabled
    ElMessage.success(isEnabled ? '商品已上架' : '商品已下架')
  } finally {
    productStatusUpdatingId.value = ''
  }
}
async function removeProduct(row: any) {
  await ElMessageBox.confirm(`确认删除积分商品“${row.name}”？仅无兑换记录的商品可删除。`, '删除确认', { type: 'warning' })
  await deletePointsProduct(row.id); ElMessage.success('删除成功'); await loadProducts()
}
function resetProductQuery() { Object.assign(productQuery, { name: '', categoryId: '', isEnabled: '' }); loadProducts(true) }
function changeProductPage({ page, limit }: any) { productPage.current = page; productPage.size = limit; loadProducts() }

async function openSkuDialog(product: any) {
  skuDialog.product = product
  skuEdit.form = { ...emptySku(), spuId: product.id }
  skuDialog.visible = true
  await loadSkus()
}
async function loadSkus() { skuDialog.loading = true; try { const response: any = await queryPointsSkus(skuDialog.product.id); skuDialog.rows = response.data || [] } finally { skuDialog.loading = false } }
function openSkuEdit(row?: any) {
  skuEdit.form = row ? { ...row } : { ...emptySku(), spuId: skuDialog.product.id }
  skuFormRef.value?.clearValidate()
}
async function submitSku() {
  await skuFormRef.value?.validate()
  await savePointsSku(skuEdit.form)
  ElMessage.success('SKU保存成功')
  skuEdit.form = { ...emptySku(), spuId: skuDialog.product.id }
  await loadSkus()
}
async function removeSku(row: any) {
  await ElMessageBox.confirm(`确认删除SKU“${row.name}”？`, '删除确认', { type: 'warning' })
  await deletePointsSku(row.id); ElMessage.success('删除成功'); await loadSkus()
}

function resetOrderQuery() { Object.assign(orderQuery, { orderNo: '', memberId: '', status: '' }); loadOrders(true) }
function changeOrderPage({ page, limit }: any) { orderPage.current = page; orderPage.size = limit; loadOrders() }
async function openOrderDetail(row: any) {
  if (!deliveryProviders.value.length) await loadDeliveryProviders('')
  const [detailResponse, logResponse]: any[] = await Promise.all([queryPointsOrderDetail(row.id), queryPointsOrderLogs(row.id)])
  orderDetail.data = detailResponse.data; orderDetail.logs = logResponse.data || []; orderDetail.visible = true
}
function openOrderAction(row: any, type: string) {
  Object.assign(orderAction, { visible: true, type, order: row, providerCode: '', trackingNo: '', remark: '' })
  if (type === POINTS_ORDER_ACTION.SHIP) loadDeliveryProviders('')
}
function openOrderActionFromDetail(row: Parameters<typeof openOrderAction>[0], type: string) {
  orderDetail.visible = false
  openOrderAction(row, type)
}
async function loadDeliveryProviders(keyword = '') {
  deliveryProviderLoading.value = true
  try {
    const response: any = await queryPointsDeliveryProviders(keyword)
    deliveryProviders.value = response.data || []
    if (!keyword && orderAction.visible && orderAction.type === POINTS_ORDER_ACTION.SHIP && !orderAction.providerCode) {
      orderAction.providerCode = deliveryProviders.value[0]?.code || ''
    }
  } finally { deliveryProviderLoading.value = false }
}
async function submitOrderAction() {
  if (orderAction.type === POINTS_ORDER_ACTION.SHIP) {
    if (!orderAction.providerCode || !orderAction.trackingNo) { ElMessage.warning('请填写物流公司和物流单号'); return }
    await shipPointsOrder({ id: orderAction.order.id, providerCode: orderAction.providerCode, trackingNo: orderAction.trackingNo })
  } else if (orderAction.type === POINTS_ORDER_ACTION.FULFILL) {
    if (!orderAction.remark) { ElMessage.warning('请填写履约说明'); return }
    await fulfillPointsOrder({ id: orderAction.order.id, remark: orderAction.remark })
  } else {
    if (!orderAction.remark) { ElMessage.warning('请填写取消原因'); return }
    await cancelPointsOrder({ id: orderAction.order.id, reason: orderAction.remark })
  }
  ElMessage.success('操作成功'); orderAction.visible = false; await loadOrders()
}

onMounted(() => { void loadActiveTab() })

watch(() => route.query.tab, (value) => {
  activeTab.value = resolveTab(value)
  void loadActiveTab()
})
</script>

<style scoped>
.points-category-toolbar { display: flex; justify-content: flex-end; margin: 2px 0 8px; }
.points-category-name { font-weight: 700; }
.points-mall-page :deep(.mall-query-form .el-input),
.points-mall-page :deep(.mall-query-form .el-select) { width: 188px; }
.points-mall-page .mall-table-panel :deep(.mall-pagination) { display: flex; min-height: 48px; align-items: center; justify-content: flex-end; margin: 0; padding: 7px 12px; border-top: 1px solid var(--mall-line, var(--ym-line)); }
.product-cell { display: flex; width: 240px; max-width: 100%; min-width: 0; align-items: center; justify-content: flex-start; gap: 12px; margin: 0 auto; text-align: left; }
.product-cell-copy { min-width: 0; flex: 1 1 auto; text-align: left; }
.product-cell strong, .product-cell p { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.product-cell p { margin: 4px 0 0; color: var(--mall-muted, var(--ym-muted)); font-size: 12px; }
.product-cell.compact { gap: 8px; }
.points-cell-stack { display: flex; width: max-content; max-width: 100%; margin: 0 auto; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; }
.status-switch-cell { display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; }
.status-switch-cell span { color: var(--mall-muted, var(--ym-muted)); font-size: 12px; }
.product-image { width: 42px; height: 42px; flex: 0 0 42px; border-radius: 7px; background: var(--mall-paper, var(--ym-paper)); }.table-image { width: 34px; height: 34px; flex: 0 0 34px; border-radius: 7px; background: var(--mall-paper, var(--ym-paper)); }
.image-placeholder { display: inline-flex; align-items: center; justify-content: center; color: var(--mall-muted, var(--ym-muted)); font-size: 16px; }
.muted { color: var(--mall-muted, var(--ym-muted)); font-size: 12px; }.form-tip { margin-left: 12px; color: var(--mall-muted, var(--ym-muted)); font-size: 12px; }.dialog-form { margin-top: 18px; }
.timeline-title { margin: 26px 0 18px; font-size: 16px; }.image-uploader { display: flex; align-items: center; gap: 12px; }.image-uploader :deep(.upload-preview) { width: 72px; height: 72px; flex: 0 0 72px; border-radius: 9px; background: var(--mall-paper, var(--ym-paper)); }
.points-mall-empty { display: flex; min-height: 180px; align-items: center; justify-content: center; flex-direction: column; gap: 7px; color: var(--mall-muted, var(--ym-muted)); }
.points-mall-empty .el-icon { margin-bottom: 3px; color: var(--mall-brand, var(--ym-brand)); font-size: 28px; }
.points-mall-empty strong { color: var(--mall-ink, var(--ym-ink)); font-size: 13px; }
.points-mall-empty span { font-size: 12px; }
.points-mall-time { display: block; color: var(--mall-ink, var(--ym-ink)); font-size: 12px; }
.points-mall-time-sub { display: block; margin-top: 0; color: var(--mall-muted, var(--ym-muted)); font-family: var(--ym-font-mono, monospace); font-size: 10px; }
.points-order-drawer-heading { display: flex; flex-direction: column; gap: 5px; }
.points-order-drawer-heading span { color: var(--mall-brand, var(--ym-brand)); font-family: var(--ym-font-mono, monospace); font-size: 10px; font-weight: 700; letter-spacing: 0.12em; }
.points-order-drawer-heading strong { color: var(--mall-ink, var(--ym-ink)); font-size: 19px; }
.points-order-detail-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.points-order-detail-head > div { display: flex; flex-direction: column; gap: 5px; }
.points-order-detail-head span { color: var(--mall-muted, var(--ym-muted)); font-size: 9px; letter-spacing: .04em; }
.points-order-detail-head .points-order-no { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: var(--mall-ink, var(--ym-ink)); }
.points-order-summary { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--mall-line, var(--ym-line)); }
.points-order-product-image { width: 64px; height: 64px; flex: 0 0 64px; border-radius: 8px; background: var(--mall-paper, var(--ym-paper)); }
.points-order-summary-copy { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; gap: 5px; }
.points-order-summary-copy strong { color: var(--mall-ink, var(--ym-ink)); font-size: 14px; }
.points-order-summary-copy span { color: var(--mall-muted, var(--ym-muted)); font-size: 11px; }
.points-order-drawer-actions { display: flex; justify-content: flex-end; gap: 10px; }
.drawer-kicker { display: block; color: var(--mall-brand, var(--ym-brand)); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; font-weight: 700; letter-spacing: .12em; }
.points-dialog-kicker-head { display: flex; flex-direction: column; gap: 5px; }
.points-dialog-kicker-head h2 { margin: 0; color: var(--mall-ink, var(--ym-ink)); font-size: 18px; font-weight: 700; }
.points-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 18px; margin-top: 18px; }
.points-form-grid .el-form-item { margin-bottom: 0; }
.points-form-grid .wide { grid-column: 1 / -1; }
.sku-inline-form { margin-bottom: 14px; padding: 14px; border: 1px solid var(--mall-line, var(--ym-line)); border-radius: 8px; background: var(--ym-row-hover); }
.sku-inline-main { display: grid; grid-template-columns: minmax(150px, 1.4fr) 120px 120px minmax(172px, 1fr) auto; align-items: end; gap: 10px 12px; }
.sku-inline-form :deep(.el-form-item) { margin-bottom: 0; }
.sku-inline-form :deep(.el-input) { width: 100%; }
.sku-inline-form :deep(.el-input-number) { width: 100%; }
.sku-inline-form :deep(.el-form-item__label) { min-height: auto; padding-bottom: 6px; color: var(--mall-muted, var(--ym-muted)); font-size: 12px; white-space: nowrap; }
.sku-label-tip { color: var(--mall-muted, var(--ym-muted)); font-size: 9px; font-weight: 400; }
.image-uploader-compact { gap: 8px; }
.image-uploader-compact :deep(.upload-preview) { width: 32px; height: 32px; flex: 0 0 32px; border-radius: 5px; }
.image-uploader :deep(.upload-preview-empty) { display: inline-flex; align-items: center; justify-content: center; color: var(--mall-muted, var(--ym-muted)); }
</style>
