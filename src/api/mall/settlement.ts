import { request } from '@/utils/request'
import type { PageResponse } from '@/types/api'

export interface SettlementRecord {
  id: string
  mchId: string
  shopId: string
  ledgerNo: string
  bizType: string
  bizId: string
  orderId: string
  orderNo: string
  grossAmount: number
  commissionRate: number
  commissionAmount: number
  amount: number
  availableTime?: string
  status: string
  settlementNo?: string
  transactionNo?: string
  proof?: string
  settledTime?: string
  settlementRemark?: string
  createTime?: string
}

export interface SettlementPreview {
  shopId: string
  recordCount: number
  autoIncludedNegativeCount: number
  totalAmount: number
  settlementAccountId: string
  settlementAccountType: string
  settlementAccountName: string
  settlementAccountNo: string
  settlementBankName?: string
}

export interface SettlementAccountRecord {
  id: string
  mchId: string
  shopId: string
  accountType: string
  accountName: string
  accountNo: string
  bankName?: string
  status: string
  auditTime?: string
  auditRemark?: string
  createTime?: string
}

export interface PaymentChannelRecord {
  id: string
  channelCode: string
  channelName: string
  shopId: string
  shopName: string
  appTarget: string
  collectionMode: string
  parentId?: string
  appId?: string
  mchId?: string
  subAppId?: string
  subMchId?: string
  certificateSerialNo?: string
  wechatPayPublicKeyId?: string
  payNotifyUrl?: string
  refundNotifyUrl?: string
  isEnabled: boolean
  hasAppSecret: boolean
  hasSubAppSecret: boolean
  hasPrivateKey: boolean
  hasWechatPayPublicKey: boolean
  hasApiV3Key: boolean
}

export interface PaymentChannelSaveData {
  id?: string
  channelName: string
  shopId: string
  appTarget: string
  collectionMode: string
  parentId?: string
  appId?: string
  appSecret?: string
  mchId?: string
  subAppId?: string
  subAppSecret?: string
  subMchId?: string
  certificateSerialNo?: string
  privateKeyRaw?: string
  wechatPayPublicKeyId?: string
  wechatPayPublicKeyRaw?: string
  apiV3Key?: string
  payNotifyUrl?: string
  refundNotifyUrl?: string
  isEnabled: boolean
}

export function queryPlatformSettlements(params: Record<string, unknown>) {
  return request<PageResponse<SettlementRecord>>({
    url: '/admin/settlement/query',
    method: 'get',
    params,
  })
}

export function confirmPlatformSettlement(data: {
  ids: string[]
  expectedAmount: number
  expectedRecordCount: number
  settlementAccountId: string
  transactionNo: string
  proof?: string
  remark?: string
}) {
  return request<string>({ url: '/admin/settlement/settle', method: 'post', data })
}

export function previewPlatformSettlement(ids: string[]) {
  return request<SettlementPreview>({
    url: '/admin/settlement/preview',
    method: 'post',
    data: { ids },
  })
}

export function queryMerchantSettlements(params: Record<string, unknown>) {
  return request<PageResponse<SettlementRecord>>({
    url: '/mch/settlement/query',
    method: 'get',
    params,
  })
}

export function queryPlatformSettlementAccounts(params: Record<string, unknown>) {
  return request<PageResponse<SettlementAccountRecord>>({
    url: '/admin/settlement/account/query',
    method: 'get',
    params,
  })
}

export function getPlatformSettlementAccount(id: string) {
  return request<SettlementAccountRecord>({
    url: '/admin/settlement/account/detail',
    method: 'get',
    params: { id },
  })
}

export function auditPlatformSettlementAccount(data: { id: string; approved: boolean; remark?: string }) {
  return request<void>({ url: '/admin/settlement/account/audit', method: 'post', data })
}

export function getMerchantSettlementAccount(shopId: string) {
  return request<SettlementAccountRecord | null>({
    url: '/mch/settlement/account/detail',
    method: 'get',
    params: { shopId },
  })
}

export function saveMerchantSettlementAccount(data: {
  shopId: string
  accountType: string
  accountName: string
  accountNo: string
  bankName?: string
}) {
  return request<SettlementAccountRecord>({ url: '/mch/settlement/account/save', method: 'post', data })
}

export function queryPlatformPaymentChannels() {
  return request<PaymentChannelRecord[]>({ url: '/admin/settlement/channel/query', method: 'get' })
}

export function savePlatformPaymentChannel(data: PaymentChannelSaveData) {
  return request<PaymentChannelRecord>({ url: '/admin/settlement/channel/save', method: 'post', data })
}

export function getMerchantPaymentChannel(shopId: string) {
  return request<PaymentChannelRecord | null>({
    url: '/mch/settlement/channel/detail',
    method: 'get',
    params: { shopId },
  })
}

export function saveMerchantPaymentChannel(data: PaymentChannelSaveData) {
  return request<PaymentChannelRecord>({ url: '/mch/settlement/channel/save', method: 'post', data })
}
