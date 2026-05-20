const { toSafeUser } = require('../services/authService');
const { unlinkExternalAccount } = require('../services/accountLinkService');
const {
  collectExternalActivityForUser,
  getSavedExternalActivity,
  saveExternalActivitySync,
} = require('../services/externalActivityService');

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

async function syncMyExternalActivity(req, res) {
  try {
    const collection = await collectExternalActivityForUser(req.user);

    if (!collection.hasTasks) {
      return res.status(400).json({
        success: false,
        partialSuccess: false,
        message: '연동된 외부 계정이 없습니다. 먼저 GitHub, 백준, Dreamhack 계정을 연동해주세요.',
        data: {},
        errors: {},
      });
    }

    const saved = await saveExternalActivitySync(req.user.id, collection);

    if (collection.successCount === 0) {
      return res.status(502).json({
        success: false,
        partialSuccess: false,
        message: '연동된 외부 활동 데이터 수집에 모두 실패했습니다.',
        data: collection.data,
        errors: collection.errors,
        saved,
      });
    }

    return res.json({
      success: true,
      partialSuccess: collection.partialSuccess,
      message: collection.errorCount > 0
        ? '일부 외부 활동 데이터만 수집되어 DB에 기록되었습니다.'
        : '연동된 외부 활동 데이터를 모두 수집하여 DB에 저장했습니다.',
      data: collection.data,
      errors: collection.errors,
      saved,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.publicMessage || '외부 활동 데이터 동기화에 실패했습니다.',
      error: error.message,
    });
  }
}

async function getMyExternalActivity(req, res) {
  try {
    const saved = await getSavedExternalActivity(req.user.id);

    return res.json({
      success: true,
      data: saved,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.publicMessage || '저장된 외부 활동 데이터를 불러오지 못했습니다.',
      error: error.message,
    });
  }
}

module.exports = {
  getMe,
  disconnectAccountLink,
  getMyExternalActivity,
  syncMyExternalActivity,
};
