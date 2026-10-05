import request from '@/utils/request';

export function getSkuList(params) {
  return request({
    url: '/mch/productSku/crud/query',
    method: 'get',
    params
  });
}

export function saveSku(data) {
  return request({
    url: '/mch/productSku/create',
    method: 'post',
    data
  });
}

export function updateSku(data) {
  return request({
    url: '/mch/productSku/update',
    method: 'post',
    data
  });
}

export function deleteSku(ids) {
  return request({
    url: '/mch/productSku/delete',
    method: 'post',
    data: ids
  });
}

// SKU详情
export function getSkuDetail(id) {
  return request({
    url: '/mch/productSku/detail',
    method: 'get',
    params: { id }
  });
}
