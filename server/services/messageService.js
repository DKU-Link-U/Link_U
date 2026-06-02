const prisma = require('../config/prisma');
const { toKoreanDateTime } = require('../utils/koreanTime');

function getUserDisplayName(user) {
  return user?.nickname || user?.name || user?.email || 'Unknown';
}

function toMessageDto(message) {
  return {
    messageId: message.id,
    id: message.id,
    senderId: message.senderId,
    senderName: getUserDisplayName(message.sender),
    receiverId: message.receiverId,
    receiverName: getUserDisplayName(message.receiver),
    content: message.content,
    createdAt: toKoreanDateTime(message.createdAt),
    isRead: message.isRead,
  };
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
}

async function findRecipient(identifier) {
  const keyword = String(identifier || '').trim();

  if (!keyword) {
    throw createHttpError(400, '받는 사람을 입력해주세요.');
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { id: keyword },
        { email: { equals: keyword, mode: 'insensitive' } },
        { nickname: { equals: keyword, mode: 'insensitive' } },
        { name: { equals: keyword, mode: 'insensitive' } },
        { githubId: { equals: keyword, mode: 'insensitive' } },
        { bojId: { equals: keyword, mode: 'insensitive' } },
        { dreamhackId: { equals: keyword, mode: 'insensitive' } },
      ],
    },
    take: 2,
  });

  if (users.length === 0) {
    throw createHttpError(404, '받는 사용자를 찾을 수 없습니다.');
  }

  if (users.length > 1) {
    throw createHttpError(409, '받는 사람이 여러 명입니다. 이메일 또는 정확한 사용자 ID로 입력해주세요.');
  }

  return users[0];
}

async function getMessagesForUser(userId, query = {}) {
  const box = query.box || query.type || 'all';
  const limit = Math.min(Number(query.limit) || 100, 100);
  const where = {};

  if (box === 'received' || box === 'inbox') {
    where.receiverId = userId;
  } else if (box === 'sent' || box === 'outbox') {
    where.senderId = userId;
  } else {
    where.OR = [
      { senderId: userId },
      { receiverId: userId },
    ];
  }

  const messages = await prisma.message.findMany({
    where,
    include: {
      sender: true,
      receiver: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return messages.map(toMessageDto);
}

async function sendMessage(sender, body) {
  const content = String(body.content || '').trim();

  if (!content) {
    throw createHttpError(400, '쪽지 내용을 입력해주세요.');
  }

  const recipient = await findRecipient(body.receiverId || body.to);

  if (recipient.id === sender.id) {
    throw createHttpError(400, '자기 자신에게는 쪽지를 보낼 수 없습니다.');
  }

  const createdMessage = await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        senderId: sender.id,
        receiverId: recipient.id,
        content,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    await tx.notification.create({
      data: {
        receiverId: recipient.id,
        type: 'MESSAGE',
        content: `${getUserDisplayName(sender)}님에게 새 쪽지가 도착했습니다.`,
        metadata: {
          messageId: message.id,
          senderId: sender.id,
        },
      },
    });

    return message;
  });

  return toMessageDto(createdMessage);
}

async function markMessageRead(messageId, userId) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sender: true,
      receiver: true,
    },
  });

  if (!message) {
    throw createHttpError(404, '쪽지를 찾을 수 없습니다.');
  }

  if (message.receiverId !== userId) {
    throw createHttpError(403, '내가 받은 쪽지만 읽음 처리할 수 있습니다.');
  }

  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: { isRead: true },
    include: {
      sender: true,
      receiver: true,
    },
  });

  return toMessageDto(updatedMessage);
}

module.exports = {
  getMessagesForUser,
  markMessageRead,
  sendMessage,
  toMessageDto,
};
