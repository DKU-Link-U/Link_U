const { toSafeUser } = require('../services/authService');
const { unlinkExternalAccount } = require('../services/accountLinkService');

function getMe(req, res) {
  res.json({
    success: true,
    data: {
      user: toSafeUser(req.user),
    },
  });
}

async function disconnectAccountLink(req, res) {
  try {
    const result = await unlinkExternalAccount(req.user.id, req.params.platform);

    res.json({
      success: true,
      message: `${result.platformName} 계정 연동을 해제했습니다.`,
      data: result,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.publicMessage || '계정 연동 해제에 실패했습니다.',
      error: error.message,
    });
  }
}

module.exports = {
  getMe,
  disconnectAccountLink,
};
