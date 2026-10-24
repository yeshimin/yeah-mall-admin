import request from '@/utils/request'

/**
 * 查询商家经营首页概览。
 */
export function queryMerchantDashboard(shopId: string) {
  return request({
    url: '/mch/dashboard/overview',
    method: 'get',
    params: { shopId },
  })
}
