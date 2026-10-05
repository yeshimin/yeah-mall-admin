<template>
  <div class="app-container">
    <h2>测试Banner更新接口</h2>
    <el-form :model="form" label-width="120px">
      <el-form-item label="Banner ID">
        <el-input v-model="form.id" placeholder="请输入Banner ID" />
      </el-form-item>
      <el-form-item label="Shop ID">
        <el-input v-model="form.shopId" placeholder="请输入Shop ID" />
      </el-form-item>
      <el-form-item label="选择文件">
        <input type="file" @change="handleFileSelect" ref="fileInputRef" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleUpdate">更新Banner</el-button>
      </el-form-item>
    </el-form>
    <div v-if="result" class="result">
      <h3>结果:</h3>
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { updateBannerWithFile } from '@/api/mall/banner'

const form = ref({
  id: '',
  shopId: '',
  file: null
})

const fileInputRef = ref(null)
const result = ref(null)

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    form.value.file = file
  }
}

function handleUpdate() {
  if (!form.value.id || !form.value.shopId || !form.value.file) {
    ElMessage.warning('请填写所有字段并选择文件')
    return
  }

  const bannerId = form.value.id.toString();
  updateBannerWithFile(bannerId, form.value.shopId, form.value.file).then(res => {
    ElMessage.success('更新成功')
    result.value = JSON.stringify(res, null, 2)
    console.log('更新结果:', res)
  }).catch(err => {
    ElMessage.error('更新失败: ' + err.message)
    result.value = '错误: ' + err.message
    console.error('更新错误:', err)
  })
}
</script>

<style scoped>
.app-container {
  padding: 24px;
}
.result {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>