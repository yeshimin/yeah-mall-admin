<template>
  <div class="basic-settings mall-page">
    <el-card class="settings-card" shadow="never">
      <template #header>
        <div class="settings-section-title">
          <div>
            <h3>店铺信息设置</h3>
            <p>资料仅作用于当前登录选择的店铺，保存后同步展示在 App 店铺页。</p>
          </div>
          <el-tag :type="settingsForm.isOpen ? 'success' : 'info'">
            {{ settingsForm.isOpen ? '营业中' : '已停业' }}
          </el-tag>
        </div>
      </template>

      <div class="settings-form-layout">
        <aside class="settings-logo-panel">
          <el-upload
            class="logo-upload"
            :action="merchantStorageUploadUrl"
            :headers="{ 'Authorization': `Bearer ${getToken()}` }"
            :show-file-list="false"
            :on-success="handleLogoUpload"
            :on-error="handleUploadError"
            accept="image/*"
          >
            <div class="upload-area">
              <el-image
                v-if="settingsForm.shopLogo"
                :src="getFullImageUrl(settingsForm.shopLogo)"
                fit="cover"
                class="shop-logo-preview"
              >
                <template #error>
                  <div class="upload-placeholder"><el-icon><picture-filled /></el-icon></div>
                </template>
              </el-image>
              <div v-else class="upload-placeholder">
                <el-icon><upload-filled /></el-icon>
                <span>上传 Logo</span>
              </div>
            </div>
          </el-upload>
          <strong>店铺 Logo</strong>
          <span>建议 200 × 200，支持 JPG、PNG</span>
        </aside>

      <el-form ref="settingsFormRef" :model="settingsForm" label-position="top" :rules="settingsRules" class="settings-form-grid">
        <el-form-item label="店铺编号" prop="shopNo">
          <el-input v-model="settingsForm.shopNo" placeholder="店铺编号" disabled />
        </el-form-item>

        <el-form-item label="店铺名称" prop="shopName">
          <el-input v-model="settingsForm.shopName" placeholder="请输入店铺名称" />
        </el-form-item>

        <el-form-item label="店铺简介" prop="shopIntro" class="settings-form-wide">
          <el-input
            v-model="settingsForm.shopIntro"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="简要介绍店铺经营内容与特色"
          />
        </el-form-item>

        <el-form-item label="营业状态" class="business-status-field">
          <el-switch v-model="settingsForm.isOpen" active-text="营业中" inactive-text="已停业" />
          <div class="form-tip">停业后商品仍可在平台浏览，但用户不能提交新订单。</div>
        </el-form-item>

        <el-form-item label="平台佣金">
          <el-input :model-value="`${settingsForm.settlementCommissionRate}%`" disabled />
          <div class="form-tip">由平台统一设置。</div>
        </el-form-item>

        <el-form-item label="结算周期">
          <el-input :model-value="`订单完成后 ${settingsForm.settlementDelayDays} 天`" disabled />
          <div class="form-tip">结算规则由平台设置，如有疑问请联系平台管理员。</div>
        </el-form-item>
      </el-form>
      </div>

      <div class="settings-save-bar">
        <el-button @click="handleResetForm">重置</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveSettings">保存设置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getStoragePreviewUrl } from '@/utils/storage'
import { ElMessage } from 'element-plus';
import { getToken } from '@/utils/auth';
import { resolveApiUrl } from '@/utils/download'
import { getMchShopDetail, updateMchShop } from '@/api/mall/shop';
import { getCurrentShop, setCurrentShop } from '@/utils/shop'

const loading = ref(false);
const saving = ref(false);
const settingsFormRef = ref(null);
const merchantStorageUploadUrl = resolveApiUrl('/mch/storage/upload')

const settingsForm = reactive({
  shopNo: '',
  shopName: '',
  shopLogo: '',
  shopIntro: '',
  isOpen: true,
  settlementCommissionRate: 0,
  settlementDelayDays: 7
});

const settingsRules = {
  shopName: [
    { required: true, message: '请输入店铺名称', trigger: 'blur' },
    { max: 50, message: '店铺名称长度不能超过50个字符', trigger: 'blur' }
  ]
};

// 获取完整图片URL
function getFullImageUrl(fileKey) {
  return getStoragePreviewUrl(fileKey)
}

// 与其他商家业务页面共用当前选择的店铺标识。
function getCurrentShopId() {
  return getCurrentShop()?.id || null;
}

// 处理Logo上传成功
const handleLogoUpload = (response) => {
  if (response.code === 0 && response.data && response.data.fileKey) {
    settingsForm.shopLogo = response.data.fileKey;
    ElMessage.success('Logo上传成功');
  } else {
    ElMessage.error('Logo上传失败');
  }
};

// 处理上传错误
const handleUploadError = () => {
  ElMessage.error('上传失败，请检查网络连接');
};

// 保存设置
const handleSaveSettings = async () => {
  const shopId = getCurrentShopId();
  if (!shopId) {
    ElMessage.warning('请先选择店铺');
    return;
  }

  try {
    await settingsFormRef.value.validate();

    saving.value = true;

    const response = await updateMchShop({
      id: shopId,
      shopName: settingsForm.shopName,
      shopLogo: settingsForm.shopLogo,
      shopIntro: settingsForm.shopIntro,
      isOpen: settingsForm.isOpen
    });

    if (response.code === 0) {
      setCurrentShop({ id: shopId, name: settingsForm.shopName });
      ElMessage.success('设置保存成功');
    } else {
      ElMessage.error(response.message || '保存失败');
    }
  } catch (error) {
    console.error('保存设置失败:', error);
    ElMessage.error('保存设置失败');
  } finally {
    saving.value = false;
  }
};

// 重置表单
const handleResetForm = () => {
  settingsFormRef.value.resetFields();
};

// 获取店铺信息
const getShopInfo = async () => {
  const shopId = getCurrentShopId();
  if (!shopId) {
    ElMessage.warning('请先选择店铺');
    return;
  }

  try {
    loading.value = true;

    const response = await getMchShopDetail(shopId);

    if (response.code === 0 && response.data) {
      const shopInfo = response.data;
      settingsForm.shopNo = shopInfo.shopNo || '';
      settingsForm.shopName = shopInfo.shopName || '';
      settingsForm.shopLogo = shopInfo.shopLogo || '';
      settingsForm.shopIntro = shopInfo.shopIntro || '';
      settingsForm.isOpen = shopInfo.isOpen !== false;
      settingsForm.settlementCommissionRate = Number(shopInfo.settlementCommissionRate || 0);
      settingsForm.settlementDelayDays = Number(shopInfo.settlementDelayDays ?? 7);
    } else {
      ElMessage.error(response.message || '获取店铺信息失败');
    }
  } catch (error) {
    console.error('获取店铺信息失败:', error);
    ElMessage.error('获取店铺信息失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  getShopInfo();
});
</script>

<style lang="scss" scoped>
.settings-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3,
  p {
    margin: 0;
  }

  p {
    margin-top: 5px;
    color: var(--mall-muted);
    font-size: 12px;
  }
}

.settings-form-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 28px;
  padding: 24px;
}

.settings-logo-panel {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border-radius: 8px;
  background: #f4f6f3;

  strong {
    color: var(--mall-ink);
    font-size: 13px;
  }

  > span {
    color: var(--mall-muted);
    font-size: 12px;
    text-align: center;
  }
}

.settings-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 22px;

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.settings-form-wide) {
    grid-column: 1 / -1;
  }
}

.upload-area {
  cursor: pointer;
}

.shop-logo-preview,
.upload-placeholder {
  width: 120px;
  height: 120px;
  overflow: hidden;
  border: 1px dashed var(--mall-line-strong);
  border-radius: 8px;
}

.upload-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: var(--mall-muted);
  background: #fff;
  transition: 0.2s ease;

  &:hover {
    color: var(--mall-brand);
    border-color: var(--mall-brand);
    background: var(--mall-brand-soft);
  }
}

.form-tip {
  margin-top: 6px;
  color: var(--mall-muted);
  font-size: 12px;
  line-height: 1.5;
}

.settings-save-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--mall-line);
  background: #fafbfa;
}

@media (max-width: 900px) {
  .settings-form-layout,
  .settings-form-grid {
    grid-template-columns: 1fr;
  }

  .settings-form-grid :deep(.settings-form-wide) {
    grid-column: auto;
  }
}
</style>
