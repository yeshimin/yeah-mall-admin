import request from '@/utils/request'

// 新增Banner（文件上传）
export function createBannerWithFile(shopId, file) {
  const formData = new FormData();
  formData.append('shopId', shopId);
  formData.append('file', file);

  return request({
    url: '/mch/banner/create',
    method: 'post',
    data: formData
  })
}

// 修改Banner（文件上传）
export function updateBannerWithFile(id, shopId, file) {
  const formData = new FormData();
  formData.append('id', id);
  formData.append('shopId', shopId);
  formData.append('file', file);

  return request({
    url: '/mch/banner/update',
    method: 'post',
    data: formData
  })
}

// 删除Banner
export function deleteBanner(ids) {
  return request({
    url: '/mch/banner/delete',
    method: 'post',
    data: ids
  })
}

// 查询Banner详情
export function getBannerDetail(id) {
  return request({
    url: `/mch/banner/crud/detail`,
    method: 'get',
    params: { id }
  })
}

// 查询Banner列表（新接口）
export function queryBannerList(params) {
  return request({
    url: '/mch/banner/crud/query',
    method: 'get',
    params
  })
}
