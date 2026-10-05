import request from '@/utils/request'

// 新增金刚区入口
export function createQuickEntry(data) {
  return request({
    url: '/admin/platQuickEntry/create',
    method: 'post',
    data: {
      name: data.name,
      icon: data.icon,
      type: data.type || 1,
      target: data.target || null,
      sort: data.sort,
      isEnabled: data.isEnabled,
      remark: data.remark || ''
    }
  })
}

// 修改金刚区入口
export function updateQuickEntry(data) {
  return request({
    url: '/admin/platQuickEntry/update',
    method: 'post',
    data: {
      id: data.id,
      name: data.name,
      icon: data.icon,
      type: data.type || 1,
      target: data.target || null,
      sort: data.sort,
      isEnabled: data.isEnabled,
      remark: data.remark || ''
    }
  })
}

// 删除金刚区入口
export function deleteQuickEntry(ids) {
  return request({
    url: '/admin/platQuickEntry/delete',
    method: 'post',
    data: ids
  })
}

// 查询金刚区入口详情
export function getQuickEntryDetail(id) {
  return request({
    url: `/admin/platQuickEntry/crud/query`,
    method: 'get',
    params: { id }
  })
}

// 查询金刚区入口列表
export function queryQuickEntryList(params) {
  return request({
    url: '/admin/platQuickEntry/crud/query',
    method: 'get',
    params
  })
}