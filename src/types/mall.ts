export type MallId = string

export interface MallEntity {
  id: MallId
  createTime?: string
  createBy?: string
  updateTime?: string
  updateBy?: string
}

export interface MerchantRecord extends MallEntity {
  loginAccount: string
  nickname?: string
  avatar?: string
  isEnabled: boolean
  shopCount: number
  enabledShopCount: number
}

export interface MerchantShopRecord {
  id: MallId
  shopNo: string
  shopName: string
  isEnabled: boolean
  isOpen: boolean
  createTime?: string
}

export interface MerchantDetailRecord extends MerchantRecord {
  shops: MerchantShopRecord[]
}

export interface MerchantForm {
  id?: MallId
  loginAccount: string
  loginPassword?: string
}

export interface MerchantResetPasswordForm {
  id: MallId
  loginPassword: string
}

export interface MerchantStatusForm {
  id: MallId
  isEnabled: boolean
}

export interface ShopRecord extends MallEntity {
  mchId: MallId
  mchName?: string
  shopNo?: string
  shopName: string
  shopLogo?: string
  shopIntro?: string
  settlementCommissionRate?: number
  settlementDelayDays?: number
  isEnabled?: boolean
  isOpen?: boolean
  status?: string
}

export interface ShopForm {
  id?: MallId
  mchId?: MallId
  shopNo: string
  shopName: string
  settlementCommissionRate?: number
  settlementDelayDays?: number
  isEnabled: boolean
}
