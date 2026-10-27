import request from '@/utils/request'

export const queryMembers = (params: Record<string, unknown>) =>
  request({ url: '/admin/member/query', method: 'get', params })
