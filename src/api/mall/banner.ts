import { request } from '@/utils/request'
import type { PageResponse } from '@/types/api'

export interface BannerRecord {
  id: string
  imageUrl: string
  createTime?: string
  updateTime?: string
}

export function queryMerchantBanners(params: Record<string, unknown>) {
  return request<PageResponse<BannerRecord>>({ url: '/mch/banner/crud/query', method: 'get', params })
}

export function createMerchantBanner(shopId: string, file: File) {
  return request<void>({ url: '/mch/banner/create', method: 'post', data: bannerFormData(file, { shopId }) })
}

export function updateMerchantBanner(id: string, shopId: string, file: File) {
  return request<void>({ url: '/mch/banner/update', method: 'post', data: bannerFormData(file, { id, shopId }) })
}

export function deleteMerchantBanners(ids: string[]) {
  return request<void>({ url: '/mch/banner/delete', method: 'post', data: ids })
}

export function queryPlatformBanners(params: Record<string, unknown>) {
  return request<PageResponse<BannerRecord>>({ url: '/admin/platBanner/crud/query', method: 'get', params })
}

export function createPlatformBanner(file: File) {
  return request<void>({ url: '/admin/platBanner/create', method: 'post', data: bannerFormData(file) })
}

export function updatePlatformBanner(id: string, file: File) {
  return request<void>({ url: '/admin/platBanner/update', method: 'post', data: bannerFormData(file, { id }) })
}

export function deletePlatformBanners(ids: string[]) {
  return request<void>({ url: '/admin/platBanner/delete', method: 'post', data: ids })
}

function bannerFormData(file: File, fields: Record<string, string> = {}) {
  const data = new FormData()
  data.append('file', file)
  Object.entries(fields).forEach(([key, value]) => data.append(key, value))
  return data
}
