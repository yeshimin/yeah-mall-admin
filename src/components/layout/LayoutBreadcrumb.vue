<template>
  <el-breadcrumb class="layout-breadcrumb">
    <template v-for="(item, index) in breadcrumbList" :key="index">
      <el-breadcrumb-item v-if="item.path" :to="item.path">
        {{ item.title }}
      </el-breadcrumb-item>
      <el-breadcrumb-item v-else>
        {{ item.title }}
      </el-breadcrumb-item>
    </template>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { ResourceTreeNode } from '@/types/upms'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

function hasConcreteRoute(path?: string) {
  return Boolean(path && router.getRoutes().some((item) => item.path === path))
}

function findMenuTrail(
  nodes: ResourceTreeNode[],
  targetPath: string,
  trail: Array<{ title: string; path?: string }> = [],
): Array<{ title: string; path?: string }> | null {
  for (const node of nodes) {
    const normalizedPath = hasConcreteRoute(node.path) ? node.path : undefined
    const nextTrail = [...trail, { title: node.name, path: normalizedPath }]
    if (node.path === targetPath) {
      return nextTrail
    }
    if (node.children?.length) {
      const found = findMenuTrail(node.children, targetPath, nextTrail)
      if (found) {
        return found
      }
    }
  }
  return null
}

const breadcrumbList = computed(() => {
  const menuTrail = findMenuTrail(authStore.sidebarMenus, route.path)
  if (menuTrail?.length) {
    return menuTrail
  }

  const breadcrumbs: Array<{ title: string; path?: string }> = []
  for (const routeItem of route.matched || []) {
    if (routeItem?.meta?.title && routeItem?.path && routeItem.path !== '/') {
      breadcrumbs.push({
        title: routeItem.meta.title as string,
        path: routeItem.path,
      })
    }
  }
  return breadcrumbs
})
</script>

<style scoped>
.layout-breadcrumb {
  min-width: 0;
  font-size: 14px;
}
</style>
