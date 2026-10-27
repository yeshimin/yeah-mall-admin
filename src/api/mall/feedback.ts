import request from '@/utils/request'

export function queryAdminFeedbacks(params: Record<string, unknown>) {
  return request({ url: '/admin/feedback/crud/query', method: 'get', params })
}

export function getAdminFeedbackDetail(id: string | number) {
  return request({ url: '/admin/feedback/detail', method: 'get', params: { id } })
}

export function handleAdminFeedback(data: Record<string, unknown>) {
  return request({ url: '/admin/feedback/handle', method: 'post', data })
}
