const prisma = require('../config/prisma');

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function getTier(score) {
  if (score >= 2500) return 'Diamond';
  if (score >= 1600) return 'Platinum';
  if (score >= 900) return 'Gold';
  if (score >= 400) return 'Silver';
  return 'Bronze';
}

function mapRankingUser(user, index) {
  const stats = user.activityStats;
  const score = toNumber(stats?.totalRatingScore);

  return {
    userId: user.id,
    nickname: user.nickname || user.name || user.email.split('@')[0],
    name: user.name,
    email: user.email,
    department: user.department || '미지정',
    score,
    tier: getTier(score),
    rank: index + 1,
    githubId: user.githubId,
    bojId: user.bojId,
    dreamhackId: user.dreamhackId,
    stats: {
      githubCommitCount: toNumber(stats?.githubCommitCount),
      githubPrCount: toNumber(stats?.githubPrCount),
      bojSolvedCount: toNumber(stats?.bojSolvedCount),
      bojTierNumber: stats?.bojTierNumber ?? null,
      bojRating: stats?.bojRating ?? null,
      dreamhackScore: toNumber(stats?.dreamhackScore),
      dreamhackSolvedCount: toNumber(stats?.dreamhackSolvedCount),
      dreamhackRank: stats?.dreamhackRank ?? null,
      lastSyncedAt: stats?.lastSyncedAt ?? null,
    },
  };
}

async function getRankedUsers({ department } = {}) {
  const users = await prisma.user.findMany({
    where: department
      ? {
          department,
        }
      : undefined,
    include: {
      activityStats: true,
    },
  });

  return users
    .map((user) => ({
      user,
      score: toNumber(user.activityStats?.totalRatingScore),
      lastSyncedAt: user.activityStats?.lastSyncedAt?.getTime?.() || 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.lastSyncedAt !== a.lastSyncedAt) return b.lastSyncedAt - a.lastSyncedAt;
      return a.user.nickname?.localeCompare(b.user.nickname || '') || 0;
    })
    .map(({ user }, index) => mapRankingUser(user, index));
}

function buildDepartmentRankings(users) {
  const groups = users.reduce((map, user) => {
    const department = user.department || '미지정';
    const current = map.get(department) || {
      department,
      totalScore: 0,
      memberCount: 0,
    };

    current.totalScore += user.score;
    current.memberCount += 1;
    map.set(department, current);

    return map;
  }, new Map());

  return [...groups.values()]
    .map((group) => ({
      department: group.department,
      memberCount: group.memberCount,
      avgScore: group.memberCount > 0 ? Math.round(group.totalScore / group.memberCount) : 0,
    }))
    .sort((a, b) => b.avgScore - a.avgScore || b.memberCount - a.memberCount)
    .map((group, index) => ({
      rank: index + 1,
      ...group,
    }));
}

async function listRankings(req, res) {
  try {
    const { scope, department } = req.query;
    const users = await getRankedUsers({
      department: scope === 'department' ? department : undefined,
    });

    if (scope === 'departments') {
      return res.json({
        success: true,
        data: buildDepartmentRankings(users),
      });
    }

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '랭킹 데이터를 불러오지 못했습니다.',
      error: error.message,
    });
  }
}

async function getRankingUser(req, res) {
  try {
    const users = await getRankedUsers();
    const user = users.find((item) => item.userId === req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '랭킹 사용자를 찾을 수 없습니다.',
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '랭킹 사용자를 불러오지 못했습니다.',
      error: error.message,
    });
  }
}

module.exports = {
  getRankingUser,
  listRankings,
};
