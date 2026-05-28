const recruitmentService = require('../services/recruitmentService');

async function createRecruitment(req, res) {
  try {
    const recruitment = await recruitmentService.createRecruitment(req.user.id, req.body);

    res.status(201).json({
      success: true,
      data: { recruitment },
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.publicMessage || '모집글 생성에 실패했습니다.',
      error: error.message,
    });
  }
}

async function getRecruitments(req, res) {
  try {
    const result = await recruitmentService.getRecruitments(req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.publicMessage || '모집글 목록 조회에 실패했습니다.',
      error: error.message,
    });
  }
}

async function getRecruitmentById(req, res) {
  try {
    const recruitment = await recruitmentService.getRecruitmentById(req.params.id);

    res.json({
      success: true,
      data: { recruitment },
    });
  } catch (error) {
    res.status(error.statusCode || 404).json({
      success: false,
      message: error.publicMessage || '모집글 조회에 실패했습니다.',
      error: error.message,
    });
  }
}

async function updateRecruitment(req, res) {
  try {
    const recruitment = await recruitmentService.updateRecruitment(req.params.id, req.user.id, req.body);

    res.json({
      success: true,
      data: { recruitment },
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.publicMessage || '모집글 수정에 실패했습니다.',
      error: error.message,
    });
  }
}

async function deleteRecruitment(req, res) {
  try {
    await recruitmentService.deleteRecruitment(req.params.id, req.user.id);

    res.status(204).send();
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.publicMessage || '모집글 삭제에 실패했습니다.',
      error: error.message,
    });
  }
}

module.exports = {
  createRecruitment,
  deleteRecruitment,
  getRecruitmentById,
  getRecruitments,
  updateRecruitment,
};
