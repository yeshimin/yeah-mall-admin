import type { AxiosHeaders, AxiosRequestConfig } from 'axios'
import { resolveApiUrl } from './api-base-url'

const MARKER_HEADER = 'Api-Encryption'
const MARKER_VALUE_V1 = 'v1'
const QUERY_PARAMETER = '__enc'
const DEFAULT_SUITE = 'sm2-sm4-gcm-v1'
const TEXT_ENCODER = new TextEncoder()
const TEXT_DECODER = new TextDecoder()

type ApiEncryptionInfo = {
  enabled: boolean
  required: boolean
  version: number
  suite: string
  keyId: string
  publicKey?: string
  timestampWindowSeconds: number
}

type Envelope = {
  v: number
  kid: string
  ts: number
  n: string
  p: string
  ek: string
  iv: string
  ct: string
  tag: string
}

type ResponseEnvelope = {
  v: number
  kid: string
  iv: string
  ct: string
  tag: string
}

export type ApiEncryptionRequestConfig = AxiosRequestConfig & {
  skipApiEncryption?: boolean
  __apiEncryptionContext?: {
    responseKey: Uint8Array
    responseAad: string
  }
}

let encryptionInfoPromise: Promise<ApiEncryptionInfo> | null = null
let cryptoModulePromise: Promise<typeof import('sm-crypto-v3')> | null = null
const DISABLED_ENCRYPTION: ApiEncryptionInfo = {
  enabled: false,
  required: false,
  version: 1,
  suite: '',
  keyId: '',
  timestampWindowSeconds: 0,
}

/**
 * 为普通 JSON 或查询参数请求创建一次性 SM2 + SM4-GCM Envelope。
 * 文件流、Blob 和初始化接口保留原始传输方式。
 */
export async function encryptApiRequest(config: ApiEncryptionRequestConfig, headers: AxiosHeaders) {
  if (config.skipApiEncryption || shouldSkip(config)) {
    return
  }

  const info = await getEncryptionInfo()
  if (!info.enabled) {
    return
  }
  if (!info.publicKey) {
    throw new Error('加密服务未返回公钥')
  }
  if (info.suite !== DEFAULT_SUITE) {
    throw new Error(`当前管理后台不支持加密套件：${info.suite}`)
  }
  const { hkdf, sm2, sm4 } = await getCryptoModule()

  const method = (config.method || 'get').toUpperCase()
  const path = resolveRequestPath(config.url)
  const nonce = randomBytes(16)
  const timestamp = Math.floor(Date.now() / 1000)
  const nonceValue = toBase64Url(nonce)
  const aadBase = `${info.version}|${info.keyId}|${timestamp}|${nonceValue}|${method}|${path}`
  const requestAad = `${aadBase}|request`
  const responseAad = `${aadBase}|response`
  const baseKey = randomBytes(16)
  const requestKey = hkdf(baseKey, nonce, 'api-encryption:v1:request', 16)
  const responseKey = hkdf(baseKey, nonce, 'api-encryption:v1:response', 16)
  const iv = randomBytes(12)

  const plaintext = method === 'GET' || method === 'HEAD'
    ? JSON.stringify(config.params || {})
    : JSON.stringify(config.data ?? {})
  if ((method !== 'GET' && method !== 'HEAD') && hasParams(config.params)) {
    throw new Error('加密请求不支持同时传递明文查询参数')
  }

  const encrypted = sm4.encrypt(TEXT_ENCODER.encode(plaintext), requestKey, {
    mode: 'gcm',
    iv,
    associatedData: TEXT_ENCODER.encode(requestAad),
    output: 'array',
    outputTag: true,
  })
  if (!isGcmResult(encrypted) || !encrypted.tag) {
    throw new Error('请求加密失败')
  }

  const envelope: Envelope = {
    v: info.version,
    kid: info.keyId,
    ts: timestamp,
    n: nonceValue,
    p: path,
    ek: toBase64Url(hexToBytes(sm2.doEncrypt(baseKey, info.publicKey, 1, { asn1: false }))),
    iv: toBase64Url(iv),
    ct: toBase64Url(encrypted.output),
    tag: toBase64Url(encrypted.tag),
  }

  if (method === 'GET' || method === 'HEAD') {
    config.params = { [QUERY_PARAMETER]: toBase64Url(TEXT_ENCODER.encode(JSON.stringify(envelope))) }
  } else {
    config.data = envelope
  }
  headers.set(MARKER_HEADER, MARKER_VALUE_V1)
  config.__apiEncryptionContext = { responseKey, responseAad }
}

/** 使用请求阶段保存的响应密钥解密加密 Envelope，非加密响应原样返回。 */
export async function decryptApiResponse(config: ApiEncryptionRequestConfig, payload: unknown) {
  const context = config.__apiEncryptionContext
  if (!context || !isResponseEnvelope(payload)) {
    return payload
  }
  const { sm4 } = await getCryptoModule()

  const plaintext = sm4.decrypt(fromBase64Url(payload.ct), context.responseKey, {
    mode: 'gcm',
    iv: fromBase64Url(payload.iv),
    associatedData: TEXT_ENCODER.encode(context.responseAad),
    tag: fromBase64Url(payload.tag),
    output: 'array',
  })
  return JSON.parse(TEXT_DECODER.decode(plaintext))
}

/** 判断当前请求是否属于无法或不应进入报文加密协议的场景。 */
function shouldSkip(config: ApiEncryptionRequestConfig) {
  if (config.data instanceof FormData || config.responseType === 'blob') {
    return true
  }
  return resolveRequestPath(config.url) === '/encryption/public-key'
}

/** 获取并缓存后端公开的加密协议元数据；404 表示旧后端不支持该能力。 */
async function getEncryptionInfo() {
  if (!encryptionInfoPromise) {
    encryptionInfoPromise = fetch(resolveApiUrl('/encryption/public-key'), {
      headers: { Accept: 'application/json' },
    }).then(async (response) => {
      // 允许先发布新前端，再逐步升级尚未提供该能力的后端。
      if (response.status === 404) {
        return DISABLED_ENCRYPTION
      }
      if (!response.ok) {
        throw new Error('读取加密配置失败')
      }
      const body = await response.json() as { code?: number; message?: string; data?: ApiEncryptionInfo }
      if (body.code !== 0 || !body.data) {
        throw new Error(body.message || '读取加密配置失败')
      }
      return body.data
    }).catch((error) => {
      encryptionInfoPromise = null
      throw error
    })
  }
  return encryptionInfoPromise
}

/** 按需加载国密实现，避免加密关闭时增加首屏运行成本。 */
function getCryptoModule() {
  if (!cryptoModulePromise) {
    cryptoModulePromise = import('sm-crypto-v3')
  }
  return cryptoModulePromise
}

/** 从 Axios URL 中提取会参与 AAD 校验的后端请求路径。 */
function resolveRequestPath(url?: string) {
  const value = url || ''
  if (/^https?:\/\//i.test(value)) {
    return new URL(value).pathname
  }
  const path = value.split('?')[0] || '/'
  return path.startsWith('/') ? path : `/${path}`
}

/** 判断请求是否仍携带未加密查询参数。 */
function hasParams(params: unknown) {
  return Boolean(params && Object.keys(params as Record<string, unknown>).length)
}

/** 使用浏览器 CSPRNG 生成协议要求的随机字节。 */
function randomBytes(length: number) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

/** 将二进制字段编码为可安全放入 JSON 和 URL 查询参数的 Base64URL。 */
function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** 解码协议 Envelope 中的 Base64URL 二进制字段。 */
function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

/**
 * 将前端 SM2 库返回的原始 C1C3C2 十六进制密文转为二进制。
 *
 * sm-crypto-v3 的非 ASN.1 输出固定省略 C1 的未压缩点前缀，因此必须无条件补充 04；
 * 不能按密文首字节猜测，否则随机 C1 坐标以 04 开头时会少传一个字节。
 */
function hexToBytes(value: string) {
  const normalized = `04${value}`
  if (!/^[0-9a-fA-F]+$/.test(normalized) || normalized.length % 2 !== 0) {
    throw new Error('SM2 加密结果无效')
  }
  const bytes = new Uint8Array(normalized.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(normalized.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

/** 判断 SM4-GCM 库是否返回了包含认证标签的加密结果。 */
function isGcmResult(value: unknown): value is { output: Uint8Array; tag?: Uint8Array } {
  return typeof value === 'object' && value !== null && 'output' in value
}

/** 判断响应是否符合加密响应 Envelope 的最小结构。 */
function isResponseEnvelope(value: unknown): value is ResponseEnvelope {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const envelope = value as Partial<ResponseEnvelope>
  return typeof envelope.v === 'number'
    && typeof envelope.kid === 'string'
    && typeof envelope.iv === 'string'
    && typeof envelope.ct === 'string'
    && typeof envelope.tag === 'string'
}
