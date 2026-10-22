import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types/api'
import { getToken } from './auth'
import { handleUnauthorized } from './session'
import { apiBaseUrl } from './api-base-url'
import { decryptApiResponse, encryptApiRequest, type ApiEncryptionRequestConfig } from './api-encryption'

type RequestConfig = ApiEncryptionRequestConfig & {
  skipAuth?: boolean
  suppressErrorMessage?: boolean
  idempotencyKey?: string
}

const service = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  paramsSerializer: {
    serialize: (params) => {
      const searchParams = new URLSearchParams()

      const appendValue = (key: string, value: unknown) => {
        if (value === undefined || value === null || value === '') {
          return
        }

        if (Array.isArray(value)) {
          value.forEach((item) => appendValue(key, item))
          return
        }

        searchParams.append(key, String(value))
      }

      Object.entries(params || {}).forEach(([key, value]) => {
        appendValue(key, value)
      })

      return searchParams.toString()
    },
  },
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

service.interceptors.request.use(async (config) => {
  const nextConfig = config
  const skipAuth = (nextConfig as RequestConfig).skipAuth
  const token = getToken()
  const headers = AxiosHeaders.from(nextConfig.headers || {})
  nextConfig.headers = headers

  // FormData 请求由浏览器自动生成 multipart boundary。
  if (nextConfig.data instanceof FormData) {
    headers.delete('Content-Type')
  }

  if (!skipAuth && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const idempotencyKey = (nextConfig as RequestConfig).idempotencyKey
  if (idempotencyKey) {
    // 同一表单提交意图复用此键，供后端阻止重复执行业务写操作。
    headers.set('Idempotency-Key', idempotencyKey)
  }

  // 协议启用后统一包装 JSON/查询参数；文件流和显式豁免请求保持原样。
  await encryptApiRequest(nextConfig as RequestConfig, headers)

  return nextConfig
})

service.interceptors.response.use(
  async (response) => {
    // 响应解密必须先于统一 R<T> 结构的业务处理。
    response.data = await decryptApiResponse(response.config as RequestConfig, response.data)
    return response
  },
  (error: AxiosError) => {
    const requestConfig = error.config as RequestConfig | undefined
    if (error.response?.status === 401 && !requestConfig?.skipAuth) {
      const responseData = error.response.data as Partial<ApiResponse<unknown>> | undefined
      const message = responseData?.message || '登录状态已失效，请重新登录'
      void handleUnauthorized(message)
      return Promise.reject(error)
    }

    let message = error.message || '请求失败'

    if (message.includes('Network Error')) {
      message = '后端接口连接异常'
    } else if (message.includes('timeout')) {
      message = '系统接口请求超时'
    } else if (error.response?.status) {
      message = `系统接口 ${error.response.status} 异常`
    }

    if (!requestConfig?.suppressErrorMessage) {
      ElMessage.error(message)
    }
    return Promise.reject(error)
  },
)

export function request<T>(config: RequestConfig) {
  return service.request<ApiResponse<T>>(config).then((response) => {
    const payload = response.data
    const code = payload?.code ?? 0
    const message = payload?.message || '请求失败'

    if (code === 0) {
      return payload
    }

    if (code === 401 && !config.skipAuth) {
      void handleUnauthorized(message || '登录状态已失效，请重新登录')
      return Promise.reject(new Error(message || 'Unauthorized'))
    }

    if (!config.suppressErrorMessage) {
      ElMessage.error(message)
    }
    return Promise.reject(new Error(message))
  })
}

// Compatibility export for migrated JavaScript business API modules.
export default request
