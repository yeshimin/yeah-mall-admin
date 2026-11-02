<template>
  <aside class="sidebar-container" :class="{ 'is-collapsed': isCollapse }">
    <div class="sidebar-logo" role="button" tabindex="0" @click="openHome" @keydown.enter="openHome">
      <span class="brand-stamp">Y</span>
      <div class="brand-copy">
        <strong>Yeah Mall</strong>
        <small>{{ brandSubtitle }}</small>
      </div>
    </div>
    <el-scrollbar class="sidebar-scrollbar">
      <LayoutNavigation mode="vertical" :collapsed="isCollapse" @navigated="emit('navigated')" />
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LayoutNavigation from './LayoutNavigation.vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  collapsed?: boolean
}>()

const emit = defineEmits<{
  navigated: []
}>()

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const isCollapse = computed(() => props.collapsed ?? appStore.sidebarCollapsed)
const brandSubtitle = computed(() => authStore.subject === 'merchant' ? '商家工作台' : '平台运营端')

async function openHome() {
  if (route.path !== '/home') {
    await router.push('/home')
  }
}
</script>

<style scoped>
.sidebar-container {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  flex-direction: column;
  color: #fff;
  background-color: #001529;
}

.sidebar-container :deep(.el-menu) {
  border-right: none;
  background-color: #001529;
}

.sidebar-container :deep(.el-menu-item),
.sidebar-container :deep(.el-sub-menu__title) {
  height: 56px;
  color: #fff;
  line-height: 56px;
}

.sidebar-container :deep(.el-menu-item:hover),
.sidebar-container :deep(.el-sub-menu__title:hover),
.sidebar-container :deep(.el-menu-item:not(.is-active)):hover,
.sidebar-container :deep(.el-sub-menu__title:not(.is-active)):hover {
  background-color: #24634f;
}

.sidebar-container :deep(.el-menu-item.is-active) {
  color: #fff;
  background-color: #24634f;
}

.sidebar-container :deep(.el-icon) {
  color: #fff;
}

.sidebar-logo {
  display: flex;
  height: 60px;
  flex: 0 0 60px;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  padding: 0 16px;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
}

.sidebar-logo:focus-visible {
  outline: 2px solid #8eafa0;
  outline-offset: -2px;
}

.brand-stamp {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: #17372b;
  background: #e5b873;
  font-size: 18px;
  font-weight: 800;
}

.brand-copy {
  display: flex;
  min-width: 0;
  max-width: 120px;
  flex: 1;
  flex-direction: column;
  opacity: 1;
  transition:
    opacity 0.15s ease,
    max-width 0.3s ease;
}

.brand-copy strong,
.brand-copy small {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.brand-copy strong {
  color: #fff;
  font-size: 17px;
  letter-spacing: 0.01em;
}

.brand-copy small {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.52);
  font-size: 11px;
}

.sidebar-container.is-collapsed .sidebar-logo {
  justify-content: center;
  gap: 0;
  padding: 0;
}

.sidebar-container.is-collapsed .brand-copy {
  max-width: 0;
  overflow: hidden;
  opacity: 0;
}

.sidebar-scrollbar {
  min-height: 0;
  flex: 1;
}

.sidebar-scrollbar :deep(.el-scrollbar__view) {
  height: 100%;
}

.sidebar-container :deep(.layout-navigation) {
  width: 100%;
  min-height: 100%;
  transition: width 0.3s ease;
}
</style>
