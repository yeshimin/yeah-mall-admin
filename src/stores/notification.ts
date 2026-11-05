import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getRecentMessages, getUnreadMessageCount, markMessagesRead } from '@/api/notification'
import type { NotifMessageVo } from '@/types/notification'
import { apiBaseUrl } from '@/utils/api-base-url'
import { getToken } from '@/utils/auth'

const RECONNECT_DELAY = 5000
const HEARTBEAT_INTERVAL = 20000
const SUMMARY_REFRESH_INTERVAL = 60000

function resolveWebSocketUrl(token: string) {
  const url = new URL(apiBaseUrl, window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  const basePath = url.pathname.replace(/\/$/, '')
  url.pathname = `${basePath}/ws/ns/default`.replace(/\/+/g, '/')
  url.search = ''
  url.searchParams.set('access_token', token)
  return url.toString()
}

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)
  const recentMessages = ref<NotifMessageVo[]>([])
  const summaryLoading = ref(false)
  const revision = ref(0)
  let socket: WebSocket | null = null
  let reconnectTimer: number | null = null
  let heartbeatTimer: number | null = null
  let summaryTimer: number | null = null
  let stopped = true
  let summarySequence = 0

  async function refreshSummary() {
    const sequence = ++summarySequence
    if (!getToken()) {
      unreadCount.value = 0
      recentMessages.value = []
      summaryLoading.value = false
      return
    }
    summaryLoading.value = true
    try {
      const [countResponse, recentResponse] = await Promise.all([
        getUnreadMessageCount(),
        getRecentMessages(),
      ])
      if (sequence !== summarySequence || stopped) {
        return
      }
      unreadCount.value = Number(countResponse.data || 0)
      recentMessages.value = recentResponse.data || []
      revision.value += 1
    } catch {
      // 布局层通知摘要失败不阻断页面使用，下一次打开面板或重连后继续刷新
    } finally {
      if (sequence === summarySequence) {
        summaryLoading.value = false
      }
    }
  }

  async function markRead(receiverId: number) {
    await markMessagesRead([receiverId])
    await refreshSummary()
  }

  function clearTimers() {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (heartbeatTimer !== null) {
      window.clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    if (summaryTimer !== null) {
      window.clearInterval(summaryTimer)
      summaryTimer = null
    }
  }

  function scheduleReconnect() {
    if (stopped || reconnectTimer !== null || !getToken()) {
      return
    }
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null
      connectWebSocket()
    }, RECONNECT_DELAY)
  }

  function startHeartbeat() {
    if (heartbeatTimer !== null) {
      window.clearInterval(heartbeatTimer)
    }
    heartbeatTimer = window.setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ category: 'heartbeat', command: 'ping' }))
      }
    }, HEARTBEAT_INTERVAL)
  }

  function connectWebSocket() {
    const token = getToken()
    if (stopped || !token || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) {
      return
    }
    const currentSocket = new WebSocket(resolveWebSocketUrl(token))
    socket = currentSocket
    currentSocket.onopen = () => {
      if (socket !== currentSocket || stopped) {
        currentSocket.close()
        return
      }
      startHeartbeat()
    }
    currentSocket.onmessage = (event) => {
      if (socket !== currentSocket || stopped) {
        return
      }
      try {
        const payload = JSON.parse(String(event.data)) as { type?: string }
        if (payload.type === 'notification.new') {
          void refreshSummary()
        }
      } catch {
        // 非 JSON 消息由具体业务处理器自行扩展
      }
    }
    currentSocket.onclose = () => {
      if (socket !== currentSocket) {
        return
      }
      if (heartbeatTimer !== null) {
        window.clearInterval(heartbeatTimer)
        heartbeatTimer = null
      }
      socket = null
      scheduleReconnect()
    }
    currentSocket.onerror = () => {
      currentSocket.close()
    }
  }

  async function start() {
    stopped = false
    await refreshSummary()
    if (stopped) {
      return
    }
    connectWebSocket()
    if (summaryTimer === null) {
      summaryTimer = window.setInterval(() => {
        void refreshSummary()
      }, SUMMARY_REFRESH_INTERVAL)
    }
  }

  function stop() {
    stopped = true
    summarySequence += 1
    clearTimers()
    socket?.close()
    socket = null
    unreadCount.value = 0
    recentMessages.value = []
    summaryLoading.value = false
  }

  return {
    unreadCount,
    recentMessages,
    summaryLoading,
    revision,
    refreshSummary,
    markRead,
    start,
    stop,
  }
})
