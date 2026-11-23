<template>
  <div class="mall-page merchant-shop-page merchant-settings-page">
    <div v-loading="loading" class="mchs-settings-card">
      <div class="mchs-section-title">
        <span class="shelf-mark" />
        <div>
          <b>店铺信息设置</b>
          <small>资料仅作用于当前登录选择的店铺，保存后同步展示在 App 店铺页</small>
        </div>
        <span class="status-ticket" :class="`tone-${form.isOpen ? 'success' : 'neutral'}`">
          {{ form.isOpen ? '营业中' : '已停业' }}
        </span>
      </div>

      <div class="mchs-settings-body">
        <div class="mchs-logo-block">
          <el-upload
            class="mchs-logo-upload"
            :action="merchantStorageUploadUrl"
            :headers="{ Authorization: `Bearer ${getToken()}` }"
            :show-file-list="false"
            :disabled="logoUploading"
            accept="image/*"
            :before-upload="beforeLogoUpload"
            :on-success="handleLogoUpload"
            :on-error="handleLogoUploadError"
          >
            <span class="mchs-logo-stack">
              <span class="mchs-logo-tile" :class="{ 'is-uploading': logoUploading }">
                <StorageImage v-if="form.shopLogo" :src="form.shopLogo" width="100%" height="100%" :preview="false" />
                <span v-else class="mchs-logo-char">{{ logoChar }}</span>
              </span>
              <span class="mchs-logo-replace">{{ logoUploading ? '上传中…' : '更换 Logo' }}</span>
            </span>
          </el-upload>
          <small>建议 200 × 200，支持 JPG、PNG</small>
        </div>

        <div class="mchs-settings-fields">
          <label class="mchs-field">
            <span>店铺编号</span>
            <input :value="form.shopNo" disabled />
          </label>
          <label class="mchs-field">
            <span>店铺名称 <em class="mchs-required">*</em></span>
            <input v-model="form.shopName" maxlength="50" placeholder="请输入店铺名称" />
          </label>
          <label class="mchs-field wide">
            <span>店铺简介</span>
            <textarea v-model="form.shopIntro" maxlength="500" rows="4" />
            <small class="mchs-intro-counter">{{ form.shopIntro.length }}/500</small>
          </label>
          <div class="mchs-business-switch">
            <span>
              <b>营业状态</b>
              <small>停业后商品仍可浏览，但用户不能提交新订单</small>
            </span>
            <button
              type="button"
              class="mchs-switch"
              :class="{ 'is-on': form.isOpen }"
              :aria-pressed="form.isOpen"
              aria-label="切换营业状态"
              @click="form.isOpen = !form.isOpen"
            ><i /></button>
          </div>
          <label class="mchs-field">
            <span>平台佣金</span>
            <input :value="commissionText" disabled />
            <small>由平台统一设置</small>
          </label>
          <label class="mchs-field">
            <span>结算周期</span>
            <input :value="settlementText" disabled />
            <small>如有疑问请联系平台管理员</small>
          </label>
        </div>
      </div>

      <div class="mchs-settings-savebar">
        <span>修改后需保存生效</span>
        <div>
          <button type="button" @click="resetForm">重置</button>
          <button type="button" class="primary" :disabled="saving" @click="saveSettings">保存设置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import StorageImage from '@/components/mall/StorageImage.vue'
import { getMchShopDetail, updateMchShop } from '@/api/mall/shop'
import { getToken } from '@/utils/auth'
import { resolveApiUrl } from '@/utils/download'
import { getCurrentShop, setCurrentShop } from '@/utils/shop'
import '@/assets/yeah-mall-shop.css'

defineOptions({ name: 'MerchantSettingsPage' })

interface ShopForm {
  shopNo: string
  shopName: string
  shopLogo: string
  shopIntro: string
  isOpen: boolean
  settlementCommissionRate: number
  settlementDelayDays: number
}

const merchantStorageUploadUrl = resolveApiUrl('/mch/storage/upload')

const loading = ref(false)
const saving = ref(false)
const logoUploading = ref(false)
const form = reactive<ShopForm>(emptyForm())
let loadedForm: ShopForm = emptyForm()

const logoChar = computed(() => form.shopName.trim().slice(0, 1) || '店')
const commissionText = computed(() => `${Number(form.settlementCommissionRate || 0)}%`)
const settlementText = computed(() => `订单完成后 ${Number(form.settlementDelayDays ?? 7)} 天`)

function emptyForm(): ShopForm {
  return {
    shopNo: '',
    shopName: '',
    shopLogo: '',
    shopIntro: '',
    isOpen: true,
    settlementCommissionRate: 0,
    settlementDelayDays: 7,
  }
}

async function loadShop() {
  const shopId = getCurrentShop()?.id
  if (!shopId) {
    ElMessage.warning('请先选择店铺')
    return
  }
  loading.value = true
  try {
    const response = await getMchShopDetail(shopId)
    const data = response.data || {}
    form.shopNo = data.shopNo || ''
    form.shopName = data.shopName || ''
    form.shopLogo = data.shopLogo || ''
    form.shopIntro = data.shopIntro || ''
    form.isOpen = data.isOpen !== false
    form.settlementCommissionRate = Number(data.settlementCommissionRate || 0)
    form.settlementDelayDays = Number(data.settlementDelayDays ?? 7)
    loadedForm = { ...form }
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    loading.value = false
  }
}

function beforeLogoUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择 JPG、PNG 等图片文件')
    return false
  }
  logoUploading.value = true
  return true
}

function handleLogoUpload(response: { code?: number; data?: { fileKey?: string }; message?: string }) {
  logoUploading.value = false
  if (response?.code === 0 && response.data?.fileKey) {
    form.shopLogo = response.data.fileKey
    ElMessage.success('Logo 上传成功')
    return
  }
  ElMessage.error(response?.message || 'Logo 上传失败')
}

function handleLogoUploadError() {
  logoUploading.value = false
  ElMessage.error('Logo 上传失败，请检查网络连接')
}

function resetForm() {
  Object.assign(form, loadedForm)
  ElMessage.success('店铺设置已恢复为加载值')
}

async function saveSettings() {
  const shopId = getCurrentShop()?.id
  if (!shopId) {
    ElMessage.warning('请先选择店铺')
    return
  }
  const shopName = form.shopName.trim()
  if (!shopName) {
    ElMessage.warning('请输入店铺名称')
    return
  }
  saving.value = true
  try {
    await updateMchShop({
      id: shopId,
      shopName,
      shopLogo: form.shopLogo,
      shopIntro: form.shopIntro,
      isOpen: form.isOpen,
    })
    form.shopName = shopName
    loadedForm = { ...form }
    setCurrentShop({ id: shopId, name: shopName })
    ElMessage.success('店铺设置已保存')
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    saving.value = false
  }
}

onMounted(loadShop)
</script>