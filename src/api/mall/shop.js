import request from '@/utils/request'

// 查询店铺列表
export function listShop(query) {
  return request({
    url: '/admin/shop/query',
    method: 'get',
    params: query
  })
}

// 创建店铺
export function createShop(data) {
  return request({
    url: '/admin/shop/create',
    method: 'post',
    data
  })
}

// 查询店铺详情
export function getShopDetail(id) {
  return request({
    url: '/admin/shop/detail',
    method: 'get',
    params: { id }
  })
}

// 修改店铺
export function updateShop(data) {
  return request({
    url: '/admin/shop/update',
    method: 'post',
    data
  })
}

// 删除店铺（支持批量）
export function deleteShop(ids) {
  return request({
    url: '/admin/shop/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 查询店铺列表
export function queryShopList(params) {
  return request({
    url: '/mch/shop/crud/query',
    method: 'get',
    params
  })
}
