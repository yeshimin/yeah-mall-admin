<template>
  <el-menu
    :default-active="activeMenu"
    :mode="props.mode"
    :collapse="props.mode === 'vertical' && props.collapsed"
    :ellipsis="props.mode === 'horizontal'"
    :unique-opened="props.mode === 'vertical'"
    class="layout-navigation"
    :class="`is-${props.mode}`"
    @select="handleMenuSelect"
  >
    <el-menu-item v-if="props.showHome" index="/home">
      <el-icon><House /></el-icon>
      <template #title>首页</template>
    </el-menu-item>
    <LayoutMenuNode v-for="menu in menuList" :key="menu.id" :node="menu" />
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { House } from '@element-plus/icons-vue'
import LayoutMenuNode from './LayoutMenuNode.vue'
import { useAuthStore } from '@/stores/auth'
import type { ResourceTreeNode } from '@/types/upms'

const props = withDefaults(defineProps<{
  mode?: 'vertical' | 'horizontal'
  collapsed?: boolean
  showHome?: boolean
}>(), {
  mode: 'vertical',
  collapsed: false,
  showHome: true,
})

const emit = defineEmits<{
  navigated: []
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)
const menuList = computed(() => authStore.sidebarMenus)

function findMenuNode(nodes: ResourceTreeNode[], index: string): ResourceTreeNode | null {
  for (const node of nodes) {
    if (node.path === index || String(node.id) === index) {
      return node
    }
    if (node.children?.length) {
      const found = findMenuNode(node.children, index)
      if (found) {
        return found
      }
    }
  }
  return null
}

function resolveExternalUrl(linkUrl?: string) {
  if (!linkUrl) {
    return null
  }

  try {
    const url = new URL(linkUrl)
    return ['http:', 'https:'].includes(url.protocol) ? url : null
  } catch {
    return null
  }
}

async function handleMenuSelect(index: string) {
  if (index === '/home') {
    if (route.path !== '/home') {
      await router.push('/home')
    }
    emit('navigated')
    return
  }

  const node = findMenuNode(menuList.value, index)
  if (node?.isLink) {
    const externalUrl = resolveExternalUrl(node.linkUrl)
    if (!externalUrl) {
      ElMessage.warning('外链地址无效，请联系管理员检查菜单配置')
      return
    }

    window.open(externalUrl.href, '_blank', 'noopener,noreferrer')
    emit('navigated')
    return
  }

  if (!node?.path) {
    ElMessage.warning('菜单路径未配置')
    return
  }

  if (node.path !== route.path) {
    await router.push(node.path)
  }
  emit('navigated')
}
</script>

<style scoped>
.layout-navigation {
  width: 100%;
}

.layout-navigation.is-horizontal {
  min-width: 0;
  height: 60px;
  border-bottom: none;
  background: transparent;
}

.layout-navigation.is-horizontal :deep(.el-menu-item),
.layout-navigation.is-horizontal :deep(.el-sub-menu__title) {
  height: 60px;
  padding: 0 16px;
  border-bottom-width: 2px;
}

.layout-navigation.is-horizontal :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: var(--el-menu-active-color);
  border-bottom-color: var(--el-menu-active-color);
}
</style>
