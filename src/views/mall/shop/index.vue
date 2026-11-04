<template>
  <div class="mall-page shop-manage-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" :model="searchForm" class="mall-query-form" @submit.prevent="handleSearch">
        <el-form-item label="所属商家">
          <el-select
            v-model="searchForm.mchId"
            clearable
            filterable
            remote
            remote-show-suffix
            reserve-keyword
            placeholder="全部商家"
            :remote-method="searchMerchantOptions"
            :loading="merchantLoading"
            @visible-change="handleMerchantSelectVisible"
          >
            <el-option
              v-for="merchant in merchantOptions"
              :key="merchant.id"
              :label="merchant.loginAccount"
              :value="merchant.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="店铺">
          <el-input v-model="searchForm.keyword" placeholder="店铺名称、编号或 ID" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态">
            <el-option label="全部状态" value="all" />
            <el-option label="平台已启用" value="platform-enabled" />
            <el-option label="平台已停用" value="platform-disabled" />
            <el-option label="营业中" value="open" />
            <el-option label="已停业" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item class="mall-query-actions">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" native-type="submit" icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
      <div class="mall-business-actions">
        <el-button type="danger" plain icon="Delete" :disabled="selectedIds.length === 0" @click="handleDelete()">
          批量删除
        </el-button>
        <el-button type="primary" icon="Plus" @click="openCreateDialog">新增店铺</el-button>
      </div>
    </section>

    <section class="mall-table-panel">
      <el-table v-loading="loading" :data="shopList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="52" />
        <el-table-column label="店铺" min-width="220">
          <template #default="{ row }">
            <div class="shop-cell">
              <span class="shop-logo-wrap">
                <StorageImage v-if="row.shopLogo" :src="row.shopLogo" :width="36" :height="36" :preview="false" />
                <span v-else class="shop-mark">{{ (row.shopName || '店').slice(0, 1) }}</span>
              </span>
              <span class="shop-copy">
                <strong><CopyableText :value="row.shopName || '-'" label="店铺名称" /></strong>
                <small class="shop-identity">
                  <span class="shop-no-value">
                    <CopyableText :value="row.shopNo || '-'" label="店铺编号" />
                  </span>
                  <span class="shop-identity-separator">· ID</span>
                  <span class="shop-id-value">
                    <CopyableText :value="row.id" label="店铺 ID" />
                  </span>
                </small>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="所属商家" min-width="120">
          <template #default="{ row }">
            <CopyableText :value="row.mchName || '-'" label="商家账号" />
          </template>
        </el-table-column>
        <el-table-column label="平台状态" width="100">
          <template #default="{ row }">
            <ReadOnlyStatus :tone="row.isEnabled ? 'success' : 'neutral'">
              {{ row.isEnabled ? '已启用' : '已停用' }}
            </ReadOnlyStatus>
          </template>
        </el-table-column>
        <el-table-column label="营业状态" width="100">
          <template #default="{ row }">
            <ReadOnlyStatus :tone="row.isOpen ? 'success' : 'warning'">
              {{ row.isOpen ? '营业中' : '已停业' }}
            </ReadOnlyStatus>
          </template>
        </el-table-column>
        <el-table-column label="平台佣金" width="100">
          <template #default="{ row }">{{ formatPercent(row.settlementCommissionRate) }}</template>
        </el-table-column>
        <el-table-column label="结算周期" width="100">
          <template #default="{ row }">T+{{ Number(row.settlementDelayDays ?? 0) }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="168" />
        <el-table-column label="操作" width="172" fixed="right">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-button link type="primary" @click="openDetail(row)">查看</el-button>
              <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="shop-empty-state">
            <el-icon><ShopIcon /></el-icon>
            <strong>没有匹配的店铺</strong>
            <span>调整筛选条件后重新查询</span>
          </div>
        </template>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="Number(pagination.total)"
          @current-change="loadShops"
          @size-change="handlePageSizeChange"
        />
      </div>
    </section>

    <el-drawer v-model="detailVisible" class="shop-detail-drawer" size="600px" @closed="handleDetailClosed">
      <template #header>
        <div class="drawer-heading">
          <span>SHOP DETAIL</span>
          <strong>店铺详情</strong>
        </div>
      </template>
      <div v-if="detail" class="shop-detail-content">
        <div class="shop-profile">
          <span class="shop-logo-wrap is-large">
            <StorageImage v-if="detail.shopLogo" :src="detail.shopLogo" :width="54" :height="54" :preview="false" />
            <span v-else class="shop-mark is-large">{{ (detail.shopName || '店').slice(0, 1) }}</span>
          </span>
          <div class="shop-profile-copy">
            <h3><CopyableText :value="detail.shopName || '-'" label="店铺名称" /></h3>
            <span>
              <CopyableText :value="detail.shopNo || '-'" label="店铺编号" />
              <span> · ID </span>
              <CopyableText :value="detail.id" label="店铺 ID" />
            </span>
          </div>
          <div class="shop-profile-status">
            <ReadOnlyStatus :tone="detail.isEnabled ? 'success' : 'neutral'">
              {{ detail.isEnabled ? '平台已启用' : '平台已停用' }}
            </ReadOnlyStatus>
            <ReadOnlyStatus :tone="detail.isOpen ? 'success' : 'warning'">
              {{ detail.isOpen ? '营业中' : '已停业' }}
            </ReadOnlyStatus>
          </div>
        </div>

        <div class="shop-description-grid">
          <div><span>所属商家</span><strong><CopyableText :value="detail.mchName || '-'" label="商家账号" /></strong></div>
          <div><span>平台佣金</span><strong>{{ formatPercent(detail.settlementCommissionRate) }}</strong></div>
          <div><span>结算周期</span><strong>订单完成后 {{ Number(detail.settlementDelayDays ?? 0) }} 天</strong></div>
          <div><span>创建时间</span><strong>{{ detail.createTime || '-' }}</strong></div>
          <div><span>更新时间</span><strong>{{ detail.updateTime || '-' }}</strong></div>
          <div><span>店铺编号</span><strong><CopyableText :value="detail.shopNo || '-'" label="店铺编号" /></strong></div>
        </div>

        <section class="shop-intro-section">
          <h4>店铺简介</h4>
          <p>{{ detail.shopIntro || '店铺暂未填写简介' }}</p>
        </section>
      </div>
      <template #footer>
        <el-button type="primary" @click="editFromDetail">编辑平台设置</el-button>
      </template>
    </el-drawer>

    <el-dialog
      v-model="dialogVisible"
      class="shop-form-dialog"
      :title="editingId ? '编辑店铺' : '新增店铺'"
      width="680px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" class="shop-form-grid">
        <el-form-item label="所属商家" prop="mchId">
          <el-input v-if="editingId" :model-value="editingMerchantName" disabled />
          <el-select
            v-else
            v-model="form.mchId"
            filterable
            remote
            remote-show-suffix
            reserve-keyword
            placeholder="请选择商家"
            :remote-method="searchMerchantOptions"
            :loading="merchantLoading"
            @visible-change="handleMerchantSelectVisible"
          >
            <el-option
              v-for="merchant in merchantOptions"
              :key="merchant.id"
              :label="merchant.loginAccount"
              :value="merchant.id"
            />
          </el-select>
          <div v-if="editingId" class="form-tip">创建后不可更换所属商家</div>
        </el-form-item>
        <el-form-item label="店铺名称" prop="shopName">
          <el-input v-model="form.shopName" placeholder="请输入店铺名称" />
        </el-form-item>
        <el-form-item label="店铺编号" prop="shopNo">
          <el-input v-model="form.shopNo" :disabled="Boolean(editingId)" placeholder="留空由系统自动生成" />
          <div class="form-tip">支持字母、数字、中划线和下划线</div>
        </el-form-item>
        <el-form-item label="平台状态">
          <el-select v-model="form.isEnabled">
            <el-option label="已启用" :value="true" />
            <el-option label="已停用" :value="false" />
          </el-select>
          <div class="form-tip">停用后平台不再允许该店铺交易</div>
        </el-form-item>
        <el-form-item label="平台佣金比例">
          <div class="number-field">
            <el-input-number
              v-model="form.settlementCommissionRate"
              :min="0"
              :max="100"
              :precision="2"
              :step="0.1"
              controls-position="right"
            />
            <span>%</span>
          </div>
        </el-form-item>
        <el-form-item label="结算周期">
          <div class="number-field">
            <el-input-number
              v-model="form.settlementDelayDays"
              :min="0"
              :max="365"
              :step="1"
              controls-position="right"
            />
            <span>天</span>
          </div>
          <div class="form-tip">从订单完成时间开始计算</div>
        </el-form-item>
      </el-form>
      <div class="dialog-hint">
        <el-icon><Operation /></el-icon>
        <span>店铺 Logo、简介和营业状态由商家在店铺设置中维护。</span>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Operation, Shop as ShopIcon } from '@element-plus/icons-vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import ReadOnlyStatus from '@/components/mall/ReadOnlyStatus.vue'
import StorageImage from '@/components/mall/StorageImage.vue'
import {
  createShop,
  deleteShops,
  getShopDetail,
  queryMerchants,
  queryShops,
  updateShop,
} from '@/api/mall/platform'
import type { MerchantRecord, ShopForm, ShopRecord } from '@/types/mall'
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'

type ShopStatusFilter = 'all' | 'platform-enabled' | 'platform-disabled' | 'open' | 'closed'

const formRef = ref<FormInstance>()
const loading = ref(false)
const merchantLoading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const editAfterDetailClose = ref(false)
const editingId = ref<string>()
const editingMerchantName = ref('')
const detail = ref<ShopRecord>()
const shopList = ref<ShopRecord[]>([])
const merchantOptions = ref<MerchantRecord[]>([])
const selectedIds = ref<string[]>([])
let merchantRequestId = 0

const searchForm = reactive<{ mchId?: string; keyword: string; status: ShopStatusFilter }>({
  keyword: '',
  status: 'all',
})
const pagination = reactive({ current: 1, size: 10, total: 0 })
const form = reactive<ShopForm>({
  mchId: undefined,
  shopNo: '',
  shopName: '',
  settlementCommissionRate: 0,
  settlementDelayDays: 7,
  isEnabled: true,
})

function validateShopNo(_rule: unknown, value: string | undefined, callback: (error?: Error) => void) {
  const shopNo = value?.trim()
  if (!shopNo) {
    callback()
    return
  }
  if (shopNo.length > 32) {
    callback(new Error('店铺编号长度不能超过32个字符'))
    return
  }
  if (!/^[A-Za-z0-9_-]+$/.test(shopNo)) {
    callback(new Error('店铺编号仅支持数字、英文字母、中划线和下划线'))
    return
  }
  callback()
}

const formRules: FormRules<ShopForm> = {
  mchId: [{ required: true, message: '请选择所属商家', trigger: 'change' }],
  shopName: [{ required: true, message: '请输入店铺名称', trigger: 'blur' }],
  shopNo: [{ validator: validateShopNo, trigger: ['blur', 'change'] }],
}

function resetForm() {
  editingId.value = undefined
  editingMerchantName.value = ''
  Object.assign(form, {
    mchId: undefined,
    shopNo: '',
    shopName: '',
    settlementCommissionRate: 0,
    settlementDelayDays: 7,
    isEnabled: true,
  })
  formRef.value?.clearValidate()
}

function applyStatusFilter(params: Record<string, unknown>) {
  if (searchForm.status === 'platform-enabled') params.isEnabled = true
  if (searchForm.status === 'platform-disabled') params.isEnabled = false
  if (searchForm.status === 'open') params.isOpen = true
  if (searchForm.status === 'closed') params.isOpen = false
}

async function loadMerchantOptions(keyword = '') {
  const requestId = ++merchantRequestId
  merchantLoading.value = true
  try {
    const response = await queryMerchants({
      current: 1,
      size: 50,
      keyword: keyword.trim() || undefined,
    })
    if (requestId !== merchantRequestId) return

    // 保留当前已选商家，避免远程搜索后下拉框只能回显原始ID。
    const selectedMerchantIds = new Set([searchForm.mchId, form.mchId].filter(Boolean))
    const preservedOptions = merchantOptions.value.filter((merchant) => selectedMerchantIds.has(merchant.id))
    merchantOptions.value = Array.from(
      new Map([...preservedOptions, ...(response.data.records || [])].map((merchant) => [merchant.id, merchant])).values(),
    )
  } catch (error) {
    if (requestId === merchantRequestId) {
      ElMessage.error(getRequestErrorMessage(error) || '加载商家选项失败')
    }
  } finally {
    if (requestId === merchantRequestId) merchantLoading.value = false
  }
}

function searchMerchantOptions(keyword: string) {
  void loadMerchantOptions(keyword)
}

function handleMerchantSelectVisible(visible: boolean) {
  if (visible && merchantOptions.value.length === 0) void loadMerchantOptions()
}

async function loadShops() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      current: pagination.current,
      size: pagination.size,
      mchId: searchForm.mchId,
      keyword: searchForm.keyword.trim() || undefined,
    }
    applyStatusFilter(params)
    const response = await queryShops(params)
    shopList.value = response.data.records || []
    pagination.total = Number(response.data.total || 0)
    selectedIds.value = []
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载店铺列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  void loadShops()
}

function handleReset() {
  searchForm.mchId = undefined
  searchForm.keyword = ''
  searchForm.status = 'all'
  handleSearch()
}

function handlePageSizeChange() {
  pagination.current = 1
  void loadShops()
}

function handleSelectionChange(rows: ShopRecord[]) {
  selectedIds.value = rows.map((row) => row.id)
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

function assignForm(record: ShopRecord) {
  Object.assign(form, {
    mchId: record.mchId,
    shopNo: record.shopNo || '',
    shopName: record.shopName,
    settlementCommissionRate: Number(record.settlementCommissionRate || 0),
    settlementDelayDays: Number(record.settlementDelayDays ?? 7),
    isEnabled: record.isEnabled !== false,
  })
}

async function fetchDetail(id: string) {
  const response = await getShopDetail(id)
  return response.data
}

async function openDetail(row: ShopRecord) {
  try {
    detail.value = await fetchDetail(row.id)
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载店铺详情失败')
  }
}

async function openEditDialog(row: ShopRecord) {
  try {
    const record = await fetchDetail(row.id)
    editingId.value = row.id
    editingMerchantName.value = record.mchName || '-'
    assignForm(record)
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载店铺详情失败')
  }
}

function editFromDetail() {
  if (!detail.value) return
  editAfterDetailClose.value = true
  detailVisible.value = false
}

function handleDetailClosed() {
  if (!editAfterDetailClose.value || !detail.value) return
  const record = detail.value
  editAfterDetailClose.value = false
  editingId.value = record.id
  editingMerchantName.value = record.mchName || '-'
  assignForm(record)
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value || submitting.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    submitting.value = true
    if (editingId.value) await updateShop({ ...form, id: editingId.value })
    else await createShop({ ...form })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await loadShops()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '保存店铺失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row?: ShopRecord) {
  const ids = row ? [row.id] : selectedIds.value
  if (ids.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${ids.length} 家店铺吗？仅无关联业务数据的空店铺允许删除，日常经营请优先停用。`,
      '删除店铺',
      { type: 'warning' },
    )
    await deleteShops(ids)
    ElMessage.success('删除成功')
    selectedIds.value = []

    const remainingTotal = Math.max(0, pagination.total - ids.length)
    const lastPage = Math.max(1, Math.ceil(remainingTotal / pagination.size))
    if (pagination.current > lastPage) pagination.current = lastPage
    await loadShops()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '删除店铺失败')
  }
}

function formatPercent(value?: number) {
  const normalized = Number(value || 0)
  return `${normalized.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')}%`
}

onMounted(() => {
  void loadMerchantOptions()
  void loadShops()
})
</script>

<style scoped>
.shop-cell {
  display: inline-flex;
  width: 196px;
  max-width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  margin: 0 auto;
  text-align: left;
}

.shop-manage-page :deep(.mall-query-form .el-select) {
  width: 168px;
}

.shop-manage-page :deep(.mall-query-form .el-input) {
  width: 188px;
}

.shop-logo-wrap {
  display: inline-flex;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  overflow: hidden;
  border-radius: 8px;
}

.shop-logo-wrap.is-large {
  width: 54px;
  height: 54px;
  flex-basis: 54px;
  border-radius: 11px;
}

.shop-logo-wrap :deep(.el-image),
.shop-logo-wrap :deep(.storage-image-placeholder) {
  border-radius: inherit;
}

.shop-mark {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--mall-brand, #24634f);
  background: var(--mall-brand-soft, #e8f2ed);
  font-size: 13px;
  font-weight: 700;
}

.shop-mark.is-large {
  width: 54px;
  height: 54px;
  border-radius: 11px;
  font-size: 18px;
}

.shop-copy {
  display: flex;
  width: 150px;
  min-width: 0;
  flex: 0 1 150px;
  flex-direction: column;
  gap: 2px;
}

.shop-copy strong {
  display: block;
  overflow: hidden;
  max-width: 100%;
  color: var(--mall-ink, #17251f);
  font-size: 13px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-copy strong :deep(.copyable-text) {
  display: block;
  overflow: hidden;
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-identity {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  overflow: hidden;
  color: var(--mall-muted, #65726a);
  font-family: var(--ym-font-mono, monospace);
  font-size: 10px;
  line-height: 14px;
  white-space: nowrap;
}

.shop-no-value,
.shop-id-value {
  min-width: 0;
  overflow: hidden;
}

.shop-no-value {
  flex: 0 1 auto;
}

.shop-id-value {
  flex: 1 1 auto;
}

.shop-identity-separator {
  flex: 0 0 auto;
  margin: 0 3px;
}

.shop-identity :deep(.copyable-text) {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-empty-state {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  color: var(--mall-muted, #65726a);
}

.shop-empty-state .el-icon {
  margin-bottom: 3px;
  color: var(--mall-brand, #24634f);
  font-size: 28px;
}

.shop-empty-state strong {
  color: var(--mall-ink-secondary, #30423a);
  font-size: 14px;
}

.shop-empty-state span {
  font-size: 12px;
}

.drawer-heading {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drawer-heading > span {
  color: var(--mall-brand, #24634f);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.drawer-heading > strong {
  color: var(--mall-ink, #17251f);
  font-size: 19px;
}

.shop-detail-content {
  display: flex;
  flex-direction: column;
}

.shop-profile {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  padding: 16px 0 18px;
  border-bottom: 1px solid var(--mall-line, #dce4de);
}

.shop-profile-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.shop-profile-copy h3 {
  overflow: hidden;
  margin: 0;
  color: var(--mall-ink, #17251f);
  font-size: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-profile-copy > span {
  display: flex;
  min-width: 0;
  align-items: center;
  overflow: hidden;
  color: var(--mall-muted, #65726a);
  font-family: var(--ym-font-mono, monospace);
  font-size: 10px;
  white-space: nowrap;
}

.shop-profile-status {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}

.shop-description-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 18px;
  border: 1px solid var(--mall-line, #dce4de);
  border-right: 0;
  border-bottom: 0;
}

.shop-description-grid > div {
  display: flex;
  min-height: 62px;
  flex-direction: column;
  gap: 7px;
  box-sizing: border-box;
  padding: 11px 12px;
  border-right: 1px solid var(--mall-line, #dce4de);
  border-bottom: 1px solid var(--mall-line, #dce4de);
}

.shop-description-grid span {
  color: var(--mall-muted, #65726a);
  font-size: 11px;
}

.shop-description-grid strong {
  color: var(--mall-ink-secondary, #30423a);
  font-size: 13px;
}

.shop-intro-section {
  margin-top: 18px;
}

.shop-intro-section h4 {
  margin: 0 0 10px;
  color: var(--mall-ink, #17251f);
  font-size: 13px;
}

.shop-intro-section p {
  margin: 0;
  color: var(--mall-ink-secondary, #30423a);
  font-size: 12px;
  line-height: 1.7;
}

.shop-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}

.shop-form-grid :deep(.el-form-item) {
  margin-bottom: 14px;
}

.shop-form-grid :deep(.el-select),
.shop-form-grid :deep(.el-input-number) {
  width: 100%;
}

.form-tip {
  width: 100%;
  min-height: 14px;
  margin-top: 4px;
  color: var(--mall-muted, #65726a);
  font-size: 10px;
  line-height: 1.4;
}

.number-field {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
}

.number-field > span {
  min-width: 18px;
  color: var(--mall-muted, #65726a);
  font-size: 12px;
}

.dialog-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  padding: 10px 12px;
  color: var(--mall-muted, #65726a);
  border-radius: 6px;
  background: var(--mall-paper, #f4f6f3);
  font-size: 11px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
}
</style>
