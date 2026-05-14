import { mockMessages } from '../models'
import { buildQuery, cloneData, requestJson } from './httpClient'

function createMessageFallback(message, currentUser) {
  const sender = currentUser ?? { userId: 'guest', nickname: 'Guest' }

  return {
    messageId: `msg_${Date.now()}`,
    senderId: sender.userId,
    senderName: sender.nickname,
    receiverId: message.receiverId ?? message.to,
    receiverName: message.to,
    content: message.content,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    isRead: true,
  }
}

export async function fetchMessages(params = {}) {
  return requestJson(`/api/messages${buildQuery(params)}`, {
    fallback: () => cloneData(mockMessages),
    errorMessage: 'Failed to load messages.',
  })
}

export async function sendMessage(message, { currentUser, accessToken } = {}) {
  return requestJson('/api/messages', {
    method: 'POST',
    body: message,
    accessToken,
    fallback: () => createMessageFallback(message, currentUser),
    errorMessage: 'Failed to send message.',
  })
}

export async function markMessageRead(messageId, { accessToken } = {}) {
  return requestJson(`/api/messages/${encodeURIComponent(messageId)}/read`, {
    method: 'PATCH',
    accessToken,
    fallback: () => ({ messageId, isRead: true }),
    errorMessage: 'Failed to mark message as read.',
  })
}
