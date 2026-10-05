import request from '@/utils/request'

// 创建秒杀活动
export function createSeckillActivity(data) {
  return request({
    url: '/admin/seckillActivity/create',
    method: 'post',
    data
  })
}

// 更新秒杀活动
export function updateSeckillActivity(data) {
  return request({
    url: '/admin/seckillActivity/update',
    method: 'post',
    data
  })
}

// 删除秒杀活动
export function deleteSeckillActivity(ids) {
  return request({
    url: '/admin/seckillActivity/delete',
    method: 'post',
    data: ids
  })
}

// 获取秒杀活动详情
export function getSeckillActivityDetail(id) {
  return request({
    url: `/admin/seckillActivity/detail`,
    method: 'get',
    params: { id }
  })
}

// 查询秒杀活动列表
export function querySeckillActivityList(params) {
  return request({
    url: '/admin/seckillActivity/crud/query',
    method: 'get',
    params
  })
}

// 关联秒杀商品
export function addSeckillProduct(data) {
  return request({
    url: '/admin/seckill/product/add',
    method: 'post',
    data
  })
}

// 移除秒杀商品
export function removeSeckillProduct(data) {
  return request({
    url: '/admin/seckill/product/remove',
    method: 'post',
    data
  })
}

// 查询秒杀商品列表
export function querySeckillProductList(params) {
  return request({
    url: '/admin/seckill/product/query',
    method: 'get',
    params
  })
}

// 获取活动监控数据
export function getSeckillMonitorData(activityId) {
  return request({
    url: `/admin/seckill/monitor/data`,
    method: 'get',
    params: { activityId }
  })
}

// 更新秒杀活动状态
export function updateSeckillActivityStatus(data) {
  return request({
    url: '/admin/seckillActivity/updateStatus',
    method: 'post',
    data
  })
}

// 更新秒杀活动是否启用
export function updateSeckillActivityEnabled(data) {
  return request({
    url: '/admin/seckillActivity/updateEnabled',
    method: 'post',
    data
  })
}

// 创建秒杀场次
export function createSeckillSession(data) {
  return request({
    url: '/admin/seckillSession/crud/create',
    method: 'post',
    data
  })
}

// 更新秒杀场次
export function updateSeckillSession(data) {
  return request({
    url: '/admin/seckillSession/crud/update',
    method: 'post',
    data
  })
}

// 删除秒杀场次
export function deleteSeckillSession(ids) {
  return request({
    url: '/admin/seckillSession/crud/delete',
    method: 'post',
    data: ids
  })
}

// 查询秒杀场次列表
export function querySeckillSessionList(params) {
  return request({
    url: '/admin/seckillSession/crud/query',
    method: 'get',
    params
  })
}

// 商家端查询秒杀活动列表
export function queryMchSeckillActivityList(params) {
  return request({
    url: '/mch/seckillActivity/query',
    method: 'get',
    params
  })
}

// 商家端查询秒杀活动场次列表
export function queryMchSeckillSessionList(params) {
  return request({
    url: '/mch/seckillActivity/querySession',
    method: 'get',
    params
  })
}

// 提交秒杀活动报名申请
export function submitSeckillApply(data) {
  return request({
    url: '/mch/seckillActivity/submitApply',
    method: 'post',
    data
  })
}

// 查询商家SPU列表
export function queryMchSpuList(params) {
  return request({
    url: '/mch/productSpu/query',
    method: 'get',
    params
  })
}
