import { reactive } from 'vue'
import { getPublicSysConfigs } from '@/api/upms'
import {
  DEFAULT_PASSWORD_POLICY,
  PASSWORD_POLICY_GROUP_CODE,
  resolvePasswordPolicy,
  type PasswordPolicy,
} from '@/utils/password-policy'

/** 加载公开密码规则，并在接口不可用时退回前端默认策略。 */
export function usePasswordPolicy() {
  const passwordPolicy = reactive<PasswordPolicy>({ ...DEFAULT_PASSWORD_POLICY })

  /** 刷新当前响应式密码策略。 */
  const loadPasswordPolicy = async () => {
    try {
      const response = await getPublicSysConfigs({ groupCode: PASSWORD_POLICY_GROUP_CODE })
      Object.assign(passwordPolicy, resolvePasswordPolicy(response.data))
    } catch {
      Object.assign(passwordPolicy, DEFAULT_PASSWORD_POLICY)
    }
  }

  return {
    passwordPolicy,
    loadPasswordPolicy,
  }
}
