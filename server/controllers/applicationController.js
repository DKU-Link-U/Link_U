const communityService = require('../services/communityService');

function handleError(res, error, fallbackMessage) {
  res.status(error.statusCode || 400).json({
    success: false,
    message: error.publicMessage || fallbackMessage,
    error: error.message,
  });
}

async function updateApplicationStatus(req, res) {
  try {
    const application = await communityService.updateApplicationStatus(req.params.id, req.user.id, req.body.status);

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    handleError(res, error, '지원 상태 변경에 실패했습니다.');
  }
}

module.exports = {
  updateApplicationStatus,
};
