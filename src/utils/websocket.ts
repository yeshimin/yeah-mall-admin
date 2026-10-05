import { getToken } from './auth'

type MessageHandler = (message: unknown) => void

class WebSocketService {
  private socket: WebSocket | null = null
  private handlers = new Set<MessageHandler>()

  init() {
    if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) return
    const token = getToken()
    if (!token) return
    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws'
    this.socket = new WebSocket(`${scheme}://${window.location.host}/ws/ns/default?token=${encodeURIComponent(token)}`)
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handlers.forEach((handler) => handler(message))
      } catch {
        // Ignore malformed WebSocket payloads.
      }
    }
  }

  send(message: unknown) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false
    this.socket.send(JSON.stringify(message))
    return true
  }

  onMessage(handler: MessageHandler) { this.handlers.add(handler) }
  offMessage(handler: MessageHandler) { this.handlers.delete(handler) }
  disconnect() { this.socket?.close(); this.socket = null; this.handlers.clear() }
}

export default new WebSocketService()
