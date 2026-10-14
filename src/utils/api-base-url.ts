export const apiBaseUrl = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080')

/** 将接口相对路径拼接为当前环境使用的完整 API 地址。 */
export function resolveApiUrl(path: string) {
  const normalizedBase = apiBaseUrl.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}
