import { request } from '@/utils/request'
import type {
  MerchantLoginRequest,
  MerchantLoginVo,
  MerchantMineVo,
  MerchantResourceTreeNode,
} from '@/types/merchant'

export function loginMerchant(payload: MerchantLoginRequest) {
  return request<MerchantLoginVo>({
    url: '/mch/auth/login',
    method: 'post',
    data: payload,
    skipAuth: true,
  })
}

export function getMerchantMine() {
  return request<MerchantMineVo>({
    url: '/mch/merchant/mine',
    method: 'get',
  })
}

export function getMerchantMineResources() {
  return request<MerchantResourceTreeNode[]>({
    url: '/mch/merchant/mineResources',
    method: 'get',
  })
}
