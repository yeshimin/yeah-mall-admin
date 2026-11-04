<template>
  <div class="mall-page merchant-manage-page">
    <section class="mall-filter-panel">
      <el-form :inline="true" :model="searchForm" class="mall-query-form" @submit.prevent="handleSearch">
        <el-form-item label="商家账号">
          <el-input v-model="searchForm.keyword" placeholder="账号、昵称或 ID" clearable />
        </el-form-item>
        <el-form-item label="账号状态">
          <el-select v-model="searchForm.isEnabled" clearable placeholder="全部状态">
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item class="mall-query-actions">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" native-type="submit"><el-icon><Search /></el-icon>查询</el-button>
        </el-form-item>
      </el-form>
      <div class="mall-business-actions">
        <el-button type="danger" plain :disabled="selectedIds.length === 0" @click="handleDelete()">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
        <el-button type="primary" @click="openCreateDialog"><el-icon><Plus /></el-icon>新增商家</el-button>
      </div>
    </section>

    <section class="mall-table-panel">
      <el-table v-loading="loading" :data="merchantList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="52" />
        <el-table-column label="商家账号" min-width="260">
          <template #default="{ row }">
            <div class="merchant-account-cell">
              <span class="merchant-avatar">{{ merchantInitial(row) }}</span>
              <span class="merchant-account-copy">
                <strong>{{ row.loginAccount }}</strong>
                <small :title="`${row.nickname ? `${row.nickname} · ` : ''}ID ${row.id}`">{{ row.nickname ? `${row.nickname} · ` : '' }}ID {{ row.id }}</small>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="店铺数量" min-width="160">
          <template #default="{ row }">
            <el-button link class="merchant-shop-count" @click="openDetail(row)">
              <strong>{{ row.shopCount }}</strong><span>家店铺</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="账号状态" min-width="160">
          <template #default="{ row }">
            <span class="merchant-account-status" :class="row.isEnabled ? 'is-enabled' : 'is-disabled'">
              <i></i>{{ row.isEnabled ? '启用' : '停用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160" />
        <el-table-column label="操作" min-width="160" fixed="right">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-button link type="primary" @click="openDetail(row)">查看</el-button>
              <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
              <el-dropdown trigger="click" @command="handleMoreCommand($event, row)">
                <el-button link type="primary">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="resetPassword">重置密码</el-dropdown-item>
                    <el-dropdown-item command="toggleStatus">{{ row.isEnabled ? '停用账号' : '启用账号' }}</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除商家</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <MallPagination :total="pagination.total" :page="pagination.current" :limit="pagination.size" @pagination="handlePagination" />
    </section>

    <el-drawer v-model="detailVisible" size="560px" class="merchant-detail-drawer" @closed="merchantDetail = undefined">
      <template #header>
        <div class="drawer-heading"><span>MERCHANT DETAIL</span><strong>商家详情</strong></div>
      </template>
      <div v-if="merchantDetail" class="merchant-detail-content">
        <div class="merchant-detail-profile">
          <span class="merchant-detail-avatar">{{ merchantInitial(merchantDetail) }}</span>
          <div>
            <h3>{{ merchantDetail.nickname || merchantDetail.loginAccount }}</h3>
            <span>{{ merchantDetail.loginAccount }} · ID {{ merchantDetail.id }}</span>
          </div>
          <span class="merchant-account-status" :class="merchantDetail.isEnabled ? 'is-enabled' : 'is-disabled'">
            <i></i>{{ merchantDetail.isEnabled ? '账号启用' : '账号停用' }}
          </span>
        </div>
        <div class="merchant-description-grid">
          <div><span>登录账号</span><strong>{{ merchantDetail.loginAccount }}</strong></div>
          <div><span>关联店铺</span><strong>{{ merchantDetail.shopCount }} 家，其中 {{ merchantDetail.enabledShopCount }} 家启用</strong></div>
          <div><span>创建时间</span><strong>{{ merchantDetail.createTime || '-' }}</strong></div>
          <div><span>更新时间</span><strong>{{ merchantDetail.updateTime || '-' }}</strong></div>
        </div>
        <section class="merchant-shop-section">
          <div class="merchant-detail-section-title">
            <h3>关联店铺</h3>
            <el-button @click="goToShops">进入店铺管理</el-button>
          </div>
          <el-table v-if="merchantDetail.shops.length" :data="merchantDetail.shops" border>
            <el-table-column prop="shopNo" label="店铺编号" min-width="130" />
            <el-table-column prop="shopName" label="店铺名称" min-width="150" />
            <el-table-column label="平台状态" width="90"><template #default="{ row }">{{ row.isEnabled ? '启用' : '停用' }}</template></el-table-column>
            <el-table-column label="营业状态" width="90"><template #default="{ row }">{{ row.isOpen ? '营业中' : '休息中' }}</template></el-table-column>
          </el-table>
          <el-empty v-else :image-size="52" description="该商家暂未创建店铺" />
        </section>
      </div>
      <template #footer>
        <div v-if="merchantDetail" class="merchant-detail-actions">
          <el-button @click="openResetPasswordDialog(merchantDetail)">重置密码</el-button>
          <el-button @click="handleToggleStatus(merchantDetail)">{{ merchantDetail.isEnabled ? '停用账号' : '启用账号' }}</el-button>
          <el-button type="primary" @click="openEditFromDetail">编辑商家</el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="dialogVisible" class="merchant-account-dialog" width="480px" destroy-on-close @closed="resetForm">
      <template #header>
        <div class="dialog-heading"><span>MERCHANT ACCOUNT</span><strong>{{ editingId ? '编辑商家' : '新增商家' }}</strong></div>
      </template>
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top">
        <el-form-item label="商家账号" prop="loginAccount"><el-input v-model="form.loginAccount" placeholder="请输入商家账号" /></el-form-item>
        <el-form-item v-if="!editingId" label="登录密码" prop="loginPassword">
          <el-input v-model="form.loginPassword" type="password" placeholder="请输入登录密码" show-password />
          <div class="form-tip">保存前将按系统规则进行加密处理。</div>
        </el-form-item>
        <div v-else class="form-tip merchant-edit-tip">账号状态和密码请通过列表“更多”操作单独维护。</div>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="passwordDialogVisible" class="merchant-password-dialog" width="430px" @closed="resetPasswordForm">
      <template #header><div class="dialog-heading"><span>RESET PASSWORD</span><strong>重置登录密码</strong></div></template>
      <div v-if="passwordMerchant" class="password-merchant-summary">
        <span class="merchant-avatar">{{ merchantInitial(passwordMerchant) }}</span>
        <div><strong>{{ passwordMerchant.loginAccount }}</strong><small>{{ passwordMerchant.nickname || '未设置昵称' }}</small></div>
      </div>
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-position="top">
        <el-form-item label="新密码" prop="loginPassword"><el-input v-model="passwordForm.loginPassword" type="password" placeholder="请输入新密码" show-password /></el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword"><el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password /></el-form-item>
      </el-form>
      <template #footer><el-button @click="passwordDialogVisible = false">取消</el-button><el-button type="primary" :loading="passwordSubmitting" @click="handleResetPassword">确认重置</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Delete, Plus, Search } from '@element-plus/icons-vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import { createMerchant, deleteMerchants, getMerchantDetail, queryMerchants, resetMerchantPassword, updateMerchant, updateMerchantStatus } from '@/api/mall/platform'
import type { MerchantDetailRecord, MerchantForm, MerchantRecord } from '@/types/mall'
import { sha256Hex } from '@/utils/crypto'
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'

type MerchantMoreCommand = 'resetPassword' | 'toggleStatus' | 'delete'

const router = useRouter()
const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const passwordSubmitting = ref(false)
const dialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const detailVisible = ref(false)
const editingId = ref<string>()
const passwordMerchant = ref<MerchantRecord>()
const merchantDetail = ref<MerchantDetailRecord>()
const merchantList = ref<MerchantRecord[]>([])
const selectedIds = ref<string[]>([])

const searchForm = reactive<{ keyword: string; isEnabled?: boolean }>({ keyword: '' })
const pagination = reactive({ current: 1, size: 10, total: 0 })
const form = reactive<MerchantForm>({ loginAccount: '', loginPassword: '' })
const passwordForm = reactive({ loginPassword: '', confirmPassword: '' })

const formRules: FormRules<MerchantForm> = {
  loginAccount: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  loginPassword: [{ validator: (_rule, value, callback) => {
    if (!editingId.value && !value) callback(new Error('请输入登录密码'))
    else callback()
  }, trigger: 'blur' }],
}

const passwordRules: FormRules = {
  loginPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [{ validator: (_rule, value, callback) => {
    if (!value) callback(new Error('请再次输入新密码'))
    else if (value !== passwordForm.loginPassword) callback(new Error('两次输入的密码不一致'))
    else callback()
  }, trigger: 'blur' }],
}

function resetForm() {
  editingId.value = undefined
  Object.assign(form, { loginAccount: '', loginPassword: '' })
  formRef.value?.clearValidate()
}

function resetPasswordForm() {
  passwordMerchant.value = undefined
  Object.assign(passwordForm, { loginPassword: '', confirmPassword: '' })
  passwordFormRef.value?.clearValidate()
}

async function loadMerchants() {
  loading.value = true
  try {
    const response = await queryMerchants({ current: pagination.current, size: pagination.size, keyword: searchForm.keyword || undefined, isEnabled: searchForm.isEnabled })
    merchantList.value = response.data.records || []
    pagination.total = Number(response.data.total || 0)
    selectedIds.value = []
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '加载商家列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() { pagination.current = 1; void loadMerchants() }
function handleReset() { searchForm.keyword = ''; searchForm.isEnabled = undefined; handleSearch() }
function handlePagination(value: { page: number; limit: number }) { pagination.current = value.page; pagination.size = value.limit; void loadMerchants() }
function merchantInitial(merchant?: Pick<MerchantRecord, 'loginAccount' | 'nickname'>) { return String(merchant?.nickname || merchant?.loginAccount || '商').trim().slice(0, 1).toUpperCase() }
function handleSelectionChange(rows: MerchantRecord[]) { selectedIds.value = rows.map((row) => row.id) }
function openCreateDialog() { resetForm(); dialogVisible.value = true }

async function openEditDialog(row: MerchantRecord) {
  try {
    const response = await getMerchantDetail(row.id)
    editingId.value = row.id
    Object.assign(form, { loginAccount: response.data.loginAccount, loginPassword: '' })
    dialogVisible.value = true
  } catch (error) { ElMessage.error(getRequestErrorMessage(error) || '加载商家详情失败') }
}

async function openDetail(row: MerchantRecord) {
  try {
    merchantDetail.value = (await getMerchantDetail(row.id)).data
    detailVisible.value = true
  } catch (error) { ElMessage.error(getRequestErrorMessage(error) || '加载商家详情失败') }
}

function openEditFromDetail() {
  const detail = merchantDetail.value
  if (!detail) return
  detailVisible.value = false
  void openEditDialog(detail)
}

function openResetPasswordDialog(row: MerchantRecord) {
  passwordMerchant.value = row
  Object.assign(passwordForm, { loginPassword: '', confirmPassword: '' })
  passwordDialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value || submitting.value) return
  try {
    await formRef.value.validate()
    submitting.value = true
    if (editingId.value) await updateMerchant({ id: editingId.value, loginAccount: form.loginAccount })
    else await createMerchant({ loginAccount: form.loginAccount, loginPassword: await sha256Hex(String(form.loginPassword || '').trim()) })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await loadMerchants()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '保存商家失败')
  } finally { submitting.value = false }
}

async function handleResetPassword() {
  if (!passwordFormRef.value || !passwordMerchant.value || passwordSubmitting.value) return
  try {
    await passwordFormRef.value.validate()
    passwordSubmitting.value = true
    await resetMerchantPassword({ id: passwordMerchant.value.id, loginPassword: await sha256Hex(passwordForm.loginPassword.trim()) })
    ElMessage.success('密码已重置，商家需要重新登录')
    passwordDialogVisible.value = false
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '重置密码失败')
  } finally { passwordSubmitting.value = false }
}

async function handleToggleStatus(row: MerchantRecord) {
  const nextEnabled = !row.isEnabled
  const action = nextEnabled ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(nextEnabled ? `确认启用商家“${row.loginAccount}”吗？` : '停用后该商家现有登录会话将立即失效，确认继续吗？', `${action}商家`, { type: 'warning', confirmButtonText: `确认${action}`, cancelButtonText: '取消' })
    await updateMerchantStatus({ id: row.id, isEnabled: nextEnabled })
    ElMessage.success(`商家账号已${action}`)
    await loadMerchants()
    if (merchantDetail.value?.id === row.id) merchantDetail.value = (await getMerchantDetail(row.id)).data
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || `${action}商家失败`)
  }
}

function handleMoreCommand(command: MerchantMoreCommand, row: MerchantRecord) {
  if (command === 'resetPassword') openResetPasswordDialog(row)
  else if (command === 'toggleStatus') void handleToggleStatus(row)
  else void handleDelete(row)
}

async function handleDelete(row?: MerchantRecord) {
  const ids = row ? [row.id] : selectedIds.value
  if (!ids.length) return
  try {
    const target = row ? `商家“${row.loginAccount}”` : `选中的 ${ids.length} 个商家`
    await ElMessageBox.confirm(`仅无关联店铺的商家可以删除，确认删除${target}吗？`, '删除商家', { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' })
    await deleteMerchants(ids)
    ElMessage.success('删除成功')
    await loadMerchants()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '删除商家失败')
  }
}

function goToShops() {
  if (!merchantDetail.value) return
  detailVisible.value = false
  void router.push({ path: '/mall/shop', query: { mchId: merchantDetail.value.id } })
}

onMounted(() => void loadMerchants())
</script>

<style scoped>
.merchant-account-cell { display: flex; width: 220px; max-width: 100%; min-width: 0; align-items: center; justify-content: flex-start; gap: 10px; margin: 0 auto; text-align: left; }
.merchant-avatar, .merchant-detail-avatar { display: inline-flex; width: 36px; height: 36px; flex: 0 0 36px; align-items: center; justify-content: center; border-radius: 10px; color: var(--mall-brand, #24634f); background: var(--mall-brand-soft, #e8f2ed); font-size: 13px; font-weight: 700; }
.merchant-account-copy { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.merchant-account-copy strong { overflow: hidden; color: var(--mall-ink, #17251f); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.merchant-account-copy small { overflow: hidden; color: var(--mall-muted, #65726a); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.merchant-shop-count { gap: 4px; }
.merchant-shop-count strong { color: var(--mall-brand, #24634f); font-family: var(--ym-font-mono, monospace); font-size: 15px; }
.merchant-shop-count span { color: var(--mall-muted, #65726a); font-size: 11px; }
.merchant-account-status { display: inline-flex; align-items: center; gap: 6px; color: #89938d; font-size: 12px; font-weight: 600; }
.merchant-account-status i { width: 6px; height: 6px; flex: 0 0 6px; border-radius: 50%; background: currentColor; }
.merchant-account-status.is-enabled { color: var(--mall-brand, #24634f); }
.drawer-heading, .dialog-heading { display: flex; flex-direction: column; gap: 5px; }
.drawer-heading span, .dialog-heading span { color: var(--mall-brand, #24634f); font-family: var(--ym-font-mono, monospace); font-size: 10px; font-weight: 700; letter-spacing: .12em; }
.drawer-heading strong, .dialog-heading strong { color: var(--mall-ink, #17251f); font-size: 19px; }
.merchant-detail-content { display: flex; flex-direction: column; }
.merchant-detail-profile { display: grid; grid-template-columns: 54px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding-bottom: 18px; }
.merchant-detail-avatar { width: 54px; height: 54px; flex-basis: 54px; font-size: 18px; }
.merchant-detail-profile > div { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.merchant-detail-profile h3 { margin: 0; color: var(--mall-ink, #17251f); font-size: 16px; }
.merchant-detail-profile > div span { color: var(--mall-muted, #65726a); font-size: 11px; }
.merchant-description-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid var(--mall-line, #dce4de); border-left: 1px solid var(--mall-line, #dce4de); }
.merchant-description-grid > div { display: flex; min-height: 62px; justify-content: center; flex-direction: column; gap: 6px; padding: 10px 12px; border-right: 1px solid var(--mall-line, #dce4de); border-bottom: 1px solid var(--mall-line, #dce4de); }
.merchant-description-grid span { color: var(--mall-muted, #65726a); font-size: 11px; }
.merchant-description-grid strong { color: var(--mall-ink-secondary, #30423a); font-size: 13px; }
.merchant-shop-section { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--mall-line, #dce4de); }
.merchant-detail-section-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.merchant-detail-section-title h3 { margin: 0; color: var(--mall-ink, #17251f); font-size: 14px; }
.merchant-detail-actions { display: flex; justify-content: flex-end; gap: 8px; }
.password-merchant-summary { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding: 11px; border-radius: 7px; background: var(--mall-paper, #f4f6f3); }
.password-merchant-summary > div { display: flex; flex-direction: column; gap: 3px; }
.password-merchant-summary small, .form-tip { color: var(--mall-muted, #65726a); font-size: 12px; }
.merchant-edit-tip { margin: 4px 0 8px; }
.merchant-manage-page .mall-filter-panel { background: #fff; }
.merchant-manage-page :deep(.mall-query-form .el-input), .merchant-manage-page :deep(.mall-query-form .el-select) { width: 188px; }
.merchant-manage-page :deep(.mall-table-panel > .mall-pagination) { min-height: 48px; align-items: center; margin: 0; padding: 7px 12px; border-top: 1px solid var(--mall-line); background: #fff; }
:global(.merchant-detail-drawer .el-drawer__footer) { padding: 14px 20px; border-top: 1px solid #dce4de; }
:global(.merchant-account-dialog .el-dialog__header), :global(.merchant-password-dialog .el-dialog__header) { margin-right: 0; padding-bottom: 16px; border-bottom: 1px solid #dce4de; }
:global(.merchant-account-dialog .el-dialog__footer), :global(.merchant-password-dialog .el-dialog__footer) { padding-top: 16px; border-top: 1px solid #dce4de; }
</style>
