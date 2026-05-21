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

function toDateKey(dateValue) {
  if (!dateValue) return '';

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

function mapRatingHistory(history = []) {
  return [...history]
    .sort((left, right) => {
      const leftDate = left.recordedDate?.getTime?.() || 0;
      const rightDate = right.recordedDate?.getTime?.() || 0;

      return leftDate - rightDate;
    })
    .map((item) => {
      const date = toDateKey(item.recordedDate);

      return {
        id: item.id,
        date,
        month: date.slice(5),
        score: item.totalRatingScore,
        totalRatingScore: item.totalRatingScore,
        githubCommitCount: item.githubCommitCount,
        githubPrCount: item.githubPrCount,
        bojSolvedCount: item.bojSolvedCount,
        bojTierNumber: item.bojTierNumber,
        bojRating: item.bojRating,
        dreamhackScore: item.dreamhackScore,
        dreamhackSolvedCount: item.dreamhackSolvedCount,
        dreamhackRank: item.dreamhackRank,
        recordedAt: item.recordedAt,
      };
    });
}

function mapGithubCommitActivity(snapshot) {
  const dailyCommits = snapshot?.summary?.dailyCommits ?? snapshot?.rawData?.stats?.dailyCommits;

  if (!Array.isArray(dailyCommits)) return [];

  return dailyCommits
    .map((day) => ({
      date: day.date,
      github: toNumber(day.github ?? day.count),
    }))
    .filter((day) => day.date);
}

function getSyncedPlatforms(user) {
  const stats = user.activityStats;

  return {
    github: Boolean(
      user.githubId
        || toNumber(stats?.githubCommitCount)
        || toNumber(stats?.githubPrCount)
        || toNumber(stats?.githubPublicRepoCount),
    ),
    baekjoon: Boolean(
      user.bojId
        || toNumber(stats?.bojSolvedCount)
        || toNumber(stats?.bojTierNumber)
        || toNumber(stats?.bojRating),
    ),
    dreamhack: Boolean(
      user.dreamhackId
        || toNumber(stats?.dreamhackScore)
        || toNumber(stats?.dreamhackSolvedCount)
        || toNumber(stats?.dreamhackContributionLevel),
    ),
  };
}

function mapRankingUser(user, index, { includeDetails = false } = {}) {
  const stats = user.activityStats;
  const scoreRecord = user.score;
  const score = toNumber(scoreRecord?.totalScore ?? stats?.totalRatingScore);
  const rankingUser = {
    userId: user.id,
    nickname: user.nickname || user.name || user.email.split('@')[0],
    name: user.name,
    email: user.email,
    department: user.department || '미지정',
    year: user.year,
    university: '단국대학교',
    oneLiner: user.oneLiner,
    techStack: user.techStack,
    interestArea: user.interestArea,
    profileImage: user.profileImage,
    score,
    tier: getTier(score),
    rank: index + 1,
    githubId: user.githubId,
    bojId: user.bojId,
    dreamhackId: user.dreamhackId,
    syncedPlatforms: getSyncedPlatforms(user),
    fieldStats: scoreRecord?.fieldDisplayScores ?? {},
    scoreBreakdown: scoreRecord
      ? {
          githubScore: scoreRecord.githubScore,
          bojScore: scoreRecord.bojScore,
          dreamhackScore: scoreRecord.dreamhackScore,
          algorithmScore: scoreRecord.algorithmScore,
          securityScore: scoreRecord.securityScore,
          implementationScore: scoreRecord.implementationScore,
          collaborationScore: scoreRecord.collaborationScore,
          problemSolvingScore: scoreRecord.problemSolvingScore,
          activityScore: scoreRecord.activityScore,
          scoreVersion: scoreRecord.scoreVersion,
          calculatedAt: scoreRecord.calculatedAt,
        }
      : null,
    stats: {
      githubCommitCount: toNumber(stats?.githubCommitCount),
      githubPrCount: toNumber(stats?.githubPrCount),
      githubPublicRepoCount: toNumber(stats?.githubPublicRepoCount),
      bojSolvedCount: toNumber(stats?.bojSolvedCount),
      bojTierNumber: stats?.bojTierNumber ?? null,
      bojRating: stats?.bojRating ?? null,
      bojRank: stats?.bojRank ?? null,
      dreamhackScore: toNumber(stats?.dreamhackScore),
      dreamhackSolvedCount: toNumber(stats?.dreamhackSolvedCount),
      dreamhackRank: stats?.dreamhackRank ?? null,
      dreamhackContributionLevel: toNumber(stats?.dreamhackContributionLevel),
      dreamhackContributionRank: stats?.dreamhackContributionRank ?? null,
      lastSyncedAt: stats?.lastSyncedAt ?? null,
    },
  };

  if (!includeDetails) {
    return rankingUser;
  }

  return {
    ...rankingUser,
    ratingHistory: mapRatingHistory(user.ratingHistory ?? []),
    commitActivity: mapGithubCommitActivity(user.activitySnapshots?.[0]),
  };
}

async function getRankedUsers({ department, includeDetails = false } = {}) {
  const users = await prisma.user.findMany({
    where: department
      ? {
          department,
        }
      : undefined,
    include: {
      activityStats: true,
      score: true,
      ...(includeDetails
        ? {
            activitySnapshots: {
              where: {
                platform: 'GITHUB',
                status: 'SUCCESS',
              },
              orderBy: {
                syncedAt: 'desc',
              },
              take: 1,
            },
            ratingHistory: {
              orderBy: {
                recordedDate: 'desc',
              },
              take: 30,
            },
          }
        : {}),
    },
  });

  return users
    .map((user) => ({
      user,
      score: toNumber(user.score?.totalScore ?? user.activityStats?.totalRatingScore),
      lastSyncedAt: user.activityStats?.lastSyncedAt?.getTime?.() || 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.lastSyncedAt !== a.lastSyncedAt) return b.lastSyncedAt - a.lastSyncedAt;
      return a.user.nickname?.localeCompare(b.user.nickname || '') || 0;
    })
    .map(({ user }, index) => mapRankingUser(user, index, { includeDetails }));
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
    const users = await getRankedUsers({ includeDetails: true });
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
