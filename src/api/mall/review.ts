import request from '@/utils/request'

export function queryAdminReviews(params: Record<string, unknown>) {
  return request({ url: '/admin/review/query', method: 'get', params })
}

export function getAdminReviewDetail(id: string | number) {
  return request({ url: '/admin/review/detail', method: 'get', params: { id } })
}

export function updateReviewVisibility(data: Record<string, unknown>) {
  return request({ url: '/admin/review/updateVisibility', method: 'post', data })
}

export function queryMchReviews(params: Record<string, unknown>) {
  return request({ url: '/mch/review/query', method: 'get', params })
}

export function getMchReviewDetail(params: Record<string, unknown>) {
  return request({ url: '/mch/review/detail', method: 'get', params })
}

export function replyMchReview(shopId: string | number, data: Record<string, unknown>) {
  return request({ url: '/mch/review/reply', method: 'post', params: { shopId }, data })
}
