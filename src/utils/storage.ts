import { resolveApiUrl } from './download'

export function getStoragePreviewUrl(fileKey?: string | null) {
  if (!fileKey) return ''
  if (/^https?:\/\//.test(fileKey)) return fileKey
  if (fileKey.startsWith('/')) return resolveApiUrl(fileKey)
  return resolveApiUrl(`/public/storage/preview?fileKey=${encodeURIComponent(fileKey)}`)
}
