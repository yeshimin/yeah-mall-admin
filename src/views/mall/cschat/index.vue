<template>
  <div class="mall-page merchant-service-page">
    <section class="merchant-service-console">
      <aside>
        <label class="cs-search">
          <el-icon><Search /></el-icon>
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索用户昵称或消息内容"
            @input="handleKeywordInput"
          />
          <button v-if="keyword" class="cs-search-clear" type="button" aria-label="清空搜索" @click="clearKeyword">×</button>
        </label>

        <div
          ref="conversationListRef"
          v-loading="listLoading"
          class="cs-conversation-list"
          @scroll="handleConversationScroll"
        >
          <button
            v-for="item in conversationList"
            :key="item.id"
            type="button"
            :class="['cs-conversation-item', { active: isActive(item) }]"
            @click="selectConversation(item)"
          >
            <span class="cs-avatar">{{ initialOf(item.memberNickname, item.memberId) }}</span>
            <span class="cs-conversation-main">
              <b>{{ item.memberNickname || `用户 ${item.memberId}` }}</b>
              <small>{{ item.lastMessage || '暂无消息' }}</small>
            </span>
            <time>{{ formatListTime(item.lastMessageTime) }}</time>
          </button>
          <div v-if="!listLoading && !conversationList.length" class="cs-conversation-empty">
            <b>{{ keyword ? '没有匹配的会话' : '暂无客服会话' }}</b>
            <span>{{ keyword ? '换个昵称或消息关键词试试' : '买家发起咨询后会出现在这里' }}</span>
          </div>
        </div>

        <div class="cs-conversation-footer">
          <span>共 {{ conversationTotal }} 个会话</span>
          <b>{{ listLoading || listLoadingMore ? '加载中…' : conversationHasMore ? '滚动加载更多' : '已全部加载' }}</b>
        </div>
      </aside>

      <main>
        <header>
          <template v-if="activeConversation">
            <span class="cs-avatar">{{ initialOf(activeMemberName, activeConversation.memberId) }}</span>
            <div>
              <b>{{ activeMemberName }}</b>
              <span>会员 ID {{ activeConversation.memberId }} · {{ activeShopName }}</span>
            </div>
            <span class="cs-conversation-ref">
              会话 ID <CopyableText :value="activeConversation.id" label="会话ID" />
            </span>
          </template>
          <template v-else>
            <span class="cs-avatar is-muted">客</span>
            <div>
              <b>客服消息</b>
              <span>选择左侧会话开始回复</span>
            </div>
          </template>
        </header>

        <div ref="chatRef" class="cs-chat" @scroll="handleMessageScroll">
          <template v-if="activeConversation">
            <div v-if="historyLoading" class="cs-chat-hint is-loading">加载更早消息…</div>
            <div v-else-if="messagePagination.hasMore && chatMessages.length" class="cs-chat-hint">向上滚动加载更早消息</div>
            <div v-else-if="chatMessages.length" class="cs-chat-hint is-boundary">没有更早消息</div>

            <article
              v-for="message in chatMessages"
              :key="message.id"
              :class="['cs-message', message.type]"
            >
              <span class="cs-avatar is-small">{{ message.type === 'send' ? shopInitial : memberInitial }}</span>
              <div class="cs-message-body">
                <small>
                  {{ message.type === 'send' ? activeShopName : activeMemberName }} · {{ formatMessageTime(message.createTime) }}
                </small>
                <div :class="['cs-bubble', `type-${message.type === 'send' ? 'me' : 'them'}`, `kind-${message.msgType}`]">
                  <template v-if="message.msgType === 2">
                    <el-image
                      v-if="message.attachment?.url"
                      :src="message.attachment.url"
                      fit="cover"
                      :preview-src-list="[message.attachment.url]"
                      preview-teleported
                      class="cs-message-image"
                    >
                      <template #error>
                        <span class="cs-media-placeholder"><el-icon><PictureFilled /></el-icon></span>
                      </template>
                    </el-image>
                    <span v-else class="cs-media-placeholder"><el-icon><PictureFilled /></el-icon></span>
                  </template>
                  <a
                    v-else-if="message.msgType === 3 || message.msgType === 4"
                    class="cs-message-file"
                    :href="message.attachment?.url || 'javascript:void(0)'"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span class="cs-file-icon">
                      <el-icon><VideoPlay v-if="message.msgType === 3" /><Document v-else /></el-icon>
                    </span>
                    <span>
                      <b>{{ message.attachment?.fileName || (message.msgType === 3 ? '视频文件' : '附件文件') }}</b>
                      <small>{{ message.attachment?.fileSize ? formatFileSize(message.attachment.fileSize) : (message.msgType === 3 ? '视频' : '附件文件') }}</small>
                    </span>
                  </a>
                  <template v-else>{{ message.content }}</template>
                </div>
              </div>
            </article>

            <div v-if="!chatMessages.length && !messagesLoading" class="cs-chat-empty">
              <b>还没有消息</b>
              <span>在下方输入内容，向买家发送第一条回复</span>
            </div>
            <div v-if="messagesLoading" class="cs-chat-loading">加载消息…</div>
          </template>
          <div v-else class="cs-chat-empty">
            <b>选择会话</b>
            <span>从左侧选择一条会话查看聊天记录</span>
          </div>
        </div>

        <footer class="cs-input-bar">
          <div class="cs-attachment-wrap">
            <button
              type="button"
              class="cs-attachment-button"
              aria-label="选择附件"
              :disabled="!!pendingAttachment?.file || sending"
              @click="attachmentOpen = !attachmentOpen"
            >
              <el-icon><Plus /></el-icon>
            </button>
            <div v-if="attachmentOpen" class="cs-attachment-menu">
              <button type="button" @click="chooseAttachment('image')"><el-icon><PictureFilled /></el-icon>图片</button>
              <button type="button" @click="chooseAttachment('video')"><el-icon><VideoPlay /></el-icon>视频</button>
              <button type="button" @click="chooseAttachment('file')"><el-icon><Document /></el-icon>文件</button>
            </div>
          </div>
          <input
            ref="attachmentInputRef"
            class="cs-file-input"
            type="file"
            :accept="attachmentAccept"
            @change="handleAttachmentChange"
            @cancel="handleAttachmentCancel"
          />

          <div class="cs-input-stack">
            <div v-if="pendingAttachment?.file" class="cs-attachment-preview">
              <span :class="['cs-attachment-art', { 'is-image': pendingAttachment.kind === 'image' }]">
                <img v-if="pendingAttachment.kind === 'image' && attachmentPreviewUrl" :src="attachmentPreviewUrl" alt="" />
                <el-icon v-else-if="pendingAttachment.kind === 'video'"><VideoPlay /></el-icon>
                <el-icon v-else><Document /></el-icon>
              </span>
              <span>
                <b>{{ pendingAttachment.file?.name }}</b>
                <small>{{ formatFileSize(pendingAttachment.file?.size) }}</small>
              </span>
              <button type="button" aria-label="移除附件" @click="clearAttachment">×</button>
            </div>
            <div class="cs-input-line">
              <input
                v-model="messageInput"
                :disabled="!!pendingAttachment?.file"
                maxlength="255"
                :placeholder="pendingAttachment?.file ? '附件待发送' : '输入回复内容'"
                @keydown.enter.prevent="handleSendMessage"
              />
              <small>{{ messageInput.length }}/255</small>
            </div>
          </div>

          <button type="button" class="cs-send-button" :disabled="sending" @click="handleSendMessage">发送</button>
        </footer>
      </main>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElIcon, ElMessage } from 'element-plus'
import { Document, PictureFilled, Plus, Search, VideoPlay } from '@element-plus/icons-vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import wsService from '@/utils/websocket'
import { getCurrentShop } from '@/utils/shop'
import { initConversation, queryConversationList, queryConversationMessages, sendMessage, uploadCsMessageFile } from '@/api/mall/cschat'
import { resolveApiUrl } from '@/utils/download'
import '@/assets/yeah-mall-service.css'

const CONVERSATION_PAGE_SIZE = 10
const MESSAGE_PAGE_SIZE = 6

const keyword = ref('')
const conversationList = ref([])
const conversationTotal = ref(0)
const conversationPage = ref(1)
const conversationHasMore = ref(false)
const listLoading = ref(false)
const listLoadingMore = ref(false)
const conversationListRef = ref(null)
const activeConversation = ref(null)
const conversationDetail = ref({})
const chatMessages = ref([])
const messagesLoading = ref(false)
const historyLoading = ref(false)
const messagePagination = reactive({
  current: 1,
  pageSize: MESSAGE_PAGE_SIZE,
  total: 0,
  hasMore: false,
})
const messageInput = ref('')
const sending = ref(false)
const chatRef = ref(null)
const attachmentInputRef = ref(null)
const attachmentOpen = ref(false)
const attachmentAccept = ref('image/*')
const attachmentKind = ref('image')
const pendingAttachment = ref(null)
const attachmentPreviewUrl = ref('')
const currentShopName = ref(getCurrentShop()?.name || '')

const activeMemberName = computed(() => {
  const row = activeConversation.value
  return conversationDetail.value.memberNickname || row?.memberNickname || (row ? `用户 ${row.memberId}` : '')
})
const activeShopName = computed(() => conversationDetail.value.shopName || currentShopName.value || '当前店铺')
const memberInitial = computed(() => initialOf(activeMemberName.value, '买'))
const shopInitial = computed(() => initialOf(activeShopName.value, '店'))

let keywordTimer = null
let messageRequestToken = 0
let listRequestToken = 0

const initialOf = (name, fallback) => {
  const value = String(name || fallback || '').trim()
  return value ? Array.from(value)[0] : '客'
}

const pad = (value) => String(value).padStart(2, '0')

const parseTime = (value) => {
  if (!value) return null
  if (value instanceof Date) return value
  const raw = String(value)
  const date = new Date(/^\d{4}-\d{2}-\d{2} \d/.test(raw) ? raw.replace(/-/g, '/') : raw)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatListTime = (value) => {
  const date = parseTime(value)
  if (!date) return ''
  const now = new Date()
  if (now.getTime() - date.getTime() >= 0 && now.getTime() - date.getTime() < 60000) return '刚刚'
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayDiff = Math.round((today.getTime() - target.getTime()) / 86400000)
  if (dayDiff === 0) return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  if (dayDiff === 1) return '昨天'
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`
}

const formatMessageTime = (value) => {
  const date = parseTime(value)
  if (!date) return ''
  const now = new Date()
  if (now.getTime() - date.getTime() >= 0 && now.getTime() - date.getTime() < 60000) return '刚刚'
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayDiff = Math.round((today.getTime() - target.getTime()) / 86400000)
  const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  if (dayDiff === 0) return clock
  if (dayDiff === 1) return `昨天 ${clock}`
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${clock}`
}

const nowStamp = () => {
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const getFullImageUrl = (fileKey) => {
  if (!fileKey) return ''
  if (/^https?:\/\//.test(fileKey)) return fileKey
  return resolveApiUrl(`/public/storage/preview?fileKey=${encodeURIComponent(fileKey)}`)
}

const formatFileSize = (size) => {
  const bytes = Number(size || 0)
  if (!bytes) return '附件文件'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const parseAttachment = (content, msgType) => {
  if (Number(msgType) === 2) {
    return { fileKey: content, url: getFullImageUrl(content) }
  }
  if (![3, 4].includes(Number(msgType))) return null
  try {
    const metadata = JSON.parse(content || '{}')
    return { ...metadata, url: getFullImageUrl(metadata.fileKey) }
  } catch {
    return { fileKey: content, url: getFullImageUrl(content) }
  }
}

const isActive = (row) => !!activeConversation.value && String(activeConversation.value.id) === String(row.id)

const scrollToBottom = () => {
  nextTick(() => {
    if (chatRef.value) chatRef.value.scrollTop = chatRef.value.scrollHeight
  })
}

const maybeLoadMoreConversations = () => {
  if (!conversationHasMore.value || listLoading.value || listLoadingMore.value) return
  const el = conversationListRef.value
  if (!el || el.scrollHeight > el.clientHeight + 1) return
  loadConversations({ append: true })
}

const loadConversations = async ({ append = false } = {}) => {
  const token = ++listRequestToken
  const targetPage = append ? conversationPage.value + 1 : 1
  if (append) {
    listLoadingMore.value = true
  } else {
    listLoading.value = true
    listLoadingMore.value = false
  }
  try {
    const response = await queryConversationList({
      current: targetPage,
      size: CONVERSATION_PAGE_SIZE,
      keyword: keyword.value.trim(),
    })
    if (token !== listRequestToken) return
    if (response.code === 0 && response.data) {
      const records = response.data.records || []
      if (append) {
        const seen = new Set(conversationList.value.map((item) => String(item.id)))
        conversationList.value = [
          ...conversationList.value,
          ...records.filter((item) => !seen.has(String(item.id))),
        ]
      } else {
        conversationList.value = records
        if (conversationListRef.value) conversationListRef.value.scrollTop = 0
      }
      conversationPage.value = targetPage
      conversationTotal.value = Number(response.data.total) || 0
      conversationHasMore.value = !!records.length && conversationList.value.length < conversationTotal.value
    } else if (!append) {
      conversationList.value = []
      conversationTotal.value = 0
      conversationHasMore.value = false
    }

    if (activeConversation.value) {
      const latest = conversationList.value.find((item) => String(item.id) === String(activeConversation.value.id))
      if (latest) activeConversation.value = latest
    } else if (conversationList.value.length) {
      selectConversation(conversationList.value[0])
    }

    nextTick(maybeLoadMoreConversations)
  } catch (error) {
    if (token !== listRequestToken) return
    console.error('获取客服会话失败:', error)
    ElMessage.error(append ? '加载更多会话失败' : '获取客服会话失败')
    if (!append) {
      conversationList.value = []
      conversationTotal.value = 0
      conversationHasMore.value = false
    }
  } finally {
    if (token === listRequestToken) {
      if (append) listLoadingMore.value = false
      else listLoading.value = false
    }
  }
}

const loadConversationDetail = async (conversationId) => {
  try {
    const response = await initConversation({ id: conversationId })
    if (response.code === 0 && response.data) {
      conversationDetail.value = response.data
      if (response.data.shopName) currentShopName.value = response.data.shopName
    }
  } catch (error) {
    console.error('获取客服会话详情失败:', error)
  }
}

const loadMessages = async (conversationId, loadOlder = false) => {
  const token = ++messageRequestToken
  if (loadOlder) historyLoading.value = true
  else messagesLoading.value = true
  const previousHeight = loadOlder && chatRef.value ? chatRef.value.scrollHeight : 0

  try {
    const response = await queryConversationMessages({
      conversationId,
      current: loadOlder ? messagePagination.current + 1 : 1,
      size: MESSAGE_PAGE_SIZE,
    })
    if (token !== messageRequestToken) return

    if (response.code === 0 && response.data) {
      const pageRecords = (response.data.records || []).map((msg) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        content: msg.msgContent,
        type: Number(msg.msgDirection) === 1 ? 'receive' : 'send',
        msgType: Number(msg.msgType) || 1,
        attachment: parseAttachment(msg.msgContent, msg.msgType),
        createTime: msg.createTime,
      }))
      const ascending = pageRecords.reverse()

      if (loadOlder) {
        chatMessages.value = [...ascending, ...chatMessages.value]
        messagePagination.current += 1
      } else {
        chatMessages.value = ascending
        messagePagination.current = 1
      }

      messagePagination.total = Number(response.data.total) || 0
      messagePagination.hasMore = chatMessages.value.length < messagePagination.total

      if (loadOlder) {
        await nextTick()
        if (chatRef.value) chatRef.value.scrollTop = chatRef.value.scrollHeight - previousHeight
      } else {
        scrollToBottom()
      }
    } else if (!loadOlder) {
      chatMessages.value = []
      messagePagination.total = 0
      messagePagination.hasMore = false
    }
  } catch (error) {
    if (token !== messageRequestToken) return
    console.error('获取客服消息失败:', error)
    if (!loadOlder) {
      ElMessage.error('获取客服消息失败')
      chatMessages.value = []
    }
  } finally {
    if (token === messageRequestToken) {
      historyLoading.value = false
      messagesLoading.value = false
    }
  }
}

const selectConversation = (row) => {
  if (isActive(row)) return
  activeConversation.value = row
  conversationDetail.value = {}
  chatMessages.value = []
  messagePagination.current = 1
  messagePagination.total = 0
  messagePagination.hasMore = false
  messageInput.value = ''
  attachmentOpen.value = false
  clearAttachment()
  nextTick(scrollToBottom)
  loadConversationDetail(row.id)
  loadMessages(row.id, false)
}

const handleConversationScroll = () => {
  if (!conversationHasMore.value || listLoading.value || listLoadingMore.value) return
  const el = conversationListRef.value
  if (!el) return
  if (el.scrollHeight - el.scrollTop - el.clientHeight > 48) return
  loadConversations({ append: true })
}

const handleKeywordInput = () => {
  if (keywordTimer) window.clearTimeout(keywordTimer)
  keywordTimer = window.setTimeout(() => {
    conversationPage.value = 1
    loadConversations()
  }, 300)
}

const clearKeyword = () => {
  if (keywordTimer) window.clearTimeout(keywordTimer)
  keyword.value = ''
  conversationPage.value = 1
  loadConversations()
}

const handleMessageScroll = (event) => {
  if (!activeConversation.value || messagePagination.hasMore === false) return
  if (messagesLoading.value || historyLoading.value) return
  if (event.target.scrollTop > 4) return
  loadMessages(activeConversation.value.id, true)
}

const summaryText = (content, msgType) => {
  if (msgType === 2) return '[图片]'
  if (msgType === 3) return '[视频]'
  if (msgType === 4) return '[文件]'
  return content
}

const updateConversationSummary = (conversationId, content, msgType, messageTime) => {
  if (keyword.value.trim()) {
    loadConversations()
    return
  }

  const index = conversationList.value.findIndex((item) => String(item.id) === String(conversationId))
  if (index < 0) {
    loadConversations()
    return
  }

  const updated = {
    ...conversationList.value[index],
    lastMessage: summaryText(content, msgType),
    lastMessageTime: messageTime,
  }
  conversationList.value.splice(index, 1)
  conversationList.value.unshift(updated)
  if (isActive(updated)) activeConversation.value = updated
}

const handleSendMessage = async () => {
  if (sending.value || !activeConversation.value) return
  if (!messageInput.value.trim() && !pendingAttachment.value?.file) return

  sending.value = true
  try {
    if (pendingAttachment.value?.file) {
      await sendAttachmentMessage()
    } else {
      await sendTextMessage()
    }
  } catch (error) {
    console.error('发送客服消息失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '发送消息失败')
  } finally {
    sending.value = false
  }
}

const sendTextMessage = async () => {
  const conversationId = activeConversation.value.id
  const content = messageInput.value.trim()
  await sendMessage({
    category: 'biz-handle',
    command: 'cs-chat.mch',
    subCmd: 'msg.mch2mem',
    payload: {
      conversationId,
      content,
      type: 1,
    },
  })

  const createTime = nowStamp()
  chatMessages.value.push({
    id: `local-${Date.now()}`,
    conversationId,
    content,
    type: 'send',
    msgType: 1,
    attachment: null,
    createTime,
  })
  updateConversationSummary(conversationId, content, 1, createTime)
  messagePagination.total += 1
  messagePagination.hasMore = chatMessages.value.length < messagePagination.total
  if (messageInput.value.trim() === content) messageInput.value = ''
  scrollToBottom()
  ElMessage.success('消息已发送')
}

const sendAttachmentMessage = async () => {
  const conversationId = activeConversation.value.id
  const attachment = pendingAttachment.value
  const result = await uploadCsMessageFile(attachment.file)

  if (result.code !== 0 || !result.data?.fileKey) {
    throw new Error('附件上传失败')
  }

  const fileKey = result.data.fileKey
  const msgType = attachment.kind === 'image' ? 2 : attachment.kind === 'video' ? 3 : 4
  const content = msgType === 2
    ? fileKey
    : JSON.stringify({
        fileKey,
        fileName: attachment.file.name.slice(0, 72),
        fileSize: attachment.file.size || 0,
      })

  await sendMessage({
    category: 'biz-handle',
    command: 'cs-chat.mch',
    subCmd: 'msg.mch2mem',
    payload: {
      conversationId,
      content,
      type: msgType,
    },
  })

  const createTime = nowStamp()
  chatMessages.value.push({
    id: `local-${Date.now()}`,
    conversationId,
    content,
    type: 'send',
    msgType,
    attachment: parseAttachment(content, msgType),
    createTime,
  })
  updateConversationSummary(conversationId, content, msgType, createTime)
  messagePagination.total += 1
  messagePagination.hasMore = chatMessages.value.length < messagePagination.total
  const label = attachment.kind === 'image' ? '图片' : attachment.kind === 'video' ? '视频' : '文件'
  clearAttachment()
  scrollToBottom()
  ElMessage.success(`${label}已发送`)
}

const chooseAttachment = (kind) => {
  attachmentKind.value = kind
  attachmentAccept.value = kind === 'image' ? 'image/*' : kind === 'video' ? 'video/*' : '*/*'
  attachmentOpen.value = false
  if (attachmentInputRef.value) attachmentInputRef.value.value = ''
  nextTick(() => attachmentInputRef.value?.click())
}

const handleAttachmentChange = (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  // 只有真正选中文件才创建待发送附件；取消选择时保持无占位。
  if (!file) return
  if (attachmentPreviewUrl.value) URL.revokeObjectURL(attachmentPreviewUrl.value)
  pendingAttachment.value = { kind: attachmentKind.value, file }
  attachmentPreviewUrl.value = attachmentKind.value === 'image' ? URL.createObjectURL(file) : ''
  messageInput.value = ''
}

const handleAttachmentCancel = () => {
  if (attachmentInputRef.value) attachmentInputRef.value.value = ''
}

const clearAttachment = () => {
  if (attachmentPreviewUrl.value) URL.revokeObjectURL(attachmentPreviewUrl.value)
  attachmentPreviewUrl.value = ''
  pendingAttachment.value = null
}

const handleWebSocketMessage = (message) => {
  if (message.category !== 'biz-handle' || message.command !== 'cs-chat.mem' || message.subCmd !== 'msg.mem2mch') return
  const payload = message.payload
  if (!payload) return

  const receiveTime = payload.createTime || nowStamp()
  updateConversationSummary(payload.conversationId, payload.content, Number(payload.type) || 1, receiveTime)

  if (activeConversation.value && String(payload.conversationId) === String(activeConversation.value.id)) {
    if (payload.messageId && chatMessages.value.some((item) => String(item.id) === String(payload.messageId))) return
    chatMessages.value.push({
      id: payload.messageId || `ws-${Date.now()}`,
      conversationId: payload.conversationId,
      content: payload.content,
      type: 'receive',
      msgType: Number(payload.type) || 1,
      attachment: parseAttachment(payload.content, payload.type),
      createTime: receiveTime,
    })
    messagePagination.total += 1
    scrollToBottom()
  }
  ElMessage.info('收到买家新消息')
}

const handleWebSocketReconnect = () => {
  loadConversations()
  if (activeConversation.value) loadMessages(activeConversation.value.id, false)
}

onMounted(() => {
  loadConversations()
  wsService.onMessage(handleWebSocketMessage)
  wsService.onReconnect(handleWebSocketReconnect)
})

onBeforeUnmount(() => {
  if (keywordTimer) window.clearTimeout(keywordTimer)
  messageRequestToken += 1
  listRequestToken += 1
  if (attachmentPreviewUrl.value) URL.revokeObjectURL(attachmentPreviewUrl.value)
  wsService.offMessage(handleWebSocketMessage)
  wsService.offReconnect(handleWebSocketReconnect)
})
</script>