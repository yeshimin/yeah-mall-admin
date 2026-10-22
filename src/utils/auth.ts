const TOKEN_KEY = 'yeah-boot-admin-token'
const LOGIN_SUBJECT_KEY = 'yeah-boot-admin-login-subject'
const LOGIN_SUBJECT_PREFERENCE_KEY = 'yeah-boot-admin-login-subject-preference'

export type LoginSubject = 'admin' | 'merchant'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getLoginSubject(): LoginSubject {
  return localStorage.getItem(LOGIN_SUBJECT_KEY) === 'merchant' ? 'merchant' : 'admin'
}

export function setLoginSubject(subject: LoginSubject) {
  localStorage.setItem(LOGIN_SUBJECT_KEY, subject)
}

export function removeLoginSubject() {
  localStorage.removeItem(LOGIN_SUBJECT_KEY)
}

/**
 * 获取登录页上次选择的端类型，不与当前登录会话绑定。
 */
export function getLoginSubjectPreference(): LoginSubject {
  return localStorage.getItem(LOGIN_SUBJECT_PREFERENCE_KEY) === 'merchant' ? 'merchant' : 'admin'
}

/**
 * 保存登录页端类型偏好，刷新或退出登录后仍保留。
 */
export function setLoginSubjectPreference(subject: LoginSubject) {
  localStorage.setItem(LOGIN_SUBJECT_PREFERENCE_KEY, subject)
}
