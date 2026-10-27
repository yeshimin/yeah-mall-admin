import { request } from '@/utils/request'
import type { PageResponse } from '@/types/api'

export interface QuickEntryRecord {
  id: string
  name: string
  icon: string
  type: number
  target: string
  sort: number
  isEnabled: boolean
  remark: string
  createTime?: string
  updateTime?: string
}

export type QuickEntrySaveRequest = Omit<QuickEntryRecord, 'id' | 'createTime' | 'updateTime'> & { id?: string }

export function queryQuickEntryList(params: Record<string, unknown>) {
  return request<PageResponse<QuickEntryRecord>>({
    url: '/admin/platQuickEntry/crud/query',
    method: 'get',
    params,
  })
}

export function createQuickEntry(data: QuickEntrySaveRequest) {
  return request<void>({
    url: '/admin/platQuickEntry/create',
    method: 'post',
    data: normalizePayload(data),
  })
}

export function updateQuickEntry(data: QuickEntrySaveRequest & { id: string }) {
  return request<void>({
    url: '/admin/platQuickEntry/update',
    method: 'post',
    data: normalizePayload(data),
  })
}

export function deleteQuickEntry(ids: string[]) {
  return request<void>({
    url: '/admin/platQuickEntry/delete',
    method: 'post',
    data: ids,
  })
}

function normalizePayload(data: QuickEntrySaveRequest) {
  return {
    id: data.id || undefined,
    name: data.name.trim(),
    icon: data.icon,
    type: data.type,
    target: data.target.trim() || null,
    sort: data.sort,
    isEnabled: data.isEnabled,
    remark: data.remark.trim(),
  }
}
