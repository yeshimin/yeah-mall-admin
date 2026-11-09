<template>
  <div class="notification-center">
    <section class="message-board">
      <div class="message-actions">
        <el-button v-if="canSend" type="primary" @click="openSendDialog">发送消息</el-button>
        <el-button :disabled="unreadCount === 0" @click="handleReadAll">全部已读</el-button>
        <el-tag effect="light">{{ unreadCount }} 条未读</el-tag>
      </div>
      <div class="filter-bar">
        <el-segmented v-model="searchForm.readStatus" :options="readStatusOptions" @change="handleSearch" />
        <el-select v-model="searchForm.messageType" placeholder="消息类型" clearable @change="handleSearch">
          <el-option label="系统消息" value="1" />
          <el-option label="业务消息" value="2" />
          <el-option label="通告" value="3" />
        </el-select>
        <el-input
          v-model="searchForm.title"
          class="title-search"
          placeholder="搜索标题"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
      </div>

      <div v-loading="loading" class="message-list">
        <button
          v-for="item in messages"
          :key="item.receiverId"
          type="button"
          class="message-item"
          :class="{ unread: item.readStatus === '0' }"
          @click="openMessage(item)"
        >
          <span class="message-state"></span>
          <span class="message-main">
            <span class="message-heading">
              <strong>{{ item.title }}</strong>
              <el-tag size="small" effect="plain">{{ messageTypeLabel(item.messageType) }}</el-tag>
            </span>
            <span class="message-preview">{{ item.content || '' }}</span>
            <span class="message-meta">
              {{ item.senderName || '系统' }} · {{ item.sendTime || '-' }}
            </span>
          </span>
          <span class="message-status">{{ item.readStatus === '0' ? '未读' : '已读' }}</span>
        </button>
        <el-empty v-if="!loading && messages.length === 0" description="暂无消息" />
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="pagination.total"
          @size-change="loadMessages"
          @current-change="loadMessages"
        />
      </div>
    </section>

    <el-drawer v-model="detailVisible" title="消息详情" size="520px">
      <article v-if="currentMessage" class="message-detail">
        <el-tag effect="plain">{{ messageTypeLabel(currentMessage.messageType) }}</el-tag>
        <h2>{{ currentMessage.title }}</h2>
        <p class="detail-meta">
          {{ currentMessage.senderName || '系统' }} · {{ currentMessage.sendTime || '-' }}
        </p>
        <div class="detail-content">{{ currentMessage.content || '' }}</div>
        <el-button
          v-if="currentMessage.linkUrl"
          type="primary"
          @click="openMessageLink(currentMessage.linkUrl)"
        >
          查看相关内容
        </el-button>
      </article>
    </el-drawer>

    <el-dialog
      v-model="sendDialogVisible"
      title="发送站内信"
      width="620px"
      :close-on-click-modal="!sending"
      :close-on-press-escape="!sending"
      :show-close="!sending"
      @closed="resetSendForm"
    >
      <el-form ref="sendFormRef" :model="sendForm" :rules="sendRules" label-width="100px">
        <el-form-item label="接收端" prop="receiverSubject">
          <el-radio-group v-model="sendForm.receiverSubject" @change="handleReceiverSubjectChange">
            <el-radio value="admin">管理端用户</el-radio>
            <el-radio value="app">App 用户</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="消息类型" prop="messageType">
          <el-select v-model="sendForm.messageType">
            <el-option label="系统消息" value="1" />
            <el-option label="业务消息" value="2" />
            <el-option label="通告" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="接收范围" prop="targetType">
          <el-radio-group v-model="sendForm.targetType" @change="handleTargetTypeChange">
            <el-radio value="1">指定用户</el-radio>
            <el-radio value="2">全部用户</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="sendForm.targetType === '1'" label="接收用户" prop="receiverUserIds">
          <el-select
            v-model="sendForm.receiverUserIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择用户"
            :loading="receiverOptionsLoading"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="sendForm.title" maxlength="128" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="sendForm.content" type="textarea" :rows="6" maxlength="10000" show-word-limit />
        </el-form-item>
        <el-form-item label="跳转地址" prop="linkUrl">
          <el-input v-model="sendForm.linkUrl" maxlength="255" placeholder="可选，例如 /system/user" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="sending" @click="sendDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="sending" @click="handleSend">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getNotifMessageReceiverOptions,
  markAllMessagesRead,
  markMessagesRead,
  queryMyMessages,
  sendNotifMessage,
} from '@/api/notification'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import type {
  NotifMessageReceiverOption,
  NotifMessageSendRequest,
  NotifMessageVo,
} from '@/types/notification'
import { createIdempotencyKey } from '@/utils/idempotency'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const canSend = computed(() => authStore.hasPermission('api:admin:notifMessage:send'))
const unreadCount = computed(() => notificationStore.unreadCount)

const readStatusOptions = [
  { label: '全部', value: '' },
  { label: '未读', value: '0' },
  { label: '已读', value: '1' },
]
const searchForm = reactive({ readStatus: '', messageType: '', title: '' })
const pagination = reactive({ currentPage: 1, pageSize: 10, total: 0 })
const loading = ref(false)
const messages = ref<NotifMessageVo[]>([])
const detailVisible = ref(false)
const currentMessage = ref<NotifMessageVo | null>(null)
let loadSequence = 0

const sendDialogVisible = ref(false)
const sending = ref(false)
const sendFormRef = ref<FormInstance>()
const userOptions = ref<NotifMessageReceiverOption[]>([])
const receiverOptionsLoading = ref(false)
let receiverOptionsSequence = 0
let sendSubmission: { fingerprint: string; key: string } | null = null
const sendForm = reactive<NotifMessageSendRequest>({
  receiverSubject: 'admin',
  messageType: '1',
  targetType: '1',
  receiverUserIds: [],
  title: '',
  content: '',
  linkUrl: '',
})
const sendRules = reactive<FormRules>({
  receiverSubject: [{ required: true, message: '请选择接收端', trigger: 'change' }],
  messageType: [{ required: true, message: '请选择消息类型', trigger: 'change' }],
  targetType: [{ required: true, message: '请选择接收范围', trigger: 'change' }],
  receiverUserIds: [{
    validator: (_rule, value: number[], callback) => {
      if (sendForm.targetType === '1' && (!value || value.length === 0)) {
        callback(new Error('请选择接收用户'))
        return
      }
      callback()
    },
    trigger: 'change',
  }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
})

function messageTypeLabel(type: string) {
  return ({ '1': '系统消息', '2': '业务消息', '3': '通告' } as Record<string, string>)[type] || '消息'
}

async function loadMessages() {
  const sequence = ++loadSequence
  loading.value = true
  try {
    const response = await queryMyMessages({
      current: pagination.currentPage,
      size: pagination.pageSize,
      readStatus: searchForm.readStatus || undefined,
      messageType: searchForm.messageType || undefined,
      title: searchForm.title || undefined,
    })
    if (sequence !== loadSequence) {
      return
    }
    messages.value = response.data.records || []
    pagination.total = Number(response.data.total || 0)
  } finally {
    if (sequence === loadSequence) {
      loading.value = false
    }
  }
}

function handleSearch() {
  pagination.currentPage = 1
  void loadMessages()
}

async function openMessage(item: NotifMessageVo) {
  currentMessage.value = item
  detailVisible.value = true
  if (item.readStatus === '0') {
    await markMessagesRead([item.receiverId])
    item.readStatus = '1'
    await Promise.all([loadMessages(), notificationStore.refreshSummary()])
  }
}

async function openRouteMessage(receiverIdValue: unknown, reloadMessages: boolean) {
  const receiverId = Array.isArray(receiverIdValue) ? receiverIdValue[0] : receiverIdValue
  if (typeof receiverId !== 'string' || !/^\d+$/.test(receiverId)) {
    return
  }
  if (reloadMessages) {
    searchForm.readStatus = ''
    searchForm.messageType = ''
    searchForm.title = ''
    pagination.currentPage = 1
    await loadMessages()
  }
  const message = messages.value.find((item) => String(item.receiverId) === receiverId)
  if (message) {
    await openMessage(message)
  }
  const { receiverId: _receiverId, ...query } = route.query
  await router.replace({ path: route.path, query })
}

async function handleReadAll() {
  await markAllMessagesRead()
  ElMessage.success('已全部标记为已读')
  await Promise.all([loadMessages(), notificationStore.refreshSummary()])
}

async function openMessageLink(link: string) {
  if (/^https?:\/\//i.test(link)) {
    window.open(link, '_blank', 'noopener,noreferrer')
    return
  }
  await router.push(link)
}

async function openSendDialog() {
  sendDialogVisible.value = true
  if (sendForm.targetType === '1' && userOptions.value.length === 0) {
    await loadReceiverOptions()
  }
}

async function loadReceiverOptions() {
  const sequence = ++receiverOptionsSequence
  const receiverSubject = sendForm.receiverSubject
  receiverOptionsLoading.value = true
  try {
    const response = await getNotifMessageReceiverOptions(receiverSubject)
    if (sequence === receiverOptionsSequence && receiverSubject === sendForm.receiverSubject) {
      userOptions.value = response.data || []
    }
  } finally {
    if (sequence === receiverOptionsSequence) {
      receiverOptionsLoading.value = false
    }
  }
}

async function handleReceiverSubjectChange() {
  receiverOptionsSequence += 1
  sendForm.receiverUserIds = []
  userOptions.value = []
  if (sendForm.targetType === '1') {
    await loadReceiverOptions()
  }
}

async function handleTargetTypeChange() {
  sendForm.receiverUserIds = []
  if (sendForm.targetType === '1' && userOptions.value.length === 0) {
    await loadReceiverOptions()
  }
}

async function handleSend() {
  if (!sendFormRef.value || sending.value) {
    return
  }
  await sendFormRef.value.validate()
  if (sendForm.targetType === '2') {
    try {
      await ElMessageBox.confirm(
        '确认向当前全部启用的管理端用户发送这条站内信吗？',
        '全局发送确认',
        { type: 'warning', confirmButtonText: '确认发送', cancelButtonText: '取消' },
      )
    } catch {
      return
    }
  }
  sending.value = true
  try {
    const payload = {
      ...sendForm,
      receiverUserIds: sendForm.targetType === '1' ? sendForm.receiverUserIds : undefined,
    }
    const fingerprint = JSON.stringify(payload)
    if (!sendSubmission || sendSubmission.fingerprint !== fingerprint) {
      sendSubmission = { fingerprint, key: createIdempotencyKey() }
    }
    await sendNotifMessage(payload, { idempotencyKey: sendSubmission.key })
    ElMessage.success('站内信发送成功')
    sendDialogVisible.value = false
    await Promise.all([loadMessages(), notificationStore.refreshSummary()])
  } finally {
    sending.value = false
  }
}

function resetSendForm() {
  receiverOptionsSequence += 1
  receiverOptionsLoading.value = false
  sendForm.receiverSubject = 'admin'
  sendForm.messageType = '1'
  sendForm.targetType = '1'
  sendForm.receiverUserIds = []
  sendForm.title = ''
  sendForm.content = ''
  sendForm.linkUrl = ''
  userOptions.value = []
  sendSubmission = null
  sendFormRef.value?.clearValidate()
}

onMounted(async () => {
  await Promise.all([loadMessages(), notificationStore.refreshSummary()])
  await openRouteMessage(route.query.receiverId, false)
})

watch(() => notificationStore.revision, () => {
  void loadMessages()
})

watch(() => route.query.receiverId, (receiverId) => {
  if (receiverId != null) {
    void openRouteMessage(receiverId, true)
  }
})
</script>

<style scoped>
.notification-center {
  width: 100%;
  min-height: 100%;
  padding: 20px;
  background: #fff;
}

.message-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 16px;
}

.unread-summary {
  margin-left: 4px;
  color: #606266;
}

.message-board {
  width: 100%;
  background: #fff;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.filter-bar .el-select {
  width: 150px;
}

.title-search {
  width: 240px;
}

.message-list {
  min-height: 360px;
}

.message-item {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 16px;
  border: none;
  border-bottom: 1px solid #eef2f6;
  background: transparent;
  color: #334155;
  cursor: pointer;
  text-align: left;
}

.message-item:hover {
  background: #f8fbff;
}

.message-item.unread {
  background: #f3f9ff;
}

.message-state {
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: 50%;
  background: #cbd5e1;
}

.unread .message-state {
  background: #1687d9;
  box-shadow: 0 0 0 5px rgb(22 135 217 / 10%);
}

.message-main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.message-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.message-heading strong {
  overflow: hidden;
  color: #1e293b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-preview {
  overflow: hidden;
  color: #64748b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-meta,
.detail-meta {
  color: #94a3b8;
  font-size: 12px;
}

.message-status {
  color: #94a3b8;
  font-size: 12px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
}

.message-detail h2 {
  margin: 18px 0 8px;
  color: #172033;
}

.detail-content {
  margin: 24px 0;
  color: #475569;
  line-height: 1.8;
  white-space: pre-wrap;
}

@media (max-width: 767px) {
  .notification-center {
    padding: 12px;
  }

  .message-actions,
  .filter-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .message-actions {
    flex-wrap: wrap;
  }

  .filter-bar .el-select,
  .title-search {
    width: 100%;
  }
}
</style>
