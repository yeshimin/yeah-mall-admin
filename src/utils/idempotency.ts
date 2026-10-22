/** 为一次表单提交意图生成浏览器安全随机 UUID。 */
export function createIdempotencyKey() {
  if (typeof crypto?.randomUUID !== 'function') {
    throw new Error('当前浏览器不支持安全的请求幂等键生成')
  }
  return crypto.randomUUID()
}
