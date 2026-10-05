<template>
  <div class="chat-manage">
    <div class="page-header">
      <h2>客服消息</h2>
    </div>

    <el-card class="search-card">
      <el-form ref="searchFormRef" :model="searchForm" label-position="left" label-width="80px" inline>
        <el-form-item label="会话状态">
          <el-select v-model="searchForm.status" placeholder="请选择会话状态" clearable style="width: 200px;">
            <el-option label="全部" value=""></el-option>
            <el-option label="活跃" value="active"></el-option>
            <el-option label="已结束" value="ended"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="请输入用户昵称或会话内容" clearable style="width: 300px;"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <h3>会话列表</h3>
        </div>
      </template>
      <el-table v-loading="loading" :data="conversationList" style="width: 100%" @sort-change="handleSortChange">
        <el-table-column prop="id" label="会话ID" min-width="180" sortable="custom"></el-table-column>
        <el-table-column prop="memberId" label="用户ID" min-width="120" sortable="custom"></el-table-column>
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
        <el-table-column prop="createTime" label="创建时间" min-width="180" sortable="custom"></el-table-column>
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
    <el-dialog v-model="chatDialogVisible" :title="chatTitle" width="800px" height="70vh" :close-on-press-escape="false" @keydown.esc="handleDialogKeydown">
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
                    :src="getFullImageUrl(message.content)"
                    fit="cover"
                    :style="{ width: '80px', height: '80px' }"
                    :preview-src-list="[getFullImageUrl(message.content)]"
                    preview-teleported
                  >
                    <template #error>
                      <div class="image-slot">
                        <el-icon><picture-filled /></el-icon>
                      </div>
                    </template>
                  </el-image>
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
          <el-upload
            class="image-upload"
            action="#"
            :auto-upload="false"
            :on-change="handleImageUpload"
            :show-file-list="false"
            accept="image/*"
          >
            <el-button size="small" type="primary" icon="el-icon-picture-outline"></el-button>
          </el-upload>

          <div class="input-container">
            <!-- 图片预览 -->
            <div v-if="imagePreviewUrl" class="image-preview-in-input">
              <el-image
                :src="imagePreviewUrl"
                fit="cover"
                :style="{ width: '80px', height: '80px' }"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><picture-filled /></el-icon>
                  </div>
                </template>
              </el-image>
              <el-button size="small" type="danger" @click="clearImage" style="position: absolute; top: -10px; right: -10px; padding: 0; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <el-icon><Close /></el-icon>
                  </el-button>
            </div>

            <!-- 文本输入框 -->
            <el-input
              v-model="messageInput"
              type="textarea"
              placeholder="请输入消息内容"
              :rows="3"
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElIcon } from 'element-plus';
import { PictureFilled, Close, User } from '@element-plus/icons-vue';
import wsService from '@/utils/websocket';
import { initConversation, queryConversationList, queryConversationMessages, uploadCsMessageFile } from '@/api/mall/cschat';
import { resolveApiUrl } from '@/utils/download';

const loading = ref(false);
const messagesLoading = ref(false);
const sending = ref(false);
const chatMessagesRef = ref(null);
const selectedImageFile = ref(null);
const imagePreviewUrl = ref(null);
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
  status: '',
  keyword: ''
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

const sortConfig = reactive({
  prop: 'createTime',
  order: 'desc'
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

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  });
};

// 获取会话列表
const getConversationList = async () => {
  try {
    loading.value = true;

    const params = {
      current: pagination.current,
      size: pagination.pageSize,
      // 可以根据需要添加其他参数，如memberNickname、lastMessage等
      // 这里暂时只传递分页参数
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
        msgType: msg.msgType, // 消息类型：1-文本，2-图片
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
  if (!messageInput.value.trim() && !selectedImageFile.value) {
    return;
  }

  sending.value = true;

  try {
    // 如果有选中的图片文件，发送图片消息
    if (selectedImageFile.value) {
      await sendImageMessage();
    }
    // 否则，发送文本消息
    else if (messageInput.value.trim()) {
      await sendTextMessage();
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    ElMessage.error('发送消息失败');
  } finally {
    sending.value = false;
  }
};

// 发送文本消息
const sendTextMessage = async () => {
  // 构造WebSocket消息
  const wsMessage = {
    category: 'biz-handle',
    command: 'cs-chat.mch',
    subCmd: 'msg.mch2mem',
    payload: {
      conversationId: currentConversation.value.id,
      content: messageInput.value,
      type: 1 // 1表示文本消息
    }
  };

  // 通过WebSocket发送消息
  const success = wsService.send(wsMessage);

  if (success) {
    // 本地添加消息
    const newMessage = {
      id: Date.now().toString(),
      conversationId: currentConversation.value.id,
      content: messageInput.value,
      type: 'send',
      msgType: 1, // 消息类型：1-文本
      createTime: new Date().toISOString()
    };

    chatMessages.value.push(newMessage);
    messageInput.value = '';
    scrollToBottom();
  } else {
    ElMessage.error('发送消息失败，请检查网络连接');
  }
};

// 发送图片消息
const sendImageMessage = async () => {
  const file = selectedImageFile.value;
  const result = await uploadCsMessageFile(file.raw);

  if (result.code === 0 && result.data && result.data.fileKey) {
    const fileKey = result.data.fileKey;

    // 本地添加消息
    const newMessage = {
      id: Date.now().toString(),
      conversationId: currentConversation.value.id,
      content: fileKey, // 使用fileKey作为内容
      type: 'send',
      msgType: 2, // 消息类型：2-图片
      createTime: new Date().toISOString()
    };

    chatMessages.value.push(newMessage);
    selectedImageFile.value = null; // 清空选中的图片
    imagePreviewUrl.value = ''; // 清空图片预览
    inputDisabled.value = false; // 重新启用输入框
    scrollToBottom();

    // 通过WebSocket发送图片消息
    const wsMessage = {
      category: 'biz-handle',
      command: 'cs-chat.mch',
      subCmd: 'msg.mch2mem',
      payload: {
        conversationId: currentConversation.value.id,
        content: fileKey, // 使用fileKey作为内容
        type: 2 // 2表示图片消息
      }
    };
    wsService.send(wsMessage);
  } else {
    ElMessage.error('图片上传失败');
  }
};

// 处理图片选择
const handleImageUpload = (file) => {
  selectedImageFile.value = file;
  // 生成图片预览URL
  imagePreviewUrl.value = URL.createObjectURL(file.raw);
  // 清空文本输入框，确保图片和文本不可同时存在
  messageInput.value = '';
  // 禁用输入框
  inputDisabled.value = true;
  ElMessage.success('图片已选择，点击发送按钮发送');
};

// 清除图片
const clearImage = () => {
  selectedImageFile.value = null;
  imagePreviewUrl.value = '';
  // 重新启用输入框
  inputDisabled.value = false;
};

// 处理文本输入
const handleTextInput = () => {
  // 如果输入文本，清除图片选择
  if (messageInput.value.trim() && selectedImageFile.value) {
    clearImage();
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

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  getConversationList();
};

// 重置
const resetForm = () => {
  searchForm.status = '';
  searchForm.keyword = '';
  pagination.current = 1;
  getConversationList();
};

// 排序
const handleSortChange = ({ prop, order }) => {
  if (prop && order) {
    sortConfig.prop = prop;
    sortConfig.order = order === 'ascending' ? 'asc' : 'desc';
    getConversationList();
  }
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
  console.log('收到WebSocket消息:', message);

  // 处理买家发送给商家的消息
  if (message.category === 'biz-handle' && message.command === 'cs-chat.mem' && message.subCmd === 'msg.mem2mch') {
    const payload = message.payload;
    console.log('处理买家消息，payload:', payload);
    console.log('当前会话:', currentConversation.value);

    if (payload && currentConversation.value) {
      console.log('payload.conversationId:', payload.conversationId);
      console.log('currentConversation.id:', currentConversation.value.id);

      // 检查是否是当前会话的消息（通过会话ID匹配，注意类型转换）
      if (String(payload.conversationId) === String(currentConversation.value.id)) {
        console.log('会话ID匹配，添加消息到对话框');
        // 本地添加消息
            const newMessage = {
              id: Date.now().toString(),
              conversationId: payload.conversationId,
              content: payload.content,
              type: 'receive', // 买家发送的消息，显示为接收
              msgType: payload.type, // 消息类型：1-文本，2-图片
              createTime: new Date().toISOString()
            };

        chatMessages.value.push(newMessage);
        scrollToBottom();
      } else {
        console.log('会话ID不匹配，忽略消息');
      }
    } else {
      console.log('payload或currentConversation为空，忽略消息');
    }
  }

  // 处理其他类型的消息...
};

onMounted(() => {
  getConversationList();
  // 注册WebSocket消息处理器
  wsService.onMessage(handleWebSocketMessage);
});
</script>

<style lang="scss" scoped>
.chat-manage {
  padding: 20px;
}

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
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-time {
  font-size: 12px;
  color: #909399;
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
  color: #909399;
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
    background-color: #409eff;
    color: white;
    border-bottom-right-radius: 4px;
  }

  &.receive {
    background-color: white;
    color: #303133;
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

.no-messages {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.chat-input {
  padding: 20px;
  border-top: 1px solid #ebeef5;
  background-color: white;
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.image-upload {
  flex-shrink: 0;
}

.input-container {
  flex: 1;
  position: relative;
  min-height: 80px;
}

.image-preview-in-input {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  display: inline-block;
  position: relative;
  margin-right: 10px;
  margin-bottom: 10px;
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
  color: #909399;
}
</style>
