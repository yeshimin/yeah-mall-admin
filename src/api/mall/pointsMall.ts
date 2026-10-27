import request from '@/utils/request'

export const queryPointsCategories = () =>
  request({ url: '/admin/pointsMall/categories', method: 'get' })

export const savePointsCategory = (data: Record<string, unknown>) =>
  request({ url: '/admin/pointsMall/category/save', method: 'post', data })

export const deletePointsCategory = (id: string) =>
  request({ url: '/admin/pointsMall/category/delete', method: 'post', params: { id } })

export const queryPointsProducts = (params: Record<string, unknown>) =>
  request({ url: '/admin/pointsMall/products', method: 'get', params })

export const savePointsProduct = (data: Record<string, unknown>) =>
  request({ url: '/admin/pointsMall/product/save', method: 'post', data })

export const deletePointsProduct = (id: string) =>
  request({ url: '/admin/pointsMall/product/delete', method: 'post', params: { id } })

export const queryPointsSkus = (spuId: string) =>
  request({ url: '/admin/pointsMall/skus', method: 'get', params: { spuId } })

export const savePointsSku = (data: Record<string, unknown>) =>
  request({ url: '/admin/pointsMall/sku/save', method: 'post', data })

export const deletePointsSku = (id: string) =>
  request({ url: '/admin/pointsMall/sku/delete', method: 'post', params: { id } })

export const queryPointsCoupons = () =>
  request({ url: '/admin/pointsMall/coupons', method: 'get' })

export const queryPointsDeliveryProviders = (keyword = '') =>
  request({ url: '/admin/pointsMall/deliveryProviders', method: 'get', params: { keyword: keyword || undefined } })

export const queryPointsOrders = (params: Record<string, unknown>) =>
  request({ url: '/admin/pointsMall/orders', method: 'get', params })

export const queryPointsOrderDetail = (id: string) =>
  request({ url: '/admin/pointsMall/order/detail', method: 'get', params: { id } })

export const queryPointsOrderLogs = (id: string) =>
  request({ url: '/admin/pointsMall/order/logs', method: 'get', params: { id } })

export const shipPointsOrder = (data: Record<string, unknown>) =>
  request({ url: '/admin/pointsMall/order/ship', method: 'post', data })

export const fulfillPointsOrder = (data: Record<string, unknown>) =>
  request({ url: '/admin/pointsMall/order/fulfill', method: 'post', data })

export const cancelPointsOrder = (data: Record<string, unknown>) =>
  request({ url: '/admin/pointsMall/order/cancel', method: 'post', data })
