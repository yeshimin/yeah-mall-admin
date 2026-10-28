import { request } from '@/utils/request'
import type { PageResponse } from '@/types/api'

export interface PlatformCategoryRecord {
  id: string
  parentId: string | number
  code: string
  name: string
  image?: string
  sort: number
  level?: number
  path?: string
  remark: string
  createTime?: string
  updateTime?: string
  children?: PlatformCategoryRecord[]
}

export interface PlatformCategorySaveRequest {
  id?: string
  parentId: string | number
  code: string
  name: string
  image?: string
  sort: number
  remark: string
}

export function getPlatformCategoryTree() {
  return request<PlatformCategoryRecord[]>({
    url: '/admin/productCategory/tree',
    method: 'get',
  })
}

export function queryPlatformCategoryList(params: Record<string, unknown>) {
  return request<PageResponse<PlatformCategoryRecord>>({
    url: '/admin/productCategory/crud/query',
    method: 'get',
    params,
  })
}

export function getPlatformCategoryDetail(id: string) {
  return request<PlatformCategoryRecord>({
    url: '/admin/productCategory/crud/detail',
    method: 'get',
    params: { id },
  })
}

export function createPlatformCategory(data: PlatformCategorySaveRequest) {
  return request<PlatformCategoryRecord>({
    url: '/admin/productCategory/create',
    method: 'post',
    data,
  })
}

export function updatePlatformCategory(data: PlatformCategorySaveRequest & { id: string }) {
  return request<PlatformCategoryRecord>({
    url: '/admin/productCategory/update',
    method: 'post',
    data,
  })
}

export function deletePlatformCategories(ids: string[]) {
  return request<void>({
    url: '/admin/productCategory/delete',
    method: 'post',
    data: ids,
  })
}
