const github = require('../crawlers/github');
const solvedac = require('../crawlers/solvedac');
const dreamhack = require('../crawlers/dreamhack');

/**
 * GitHub, Solved.ac, Dreamhack 데이터를 한 번에 수집하여 반환합니다.
 */
async function getIntegratedUserData(req, res) {
  const { githubId, bojId, dhId } = req.params;

  try {
    const [ghProfile, ghStats, bojInfo, dhStats] = await Promise.all([
      github.getUserProfile(githubId),
      github.getUserContributionStats(githubId),
      solvedac.getUserInfo(bojId),
      dreamhack.getUserStats(dhId),
    ]);

    res.json({
      success: true,
      data: {
        github: {
          profile: ghProfile,
          stats: ghStats,
        },
        boj: bojInfo,
        dreamhack: dhStats,
      },
    });
  } catch (error) {
    console.error('[API Error] 데이터 통합 조회 실패:', error.message);
    res.status(500).json({
      success: false,
      message: '데이터 수집 도중 오류가 발생했습니다.',
      error: error.message,
    });
  }
}

module.exports = {
  getIntegratedUserData,
};
