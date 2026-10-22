import { request } from '@/utils/request'

const SHOP_ID_KEY = 'shopId'
const SHOP_NAME_KEY = 'shopName'
const CURRENT_SHOP_KEY = 'currentShop'
const SHOP_CONTEXT_CHANGED_EVENT = 'shop-context-changed'

export interface CurrentShop {
  id: string
  name: string
}

function normalizeShopId(value: unknown): string | null {
  const id = String(value ?? '').trim()
  return /^[1-9]\d*$/.test(id) ? id : null
}

/**
 * 读取当前商家选择的店铺。
 */
export function getCurrentShop(): CurrentShop | null {
  const raw = localStorage.getItem(CURRENT_SHOP_KEY)
  if (raw) {
    try {
      const shop = JSON.parse(raw) as CurrentShop
      const id = normalizeShopId(shop.id)
      if (id && shop.name) {
        return { id, name: shop.name }
      }
    } catch {
      // 使用旧版 localStorage 键继续兼容已登录会话。
    }
  }

  const id = normalizeShopId(localStorage.getItem(SHOP_ID_KEY))
  const name = localStorage.getItem(SHOP_NAME_KEY) || ''
  return id && name ? { id, name } : null
}

/**
 * 设置当前商家操作店铺，同时兼容现有业务页面的 shopId 读取方式。
 */
export function setCurrentShop(shop: CurrentShop) {
  const id = normalizeShopId(shop.id)
  if (!id) {
    throw new Error('店铺ID不合法')
  }
  const currentShop = { id, name: shop.name }
  localStorage.setItem(SHOP_ID_KEY, currentShop.id)
  localStorage.setItem(SHOP_NAME_KEY, currentShop.name)
  localStorage.setItem(CURRENT_SHOP_KEY, JSON.stringify(currentShop))
  window.dispatchEvent(new Event(SHOP_CONTEXT_CHANGED_EVENT))
}

/**
 * 刷新当前商家店铺信息，确保缓存名称与后端保持一致。
 */
export async function refreshCurrentShop(): Promise<CurrentShop | null> {
  const currentShop = getCurrentShop()
  if (!currentShop) {
    return null
  }

  try {
    const response = await request<{ id?: number; shopName?: string }>({
      url: '/mch/shop/crud/detail',
      method: 'get',
      params: { id: currentShop.id },
      suppressErrorMessage: true,
    })
    const shopName = String(response.data?.shopName || '').trim()
    if (!shopName) {
      return currentShop
    }

    const latestShopId = normalizeShopId(response.data?.id) || currentShop.id
    const latestShop = { id: latestShopId, name: shopName }
    if (latestShop.id !== currentShop.id || latestShop.name !== currentShop.name) {
      setCurrentShop(latestShop)
    }
    return latestShop
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('店铺不存在') || message.includes('无该店铺权限')) {
      clearCurrentShop()
      return null
    }
    throw error
  }
}

/**
 * 清理当前商家操作店铺。
 */
export function clearCurrentShop() {
  localStorage.removeItem(SHOP_ID_KEY)
  localStorage.removeItem(SHOP_NAME_KEY)
  localStorage.removeItem(CURRENT_SHOP_KEY)
  window.dispatchEvent(new Event(SHOP_CONTEXT_CHANGED_EVENT))
}

export const SHOP_CONTEXT_CHANGED = SHOP_CONTEXT_CHANGED_EVENT
