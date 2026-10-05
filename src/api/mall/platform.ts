import { request } from '@/utils/request'
import type { PageResponse } from '@/types/api'
import type { MerchantForm, MerchantRecord, ShopForm, ShopRecord } from '@/types/mall'

export function queryMerchants(params: Record<string, unknown>) {
  return request<PageResponse<MerchantRecord>>({
    url: '/admin/merchant/crud/query',
    method: 'get',
    params,
  })
}

export function getMerchantDetail(id: number) {
  return request<MerchantRecord>({
    url: '/admin/merchant/crud/detail',
    method: 'get',
    params: { id },
  })
}

export function createMerchant(data: MerchantForm) {
  return request<MerchantRecord>({
    url: '/admin/merchant/create',
    method: 'post',
    data,
  })
}

export function updateMerchant(data: MerchantForm) {
  return request<MerchantRecord>({
    url: '/admin/merchant/update',
    method: 'post',
    data,
  })
}

export function deleteMerchants(ids: number[]) {
  return request<void>({
    url: '/admin/merchant/delete',
    method: 'post',
    data: ids,
  })
}

export function queryShops(params: Record<string, unknown>) {
  return request<PageResponse<ShopRecord>>({
    url: '/admin/shop/query',
    method: 'get',
    params,
  })
}

export function getShopDetail(id: number) {
  return request<ShopRecord>({
    url: '/admin/shop/detail',
    method: 'get',
    params: { id },
  })
}

export function createShop(data: ShopForm) {
  return request<ShopRecord>({
    url: '/admin/shop/create',
    method: 'post',
    data,
  })
}

export function updateShop(data: ShopForm) {
  return request<ShopRecord>({
    url: '/admin/shop/update',
    method: 'post',
    data,
  })
}

export function deleteShops(ids: number[]) {
  return request<void>({
    url: '/admin/shop/delete',
    method: 'post',
    data: ids,
  })
}
