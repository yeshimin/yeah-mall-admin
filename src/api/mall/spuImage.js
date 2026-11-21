import request from '@/utils/request'

// 新增滚动图：确认保存时按临时fileKey落库并markUse
export function createSpuImage(data) {
  return request({
    url: '/mch/productSpuImage/create',
    method: 'post',
    data: data
  })
}

// 删除图片
export function deleteSpuImage(data) {
  return request({
    url: '/mch/productSpuImage/delete',
    method: 'post',
    data: data
  })
}

// 获取图片列表
export function listSpuImages(queryParams) {
  return request({
    url: '/mch/productSpuImage/crud/query',
    method: 'get',
    params: queryParams
  })
}