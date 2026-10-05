import request from '@/utils/request'

// 商家端优惠券管理API

// 获取优惠券列表
export function getMchCouponList(params) {
  return request({
    url: '/mch/mchCoupon/crud/query',
    method: 'get',
    params
  })
}

// 创建优惠券
export function createMchCoupon(data) {
  return request({
    url: '/mch/mchCoupon/create',
    method: 'post',
    data
  })
}

// 更新优惠券
export function updateMchCoupon(data) {
  return request({
    url: '/mch/mchCoupon/update',
    method: 'post',
    data
  })
}

// 删除优惠券
export function deleteMchCoupon(ids) {
  return request({
    url: '/mch/mchCoupon/crud/delete',
    method: 'post',
    data: ids
  })
}

// 获取优惠券详情
export function getMchCouponDetail(id) {
  return request({
    url: '/mch/mchCoupon/crud/detail',
    method: 'get',
    params: { id }
  })
}

// 更新优惠券状态
export function updateMchCouponStatus(data) {
  return request({
    url: '/mch/mchCoupon/updateStatus',
    method: 'post',
    data
  })
}

// 获取商品详情
export function getSpuDetail(id) {
  return request({
    url: '/mch/productSpu/detail',
    method: 'get',
    params: { id }
  })
}
