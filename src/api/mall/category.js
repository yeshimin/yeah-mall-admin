import request from '@/utils/request'

// 获取商品分类树
export function getCategoryTree(params) {
  return request({
    url: '/mch/productCategory/tree',
    method: 'get',
    params
  })
}

// 查询商品分类详情
export function getCategoryDetail(id) {
  return request({
    url: '/mch/productCategory/crud/detail',
    method: 'get',
    params: { id }
  })
}

// 新增商品分类
export function createCategory(data) {
  // 只传递后端需要的字段
  const payload = {
    shopId: data.shopId,
    parentId: data.parentId,
    code: data.code,
    name: data.name,
    sort: data.sort,
    remark: data.remark
  }
  return request({
    url: '/mch/productCategory/create',
    method: 'post',
    data: payload
  })
}

// 修改商品分类
export function updateCategory(data) {
  return request({
    url: '/mch/productCategory/update',
    method: 'post',
    data
  })
}

// 删除商品分类
export function deleteCategory(ids) {
  return request({
    url: '/mch/productCategory/delete',
    method: 'post',
    data: ids
  })
}

// 查询商品分类列表（分页/条件查询）
export function queryCategoryList(params) {
  return request({
    url: '/mch/productCategory/crud/query',
    method: 'get',
    params
  })
}
