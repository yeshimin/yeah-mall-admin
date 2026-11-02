<template>
  <aside class="sidebar-container" :class="{ 'is-collapsed': isCollapse }">
    <div class="sidebar-logo" role="button" tabindex="0" @click="openHome" @keydown.enter="openHome">
      <span class="sidebar-logo-mark">Y</span>
      <span class="sidebar-logo-title">管理后台</span>
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

const props = defineProps<{
  collapsed?: boolean
}>()

const emit = defineEmits<{
  navigated: []
}>()

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const isCollapse = computed(() => props.collapsed ?? appStore.sidebarCollapsed)

async function openHome() {
  if (route.path !== '/home') {
    await router.push('/home')
  }
}
</script>

<style scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #001529;
  color: #fff;
  overflow: hidden;
}

.sidebar-container :deep(.el-menu) {
  background-color: #001529;
  border-right: none;
}

.sidebar-container :deep(.el-menu-item),
.sidebar-container :deep(.el-sub-menu__title) {
  color: #fff;
  height: 56px;
  line-height: 56px;
}

.sidebar-container :deep(.el-menu-item:hover),
.sidebar-container :deep(.el-sub-menu__title:hover) {
  background-color: #1890ff;
}

.sidebar-container :deep(.el-menu-item.is-active) {
  background-color: #1890ff;
  color: #fff;
}

.sidebar-container :deep(.el-menu-item:not(.is-active)):hover,
.sidebar-container :deep(.el-sub-menu__title:not(.is-active)):hover {
  background-color: #1890ff;
}

.sidebar-container :deep(.el-icon) {
  color: #fff;
}

.sidebar-logo {
  flex: 0 0 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid #1f2d3d;
  cursor: pointer;
  overflow: hidden;
}

.sidebar-logo:focus-visible {
  outline: 2px solid #409eff;
  outline-offset: -2px;
}

.sidebar-logo-mark {
  display: inline-flex;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: linear-gradient(135deg, #409eff, #36cfc9);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.sidebar-logo-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  opacity: 1;
  max-width: 100px;
  transition:
    opacity 0.15s ease,
    max-width 0.3s ease;
}

.sidebar-container.is-collapsed .sidebar-logo {
  gap: 0;
}

.sidebar-container.is-collapsed .sidebar-logo-title {
  opacity: 0;
  max-width: 0;
}

.sidebar-scrollbar {
  flex: 1;
  min-height: 0;
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
