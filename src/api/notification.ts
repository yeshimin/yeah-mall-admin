import type { PageResponse } from '@/types/api'
import type {
  NotifMessageReceiverOption,
  NotifMessageSendRequest,
  NotifMessageVo,
} from '@/types/notification'
import { request } from '@/utils/request'

export function queryMyMessages(params: Record<string, unknown>) {
  return request<PageResponse<NotifMessageVo>>({
    url: '/admin/notifMessage/myPage',
    method: 'get',
    params,
  })
}

export function getRecentMessages(limit = 5) {
  return request<NotifMessageVo[]>({
    url: '/admin/notifMessage/recent',
    method: 'get',
    params: { limit },
  })
}

export function getUnreadMessageCount() {
  return request<number | string>({
    url: '/admin/notifMessage/unreadCount',
    method: 'get',
  })
}

export function getNotifMessageReceiverOptions(receiverSubject: 'admin' | 'app') {
  return request<NotifMessageReceiverOption[]>({
    url: '/admin/notifMessage/receiverOptions',
    method: 'get',
    params: { receiverSubject },
  })
}

export function markMessagesRead(ids: number[]) {
  return request<void>({
    url: '/admin/notifMessage/read',
    method: 'post',
    data: { ids },
  })
}

export function markAllMessagesRead() {
  return request<void>({
    url: '/admin/notifMessage/readAll',
    method: 'post',
  })
}

export function sendNotifMessage(data: NotifMessageSendRequest, options?: { idempotencyKey?: string }) {
  return request<void>({
    url: '/admin/notifMessage/send',
    method: 'post',
    data,
    idempotencyKey: options?.idempotencyKey,
  })
}
