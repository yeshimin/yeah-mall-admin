<template>
  <div class="login-container">
    <div class="login-panel">
      <div
        v-if="loginSubject === 'admin' && loginPageOptions.noticeEnabled && loginPageOptions.noticeContent"
        class="login-notice"
      >
        <el-alert
          :title="loginPageOptions.noticeTitle || '提示'"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="login-notice-content">{{ loginPageOptions.noticeContent }}</div>
          </template>
        </el-alert>
      </div>
        <div class="login-box">
        <div class="login-header">
          <h2>{{ loginSubject === 'admin' ? '管理后台' : '商家后台' }}</h2>
          <p>欢迎回来，请登录</p>
        </div>
        <el-radio-group v-model="loginSubject" class="login-subject" @change="handleLoginSubjectChange">
          <el-radio-button label="admin">管理端</el-radio-button>
          <el-radio-button label="merchant">商家端</el-radio-button>
        </el-radio-group>
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              :placeholder="loginSubject === 'admin' ? '请输入用户名' : '请输入商家账号'"
              prefix-icon="User"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              show-password
            ></el-input>
          </el-form-item>
          <el-form-item v-if="loginSubject === 'admin' && captchaEnabled" prop="code">
            <div class="captcha-row">
              <el-input
                v-model="loginForm.code"
                placeholder="请输入验证码"
                prefix-icon="Key"
              ></el-input>
              <button type="button" class="captcha-trigger" @click="loadCaptcha">
                <img v-if="captchaImage" :src="captchaImage" alt="验证码" class="captcha-image" />
                <span v-else>获取验证码</span>
              </button>
            </div>
          </el-form-item>
          <el-form-item class="login-form-extra">
            <el-checkbox v-model="loginForm.remember">记住用户名</el-checkbox>
            <div class="login-form-links">
              <el-link
                v-if="loginSubject === 'admin' && loginPageOptions.registerEnabled"
                type="primary"
                :underline="false"
                @click="openRegisterDialog"
              >
                注册账号
              </el-link>
              <el-link
                type="primary"
                :underline="false"
                class="login-form-forgot"
                @click="handleForgotPassword"
              >
                忘记密码？
              </el-link>
            </div>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              class="login-form-submit"
              :loading="loginLoading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <el-dialog
      v-model="registerDialogVisible"
      title="注册账号"
      width="420px"
      :close-on-click-modal="!registerLoading"
      :close-on-press-escape="!registerLoading"
      :show-close="!registerLoading"
      @closed="resetRegisterForm"
    >
      <el-alert title="注册账号仅拥有受限体验权限。" type="warning" :closable="false" show-icon />
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item prop="code">
          <div class="captcha-row">
            <el-input v-model="registerForm.code" placeholder="请输入验证码" prefix-icon="Key" />
            <button type="button" class="captcha-trigger" @click="loadRegisterCaptcha">
              <img
                v-if="registerCaptchaImage"
                :src="registerCaptchaImage"
                alt="验证码"
                class="captcha-image"
              />
              <span v-else>获取验证码</span>
            </button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="registerLoading" @click="registerDialogVisible = false"
          >取消</el-button
        >
        <el-button type="primary" :loading="registerLoading" @click="handleRegister"
          >注册</el-button
        >
      </template>
    </el-dialog>

    <el-dialog
      v-model="shopSelectDialogVisible"
      title="选择店铺"
      width="440px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <el-alert title="请选择本次登录要操作的店铺。" type="info" :closable="false" show-icon />
      <el-radio-group v-model="selectedShopId" class="shop-select-list">
        <el-radio v-for="shop in merchantShops" :key="shop.id" :value="shop.id" class="shop-select-item">
          {{ shop.shopName }}
        </el-radio>
      </el-radio-group>
      <template #footer>
        <el-button :disabled="shopSelectSubmitting" @click="cancelShopSelection">取消登录</el-button>
        <el-button type="primary" :loading="shopSelectSubmitting" @click="confirmShopSelection">进入后台</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { getRegisterCaptcha, register } from '@/api/auth'
import { getPublicSysConfigs } from '@/api/upms'
import { getLoginSubjectPreference, type LoginSubject, setLoginSubjectPreference } from '@/utils/auth'
import { sha256Hex } from '@/utils/crypto'
import { clearCurrentShop, setCurrentShop } from '@/utils/shop'
import { request } from '@/utils/request'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const REMEMBERED_USERNAME_KEY_PREFIX = 'yeah-boot-admin-remembered-username'

// 登录表单引用
const loginFormRef = ref<FormInstance>()

// 登录加载状态
const loginLoading = ref(false)
const loginSubject = ref<LoginSubject>(getLoginSubjectPreference())
const captchaEnabled = ref(false)
const captchaImage = ref('')
const registerDialogVisible = ref(false)
const registerFormRef = ref<FormInstance>()
const registerLoading = ref(false)
const registerCaptchaImage = ref('')
const shopSelectDialogVisible = ref(false)
const shopSelectSubmitting = ref(false)
const merchantShops = ref<Array<{ id: string; shopName: string }>>([])
const selectedShopId = ref<string | null>(null)
const loginPageOptions = reactive({
  noticeEnabled: false,
  noticeTitle: '',
  noticeContent: '',
  registerEnabled: false,
})

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  code: '',
  key: '',
  remember: false,
  terminal: 'web' as const,
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  key: '',
  code: '',
})

// 登录表单验证规则
const loginRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度在 6 到 32 个字符', trigger: 'blur' },
  ],
  code: [
    {
      validator: (_rule, value, callback) => {
        if (!captchaEnabled.value) {
          callback()
          return
        }
        if (!value) {
          callback(new Error('请输入验证码'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
})

const registerRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 32, message: '用户名长度在 2 到 32 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度在 6 到 32 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error('请再次输入密码'))
          return
        }
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
})

const redirectPath = () => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect ? redirect : authStore.firstAccessiblePath
}

/**
 * 店铺确认完成后才进入商家后台，保证业务请求始终带有店铺上下文。
 */
const enterManagementConsole = async () => {
  await router.push(redirectPath())
  ElMessage.success('登录成功')
}

/**
 * 查询当前商家的店铺。单店自动选中，多店交由用户确认。
 */
const prepareMerchantShop = async () => {
  try {
    const response = await request<{ records: Array<{ id: string; shopName: string }> }>({
      url: '/mch/shop/crud/query',
      method: 'get',
      params: { current: 1, size: 100 },
    })
    const shops = response.data?.records || []
    if (shops.length === 0) {
      ElMessage.error('当前商家没有可操作的店铺')
      await authStore.clearAuth()
      return
    }

    merchantShops.value = shops
    const firstShop = shops[0]
    if (!firstShop) {
      return
    }
    if (shops.length === 1) {
      setCurrentShop({ id: firstShop.id, name: firstShop.shopName })
      await enterManagementConsole()
      return
    }

    selectedShopId.value = firstShop.id
    shopSelectDialogVisible.value = true
  } catch {
    ElMessage.error('获取商家店铺失败，请重新登录')
    await authStore.clearAuth()
  }
}

/**
 * 确认本次登录的操作店铺。
 */
const confirmShopSelection = async () => {
  const selectedShop = merchantShops.value.find((shop) => shop.id === selectedShopId.value)
  if (!selectedShop) {
    ElMessage.warning('请选择店铺')
    return
  }

  shopSelectSubmitting.value = true
  try {
    setCurrentShop({ id: selectedShop.id, name: selectedShop.shopName })
    shopSelectDialogVisible.value = false
    await enterManagementConsole()
  } finally {
    shopSelectSubmitting.value = false
  }
}

/**
 * 取消店铺选择即取消本次商家登录，避免存在无店铺上下文的会话。
 */
const cancelShopSelection = async () => {
  shopSelectDialogVisible.value = false
  merchantShops.value = []
  selectedShopId.value = null
  clearCurrentShop()
  await authStore.clearAuth()
}

const loadCaptcha = async () => {
  try {
    const captcha = await authStore.refreshCaptcha()
    captchaEnabled.value = Boolean(captcha.enabled)
    loginForm.key = captcha.key || ''
    loginForm.code = ''
    captchaImage.value = captcha.image
      ? captcha.image.startsWith('data:image/')
        ? captcha.image
        : `data:image/png;base64,${captcha.image}`
      : ''
  } catch {
    captchaEnabled.value = false
    loginForm.key = ''
    captchaImage.value = ''
  }
}

const loadLoginPageOptions = async () => {
  if (loginSubject.value !== 'admin') {
    Object.assign(loginPageOptions, {
      noticeEnabled: false,
      noticeTitle: '',
      noticeContent: '',
      registerEnabled: false,
    })
    return
  }
  try {
    const response = await getPublicSysConfigs({ groupCode: 'auth.login' })
    const values = new Map(response.data.map((item) => [item.name, item.value]))
    Object.assign(loginPageOptions, {
      noticeEnabled: values.get('auth.login.notice.enabled') === 'true',
      noticeTitle: values.get('auth.login.notice.title') || '',
      noticeContent: values.get('auth.login.notice.content') || '',
      registerEnabled: values.get('auth.login.register.enabled') === 'true',
    })
  } catch {
    Object.assign(loginPageOptions, {
      noticeEnabled: false,
      noticeTitle: '',
      noticeContent: '',
      registerEnabled: false,
    })
  }
}

const loadRegisterCaptcha = async () => {
  try {
    const captcha = await getRegisterCaptcha()
    registerForm.key = captcha.data.key || ''
    registerForm.code = ''
    registerCaptchaImage.value = captcha.data.image
      ? captcha.data.image.startsWith('data:image/')
        ? captcha.data.image
        : `data:image/png;base64,${captcha.data.image}`
      : ''
  } catch {
    registerForm.key = ''
    registerCaptchaImage.value = ''
  }
}

const resetRegisterForm = () => {
  Object.assign(registerForm, {
    username: '',
    password: '',
    confirmPassword: '',
    key: '',
    code: '',
  })
  registerCaptchaImage.value = ''
  registerFormRef.value?.clearValidate()
}

const openRegisterDialog = async () => {
  if (!loginPageOptions.registerEnabled) {
    return
  }
  resetRegisterForm()
  registerDialogVisible.value = true
  await loadRegisterCaptcha()
}

const handleRegister = async () => {
  if (!registerFormRef.value || registerLoading.value) return

  try {
    await registerFormRef.value.validate()
    registerLoading.value = true
    await register({
      username: registerForm.username.trim(),
      password: await sha256Hex(registerForm.password.trim()),
      key: registerForm.key,
      code: registerForm.code,
    })
    loginForm.username = registerForm.username.trim()
    loginForm.password = ''
    registerDialogVisible.value = false
    ElMessage.success('注册成功，请登录')
  } catch {
    await loadRegisterCaptcha()
  } finally {
    registerLoading.value = false
  }
}

const handleForgotPassword = () => {
  ElMessage.info('请联系管理员')
}

const loadRememberedUsername = () => {
  const username = localStorage.getItem(`${REMEMBERED_USERNAME_KEY_PREFIX}-${loginSubject.value}`) || ''
  loginForm.username = username
  loginForm.remember = Boolean(username)
}

const saveRememberedUsername = () => {
  const key = `${REMEMBERED_USERNAME_KEY_PREFIX}-${loginSubject.value}`
  if (loginForm.remember) {
    localStorage.setItem(key, loginForm.username.trim())
    return
  }
  localStorage.removeItem(key)
}

const handleLoginSubjectChange = async () => {
  // 登录端类型是界面偏好，不能随登出清理的会话身份一起丢失。
  setLoginSubjectPreference(loginSubject.value)
  shopSelectDialogVisible.value = false
  merchantShops.value = []
  selectedShopId.value = null
  clearCurrentShop()
  loginForm.username = ''
  loginForm.password = ''
  loginForm.code = ''
  loginForm.key = ''
  captchaEnabled.value = false
  captchaImage.value = ''
  loadRememberedUsername()
  await loadLoginPageOptions()
  if (loginSubject.value === 'admin') {
    await loadCaptcha()
  }
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  try {
    // 表单验证
    await loginFormRef.value.validate()
    loginLoading.value = true
    const hashedPassword = await sha256Hex(loginForm.password.trim())
    await authStore.login({
      username: loginForm.username,
      password: hashedPassword,
      code: loginSubject.value === 'admin' && captchaEnabled.value ? loginForm.code : undefined,
      key: loginSubject.value === 'admin' && captchaEnabled.value ? loginForm.key : undefined,
      terminal: loginForm.terminal,
    }, loginSubject.value)
    saveRememberedUsername()
    if (loginSubject.value === 'merchant') {
      await prepareMerchantShop()
      return
    }
    await enterManagementConsole()
  } catch {
    if (loginSubject.value === 'admin' && captchaEnabled.value) {
      await loadCaptcha()
    }
  } finally {
    loginLoading.value = false
  }
}

onMounted(() => {
  loadRememberedUsername()
  void handleLoginSubjectChange()
})
</script>

<style scoped>
.login-container {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 100%;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.login-header {
  padding: 30px 30px 0;
  text-align: center;
}

.login-header h2 {
  margin: 0 0 10px;
  font-size: 24px;
  color: #303133;
}

.login-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.login-subject {
  display: flex;
  justify-content: center;
  margin: 20px 30px 0;
}

.login-form {
  padding: 30px;
}

.login-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(400px, calc(100vw - 32px));
}

.login-notice {
  filter: drop-shadow(0 8px 18px rgba(52, 37, 8, 0.24));
}

.login-notice-content {
  line-height: 1.6;
  white-space: pre-line;
}

.captcha-row {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 12px;
  width: 100%;
}

.captcha-trigger {
  display: inline-flex;
  width: 120px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  overflow: hidden;
}

.captcha-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-form-extra {
  width: 100%;
}

.login-form-extra :deep(.el-form-item__content) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
}

.login-form-submit {
  width: 100%;
}

.login-form-forgot {
  font-size: 14px;
}

.login-form-links {
  display: flex;
  gap: 16px;
}

.register-form {
  padding-top: 20px;
}

:deep(.shop-select-list) {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  margin-top: 20px;
}

:deep(.shop-select-list .shop-select-item) {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  margin-right: 0;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

:deep(.shop-select-list .el-radio__label) {
  flex: 1;
}
</style>
