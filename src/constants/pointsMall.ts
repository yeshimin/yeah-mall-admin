export const POINTS_PRODUCT_TYPE = Object.freeze({
  PHYSICAL: 1,
  COUPON: 2,
  BENEFIT: 3,
})

export const POINTS_FULFILLMENT_TYPE = Object.freeze({
  LOGISTICS: 1,
  AUTO_COUPON: 2,
  MANUAL: 3,
})

export const POINTS_ORDER_STATUS = Object.freeze({
  PENDING_FULFILLMENT: '1',
  SHIPPED: '2',
  COMPLETED: '3',
  CANCELED: '4',
})

export const POINTS_ORDER_ACTION = Object.freeze({
  SHIP: 'ship',
  FULFILL: 'fulfill',
  CANCEL: 'cancel',
})

export const POINTS_UNLIMITED_PER_MEMBER_LIMIT = 0

export const POINTS_ROOT_CATEGORY_ID = 0

export const POINTS_ORDER_STATUS_OPTIONS = [
  { value: POINTS_ORDER_STATUS.PENDING_FULFILLMENT, label: '待履约' },
  { value: POINTS_ORDER_STATUS.SHIPPED, label: '已发货' },
  { value: POINTS_ORDER_STATUS.COMPLETED, label: '已完成' },
  { value: POINTS_ORDER_STATUS.CANCELED, label: '已取消' },
]

export function getPointsProductTypeText(value?: number) {
  const text: Record<number, string> = {
    [POINTS_PRODUCT_TYPE.PHYSICAL]: '实物商品',
    [POINTS_PRODUCT_TYPE.COUPON]: '优惠券',
    [POINTS_PRODUCT_TYPE.BENEFIT]: '虚拟权益',
  }
  return text[value || 0] || '-'
}

export function getPointsFulfillmentText(value?: number) {
  const text: Record<number, string> = {
    [POINTS_FULFILLMENT_TYPE.LOGISTICS]: '物流发货',
    [POINTS_FULFILLMENT_TYPE.AUTO_COUPON]: '自动发券',
    [POINTS_FULFILLMENT_TYPE.MANUAL]: '人工履约',
  }
  return text[value || 0] || '-'
}

export function getPointsOrderStatusText(value?: string) {
  return POINTS_ORDER_STATUS_OPTIONS.find((item) => item.value === String(value))?.label || '-'
}

export function getPointsOrderStatusTag(value?: string) {
  const tags: Record<string, string> = {
    [POINTS_ORDER_STATUS.PENDING_FULFILLMENT]: 'warning',
    [POINTS_ORDER_STATUS.SHIPPED]: 'primary',
    [POINTS_ORDER_STATUS.COMPLETED]: 'success',
    [POINTS_ORDER_STATUS.CANCELED]: 'info',
  }
  return tags[String(value)] || 'info'
}

export function getDefaultPointsFulfillmentType(productType?: number) {
  const fulfillmentTypes: Record<number, number> = {
    [POINTS_PRODUCT_TYPE.PHYSICAL]: POINTS_FULFILLMENT_TYPE.LOGISTICS,
    [POINTS_PRODUCT_TYPE.COUPON]: POINTS_FULFILLMENT_TYPE.AUTO_COUPON,
    [POINTS_PRODUCT_TYPE.BENEFIT]: POINTS_FULFILLMENT_TYPE.MANUAL,
  }
  return fulfillmentTypes[productType || 0] || POINTS_FULFILLMENT_TYPE.LOGISTICS
}
