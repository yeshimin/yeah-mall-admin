import { request } from '@/utils/request'
import type { PageResponse } from '@/types/api'

export interface ProductCategoryRecord {
  id: string
  parentId: string | number
  code: string
  name: string
  sort: number
  level?: number
  path?: string
  remark: string
  createTime?: string
  updateTime?: string
  children?: ProductCategoryRecord[]
}

export interface ProductCategorySaveRequest {
  id?: string
  shopId: string
  parentId: string | number
  code: string
  name: string
  sort: number
  remark: string
}

export function getCategoryTree(params: { shopId: string }) {
  return request<ProductCategoryRecord[]>({
    url: '/mch/productCategory/tree',
    method: 'get',
    params,
  })
}

export function queryCategoryList(params: Record<string, unknown>) {
  return request<PageResponse<ProductCategoryRecord>>({
    url: '/mch/productCategory/crud/query',
    method: 'get',
    params,
  })
}

export function getCategoryDetail(id: string) {
  return request<ProductCategoryRecord>({
    url: '/mch/productCategory/crud/detail',
    method: 'get',
    params: { id },
  })
}

export function createCategory(data: ProductCategorySaveRequest) {
  return request<void>({
    url: '/mch/productCategory/create',
    method: 'post',
    data,
  })
}

export function updateCategory(data: ProductCategorySaveRequest & { id: string }) {
  return request<void>({
    url: '/mch/productCategory/update',
    method: 'post',
    data,
  })
}

export function deleteCategory(ids: string[]) {
  return request<void>({
    url: '/mch/productCategory/delete',
    method: 'post',
    data: ids,
  })
}
