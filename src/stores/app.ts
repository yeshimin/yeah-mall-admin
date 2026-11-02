import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getPublicSysConfigs } from '@/api/upms'

export type NavigationMode = 'side' | 'top'

export interface PageTag {
  title: string
  path: string
}

const NAVIGATION_MODE_STORAGE_KEY = 'yeahboot:layout:navigation-mode'
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'yeahboot:layout:sidebar-collapsed'
const NAVIGATION_MODE_CONFIG_KEY = 'admin.layout.navigation-mode'

let navigationModePromise: Promise<void> | null = null

function readNavigationMode(): NavigationMode {
  try {
    const value = localStorage.getItem(NAVIGATION_MODE_STORAGE_KEY)
    return value === 'top' || value === 'side' ? value : 'side'
  } catch {
    return 'side'
  }
}

function readSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function persistPreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 浏览器禁用本地存储时保留当前会话状态，不阻断页面使用。
  }
}

export const useAppStore = defineStore('app', () => {
  // 布局配置集中在这里，后续 navigationTheme/contentDensity 可沿用同一扩展方式。
  const navigationMode = ref<NavigationMode>(readNavigationMode())
  const navigationModeLoaded = ref(false)
  const sidebarCollapsed = ref(readSidebarCollapsed())
  const pageTags = ref<PageTag[]>([])

  function setNavigationMode(mode: NavigationMode) {
    navigationMode.value = mode === 'top' ? 'top' : 'side'
    persistPreference(NAVIGATION_MODE_STORAGE_KEY, navigationMode.value)
  }

  async function loadNavigationMode() {
    if (navigationModeLoaded.value) {
      return
    }

    if (!navigationModePromise) {
      const currentPromise = getPublicSysConfigs({ configKey: NAVIGATION_MODE_CONFIG_KEY })
        .then((response) => {
          const value = response.data.find((item) => item.name === NAVIGATION_MODE_CONFIG_KEY)?.value
          setNavigationMode(value === 'top' ? 'top' : 'side')
          navigationModeLoaded.value = true
        })
        .catch(() => {
          // 公开配置暂时不可用时使用上次缓存，不阻断登录后的主页面。
          navigationModeLoaded.value = true
        })
        .finally(() => {
          if (navigationModePromise === currentPromise) {
            navigationModePromise = null
          }
        })
      navigationModePromise = currentPromise
    }

    await navigationModePromise
  }

  function resetNavigationModeLoadState() {
    navigationModeLoaded.value = false
  }

  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed.value = collapsed
    persistPreference(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed))
  }

  function toggleSidebar() {
    setSidebarCollapsed(!sidebarCollapsed.value)
  }

  function addPageTag(tag: PageTag) {
    if (!tag.path || !tag.title) {
      return
    }
    if (pageTags.value.some((item) => item.path === tag.path)) {
      return
    }
    pageTags.value.push(tag)
  }

  function removePageTag(path: string) {
    pageTags.value = pageTags.value.filter((item) => item.path !== path)
  }

  function removeOtherPageTags(path: string) {
    pageTags.value = pageTags.value.filter((item) => item.path === path)
  }

  function clearPageTags() {
    pageTags.value = []
  }

  return {
    navigationMode,
    navigationModeLoaded,
    sidebarCollapsed,
    pageTags,
    setNavigationMode,
    loadNavigationMode,
    resetNavigationModeLoadState,
    setSidebarCollapsed,
    toggleSidebar,
    addPageTag,
    removePageTag,
    removeOtherPageTags,
    clearPageTags,
  }
})
