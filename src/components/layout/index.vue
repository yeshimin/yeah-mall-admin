<template>
  <div class="app-container" :class="[`navigation-${effectiveNavigationMode}`, { 'is-mobile': isMobile }]">
    <div
      v-if="effectiveNavigationMode === 'side' && !isMobile"
      class="sidebar-wrapper"
      :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed }"
    >
      <LayoutSidebar />
    </div>

    <div class="main-wrapper">
      <LayoutHeader
        :navigation-mode="effectiveNavigationMode"
        :mobile="isMobile"
        @open-mobile-navigation="mobileNavigationOpen = true"
      />
      <div v-if="effectiveNavigationMode === 'top' || isMobile" class="breadcrumb-wrapper">
        <LayoutBreadcrumb />
      </div>
      <LayoutTabs />
      <div class="content-wrapper">
        <LayoutContent />
      </div>
    </div>

    <el-drawer
      v-model="mobileNavigationOpen"
      class="mobile-navigation-drawer"
      direction="ltr"
      :size="260"
      :with-header="false"
      :destroy-on-close="true"
    >
      <LayoutSidebar :collapsed="false" @navigated="mobileNavigationOpen = false" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import LayoutBreadcrumb from './LayoutBreadcrumb.vue'
import LayoutContent from './LayoutContent.vue'
import LayoutHeader from './LayoutHeader.vue'
import LayoutSidebar from './LayoutSidebar.vue'
import LayoutTabs from './LayoutTabs.vue'
import { useAppStore, type NavigationMode } from '@/stores/app'

defineOptions({ name: 'AdminLayout' })

const MOBILE_BREAKPOINT = 768
const TOP_NAVIGATION_BREAKPOINT = 1024

const route = useRoute()
const appStore = useAppStore()
const viewportWidth = ref(typeof window === 'undefined' ? TOP_NAVIGATION_BREAKPOINT : window.innerWidth)
const mobileNavigationOpen = ref(false)

const isMobile = computed(() => viewportWidth.value < MOBILE_BREAKPOINT)
const effectiveNavigationMode = computed<NavigationMode>(() => (
  appStore.navigationMode === 'top' && viewportWidth.value >= TOP_NAVIGATION_BREAKPOINT ? 'top' : 'side'
))

function updateViewportWidth() {
  viewportWidth.value = window.innerWidth
}

watch(() => route.fullPath, () => {
  mobileNavigationOpen.value = false
})

watch(isMobile, (mobile) => {
  if (!mobile) {
    mobileNavigationOpen.value = false
  }
})

onMounted(() => {
  updateViewportWidth()
  window.addEventListener('resize', updateViewportWidth)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportWidth)
})
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #f5f7fa;
}

.sidebar-wrapper {
  flex: 0 0 200px;
  width: 200px;
  height: 100vh;
  overflow: hidden;
  transition:
    width 0.3s ease,
    flex-basis 0.3s ease;
}

.sidebar-wrapper.sidebar-collapsed {
  flex-basis: 64px;
  width: 64px;
}

.main-wrapper {
  display: flex;
  flex: 1;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
}

.breadcrumb-wrapper {
  display: flex;
  flex: 0 0 40px;
  height: 40px;
  align-items: center;
  padding: 0 18px;
  overflow: hidden;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
}

.content-wrapper {
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  background-color: #f5f7fa;
}

:global(.mobile-navigation-drawer .el-drawer__body) {
  padding: 0;
  overflow: hidden;
}

@media (max-width: 767px) {
  .breadcrumb-wrapper {
    padding: 0 12px;
  }
}
</style>
