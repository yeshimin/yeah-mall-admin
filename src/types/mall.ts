export interface MallEntity {
  id: number
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
  id?: number
  loginAccount: string
  loginPassword?: string
}

export interface ShopRecord extends MallEntity {
  mchId: number
  mchName?: string
  shopNo?: string
  shopName: string
  status?: string
}

export interface ShopForm {
  id?: number
  mchId?: number
  shopNo: string
  shopName: string
}
