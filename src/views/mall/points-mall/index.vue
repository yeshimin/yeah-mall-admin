<template>
  <div class="app-container points-mall-page">
    <el-tabs v-model="activeTab" class="content-tabs" @tab-change="loadActiveTab">
      <el-tab-pane label="商品分类" name="category">
        <div class="toolbar-row">
          <el-button type="primary" @click="openCategoryDialog()">新增分类</el-button>
        </div>
        <el-table v-loading="loading" :data="categories" row-key="id">
          <el-table-column prop="name" label="分类名称" min-width="180" />
          <el-table-column prop="parentId" label="父分类" min-width="160">
            <template #default="{ row }">{{ categoryName(row.parentId) }}</template>
          </el-table-column>
          <el-table-column label="图标" width="90">
            <template #default="{ row }">
              <el-image v-if="row.icon" :src="previewUrl(row.icon)" fit="cover" class="table-image" />
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="90" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.isEnabled ? 'success' : 'info'">{{ row.isEnabled ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openCategoryDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="removeCategory(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="积分商品" name="product">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="商品名称">
            <el-input v-model="productQuery.name" clearable placeholder="搜索商品" />
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
          <el-form-item>
            <el-button type="primary" @click="loadProducts(true)">查询</el-button>
            <el-button @click="resetProductQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <div class="toolbar-row">
          <el-button type="primary" @click="openProductDialog()">新增商品</el-button>
        </div>
        <el-table v-loading="loading" :data="products">
          <el-table-column label="商品" min-width="260">
            <template #default="{ row }">
              <div class="product-cell">
                <el-image :src="previewUrl(row.mainImage)" fit="cover" class="product-image" />
                <div>
                  <strong>{{ row.name }}</strong>
                  <p>{{ row.subtitle || '暂无副标题' }}</p>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="分类" width="130">
            <template #default="{ row }">{{ categoryName(row.categoryId) }}</template>
          </el-table-column>
          <el-table-column label="类型 / 履约" width="190">
            <template #default="{ row }">
              <div>{{ productTypeText(row.productType) }}</div>
              <span class="muted">{{ fulfillmentText(row.fulfillmentType) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="兑换时间" min-width="210">
            <template #default="{ row }">
              <div>{{ row.beginTime }}</div>
              <div class="muted">至 {{ row.endTime }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="perMemberLimit" label="每人限兑" width="100">
            <template #default="{ row }">{{ row.perMemberLimit > POINTS_UNLIMITED_PER_MEMBER_LIMIT ? row.perMemberLimit : '不限' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.isEnabled ? 'success' : 'info'">{{ row.isEnabled ? '已上架' : '已下架' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openProductDialog(row)">编辑</el-button>
              <el-button link type="warning" @click="openSkuDialog(row)">SKU管理</el-button>
              <el-button link type="danger" @click="removeProduct(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          :total="productPage.total"
          :page="productPage.current"
          :limit="productPage.size"
          @pagination="changeProductPage"
        />
      </el-tab-pane>

      <el-tab-pane label="兑换订单" name="order">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="订单编号">
            <el-input v-model="orderQuery.orderNo" clearable placeholder="订单编号" />
          </el-form-item>
          <el-form-item label="会员ID">
            <el-input v-model="orderQuery.memberId" clearable placeholder="会员ID" />
          </el-form-item>
          <el-form-item label="订单状态">
            <el-select v-model="orderQuery.status" clearable placeholder="全部状态">
              <el-option v-for="item in orderStatuses" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadOrders(true)">查询</el-button>
            <el-button @click="resetOrderQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading" :data="orders">
          <el-table-column prop="orderNo" label="订单编号" min-width="150" show-overflow-tooltip />
          <el-table-column prop="memberId" label="会员ID" min-width="160" />
          <el-table-column label="商品" min-width="230">
            <template #default="{ row }">
              <div class="product-cell compact">
                <el-image :src="previewUrl(row.productImage)" fit="cover" class="table-image" />
                <div><strong>{{ row.productName }}</strong><p>{{ row.skuName }}</p></div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="兑换" width="130">
            <template #default="{ row }">
              <div>{{ row.pointsPrice }} 积分 × {{ row.quantity }}</div>
              <span class="muted">合计 {{ row.totalPoints }} 积分</span>
            </template>
          </el-table-column>
          <el-table-column label="履约方式" width="110">
            <template #default="{ row }">{{ fulfillmentText(row.fulfillmentType) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="兑换时间" width="180" />
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openOrderDetail(row)">详情</el-button>
              <el-button v-if="canShip(row)" link type="success" @click="openOrderAction(row, POINTS_ORDER_ACTION.SHIP)">发货</el-button>
              <el-button v-if="canFulfill(row)" link type="success" @click="openOrderAction(row, POINTS_ORDER_ACTION.FULFILL)">完成履约</el-button>
              <el-button v-if="canCancel(row)" link type="danger" @click="openOrderAction(row, POINTS_ORDER_ACTION.CANCEL)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          :total="orderPage.total"
          :page="orderPage.current"
          :limit="orderPage.size"
          @pagination="changeOrderPage"
        />
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="categoryDialog.visible" :title="categoryDialog.form.id ? '编辑分类' : '新增分类'" width="520px">
      <el-form ref="categoryFormRef" :model="categoryDialog.form" :rules="categoryRules" label-width="100px">
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

    <el-dialog v-model="productDialog.visible" :title="productDialog.form.id ? '编辑积分商品' : '新增积分商品'" width="760px">
      <el-alert v-if="!productDialog.form.id" title="请先下架保存商品，再配置 SKU，最后编辑上架。" type="info" :closable="false" show-icon />
      <el-form ref="productFormRef" :model="productDialog.form" :rules="productRules" label-width="120px" class="dialog-form">
        <el-form-item label="商品分类" prop="categoryId">
          <el-select v-model="productDialog.form.categoryId" style="width: 100%">
            <el-option v-for="item in enabledCategories" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品名称" prop="name"><el-input v-model="productDialog.form.name" maxlength="64" /></el-form-item>
        <el-form-item label="商品副标题"><el-input v-model="productDialog.form.subtitle" maxlength="128" /></el-form-item>
        <el-form-item label="商品主图" prop="mainImage"><image-uploader v-model="productDialog.form.mainImage" /></el-form-item>
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
        <el-form-item v-if="productDialog.form.productType === POINTS_PRODUCT_TYPE.COUPON" label="兑换优惠券" prop="couponId">
          <el-select v-model="productDialog.form.couponId" filterable style="width: 100%" placeholder="选择已开放积分兑换的优惠券">
            <el-option
              v-for="coupon in coupons"
              :key="coupon.id"
              :label="`${coupon.name}（剩余 ${coupon.quantity - coupon.received}）`"
              :value="coupon.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="兑换时间" prop="exchangeTime">
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
        <el-form-item label="商品详情"><el-input v-model="productDialog.form.detailDesc" type="textarea" :rows="5" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="productDialog.form.sort" :min="0" /></el-form-item>
        <el-form-item label="上架"><el-switch v-model="productDialog.form.isEnabled" :disabled="!productDialog.form.id" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitProduct">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="skuDialog.visible" :title="`${skuDialog.product?.name || ''} · SKU管理`" width="820px">
      <div class="toolbar-row"><el-button type="primary" @click="openSkuEdit()">新增SKU</el-button></div>
      <el-table v-loading="skuDialog.loading" :data="skuDialog.rows">
        <el-table-column prop="name" label="SKU名称" min-width="180" />
        <el-table-column label="图片" width="90">
          <template #default="{ row }"><el-image :src="previewUrl(row.mainImage || skuDialog.product?.mainImage)" fit="cover" class="table-image" /></template>
        </el-table-column>
        <el-table-column prop="pointsPrice" label="积分价格" width="110" />
        <el-table-column prop="stock" label="可用库存" width="100" />
        <el-table-column prop="totalStock" label="累计库存" width="100" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><el-tag :type="row.isEnabled ? 'success' : 'info'">{{ row.isEnabled ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openSkuEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="removeSku(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="skuEdit.visible" :title="skuEdit.form.id ? '编辑SKU' : '新增SKU'" width="560px" append-to-body>
      <el-form ref="skuFormRef" :model="skuEdit.form" :rules="skuRules" label-width="110px">
        <el-form-item label="SKU名称" prop="name"><el-input v-model="skuEdit.form.name" /></el-form-item>
        <el-form-item label="SKU图片"><image-uploader v-model="skuEdit.form.mainImage" /></el-form-item>
        <el-form-item label="积分价格" prop="pointsPrice"><el-input-number v-model="skuEdit.form.pointsPrice" :min="1" /></el-form-item>
        <el-form-item label="可用库存" prop="stock"><el-input-number v-model="skuEdit.form.stock" :min="0" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="skuEdit.form.sort" :min="0" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="skuEdit.form.isEnabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="skuEdit.visible = false">取消</el-button>
        <el-button type="primary" @click="submitSku">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="orderDetail.visible" title="积分订单详情" size="620px">
      <template v-if="orderDetail.data">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单编号" :span="2">{{ orderDetail.data.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="会员ID">{{ orderDetail.data.memberId }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">{{ statusText(orderDetail.data.status) }}</el-descriptions-item>
          <el-descriptions-item label="商品">{{ orderDetail.data.productName }}</el-descriptions-item>
          <el-descriptions-item label="规格">{{ orderDetail.data.skuName }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ orderDetail.data.quantity }}</el-descriptions-item>
          <el-descriptions-item label="消耗积分">{{ orderDetail.data.totalPoints }}</el-descriptions-item>
          <el-descriptions-item label="履约方式">{{ fulfillmentText(orderDetail.data.fulfillmentType) }}</el-descriptions-item>
          <el-descriptions-item label="兑换时间">{{ orderDetail.data.createTime }}</el-descriptions-item>
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
        <el-timeline>
          <el-timeline-item v-for="item in orderDetail.logs" :key="item.id" :timestamp="item.createTime">
            {{ statusText(item.statusTo) }} · {{ item.remark }}
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>

    <el-dialog v-model="orderAction.visible" :title="orderActionTitle" width="520px">
      <el-form label-width="110px">
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
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import { ElButton, ElImage, ElMessage, ElMessageBox, ElUpload, type FormInstance } from 'element-plus'
import Pagination from '@/components/Pagination/index.vue'
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
} from '@/api/mall/pointsMall'

const ImageUploader = defineComponent({
  props: { modelValue: { type: String, default: '' } },
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
    return () => h('div', { class: 'image-uploader' }, [
      props.modelValue ? h(ElImage, { src: getStoragePreviewUrl(props.modelValue), fit: 'cover', class: 'upload-preview' }) : null,
      h(ElUpload, { httpRequest: upload, showFileList: false, accept: 'image/*' }, () =>
        h(ElButton, { type: 'primary', plain: true, loading: uploading.value }, () => props.modelValue ? '更换图片' : '上传图片')),
    ])
  },
})

const activeTab = ref('category')
const loading = ref(false)
const categories = ref<any[]>([])
const products = ref<any[]>([])
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
const skuEdit = reactive({ visible: false, form: emptySku() })
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

const enabledCategories = computed(() => categories.value.filter((item) => item.isEnabled))
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
async function removeProduct(row: any) {
  await ElMessageBox.confirm(`确认删除积分商品“${row.name}”？仅无兑换记录的商品可删除。`, '删除确认', { type: 'warning' })
  await deletePointsProduct(row.id); ElMessage.success('删除成功'); await loadProducts()
}
function resetProductQuery() { Object.assign(productQuery, { name: '', categoryId: '', isEnabled: '' }); loadProducts(true) }
function changeProductPage({ page, limit }: any) { productPage.current = page; productPage.size = limit; loadProducts() }

async function openSkuDialog(product: any) { skuDialog.product = product; skuDialog.visible = true; await loadSkus() }
async function loadSkus() { skuDialog.loading = true; try { const response: any = await queryPointsSkus(skuDialog.product.id); skuDialog.rows = response.data || [] } finally { skuDialog.loading = false } }
function openSkuEdit(row?: any) { skuEdit.form = row ? { ...row } : { ...emptySku(), spuId: skuDialog.product.id }; skuEdit.visible = true }
async function submitSku() {
  await skuFormRef.value?.validate(); await savePointsSku(skuEdit.form)
  ElMessage.success('SKU保存成功'); skuEdit.visible = false; await loadSkus()
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
async function loadDeliveryProviders(keyword = '') {
  deliveryProviderLoading.value = true
  try {
    const response: any = await queryPointsDeliveryProviders(keyword)
    deliveryProviders.value = response.data || []
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

onMounted(loadCategories)
</script>

<style scoped>
.points-mall-page { --ink: #2b2925; --sand: #f3eee4; --orange: #c95f32; color: var(--ink); }
.content-tabs { padding: 8px 22px 22px; border: 1px solid #ece7df; border-radius: 14px; background: #fff; }
.toolbar-row { display: flex; justify-content: flex-end; margin: 8px 0 16px; }.filter-form { margin-top: 8px; padding: 14px 16px 0; border-radius: 10px; background: #f8f6f2; }
.product-cell { display: flex; align-items: center; gap: 12px; }.product-cell p { margin: 4px 0 0; color: #8a847b; font-size: 12px; }.product-cell.compact { gap: 8px; }
.product-image { width: 58px; height: 58px; border-radius: 9px; background: var(--sand); }.table-image { width: 44px; height: 44px; border-radius: 7px; background: var(--sand); }
.muted { color: #989188; font-size: 12px; }.form-tip { margin-left: 12px; color: #989188; font-size: 12px; }.dialog-form { margin-top: 18px; }
.timeline-title { margin: 26px 0 18px; font-size: 16px; }.image-uploader { display: flex; align-items: center; gap: 12px; }.upload-preview { width: 72px; height: 72px; border-radius: 9px; background: var(--sand); }
:deep(.el-pagination) { justify-content: flex-end; margin-top: 20px; }
</style>
