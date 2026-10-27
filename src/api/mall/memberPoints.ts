import request from '@/utils/request'

export const adjustMemberPoints = (data: Record<string, unknown>) =>
  request({ url: '/admin/memberPoints/account/adjust', method: 'post', data })

export const queryPointsLedger = (params: Record<string, unknown>) =>
  request({ url: '/admin/memberPoints/ledger/query', method: 'get', params })

export const queryPointsRules = () =>
  request({ url: '/admin/memberPoints/rule/query', method: 'get' })

export const updatePointsRule = (data: Record<string, unknown>) =>
  request({ url: '/admin/memberPoints/rule/update', method: 'post', data })
