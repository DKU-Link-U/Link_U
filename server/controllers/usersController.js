const prisma = require('../config/prisma');
const { getMyCommunityRecruitments } = require('../services/communityService');
const { toSafeUser } = require('../services/authService');
const { unlinkExternalAccount } = require('../services/accountLinkService');
const {
  collectExternalActivityForUser,
  getSavedExternalActivity,
  getUserRatingHistory,
  saveExternalActivitySync,
} = require('../services/externalActivityService');

const PROFILE_FIELDS = [
  'nickname',
  'department',
  'oneLiner',
  'techStack',
  'interestArea',
  'profileImage',
];

const DEPARTMENT_OPTIONS = new Set([
  '소프트웨어학과',
  '컴퓨터공학과',
  '통계데이터사이언스학과',
  '사이버보안학과',
  '인공지능학과',
  'AI건축융합학과',
  '모바일시스템공학과',
  '기타',
]);

function normalizeOptionalString(value) {
  if (value === undefined) return undefined;
  const normalized = String(value || '').trim();
  return normalized || null;
}

function mapAccountLinks(user) {
  return {
    github: {
      username: user.githubId || '',
      verified: Boolean(user.githubId),
    },
    boj: {
      username: user.bojId || '',
      verified: Boolean(user.bojId),
    },
    dreamhack: {
      username: user.dreamhackId || '',
      verified: Boolean(user.dreamhackId),
    },
  };
}

function getMe(req, res) {
  res.json({
    success: true,
    data: {
      user: toSafeUser(req.user),
    },
  });
}

function getAccountLinks(req, res) {
  res.json({
    success: true,
    data: {
      user: toSafeUser(req.user),
      accountLinks: mapAccountLinks(req.user),
    },
  });
}

async function updateMe(req, res) {
  try {
    const data = {};

    PROFILE_FIELDS.forEach((field) => {
      const value = normalizeOptionalString(req.body?.[field]);

      if (value !== undefined) {
        data[field] = value;
      }
    });

    if (data.department && !DEPARTMENT_OPTIONS.has(data.department)) {
      return res.status(400).json({
        success: false,
        message: '지원하지 않는 학과입니다.',
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });

    return res.json({
      success: true,
      data: {
        user: toSafeUser(user),
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.publicMessage || '프로필 저장에 실패했습니다.',
      error: error.message,
    });
  }
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

async function getMyRatingHistory(req, res) {
  try {
    const history = await getUserRatingHistory(req.user.id, {
      limit: req.query.limit,
    });

    return res.json({
      success: true,
      data: {
        history,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.publicMessage || 'Failed to load rating history.',
      error: error.message,
    });
  }
}

async function getMyStudies(req, res) {
  try {
    const studies = await getMyCommunityRecruitments('STUDY', req.user.id);

    return res.json({
      success: true,
      data: studies,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.publicMessage || 'Failed to load my studies.',
      error: error.message,
    });
  }
}

async function getMyProjects(req, res) {
  try {
    const projects = await getMyCommunityRecruitments('PROJECT', req.user.id);

    return res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.publicMessage || 'Failed to load my projects.',
      error: error.message,
    });
  }
}

module.exports = {
  getAccountLinks,
  getMe,
  updateMe,
  disconnectAccountLink,
  getMyExternalActivity,
  getMyProjects,
  getMyRatingHistory,
  getMyStudies,
  syncMyExternalActivity,
};
