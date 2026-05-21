const prisma = require('../config/prisma');

function formatDateTime(value) {
  return value.toISOString().slice(0, 16).replace('T', ' ');
}

function toNotificationDto(notification) {
  return {
    notificationId: notification.id,
    id: notification.id,
    receiverId: notification.receiverId,
    type: notification.type,
    content: notification.content,
    isRead: notification.isRead,
    metadata: notification.metadata || {},
    createdAt: formatDateTime(notification.createdAt),
  };
}

async function createNotification({ receiverId, type = 'SYSTEM', content, metadata = {} }) {
  const normalizedContent = String(content || '').trim();

  if (!receiverId || !normalizedContent) {
    return null;
  }

  const notification = await prisma.notification.create({
    data: {
      receiverId,
      type,
      content: normalizedContent,
      metadata,
    },
  });

  return toNotificationDto(notification);
}

async function getNotificationsForUser(userId, query = {}) {
  const limit = Math.min(Number(query.limit) || 50, 100);
  const where = {
    receiverId: userId,
  };

  if (query.unread === 'true') {
    where.isRead = false;
  }

  if (query.type) {
    where.type = String(query.type).toUpperCase();
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return notifications.map(toNotificationDto);
}

async function markNotificationRead(notificationId, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    const error = new Error('알림을 찾을 수 없습니다.');
    error.statusCode = 404;
    error.publicMessage = error.message;
    throw error;
  }

  if (notification.receiverId !== userId) {
    const error = new Error('내 알림만 읽음 처리할 수 있습니다.');
    error.statusCode = 403;
    error.publicMessage = error.message;
    throw error;
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return toNotificationDto(updatedNotification);
}

async function markAllNotificationsRead(userId) {
  await prisma.notification.updateMany({
    where: {
      receiverId: userId,
      isRead: false,
    },
    data: { isRead: true },
  });

  return getNotificationsForUser(userId);
}

module.exports = {
  createNotification,
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  toNotificationDto,
};
