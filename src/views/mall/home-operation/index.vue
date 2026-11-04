<template>
  <div class="home-operation-page mall-page">
    <el-tabs v-model="activeTab" class="home-operation-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="Banner" name="banner" lazy>
        <div class="home-operation-pane">
          <BannerManager scope="platform" />
        </div>
      </el-tab-pane>
      <el-tab-pane label="快捷入口" name="quick-entry" lazy>
        <div class="home-operation-pane">
          <QuickEntryPage />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TabPaneName } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import BannerManager from '../components/BannerManager.vue'
import QuickEntryPage from '../quickEntry/index.vue'

defineOptions({ name: 'HomeOperationPage' })

type OperationTab = 'banner' | 'quick-entry'

const route = useRoute()
const router = useRouter()
const activeTab = ref<OperationTab>(normalizeTab(route.query.tab))

function normalizeTab(value: unknown): OperationTab {
  return value === 'quick-entry' ? 'quick-entry' : 'banner'
}

function handleTabChange(name: TabPaneName) {
  const tab = normalizeTab(name)
  const query = { ...route.query }
  if (tab === 'banner') delete query.tab
  else query.tab = tab
  void router.replace({ query })
}

watch(
  () => route.query.tab,
  (value) => {
    activeTab.value = normalizeTab(value)
  },
)
</script>

<style scoped>
.home-operation-page {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.home-operation-tabs {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 0;
  border: 0;
  background: transparent;
}

.home-operation-tabs :deep(.el-tabs__header) {
  margin: 0 0 8px;
}

.home-operation-tabs :deep(.el-tabs__content) {
  min-height: 0;
  flex: 1;
  overflow: visible;
}

.home-operation-tabs :deep(.el-tab-pane),
.home-operation-pane {
  height: 100%;
  min-height: 0;
}

.home-operation-tabs :deep(.home-operation-pane > .mall-page) {
  padding: 0;
  background: transparent;
}
</style>
