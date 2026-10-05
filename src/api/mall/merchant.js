import request from '@/utils/request'

// 查询商家列表
export function listMerchant(query) {
  return request({
    url: '/admin/merchant/crud/query',
    method: 'get',
    params: query
  })
}

// 创建商家
export function createMerchant(data) {
  return request({
    url: '/admin/merchant/create',
    method: 'post',
    data
  })
}

// 查询商家详情
export function getMerchantDetail(id) {
  return request({
    url: '/admin/merchant/crud/detail',
    method: 'get',
    params: { id }
  })
}

// 修改商家
export function updateMerchant(data) {
  return request({
    url: '/admin/merchant/update',
    method: 'post',
    data
  })
}

// 删除商家（支持批量）
export function deleteMerchant(ids) {
  return request({
    url: '/admin/merchant/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}
