import { getToken } from './auth'
import { apiBaseUrl } from './api-base-url'

type MessageHandler = (message: unknown) => void

class WebSocketService {
  private socket: WebSocket | null = null
  private handlers = new Set<MessageHandler>()
  private reconnectHandlers = new Set<() => void>()
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null
  private isConnecting = false
  private manuallyDisconnected = false
  private hasConnectedOnce = false

  private readonly heartbeatInterval = 30_000
  private readonly reconnectDelay = 5_000

  init() {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) return
    const token = getToken()
    if (!token) return

    this.manuallyDisconnected = false
    this.isConnecting = true
    // 与HTTP请求使用同一API基础地址；开发环境经/api代理，生产环境连接配置的后端域名。
    const socketUrl = new URL(apiBaseUrl, window.location.origin)
    socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    socketUrl.pathname = `${socketUrl.pathname.replace(/\/$/, '')}/ws/ns/default`
    socketUrl.search = ''
    socketUrl.searchParams.set('token', token)
    const socket = new WebSocket(socketUrl.toString())
    this.socket = socket

    socket.onopen = () => {
      // 连接成功后启动心跳，避免空闲连接被网关或浏览器回收。
      this.isConnecting = false
      this.startHeartbeat()
      if (this.hasConnectedOnce) {
        this.reconnectHandlers.forEach((handler) => handler())
      }
      this.hasConnectedOnce = true
    }

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handlers.forEach((handler) => handler(message))
      } catch {
        // Ignore malformed WebSocket payloads.
      }
    }

    socket.onclose = () => {
      if (this.socket !== socket) return
      this.socket = null
      this.isConnecting = false
      this.stopHeartbeat()
      this.scheduleReconnect()
    }

    socket.onerror = () => {
      // 统一交由 onclose 清理和重连，避免 error、close 重复创建连接。
      socket.close()
    }
  }

  send(message: unknown) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false
    this.socket.send(JSON.stringify(message))
    return true
  }

  onMessage(handler: MessageHandler) { this.handlers.add(handler) }
  offMessage(handler: MessageHandler) { this.handlers.delete(handler) }
  onReconnect(handler: () => void) { this.reconnectHandlers.add(handler) }
  offReconnect(handler: () => void) { this.reconnectHandlers.delete(handler) }

  disconnect() {
    this.manuallyDisconnected = true
    this.stopHeartbeat()
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.socket?.close()
    this.socket = null
    this.isConnecting = false
    this.hasConnectedOnce = false
    this.handlers.clear()
    this.reconnectHandlers.clear()
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = window.setInterval(() => {
      this.send({
        category: 'heartbeat',
        command: 'ping',
        payload: {},
      })
    }, this.heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private scheduleReconnect() {
    if (this.manuallyDisconnected || this.reconnectTimer !== null || !getToken()) return

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.init()
    }, this.reconnectDelay)
  }
}

export default new WebSocketService()
