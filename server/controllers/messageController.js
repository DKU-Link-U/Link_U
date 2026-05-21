const messageService = require('../services/messageService');

function handleError(res, error, fallbackMessage) {
  res.status(error.statusCode || 400).json({
    success: false,
    message: error.publicMessage || fallbackMessage,
    error: error.message,
  });
}

async function getMessages(req, res) {
  try {
    const messages = await messageService.getMessagesForUser(req.user.id, req.query);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    handleError(res, error, '쪽지 목록을 불러오지 못했습니다.');
  }
}

async function sendMessage(req, res) {
  try {
    const message = await messageService.sendMessage(req.user, req.body);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    handleError(res, error, '쪽지를 보내지 못했습니다.');
  }
}

async function markMessageRead(req, res) {
  try {
    const message = await messageService.markMessageRead(req.params.id, req.user.id);

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    handleError(res, error, '쪽지를 읽음 처리하지 못했습니다.');
  }
}

module.exports = {
  getMessages,
  markMessageRead,
  sendMessage,
};
