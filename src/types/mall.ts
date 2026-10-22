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
  loginPassword?: string
  status?: string
}

export interface MerchantForm {
  id?: MallId
  loginAccount: string
  loginPassword?: string
}

export interface ShopRecord extends MallEntity {
  mchId: MallId
  mchName?: string
  shopNo?: string
  shopName: string
  status?: string
}

export interface ShopForm {
  id?: MallId
  mchId?: MallId
  shopNo: string
  shopName: string
}
