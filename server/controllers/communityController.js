const communityService = require('../services/communityService');

function handleError(res, error, fallbackMessage) {
  res.status(error.statusCode || 400).json({
    success: false,
    message: error.publicMessage || fallbackMessage,
    error: error.message,
  });
}

function createCommunityController(type) {
  return {
    async create(req, res) {
      try {
        const item = await communityService.createCommunityRecruitment(type, req.user.id, req.body);

        res.status(201).json({
          success: true,
          data: item,
        });
      } catch (error) {
        handleError(res, error, '모집글 생성에 실패했습니다.');
      }
    },

    async getList(req, res) {
      try {
        const items = await communityService.getCommunityRecruitments(type, req.query);

        res.json({
          success: true,
          data: items,
        });
      } catch (error) {
        handleError(res, error, '모집글 목록 조회에 실패했습니다.');
      }
    },

    async getDetail(req, res) {
      try {
        const item = await communityService.getCommunityRecruitmentById(type, req.params.id);

        res.json({
          success: true,
          data: item,
        });
      } catch (error) {
        handleError(res, error, '모집글 조회에 실패했습니다.');
      }
    },

    async apply(req, res) {
      try {
        const application = await communityService.applyCommunityRecruitment(type, req.params.id, req.user.id, req.body);

        res.status(201).json({
          success: true,
          data: application,
        });
      } catch (error) {
        handleError(res, error, '지원 신청에 실패했습니다.');
      }
    },

    async getApplications(req, res) {
      try {
        const applications = await communityService.getCommunityApplications(type, req.params.id, req.user.id);

        res.json({
          success: true,
          data: applications,
        });
      } catch (error) {
        handleError(res, error, '지원자 목록 조회에 실패했습니다.');
      }
    },
  };
}

module.exports = {
  createCommunityController,
};
