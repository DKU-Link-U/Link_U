const github = require('../crawlers/github');
const solvedac = require('../crawlers/solvedac');
const dreamhack = require('../crawlers/dreamhack');

const PLATFORM_LABELS = {
  github: 'GitHub',
  boj: 'Solved.ac',
  dreamhack: 'Dreamhack',
};

async function collectPlatformData(platform, loader) {
  try {
    return {
      platform,
      ok: true,
      data: await loader(),
    };
  } catch (error) {
    console.error(`[${PLATFORM_LABELS[platform]}] 데이터 수집 실패:`, error.message);
    return {
      platform,
      ok: false,
      error: error.message,
    };
  }
}

/**
 * 선택된 GitHub, Solved.ac, Dreamhack 데이터를 수집하여 반환합니다.
 */
async function getIntegratedUserData(req, res) {
  const githubId = req.params.githubId ?? req.query.githubId;
  const bojId = req.params.bojId ?? req.query.bojId;
  const dhId = req.params.dhId ?? req.query.dhId;
  const tasks = [];

  if (githubId) {
    tasks.push(collectPlatformData('github', async () => {
      const [profile, stats] = await Promise.all([
        github.getUserProfile(githubId),
        github.getUserContributionStats(githubId),
      ]);

      return { profile, stats };
    }));
  }

  if (bojId) {
    tasks.push(collectPlatformData('boj', () => solvedac.getUserInfo(bojId)));
  }

  if (dhId) {
    tasks.push(collectPlatformData('dreamhack', () => dreamhack.getUserStats(dhId)));
  }

  if (tasks.length === 0) {
    res.status(400).json({
      success: false,
      partialSuccess: false,
      message: '조회할 외부 플랫폼 아이디가 없습니다.',
      data: {},
      errors: {},
    });
    return;
  }

  const results = await Promise.all(tasks);

  const data = {};
  const errors = {};

  results.forEach(result => {
    if (result.ok) {
      data[result.platform] = result.data;
      return;
    }

    errors[result.platform] = {
      platform: PLATFORM_LABELS[result.platform],
      message: result.error,
    };
  });

  const successCount = Object.keys(data).length;
  const errorCount = Object.keys(errors).length;

  if (successCount === 0) {
    res.status(502).json({
      success: false,
      partialSuccess: false,
      message: '선택한 외부 활동 데이터 수집에 모두 실패했습니다.',
      data,
      errors,
    });
    return;
  }

  res.json({
    success: true,
    partialSuccess: errorCount > 0,
    message: errorCount > 0
      ? '일부 외부 활동 데이터만 수집되었습니다.'
      : '선택한 외부 활동 데이터를 모두 수집했습니다.',
    data,
    errors,
  });
}

module.exports = {
  getIntegratedUserData,
};
