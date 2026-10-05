import request from '@/utils/request'

// 创建拼团活动
export function createGroupBuyActivity(data) {
  return request({
    url: '/admin/groupBuyActivity/create',
    method: 'post',
    data
  })
}

// 更新拼团活动
export function updateGroupBuyActivity(data) {
  return request({
    url: '/admin/groupBuyActivity/update',
    method: 'post',
    data
  })
}

// 删除拼团活动
export function deleteGroupBuyActivity(ids) {
  return request({
    url: '/admin/groupBuyActivity/delete',
    method: 'post',
    data: ids
  })
}

// 获取拼团活动详情
export function getGroupBuyActivityDetail(id) {
  return request({
    url: `/admin/groupBuyActivity/detail`,
    method: 'get',
    params: { id }
  })
}

// 查询拼团活动列表
export function queryGroupBuyActivityList(params) {
  return request({
    url: '/admin/groupBuyActivity/crud/query',
    method: 'get',
    params
  })
}

// 更新拼团活动状态
export function updateGroupBuyActivityStatus(data) {
  return request({
    url: '/admin/groupBuyActivity/updateStatus',
    method: 'post',
    data
  })
}

// 更新拼团活动是否启用
export function updateGroupBuyActivityEnabled(data) {
  return request({
    url: '/admin/groupBuyActivity/updateEnabled',
    method: 'post',
    data
  })
}

// 关联拼团商品
export function addGroupBuyProduct(data) {
  return request({
    url: '/admin/groupBuy/product/add',
    method: 'post',
    data
  })
}

// 移除拼团商品
export function removeGroupBuyProduct(data) {
  return request({
    url: '/admin/groupBuy/product/remove',
    method: 'post',
    data
  })
}

// 查询拼团商品列表
export function queryGroupBuyProductList(params) {
  return request({
    url: '/admin/groupBuy/product/query',
    method: 'get',
    params
  })
}

// 查询拼团订单列表
export function queryGroupBuyOrderList(params) {
  return request({
    url: '/admin/groupBuy/order/query',
    method: 'get',
    params
  })
}

// 查询拼团申请列表
export function queryGroupBuyApplyList(params) {
  return request({
    url: '/admin/groupBuy/apply/query',
    method: 'get',
    params
  })
}

// 审核拼团申请
export function auditGroupBuyApply(data) {
  return request({
    url: '/admin/groupBuy/apply/audit',
    method: 'post',
    data
  })
}

// 商家端查询拼团活动列表
export function queryMchGroupBuyActivityList(params) {
  return request({
    url: '/mch/groupBuyActivity/query',
    method: 'get',
    params
  })
}

// 提交拼团活动报名申请
export function submitGroupBuyApply(data) {
  return request({
    url: '/mch/groupBuyActivity/submitApply',
    method: 'post',
    data
  })
}

// 商家端查询拼团商品列表
export function queryMchGroupBuyProductList(params) {
  return request({
    url: '/mch/groupBuy/product/query',
    method: 'get',
    params
  })
}

// 商家端查询拼团订单列表
export function queryMchGroupBuyOrderList(params) {
  return request({
    url: '/mch/groupBuy/order/query',
    method: 'get',
    params
  })
}

// 商家端查询拼团申请记录
export function queryMchGroupBuyApplyList(params) {
  return request({
    url: '/mch/groupBuy/apply/query',
    method: 'get',
    params
  })
}