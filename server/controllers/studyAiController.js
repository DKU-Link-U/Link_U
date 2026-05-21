const { recommendStudiesForUser } = require('../services/geminiStudyService');

function handleError(res, error) {
  res.status(error.statusCode || 400).json({
    success: false,
    message: error.publicMessage || 'AI 스터디 추천 생성에 실패했습니다.',
    error: error.message,
  });
}

async function recommendStudies(req, res) {
  try {
    const recommendations = await recommendStudiesForUser(req.user.id);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    handleError(res, error);
  }
}

module.exports = {
  recommendStudies,
};
