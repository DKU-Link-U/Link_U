const { collectExternalActivityByIds } = require('../services/externalActivityService');

/**
 * GitHub, Solved.ac, Dreamhack 데이터를 한 번에 수집하여 반환합니다.
 */
async function getIntegratedUserData(req, res) {
  const githubId = req.params.githubId ?? req.query.githubId;
  const bojId = req.params.bojId ?? req.query.bojId;
  const dhId = req.params.dhId ?? req.query.dhId;

  try {
    const collection = await collectExternalActivityByIds({ githubId, bojId, dhId });

    if (!collection.hasTasks) {
      return res.status(400).json({
        success: false,
        partialSuccess: false,
        message: '조회할 외부 플랫폼 아이디가 없습니다.',
        data: {},
        errors: {},
      });
    }

    if (collection.successCount === 0) {
      return res.status(502).json({
        success: false,
        partialSuccess: false,
        message: '선택한 외부 활동 데이터 수집에 모두 실패했습니다.',
        data: collection.data,
        errors: collection.errors,
      });
    }

    return res.json({
      success: true,
      partialSuccess: collection.partialSuccess,
      message: collection.errorCount > 0
        ? '일부 외부 활동 데이터만 수집되었습니다.'
        : '선택한 외부 활동 데이터를 모두 수집했습니다.',
      data: collection.data,
      errors: collection.errors,
    });
  } catch (error) {
    console.error('[API Error] 데이터 통합 조회 실패:', error.message);
    return res.status(500).json({
      success: false,
      message: '데이터 수집 도중 오류가 발생했습니다.',
      error: error.message,
    });
  }
}

module.exports = {
  getIntegratedUserData,
};
