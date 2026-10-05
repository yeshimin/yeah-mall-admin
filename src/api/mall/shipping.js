import request from '@/utils/request'

// 获取商家发货信息
export function getShippingInfo() {
  const shopId = localStorage.getItem('shopId') || '';
  return request({
    url: `/mch/deliveryInfo/query`,
    method: 'get',
    params: { shopId }
  })
}

// 保存商家发货信息
export function saveShippingInfo(data) {
  const shopId = localStorage.getItem('shopId') || '';
  const saveData = {
    shopId: parseInt(shopId),
    name: data.senderName,
    contact: data.senderPhone,
    provinceCode: data.provinceCode,
    provinceName: data.province,
    cityCode: data.cityCode,
    cityName: data.city,
    districtCode: data.districtCode,
    districtName: data.district,
    detailAddress: data.senderAddress,
    postalCode: data.postalCode
  };
  return request({
    url: `/mch/deliveryInfo/save`,
    method: 'post',
    data: saveData
  })
}

// 获取物流商列表
export function getLogisticsList() {
  return request({
    url: '/mch/shipping/logistics/list',
    method: 'get'
  })
}

// 保存物流商信息
export function saveLogistics(data) {
  return request({
    url: '/mch/shipping/logistics/save',
    method: 'post',
    data: data
  })
}

// 删除物流商
export function deleteLogistics(id) {
  return request({
    url: `/mch/shipping/logistics/delete/${id}`,
    method: 'delete'
  })
}

// 获取省市区树形数据
export function getAreaTree(maxLevel = 3) {
  return request({
    url: `/mch/area/tree`,
    method: 'get',
    params: { maxLevel }
  })
}

// 创建物流服务商
export function createDeliveryProvider(data) {
  const shopId = localStorage.getItem('shopId') || '';
  return request({
    url: `/mch/deliveryProvider/create`,
    method: 'post',
    data: {
      ...data,
      shopId: parseInt(shopId)
    }
  })
}

// 查询物流服务商列表
export function queryDeliveryProviderList(params) {
  const shopId = localStorage.getItem('shopId') || '';
  return request({
    url: `/mch/deliveryProvider/crud/query`,
    method: 'get',
    params: {
      ...params,
      shopId: parseInt(shopId)
    }
  })
}

// 获取物流服务商详情
export function getDeliveryProviderDetail(id) {
  return request({
    url: `/mch/deliveryProvider/crud/detail`,
    method: 'get',
    params: { id }
  })
}

// 更新物流服务商
export function updateDeliveryProvider(data) {
  const shopId = localStorage.getItem('shopId') || '';
  return request({
    url: `/mch/deliveryProvider/update`,
    method: 'post',
    data: {
      ...data,
      shopId: parseInt(shopId)
    }
  })
}

// 设置默认物流服务商
export function setDefaultDeliveryProvider(id, isDefault = true) {
  const shopId = localStorage.getItem('shopId') || '';
  return request({
    url: `/mch/deliveryProvider/setDefault`,
    method: 'post',
    data: {
      id,
      shopId: parseInt(shopId),
      isDefault
    }
  })
}

// 设置是否主流物流服务商
export function setPopularDeliveryProvider(id, isPopular = true) {
  const shopId = localStorage.getItem('shopId') || '';
  return request({
    url: `/mch/deliveryProvider/setPopular`,
    method: 'post',
    data: {
      id,
      shopId: parseInt(shopId),
      isPopular
    }
  })
}

// 删除物流服务商
export function deleteDeliveryProvider(ids) {
  return request({
    url: `/mch/deliveryProvider/crud/delete`,
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 同步快递公司
export function syncExpCompany() {
  const shopId = localStorage.getItem('shopId') || '';
  return request({
    url: `/mch/deliveryProvider/syncExpCompany`,
    method: 'post',
    data: {
      shopId: parseInt(shopId)
    }
  })
}