import { request } from '@/utils/request'
import type { PageResponse } from '@/types/api'

export interface BannerRecord {
  id: string
  imageUrl: string
  title?: string
  target?: string
  sort?: number
  isEnabled?: boolean
  createTime?: string
  updateTime?: string
}

export interface MerchantBannerFields {
  title?: string
  target?: string
  sort?: number
  isEnabled?: boolean
}

export function queryMerchantBanners(params: Record<string, unknown>) {
  return request<PageResponse<BannerRecord>>({ url: '/mch/banner/crud/query', method: 'get', params })
}

export function createMerchantBanner(shopId: string, file: File, fields: MerchantBannerFields) {
  return request<void>({
    url: '/mch/banner/create',
    method: 'post',
    data: bannerFormData(file, { shopId, ...merchantBannerFields(fields) }),
  })
}

export function updateMerchantBanner(
  id: string,
  shopId: string,
  file: File | undefined,
  fields: MerchantBannerFields,
) {
  return request<void>({
    url: '/mch/banner/update',
    method: 'post',
    data: bannerFormData(file, { id, shopId, ...merchantBannerFields(fields) }),
  })
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

function merchantBannerFields(fields: MerchantBannerFields) {
  const result: Record<string, string> = {}
  if (fields.title !== undefined) result.title = fields.title
  if (fields.target !== undefined) result.target = fields.target
  if (fields.sort !== undefined) result.sort = String(fields.sort)
  if (fields.isEnabled !== undefined) result.isEnabled = String(fields.isEnabled)
  return result
}

function bannerFormData(file: File | undefined, fields: Record<string, string> = {}) {
  const data = new FormData()
  if (file) data.append('file', file)
  Object.entries(fields).forEach(([key, value]) => data.append(key, value))
  return data
}
