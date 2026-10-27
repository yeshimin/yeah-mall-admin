import { request } from '@/utils/request'
import type { PageResponse } from '@/types/api'

export interface SpecDefinition {
  id: string
  specName: string
  createTime?: string
  updateTime?: string
}

export interface SpecOptionDefinition {
  id: string
  specId: string
  optName: string
  createTime?: string
  updateTime?: string
}

export function listSpecDef(params: Record<string, unknown>) {
  return request<PageResponse<SpecDefinition>>({
    url: '/mch/productSpecDef/crud/query',
    method: 'get',
    params,
  })
}

export function createSpecDef(data: { shopId: string; specName: string }) {
  return request<void>({ url: '/mch/productSpecDef/create', method: 'post', data })
}

export function updateSpecDef(data: { id: string; specName: string }) {
  return request<void>({ url: '/mch/productSpecDef/update', method: 'post', data })
}

export function deleteSpecDef(ids: string[]) {
  return request<void>({ url: '/mch/productSpecDef/delete', method: 'post', data: ids })
}

export function listSpecOptDef(params: { shopId: string; specId: string }) {
  return request<SpecOptionDefinition[]>({ url: '/mch/productSpecOptDef/query', method: 'get', params })
}

export function createSpecOptDef(data: { shopId: string; specId: string; optName: string }) {
  return request<void>({ url: '/mch/productSpecOptDef/create', method: 'post', data })
}

export function updateSpecOptDef(data: { shopId: string; id: string; optName: string }) {
  return request<void>({ url: '/mch/productSpecOptDef/update', method: 'post', data })
}

export function deleteSpecOptDef(ids: string[]) {
  return request<void>({ url: '/mch/productSpecOptDef/delete', method: 'post', data: ids })
}
