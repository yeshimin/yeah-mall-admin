import request from '@/utils/request'

// 新增Banner（文件上传）
export function createBannerWithFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  return request({
    url: '/admin/platBanner/create',
    method: 'post',
    data: formData
  })
}

// 修改Banner（文件上传）
export function updateBannerWithFile(id, file) {
  const formData = new FormData();
  formData.append('id', id);
  formData.append('file', file);

  return request({
    url: '/admin/platBanner/update',
    method: 'post',
    data: formData
  })
}

// 删除Banner
export function deleteBanner(ids) {
  return request({
    url: '/admin/platBanner/delete',
    method: 'post',
    data: ids
  })
}

// 查询Banner详情
export function getBannerDetail(id) {
  return request({
    url: `/admin/platBanner/crud/detail`,
    method: 'get',
    params: { id }
  })
}

// 查询Banner列表
export function queryBannerList(params) {
  return request({
    url: '/admin/platBanner/crud/query',
    method: 'get',
    params
  })
}