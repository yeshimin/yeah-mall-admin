<template>
  <header class="header-container" :class="{ 'is-top-navigation': props.navigationMode === 'top' }">
    <button
      v-if="props.navigationMode === 'top'"
      type="button"
      class="header-brand"
      title="返回首页"
      @click="openHome"
    >
      <span class="header-brand-mark">Y</span>
      <span class="header-brand-title">YeahBoot</span>
    </button>

    <div v-if="props.navigationMode === 'top'" class="header-navigation">
      <LayoutNavigation mode="horizontal" />
    </div>

    <div v-else class="header-left">
      <el-button link class="header-collapse-btn" @click="handleNavigationButton">
        <el-icon class="header-collapse-icon">
          <Menu v-if="props.mobile" />
          <component :is="collapseIcon" v-else />
        </el-icon>
      </el-button>
      <button v-if="props.mobile" type="button" class="mobile-brand" @click="openHome">
        <span class="header-brand-mark">Y</span>
        <span class="header-brand-title">YeahBoot</span>
      </button>
      <LayoutBreadcrumb v-else />
    </div>

    <div class="header-right">
      <el-popover
        v-model:visible="notificationPopoverVisible"
        placement="bottom"
        :width="340"
        trigger="click"
        @show="handleNotificationShow"
      >
        <template #reference>
          <el-badge :value="notificationStore.unreadCount" :hidden="notificationStore.unreadCount === 0" :max="99">
            <button type="button" class="header-action" title="通知">
              <el-icon><Bell /></el-icon>
            </button>
          </el-badge>
        </template>
        <div class="notification-panel">
          <div class="notification-panel-header">
            <strong>通知</strong>
            <button type="button" @click="openNotificationCenter()">查看全部</button>
          </div>
          <div v-loading="notificationStore.summaryLoading" class="notification-list">
            <button
              v-for="item in notificationStore.recentMessages"
              :key="item.receiverId"
              type="button"
              class="notification-item"
              :class="{ unread: item.readStatus === '0' }"
              @click="handleNotificationClick(item.receiverId)"
            >
              <span class="notification-dot"></span>
              <span class="notification-item-main">
                <strong>{{ item.title }}</strong>
                <span>{{ item.sendTime || '-' }}</span>
              </span>
            </button>
            <p v-if="notificationStore.recentMessages.length === 0">暂无新通知</p>
          </div>
        </div>
      </el-popover>

      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="avatarUrl || defaultAvatar" @error="handleAvatarError"></el-avatar>
          <span class="user-name">{{ authStore.displayName }}</span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowDown, Bell, Expand, Fold, Menu, SwitchButton, User } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import LayoutBreadcrumb from './LayoutBreadcrumb.vue'
import LayoutNavigation from './LayoutNavigation.vue'
import { useAppStore, type NavigationMode } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { DEFAULT_AVATAR_URL, resolveAvatarUrl } from '@/utils/avatar'

const props = withDefaults(defineProps<{
  navigationMode: NavigationMode
  mobile?: boolean
}>(), {
  mobile: false,
})

const emit = defineEmits<{
  openMobileNavigation: []
}>()

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const defaultAvatar = DEFAULT_AVATAR_URL
const avatarLoadFailed = ref(false)
const notificationPopoverVisible = ref(false)
const collapseIcon = computed(() => (appStore.sidebarCollapsed ? Expand : Fold))

const avatarSource = computed(() => authStore.mine?.user?.avatar || '')
const avatarUrl = computed(() => {
  if (avatarLoadFailed.value) {
    return ''
  }
  return resolveAvatarUrl(avatarSource.value)
})

watch(avatarSource, () => {
  avatarLoadFailed.value = false
})

function handleAvatarError() {
  avatarLoadFailed.value = true
  return false
}

function handleNavigationButton() {
  if (props.mobile) {
    emit('openMobileNavigation')
    return
  }
  appStore.toggleSidebar()
}

async function openHome() {
  if (route.path !== '/home') {
    await router.push('/home')
  }
}

function handleNotificationShow() {
  void notificationStore.refreshSummary()
}

async function handleNotificationClick(receiverId: number) {
  await openNotificationCenter(receiverId)
}

async function openNotificationCenter(receiverId?: number) {
  notificationPopoverVisible.value = false
  const query = receiverId == null ? {} : { receiverId: String(receiverId) }
  const target = router.resolve({ path: '/notifications', query })
  if (route.fullPath !== target.fullPath) {
    await router.push(target)
  }
}

async function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      if (route.path !== '/profile') {
        await router.push('/profile')
      }
      break
    case 'logout':
      await authStore.logout()
      await router.push('/login')
      ElMessage.success('退出登录成功')
      break
  }
}

onMounted(() => {
  void notificationStore.start()
})

onBeforeUnmount(() => {
  notificationStore.stop()
})
</script>

<style scoped>
.header-container {
  position: relative;
  z-index: 100;
  display: flex;
  flex: 0 0 60px;
  height: 60px;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgb(15 23 42 / 8%);
}

.header-container.is-top-navigation {
  gap: 18px;
  padding-left: 16px;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.header-left {
  min-width: 0;
}

.header-right {
  flex: 0 0 auto;
  gap: 4px;
}

.header-brand,
.mobile-brand {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: none;
  background: transparent;
  color: #1f2937;
  cursor: pointer;
}

.header-brand-mark {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #1677ff, #13c2c2);
  color: #fff;
  font-size: 19px;
  font-weight: 700;
}

.header-brand-title {
  white-space: nowrap;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.header-navigation {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}

.header-collapse-btn {
  width: 36px;
  height: 36px;
  margin-right: 20px;
  padding: 0;
  border-radius: 8px;
  background-color: #f5f7fa;
  color: #303133;
}

.header-collapse-btn:hover {
  color: #409eff;
  background-color: #ecf5ff;
}

.header-collapse-icon {
  font-size: 18px;
}

.header-action {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #606266;
  cursor: pointer;
  font-size: 18px;
}

.header-action:hover {
  color: #409eff;
  background: #ecf5ff;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-name {
  max-width: 120px;
  margin: 0 8px;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.el-icon--right {
  font-size: 12px;
}

.notification-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f6;
}

.notification-panel-header strong {
  color: #303133;
  font-size: 14px;
}

.notification-panel-header button {
  padding: 0;
  border: none;
  background: transparent;
  color: #409eff;
  cursor: pointer;
  font-size: 12px;
}

.notification-list {
  min-height: 80px;
  max-height: 330px;
  overflow-y: auto;
}

.notification-list p {
  margin: 14px 0 4px;
  color: #909399;
  font-size: 13px;
  text-align: center;
}

.notification-item {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 4px;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.notification-item:hover {
  background: #f8fbff;
}

.notification-dot {
  width: 7px;
  height: 7px;
  margin-top: 6px;
  border-radius: 50%;
  background: #cbd5e1;
}

.notification-item.unread .notification-dot {
  background: #409eff;
}

.notification-item-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 5px;
}

.notification-item-main strong {
  overflow: hidden;
  color: #334155;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-item-main span {
  color: #94a3b8;
  font-size: 11px;
}

@media (max-width: 1200px) {
  .is-top-navigation .user-name {
    display: none;
  }
}

@media (max-width: 767px) {
  .header-container {
    padding: 0 12px;
  }

  .header-collapse-btn {
    margin-right: 10px;
  }

  .mobile-brand .header-brand-title,
  .user-name {
    display: none;
  }

  .user-info {
    padding-right: 4px;
  }
}
</style>
