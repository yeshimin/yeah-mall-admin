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

// 分页查询秒杀活动（含场次数量）
export function querySeckillActivityPage(params) {
  return request({
    url: '/admin/seckillActivity/query',
    method: 'get',
    params
  })
}

// 查询秒杀活动状态统计
export function querySeckillActivityStats(params) {
  return request({
    url: '/admin/seckillActivity/stats',
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

// 获取活动监控成交动态
export function getSeckillMonitorEvents(activityId, limit = 24) {
  return request({
    url: `/admin/seckill/monitor/events`,
    method: 'get',
    params: { activityId, limit }
  })
}

// 查询秒杀报名商品列表（含库存、成交额、场次与报名审核时间）
export function querySeckillSpuList(params) {
  return request({
    url: '/admin/seckillSpu/query',
    method: 'get',
    params
  })
}

// 获取秒杀报名商品详情（含图片、SKU与报名审核信息）
export function getSeckillSpuDetail(id) {
  return request({
    url: '/admin/seckillSpu/detail',
    method: 'get',
    params: { id }
  })
}

// 获取秒杀经营分析数据
export function getSeckillAnalysisData(activityId) {
  return request({
    url: '/admin/seckill/analysis/data',
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
    url: '/admin/seckillSession/create',
    method: 'post',
    data
  })
}

// 更新秒杀场次
export function updateSeckillSession(data) {
  return request({
    url: '/admin/seckillSession/update',
    method: 'post',
    data
  })
}

// 删除秒杀场次
export function deleteSeckillSession(ids) {
  return request({
    url: '/admin/seckillSession/delete',
    method: 'post',
    data: ids
  })
}

// 更新秒杀场次是否启用
export function updateSeckillSessionEnabled(data) {
  return request({
    url: '/admin/seckillSession/updateEnabled',
    method: 'post',
    data
  })
}

// 查询场次商品数统计
export function getSeckillSessionProductCounts(activityId) {
  return request({
    url: '/admin/seckillSession/productCounts',
    method: 'get',
    params: { activityId }
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

// 查询秒杀报名申请列表
export function querySeckillApplyList(params) {
  return request({
    url: '/admin/seckillActivityApply/query',
    method: 'get',
    params
  })
}

// 查询秒杀报名申请统计
export function getSeckillApplyStats(params) {
  return request({
    url: '/admin/seckillActivityApply/stats',
    method: 'get',
    params
  })
}

// 获取秒杀报名申请详情
export function getSeckillApplyDetail(id) {
  return request({
    url: '/admin/seckillActivityApply/detail',
    method: 'get',
    params: { id }
  })
}

// 审核秒杀报名申请
export function auditSeckillApply(data) {
  return request({
    url: '/admin/seckillActivityApply/audit',
    method: 'post',
    data
  })
}

// 商家端查询报名记录
export function queryMchSeckillApplyList(params) {
  return request({
    url: '/mch/seckillActivityApply/query',
    method: 'get',
    params
  })
}

// 商家端获取报名详情
export function getMchSeckillApplyDetail(id) {
  return request({
    url: '/mch/seckillActivityApply/detail',
    method: 'get',
    params: { id }
  })
}

// 商家端查询已报名的活动选项
export function queryMchSeckillApplyActivities() {
  return request({
    url: '/mch/seckillActivity/queryApplyActivity',
    method: 'get'
  })
}

// 商家端查询秒杀商品列表
export function queryMchSeckillSpuList(params) {
  return request({
    url: '/mch/seckillSpu/query',
    method: 'get',
    params
  })
}

// 商家端获取秒杀商品详情
export function getMchSeckillSpuDetail(id) {
  return request({
    url: '/mch/seckillSpu/detail',
    method: 'get',
    params: { id }
  })
}
