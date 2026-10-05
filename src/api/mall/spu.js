import request from '@/utils/request'

// 商品SPU列表
export function listSpu(params) {
  return request({
    url: '/mch/productSpu/query',
    method: 'get',
    params
  })
}
// 新增SPU
export function createSpu(data) {
  return request({
    url: '/mch/productSpu/create',
    method: 'post',
    data
  })
}
// 编辑SPU
export function updateSpu(data) {
  return request({
    url: '/mch/productSpu/update',
    method: 'post',
    data
  })
}
// 删除SPU（支持批量）
export function deleteSpu(ids) {
  return request({
    url: '/mch/productSpu/delete',
    method: 'post',
    data: ids
  })
}
// 详情
export function getSpuDetail(id) {
  return request({
    url: '/mch/productSpu/detail',
    method: 'get',
    params: { id }
  })
}
// 查询规格
export function querySpec(params) {
  return request({
    url: '/mch/productSpu/querySpec',
    method: 'get',
    params
  })
}

// 设置主图
export function setMainImage(data) {
  return request({
    url: '/mch/productSpu/setMainImage',
    method: 'post',
    data
  })
}

// 设置滚动图
export function setCarouselImages(data) {
  return request({
    url: '/mch/productSpu/setCarouselImages',
    method: 'post',
    data
  })
}
