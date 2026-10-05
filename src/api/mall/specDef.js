import request from '@/utils/request'

// 规格定义列表
export function listSpecDef(params) {
  return request({
    url: '/mch/productSpecDef/crud/query',
    method: 'get',
    params
  })
}

// 新增规格定义
export function createSpecDef(data) {
  return request({
    url: '/mch/productSpecDef/create',
    method: 'post',
    data
  })
}

// 编辑规格定义
export function updateSpecDef(data) {
  return request({
    url: '/mch/productSpecDef/update',
    method: 'post',
    data
  })
}

// 删除规格定义（支持批量）
export function deleteSpecDef(ids) {
  return request({
    url: '/mch/productSpecDef/delete',
    method: 'post',
    data: ids
  })
}

// 查询规格选项列表
export function listSpecOptDef(params) {
  return request({
    url: '/mch/productSpecOptDef/query',
    method: 'get',
    params
  })
}

// 新增规格选项
export function createSpecOptDef(data) {
  return request({
    url: '/mch/productSpecOptDef/create',
    method: 'post',
    data
  })
}

// 编辑规格选项
export function updateSpecOptDef(data) {
  return request({
    url: '/mch/productSpecOptDef/update',
    method: 'post',
    data
  })
}

// 删除规格选项（支持批量）
export function deleteSpecOptDef(ids) {
  return request({
    url: '/mch/productSpecOptDef/delete',
    method: 'post',
    data: ids
  })
}

// 其它增删改查接口可后续补充
