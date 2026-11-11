import request from '@/utils/request'

export interface ProductSpuOption {
  id: string | number
  name: string
  shopId?: string | number
}

export function queryProductSpuOptions(params: { keyword?: string; limit?: number }) {
  return request<ProductSpuOption[]>({
    url: '/admin/productSpu/options',
    method: 'get',
    params,
  })
}
