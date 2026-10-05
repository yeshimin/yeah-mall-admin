import type { ResourceTreeNode, SysOrgEntity, SysRoleEntity } from './upms'

export interface MerchantLoginRequest {
  username: string
  password: string
  terminal?: 'web' | 'app' | 'api'
}

export interface MerchantLoginVo {
  token: string
}

export interface MerchantEntity {
  id: number
  username?: string
  nickname?: string
  loginAccount?: string
  avatar?: string | null
  status?: string
  mobile?: string
  email?: string
  gender?: number
  remark?: string
  createTime?: string
}

export interface MerchantMineVo {
  user: MerchantEntity
  roles: SysRoleEntity[]
  orgs: SysOrgEntity[]
  permissions: string[]
}

export type MerchantResourceTreeNode = ResourceTreeNode
