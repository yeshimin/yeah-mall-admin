import { request } from '@/utils/request'
import type { PageResponse } from '@/types/api'

export interface BannerRecord {
  id: string
  imageUrl: string
  target?: string
  sort?: number
  isEnabled?: boolean
  createTime?: string
  updateTime?: string
}

export function queryMerchantBanners(params: Record<string, unknown>) {
  return request<PageResponse<BannerRecord>>({ url: '/mch/banner/crud/query', method: 'get', params })
}

export function createMerchantBanner(shopId: string, file: File, target = '') {
  return request<void>({ url: '/mch/banner/create', method: 'post', data: bannerFormData(file, { shopId, target }) })
}

export function updateMerchantBanner(id: string, shopId: string, file: File | undefined, target = '') {
  return request<void>({ url: '/mch/banner/update', method: 'post', data: bannerFormData(file, { id, shopId, target }) })
}

export function deleteMerchantBanners(ids: string[]) {
  return request<void>({ url: '/mch/banner/delete', method: 'post', data: ids })
}

export function queryPlatformBanners(params: Record<string, unknown>) {
  return request<PageResponse<BannerRecord>>({ url: '/admin/platBanner/crud/query', method: 'get', params })
}

export function createPlatformBanner(file: File, target = '', sort = 1, isEnabled = true) {
  return request<void>({
    url: '/admin/platBanner/create',
    method: 'post',
    data: bannerFormData(file, { target, sort: String(sort), isEnabled: String(isEnabled) }),
  })
}

export function updatePlatformBanner(id: string, file: File | undefined, target = '', sort = 1, isEnabled = true) {
  return request<void>({
    url: '/admin/platBanner/update',
    method: 'post',
    data: bannerFormData(file, { id, target, sort: String(sort), isEnabled: String(isEnabled) }),
  })
}

export function deletePlatformBanners(ids: string[]) {
  return request<void>({ url: '/admin/platBanner/delete', method: 'post', data: ids })
}

function bannerFormData(file: File | undefined, fields: Record<string, string> = {}) {
  const data = new FormData()
  if (file) data.append('file', file)
  Object.entries(fields).forEach(([key, value]) => data.append(key, value))
  return data
}
