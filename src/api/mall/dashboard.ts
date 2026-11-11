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

/**
 * 查询商家近 N 日交易趋势。
 */
export function queryMerchantDashboardTrend(shopId: string, days = 7) {
  return request({
    url: '/mch/dashboard/trend',
    method: 'get',
    params: { shopId, days },
  })
}

/**
 * 查询平台经营概览。
 */
export function queryAdminDashboardOverview() {
  return request({
    url: '/admin/dashboard/overview',
    method: 'get',
  })
}

/**
 * 查询平台近 N 日交易趋势。
 */
export function queryAdminDashboardTrend(days = 7) {
  return request({
    url: '/admin/dashboard/trend',
    method: 'get',
    params: { days },
  })
}
