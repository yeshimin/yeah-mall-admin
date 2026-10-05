const TOKEN_KEY = 'yeah-boot-admin-token'
const LOGIN_SUBJECT_KEY = 'yeah-boot-admin-login-subject'

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
