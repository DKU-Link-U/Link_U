const notificationService = require('../services/notificationService');

function handleError(res, error, fallbackMessage) {
  res.status(error.statusCode || 400).json({
    success: false,
    message: error.publicMessage || fallbackMessage,
    error: error.message,
  });
}

async function getNotifications(req, res) {
  try {
    const notifications = await notificationService.getNotificationsForUser(req.user.id, req.query);

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    handleError(res, error, '알림 목록을 불러오지 못했습니다.');
  }
}

async function markNotificationRead(req, res) {
  try {
    const notification = await notificationService.markNotificationRead(req.params.id, req.user.id);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    handleError(res, error, '알림을 읽음 처리하지 못했습니다.');
  }
}

async function markAllNotificationsRead(req, res) {
  try {
    const notifications = await notificationService.markAllNotificationsRead(req.user.id);

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    handleError(res, error, '알림을 모두 읽음 처리하지 못했습니다.');
  }
}

module.exports = {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
};
