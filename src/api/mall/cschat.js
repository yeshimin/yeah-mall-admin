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

// 发送消息
export function sendMessage(data) {
  return request({
    url: `/mch/csConversation/sendMessage`,
    method: 'post',
    data
  })
}