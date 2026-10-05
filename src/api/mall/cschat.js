import request from '@/utils/request'

// 查询会话列表
export function queryConversationList(params) {
  const shopId = localStorage.getItem('shopId') || '';
  return request({
    url: `/mch/csConversation/query`,
    method: 'get',
    params: {
      ...params,
      shopId: parseInt(shopId)
    }
  })
}

// 查询会话详情
export function getConversationDetail(id) {
  return request({
    url: `/mch/csConversation/crud/detail`,
    method: 'get',
    params: { id }
  })
}

// 删除会话
export function deleteConversations(ids) {
  return request({
    url: `/mch/csConversation/crud/delete`,
    method: 'post',
    data: ids
  })
}

// 查询会话消息
export function queryConversationMessages(params) {
  return request({
    url: `/mch/csConversation/messages`,
    method: 'get',
    params
  })
}

// 初始化会话并获取会话详情
export function initConversation(data) {
  return request({
    url: `/mch/csConversation/init`,
    method: 'post',
    data
  })
}

// 上传客服消息附件
export function uploadCsMessageFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: `/mch/storage/upload`,
    method: 'post',
    data: formData
  })
}

// 发送消息
export function sendMessage(data) {
  return request({
    url: `/mch/csConversation/sendMessage`,
    method: 'post',
    data
  })
}
