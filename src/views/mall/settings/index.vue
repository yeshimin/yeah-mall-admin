<template>
  <div class="basic-settings">
    <div class="page-header">
      <h2>基础设置</h2>
    </div>

    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h3>店铺信息设置</h3>
        </div>
      </template>

      <el-form ref="settingsFormRef" :model="settingsForm" label-width="120px" :rules="settingsRules">
        <el-form-item label="店铺编号" prop="shopNo">
          <el-input v-model="settingsForm.shopNo" placeholder="店铺编号" style="width: 400px;" disabled></el-input>
        </el-form-item>

        <el-form-item label="店铺名称" prop="shopName">
          <el-input v-model="settingsForm.shopName" placeholder="请输入店铺名称" style="width: 400px;"></el-input>
        </el-form-item>

        <el-form-item label="店铺Logo" prop="shopLogo">
          <el-upload
            class="logo-upload"
            action="/dev-api/mch/storage/upload"
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
                :style="{ width: '120px', height: '120px' }"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><picture-filled /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-else class="upload-placeholder">
                <el-icon><upload-filled /></el-icon>
                <div class="upload-text">点击上传Logo</div>
              </div>
            </div>
          </el-upload>
          <div class="form-tip">建议上传尺寸为200x200的图片，支持JPG、PNG格式</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSaveSettings" :loading="saving">保存设置</el-button>
          <el-button @click="handleResetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getStoragePreviewUrl } from '@/utils/storage'
import { ElMessage } from 'element-plus';
import { getToken } from '@/utils/auth';

const loading = ref(false);
const saving = ref(false);
const settingsFormRef = ref(null);

const settingsForm = reactive({
  shopNo: '',
  shopName: '',
  shopLogo: ''
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
  try {
    await settingsFormRef.value.validate();

    saving.value = true;

    // 调用真实的API更新店铺信息
    const response = await fetch('/dev-api/mch/shop/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        id: '1', // 店铺ID，实际项目中可能需要从其他地方获取
        shopName: settingsForm.shopName,
        shopLogo: settingsForm.shopLogo
      })
    });

    const result = await response.json();

    if (result.code === 0) {
      // 更新localStorage中的店铺信息，以便同步更新右上角的店铺名称
      const currentShop = localStorage.getItem('currentShop');
      if (currentShop) {
        const shopInfo = JSON.parse(currentShop);
        shopInfo.name = settingsForm.shopName;
        localStorage.setItem('currentShop', JSON.stringify(shopInfo));

        // 触发自定义事件，通知Navbar组件更新店铺名称
        window.dispatchEvent(new CustomEvent('shopInfoUpdated'));
      }
      ElMessage.success('设置保存成功');
    } else {
      ElMessage.error(result.message || '保存失败');
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
  try {
    loading.value = true;

    // 调用真实的API获取店铺详情
    const response = await fetch('/dev-api/mch/shop/crud/detail?id=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    const result = await response.json();

    if (result.code === 0 && result.data) {
      const shopInfo = result.data;
      settingsForm.shopNo = shopInfo.shopNo || '';
      settingsForm.shopName = shopInfo.shopName || '';
      settingsForm.shopLogo = shopInfo.shopLogo || '';
    } else {
      ElMessage.error('获取店铺信息失败');
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
.basic-settings {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-upload {
  margin-bottom: 20px;
}

.upload-area {
  display: inline-block;
  cursor: pointer;
}

.upload-placeholder {
  width: 120px;
  height: 120px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;
    background-color: #f0f9ff;
  }
}

.upload-text {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>