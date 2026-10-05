import request from '@/utils/request'

// 商家端会员优惠券管理API

// 获取领取记录列表
export function getMemberCouponList(params) {
  return request({
    url: '/mch/memberCoupon/crud/query',
    method: 'get',
    params
  })
}

// 获取优惠券列表（用于下拉选择）
export function getCouponList(params) {
  return request({
    url: '/mch/mchCoupon/crud/query',
    method: 'get',
    params
  })
}
