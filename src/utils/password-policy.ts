import type { NameValueVo } from '@/types/upms'

export const PASSWORD_POLICY_GROUP_CODE = 'admin.auth.password'

export type PasswordPolicy = {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireDigit: boolean
  requireSpecial: boolean
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 6,
  maxLength: 32,
  requireUppercase: false,
  requireLowercase: false,
  requireDigit: false,
  requireSpecial: false,
}

/** 将公开系统参数解析为可用于前端校验的密码策略。 */
export function resolvePasswordPolicy(configs: NameValueVo[]): PasswordPolicy {
  const values = new Map(configs.map((item) => [item.name, item.value]))
  const minLength = parseLength(values.get('admin.auth.password.min-length'), DEFAULT_PASSWORD_POLICY.minLength)
  const maxLength = Math.max(minLength, parseLength(values.get('admin.auth.password.max-length'), DEFAULT_PASSWORD_POLICY.maxLength))

  return {
    minLength,
    maxLength,
    requireUppercase: values.get('admin.auth.password.require-uppercase') === 'true',
    requireLowercase: values.get('admin.auth.password.require-lowercase') === 'true',
    requireDigit: values.get('admin.auth.password.require-digit') === 'true',
    requireSpecial: values.get('admin.auth.password.require-special') === 'true',
  }
}

/** 按当前密码策略校验输入值，并返回首个不符合项的提示。 */
export function validatePasswordPolicy(value: string, policy: PasswordPolicy): string | undefined {
  if (value.length < policy.minLength || value.length > policy.maxLength) {
    return `密码长度应在 ${policy.minLength} 到 ${policy.maxLength} 位之间`
  }
  if (policy.requireUppercase && !/[A-Z]/.test(value)) {
    return '密码必须包含大写字母'
  }
  if (policy.requireLowercase && !/[a-z]/.test(value)) {
    return '密码必须包含小写字母'
  }
  if (policy.requireDigit && !/\d/.test(value)) {
    return '密码必须包含数字'
  }
  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(value)) {
    return '密码必须包含特殊字符'
  }
  return undefined
}

/** 将长度参数解析为正整数；配置缺失或非法时使用默认值。 */
function parseLength(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}
