export interface NotifMessageVo {
  receiverId: number
  messageId: number
  messageType: string
  targetType: string
  title: string
  content?: string
  bizType?: string
  bizId?: string
  linkUrl?: string
  senderName?: string
  sendTime: string
  readStatus: string
  readTime?: string
}

export interface NotifMessageSendRequest {
  receiverSubject: 'admin' | 'app'
  messageType: string
  targetType: string
  receiverUserIds?: number[]
  title: string
  content?: string
  bizType?: string
  bizId?: string
  linkUrl?: string
}

export interface NotifMessageReceiverOption {
  id: number
  name: string
}
