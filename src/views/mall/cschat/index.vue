<template>
  <div class="chat-manage mall-page">
    <el-card class="search-card mall-filter-card" shadow="never">
      <el-form ref="searchFormRef" :model="searchForm" label-position="left" label-width="80px" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入用户昵称或消息内容"
            clearable
            style="width: 300px;"
            @keyup.enter="handleSearch"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card mall-table-card" shadow="never">
      <el-table v-loading="loading" :data="conversationList" style="width: 100%">
        <el-table-column prop="id" label="会话ID" min-width="180"></el-table-column>
        <el-table-column prop="memberId" label="用户ID" min-width="120"></el-table-column>
        <el-table-column label="用户信息" min-width="200">
          <template #default="scope">
            <div class="user-info">
              <div class="user-avatar">
                <el-image
                  :src="getFullImageUrl(scope.row.memberAvatar)"
                  fit="cover"
                  style="width: 40px; height: 40px; border-radius: 50%;"
                >
                  <template #error>
                    <div class="image-slot">
                      <el-icon><user /></el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
              <div class="user-name">{{ scope.row.memberNickname || `用户 ${scope.row.memberId}` }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="会话信息" min-width="300">
          <template #default="scope">
            <div class="last-message">
              <div class="message-content">{{ scope.row.lastMessage || '暂无消息' }}</div>
              <div class="message-time">
                最后消息时间：{{ scope.row.lastMessageTime ? formatTime(scope.row.lastMessageTime) : '无' }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180"></el-table-column>
        <el-table-column label="操作" min-width="120" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleViewConversation(scope.row)">查看聊天</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container" style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="Number(pagination.total)"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 聊天对话框 -->
    <el-dialog v-model="chatDialogVisible" :title="chatTitle" width="800px" class="cs-chat-dialog" :close-on-press-escape="false" @keydown.esc="handleDialogKeydown" @closed="handleDialogClosed">
      <div class="chat-dialog">
        <!-- 聊天记录 -->
        <div class="chat-messages" ref="chatMessagesRef" v-loading="messagesLoading">
          <div v-for="(message, index) in chatMessages" :key="index" :class="['message-item', message.type === 'send' ? 'send' : 'receive']">
            <!-- 头像 -->
            <div class="message-avatar">
              <el-image
                :src="message.type === 'send' ? getFullImageUrl(conversationDetail.mchAvatar) : getFullImageUrl(conversationDetail.memberAvatar)"
                fit="cover"
                style="width: 36px; height: 36px; border-radius: 50%;"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><user /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>

            <div class="message-content">
              <!-- 昵称 -->
              <div class="message-nickname" :class="message.type === 'send' ? 'send' : 'receive'">
                {{ message.type === 'send' ? conversationDetail.mchNickname : conversationDetail.memberNickname }}
              </div>

              <div class="message-bubble" :class="message.type === 'send' ? 'send' : 'receive'">
                <template v-if="message.msgType === 2">
                  <el-image
                    :src="message.attachment.url"
                    fit="cover"
                    :style="{ width: '80px', height: '80px' }"
                    :preview-src-list="[message.attachment.url]"
                    preview-teleported
                  >
                    <template #error>
                      <div class="image-slot">
                        <el-icon><picture-filled /></el-icon>
                      </div>
                    </template>
                  </el-image>
                </template>
                <template v-else-if="message.msgType === 3">
                  <video class="message-video" :src="message.attachment.url" controls></video>
                </template>
                <template v-else-if="message.msgType === 4">
                  <a class="message-file" :href="message.attachment.url" target="_blank" rel="noopener noreferrer">
                    <el-icon><Document /></el-icon>
                    <span>
                      <strong>{{ message.attachment.fileName || '附件文件' }}</strong>
                      <small>{{ formatFileSize(message.attachment.fileSize) }}</small>
                    </span>
                  </a>
                </template>
                <template v-else>
                  {{ message.content }}
                </template>
              </div>
              <div class="message-time">{{ formatTime(message.createTime) }}</div>
            </div>
          </div>
          <div v-if="chatMessages.length === 0" class="no-messages">
            <span>暂无消息</span>
          </div>
        </div>

        <!-- 消息输入 -->
        <div class="chat-input">
          <el-dropdown trigger="click" @command="chooseAttachment">
            <el-button class="attachment-button" aria-label="选择附件"><el-icon><Plus /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="image"><el-icon><PictureFilled /></el-icon>图片</el-dropdown-item>
                <el-dropdown-item command="video"><el-icon><VideoPlay /></el-icon>视频</el-dropdown-item>
                <el-dropdown-item command="file"><el-icon><Document /></el-icon>文件</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <input ref="attachmentInputRef" class="attachment-input" type="file" :accept="attachmentAccept" @change="handleAttachmentChange" />

          <div class="input-container">
            <div v-if="selectedAttachment?.file" class="attachment-preview-in-input">
              <el-image
                v-if="selectedAttachment.kind === 'image'"
                :src="attachmentPreviewUrl"
                fit="cover"
                :style="{ width: '80px', height: '80px' }"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><picture-filled /></el-icon>
                  </div>
                </template>
              </el-image>
              <video v-else-if="selectedAttachment.kind === 'video'" :src="attachmentPreviewUrl" controls></video>
              <div v-else class="selected-file"><el-icon><Document /></el-icon><span>{{ selectedAttachment.file.name }}</span></div>
              <el-button class="attachment-clear" size="small" type="danger" @click="clearAttachment"><el-icon><Close /></el-icon></el-button>
            </div>

            <!-- 文本输入框 -->
            <el-input
              v-model="messageInput"
              type="textarea"
              placeholder="请输入消息内容"
              :rows="3"
              maxlength="255"
              show-word-limit
              :disabled="inputDisabled"
              @input="handleTextInput"
              @keyup.enter.exact="handleSendMessage"
            ></el-input>
          </div>

          <el-button type="primary" @click="handleSendMessage" :loading="sending">发送</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount, onMounted, nextTick } from 'vue';
import { ElMessage, ElIcon } from 'element-plus';
import { Close, Document, PictureFilled, Plus, User, VideoPlay } from '@element-plus/icons-vue';
import wsService from '@/utils/websocket';
import { initConversation, queryConversationList, queryConversationMessages, sendMessage, uploadCsMessageFile } from '@/api/mall/cschat';
import { resolveApiUrl } from '@/utils/download';

const loading = ref(false);
const messagesLoading = ref(false);
const sending = ref(false);
const chatMessagesRef = ref(null);
const attachmentInputRef = ref(null);
const selectedAttachment = ref(null);
const attachmentPreviewUrl = ref('');
const attachmentAccept = ref('image/*');
const inputDisabled = ref(false);
const messagePagination = reactive({
  current: 1,
  pageSize: 50,
  total: 0,
  hasMore: true
});
const conversationDetail = ref({
  memberId: '',
  memberNickname: '',
  memberAvatar: '',
  mchId: '',
  mchNickname: '',
  mchAvatar: '',
  shopId: '',
  shopName: '',
  shopLogo: ''
});

const searchForm = reactive({
  keyword: ''
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

const conversationList = ref([]);
const chatDialogVisible = ref(false);
const chatTitle = ref('');
const currentConversation = ref(null);
const chatMessages = ref([]);
const messageInput = ref('');

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 获取完整图片URL
const getFullImageUrl = (fileKey) => {
  if (!fileKey) return '';
  if (/^https?:\/\//.test(fileKey)) return fileKey;
  return resolveApiUrl(`/public/storage/preview?fileKey=${encodeURIComponent(fileKey)}`);
};

const formatFileSize = (size) => {
  const bytes = Number(size || 0);
  if (!bytes) return '附件文件';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const parseAttachment = (content, msgType) => {
  if (Number(msgType) === 2) {
    return { fileKey: content, url: getFullImageUrl(content) };
  }
  if (![3, 4].includes(Number(msgType))) return null;
  try {
    const metadata = JSON.parse(content || '{}');
    return { ...metadata, url: getFullImageUrl(metadata.fileKey) };
  } catch (error) {
    return { fileKey: content, url: getFullImageUrl(content) };
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  });
};

const updateConversationSummary = (conversationId, content, msgType, messageTime) => {
  if (searchForm.keyword.trim()) {
    // 搜索结果是否仍匹配取决于最新消息内容，交给后端重新筛选。
    getConversationList();
    return;
  }

  const conversationIndex = conversationList.value.findIndex(
    item => String(item.id) === String(conversationId)
  );
  if (conversationIndex < 0) {
    getConversationList();
    return;
  }

  // 更新会话摘要，并将最近有消息的会话移动到列表顶部。
  const conversation = {
    ...conversationList.value[conversationIndex],
    lastMessage: Number(msgType) === 2 ? '[图片]' : Number(msgType) === 3 ? '[视频]' : Number(msgType) === 4 ? '[文件]' : content,
    lastMessageTime: messageTime
  };
  conversationList.value.splice(conversationIndex, 1);
  conversationList.value.unshift(conversation);
};

// 获取会话列表
const getConversationList = async () => {
  try {
    loading.value = true;

    const params = {
      current: pagination.current,
      size: pagination.pageSize,
      keyword: searchForm.keyword.trim()
    };

    const response = await queryConversationList(params);
    if (response.code === 0 && response.data) {
      conversationList.value = response.data.records || [];
      pagination.total = parseInt(response.data.total) || 0;
    } else {
      conversationList.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    console.error('获取会话列表失败:', error);
    ElMessage.error('获取会话列表失败');
    conversationList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 获取聊天消息
const getChatMessages = async (conversationId, isLoadMore = false) => {
  try {
    if (!isLoadMore) {
      messagesLoading.value = true;
    }

    const params = {
      conversationId,
      current: isLoadMore ? messagePagination.current + 1 : 1,
      size: messagePagination.pageSize
    };

    const response = await queryConversationMessages(params);
    if (response.code === 0 && response.data) {
      const newMessages = (response.data.records || []).map(msg => ({
        id: msg.id,
        conversationId: msg.conversationId,
        content: msg.msgContent,
        type: msg.msgDirection === 1 ? 'receive' : 'send', // 1-买家到商家（接收），2-商家到买家（发送）
        msgType: msg.msgType,
        attachment: parseAttachment(msg.msgContent, msg.msgType),
        createTime: msg.createTime
      }));

      if (isLoadMore) {
        // 加载更多消息，添加到数组前面
        chatMessages.value = [...newMessages, ...chatMessages.value];
        messagePagination.current++;
      } else {
        // 首次加载消息，替换数组并倒序
        chatMessages.value = newMessages.reverse();
        messagePagination.current = 1;
      }

      messagePagination.total = parseInt(response.data.total) || 0;
      messagePagination.hasMore = chatMessages.value.length < messagePagination.total;
    } else {
      if (!isLoadMore) {
        chatMessages.value = [];
      }
      messagePagination.hasMore = false;
    }
  } catch (error) {
    console.error('获取聊天消息失败:', error);
    if (!isLoadMore) {
      ElMessage.error('获取聊天消息失败');
      chatMessages.value = [];
    }
    messagePagination.hasMore = false;
  } finally {
    messagesLoading.value = false;
    if (!isLoadMore) {
      scrollToBottom();
    }
  }
};

// 获取会话详细信息
const getConversationDetail = async (conversationId) => {
  try {
    const response = await initConversation({ id: conversationId });

    if (response.code === 0 && response.data) {
      conversationDetail.value = response.data;
      return response.data;
    } else {
      console.error('获取会话详细信息失败:', response.message);
      return null;
    }
  } catch (error) {
    console.error('获取会话详细信息失败:', error);
    return null;
  }
};

// 查看聊天
const handleViewConversation = async (row) => {
  currentConversation.value = row;
  chatMessages.value = [];
  messagePagination.current = 1;
  messagePagination.hasMore = true;

  // 获取会话详细信息
  const detail = await getConversationDetail(row.id);
  if (detail) {
    chatTitle.value = `与用户 ${detail.memberNickname || row.memberId} 的聊天`;
  } else {
    chatTitle.value = `与用户 ${row.memberId} 的聊天`;
  }

  chatDialogVisible.value = true;

  // 对话框显示后再获取消息，确保滚动操作能生效
  nextTick(() => {
    getChatMessages(row.id);
    // 添加滚动事件监听
    if (chatMessagesRef.value) {
      chatMessagesRef.value.addEventListener('scroll', handleMessageScroll);
    }
  });
};

// 发送消息
const handleSendMessage = async () => {
  if (!messageInput.value.trim() && !selectedAttachment.value?.file) {
    return;
  }

  sending.value = true;

  try {
    if (selectedAttachment.value?.file) {
      await sendAttachmentMessage();
    }
    // 否则，发送文本消息
    else if (messageInput.value.trim()) {
      await sendTextMessage();
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    ElMessage.error(error instanceof Error ? error.message : '发送消息失败');
  } finally {
    sending.value = false;
  }
};

// 发送文本消息
const sendTextMessage = async () => {
  const conversationId = currentConversation.value.id;
  const content = messageInput.value.trim();
  // HTTP 与 WebSocket 使用同一命令格式，由服务端统一鉴权、落库并推送给买家。
  const message = {
    category: 'biz-handle',
    command: 'cs-chat.mch',
    subCmd: 'msg.mch2mem',
    payload: {
      conversationId,
      content,
      type: 1 // 1表示文本消息
    }
  };

  await sendMessage(message);

  // 服务端确认成功后再显示消息，发送失败时输入内容保持不变。
  const createTime = new Date().toISOString();
  chatMessages.value.push({
    id: Date.now().toString(),
    conversationId,
    content,
    type: 'send',
    msgType: 1,
    createTime
  });
  updateConversationSummary(conversationId, content, 1, createTime);
  if (messageInput.value.trim() === content) {
    messageInput.value = '';
  }
  scrollToBottom();
};

// 发送附件消息
const sendAttachmentMessage = async () => {
  const conversationId = currentConversation.value.id;
  const attachment = selectedAttachment.value;
  const result = await uploadCsMessageFile(attachment.file);

  if (result.code === 0 && result.data && result.data.fileKey) {
    const fileKey = result.data.fileKey;
    const msgType = attachment.kind === 'image' ? 2 : attachment.kind === 'video' ? 3 : 4;
    const content = msgType === 2 ? fileKey : JSON.stringify({
      fileKey,
      fileName: attachment.file.name.slice(0, 72),
      fileSize: attachment.file.size || 0
    });
    const message = {
      category: 'biz-handle',
      command: 'cs-chat.mch',
      subCmd: 'msg.mch2mem',
      payload: {
        conversationId,
        content,
        type: msgType
      }
    };
    await sendMessage(message);

    const createTime = new Date().toISOString();
    const newMessage = {
      id: Date.now().toString(),
      conversationId,
      content,
      type: 'send',
      msgType,
      attachment: parseAttachment(content, msgType),
      createTime
    };

    chatMessages.value.push(newMessage);
    updateConversationSummary(conversationId, content, msgType, createTime);
    clearAttachment();
    scrollToBottom();
  } else {
    ElMessage.error('附件上传失败');
  }
};

const chooseAttachment = (kind) => {
  attachmentAccept.value = kind === 'image' ? 'image/*' : kind === 'video' ? 'video/*' : '*/*';
  selectedAttachment.value = { kind, file: null };
  nextTick(() => attachmentInputRef.value?.click());
};

const handleAttachmentChange = (event) => {
  const file = event.target.files?.[0];
  if (!file || !selectedAttachment.value) {
    selectedAttachment.value = null;
    return;
  }
  selectedAttachment.value = { ...selectedAttachment.value, file };
  attachmentPreviewUrl.value = selectedAttachment.value.kind === 'file' ? '' : URL.createObjectURL(file);
  messageInput.value = '';
  inputDisabled.value = true;
  event.target.value = '';
};

const clearAttachment = () => {
  if (attachmentPreviewUrl.value) URL.revokeObjectURL(attachmentPreviewUrl.value);
  selectedAttachment.value = null;
  attachmentPreviewUrl.value = '';
  inputDisabled.value = false;
};

// 处理文本输入
const handleTextInput = () => {
  if (messageInput.value.trim() && selectedAttachment.value) {
    clearAttachment();
  }
};

// 处理消息区域滚动事件
const handleMessageScroll = (event) => {
  const { scrollTop } = event.target;
  // 当滚动到顶部且还有更多消息时，加载下一页
  if (scrollTop === 0 && messagePagination.hasMore && !messagesLoading.value) {
    if (currentConversation.value) {
      getChatMessages(currentConversation.value.id, true);
    }
  }
};

// 处理对话框键盘事件
const handleDialogKeydown = (event) => {
  // 检查是否存在图片预览遮罩层
  const imagePreviewMask = document.querySelector('.el-image-viewer__mask');
  if (!imagePreviewMask) {
    // 如果没有图片预览，关闭对话框
    chatDialogVisible.value = false;
  }
};

const handleDialogClosed = () => {
  chatMessagesRef.value?.removeEventListener('scroll', handleMessageScroll);
  currentConversation.value = null;
  chatMessages.value = [];
  messageInput.value = '';
  clearAttachment();
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  getConversationList();
};

// 重置
const resetForm = () => {
  searchForm.keyword = '';
  pagination.current = 1;
  getConversationList();
};

// 分页
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  getConversationList();
};

const handleCurrentChange = (current) => {
  pagination.current = current;
  getConversationList();
};

// 注册WebSocket消息处理器
const handleWebSocketMessage = (message) => {
  // 处理买家发送给商家的消息
  if (message.category === 'biz-handle' && message.command === 'cs-chat.mem' && message.subCmd === 'msg.mem2mch') {
    const payload = message.payload;
    if (!payload) return;

    const receiveTime = payload.createTime || new Date().toISOString();
    updateConversationSummary(payload.conversationId, payload.content, payload.type, receiveTime);

    if (currentConversation.value && String(payload.conversationId) === String(currentConversation.value.id)) {
      if (payload.messageId && chatMessages.value.some(item => String(item.id) === String(payload.messageId))) {
        return;
      }
      chatMessages.value.push({
        id: payload.messageId || Date.now().toString(),
        conversationId: payload.conversationId,
        content: payload.content,
        type: 'receive',
        msgType: payload.type,
        attachment: parseAttachment(payload.content, payload.type),
        createTime: receiveTime
      });
      scrollToBottom();
    }
  }
};

const handleWebSocketReconnect = () => {
  // 重连后补拉断线期间的消息，并同步最新会话摘要。
  getConversationList();
  if (currentConversation.value) {
    getChatMessages(currentConversation.value.id);
  }
};

onMounted(() => {
  getConversationList();
  // 注册WebSocket消息处理器
  wsService.onMessage(handleWebSocketMessage);
  wsService.onReconnect(handleWebSocketReconnect);
});

onBeforeUnmount(() => {
  wsService.offMessage(handleWebSocketMessage);
  wsService.offReconnect(handleWebSocketReconnect);
});
</script>

<style lang="scss" scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  font-weight: bold;
}

.last-message {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-content {
  color: var(--mall-ink-secondary, #30423a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-time {
  font-size: 12px;
  color: var(--mall-muted, #65726a);
}

/* 聊天对话框样式 */
.chat-dialog {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
  max-height: calc(70vh - 160px); /* 确保有足够的高度用于滚动 */

  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
  align-items: flex-start;

  &.send {
    flex-direction: row-reverse;
  }
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.send {
    align-items: flex-end;
  }

  &.receive {
    align-items: flex-start;
  }
}

.message-nickname {
  font-size: 12px;
  color: var(--mall-muted, #65726a);
  margin-bottom: 4px;

  &.send {
    text-align: right;
  }

  &.receive {
    text-align: left;
  }
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  word-break: break-word;

  &.send {
    background-color: var(--mall-brand, #24634f);
    color: white;
    border-bottom-right-radius: 4px;
  }

  &.receive {
    background-color: white;
    color: var(--mall-ink-secondary, #30423a);
    border-bottom-left-radius: 4px;
  }

  /* 确保图片在聊天框中保持较小尺寸，禁用悬停放大效果 */
  :deep(.el-image) {
    border-radius: 4px !important;
    box-shadow: none !important;
    width: 80px !important;
    height: 80px !important;

    .el-image__inner {
      transition: none !important;
      transform: none !important;
      cursor: pointer !important;
      width: 100% !important;
      height: 100% !important;
    }
  }
}

.message-video {
  display: block;
  width: 280px;
  max-width: 100%;
  max-height: 220px;
  border-radius: 6px;
  background: #111;
}

.message-file {
  display: flex;
  width: 260px;
  max-width: 100%;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;

  > .el-icon {
    flex: 0 0 auto;
    font-size: 34px;
  }

  > span {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
  }

  strong {
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    opacity: .68;
  }
}

.no-messages {
  text-align: center;
  padding: 40px 0;
  color: var(--mall-muted, #65726a);
}

.chat-input {
  padding: 20px;
  border-top: 1px solid #ebeef5;
  background-color: white;
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.attachment-input { display: none; }

.input-container {
  flex: 1;
  position: relative;
  min-height: 80px;
}

.attachment-preview-in-input {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  display: inline-block;
  position: relative;
  margin-right: 10px;
  margin-bottom: 10px;
}

.attachment-preview-in-input > video {
  width: 160px;
  height: 90px;
  border-radius: 6px;
  background: #111;
}

.selected-file {
  display: flex;
  max-width: 320px;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--mall-line);
  border-radius: 8px;
  background: var(--mall-paper);
}

.selected-file span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-clear {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 20px;
  height: 20px;
  padding: 0;
  border-radius: 50%;
}

.el-input {
  flex: 1;
  min-height: 80px;
}

.el-textarea__inner {
  resize: none;
  min-height: 80px;
}

/* 确保文本输入时图片被清除 */
textarea:focus {
  outline: none;
}

.no-messages {
  text-align: center;
  padding: 40px 0;
  color: var(--mall-muted, #65726a);
}

.chat-manage {
  min-height: 100%;
}

.message-content {
  color: var(--mall-ink-secondary);
}

.message-time,
.message-nickname,
.no-messages {
  color: var(--mall-muted);
}

.chat-dialog {
  min-height: 520px;
  max-height: calc(100vh - 190px);
}

.chat-messages {
  min-height: 330px;
  max-height: calc(100vh - 350px);
  padding: 20px 22px;
  background: #eef2ef;
}

.message-bubble {
  border: 1px solid var(--mall-line);
  border-radius: 10px;
  line-height: 1.55;
}

.message-bubble.send {
  color: #fff;
  border-color: var(--mall-brand);
  border-bottom-right-radius: 3px;
  background: var(--mall-brand);
}

.message-bubble.receive {
  color: var(--mall-ink-secondary);
  border-bottom-left-radius: 3px;
  background: #fff;
}

.chat-input {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 88px;
  align-items: end;
  gap: 10px;
  padding: 14px 18px 18px;
  border-top-color: var(--mall-line);
}

.attachment-button {
  width: 40px;
  height: 40px;
}

.attachment-button {
  padding: 0;
  color: var(--mall-brand);
  border-color: var(--mall-line-strong);
  background: var(--mall-brand-soft);
}

.input-container {
  display: flex;
  min-width: 0;
  min-height: 80px;
  flex-direction: column;
  gap: 10px;
}

.attachment-preview-in-input {
  position: relative;
  top: auto;
  left: auto;
  align-self: flex-start;
  margin: 0;
}

.chat-input > .el-button:last-child {
  width: 88px;
  height: 40px;
  margin: 0;
}
</style>
