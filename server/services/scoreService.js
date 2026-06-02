const prisma = require('../config/prisma');

const SCORE_VERSION = '2026-06-02-v1';

const FIELD_DISPLAY_THRESHOLDS = {
  algorithm: 1500,
  security: 1500,
  implementation: 1000,
  collaboration: 500,
  problemSolving: 1600,
  activity: 1000,
};

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function toDisplayScore(rawScore, threshold) {
  if (!threshold) return 0;

  return Math.min(100, Math.max(0, Math.round((toNumber(rawScore) / threshold) * 100)));
}

function calculateScoreFromStats(stats = {}) {
  const githubCommitCount = toNumber(stats.githubCommitCount);
  const githubPrCount = toNumber(stats.githubPrCount);
  const githubPublicRepoCount = toNumber(stats.githubPublicRepoCount);
  const bojSolvedCount = toNumber(stats.bojSolvedCount);
  const bojTierNumber = toNumber(stats.bojTierNumber);
  const bojRating = toNumber(stats.bojRating);
  const rawDreamhackScore = toNumber(stats.dreamhackScore);
  const dreamhackSolvedCount = toNumber(stats.dreamhackSolvedCount);
  const dreamhackContributionLevel = toNumber(stats.dreamhackContributionLevel);

  const implementationScore = Math.round(
    githubCommitCount * 2
      + githubPublicRepoCount * 10,
  );
  const collaborationScore = Math.round(githubPrCount * 25);
  const githubScore = implementationScore + collaborationScore;

  const algorithmScore = Math.round(
    bojSolvedCount * 3
      + bojTierNumber * 30
      + bojRating * 0.1,
  );
  const bojScore = algorithmScore;

  const securityScore = Math.round(
    rawDreamhackScore
      + dreamhackSolvedCount * 20
      + dreamhackContributionLevel * 50,
  );
  const dreamhackScore = securityScore;

  const problemSolvingScore = Math.round(
    algorithmScore * 0.7
      + securityScore * 0.3,
  );
  const activityScore = Math.round(
    githubCommitCount
      + githubPrCount * 10
      + bojSolvedCount
      + dreamhackSolvedCount * 5,
  );
  const totalScore = githubScore + bojScore + dreamhackScore;

  const fieldRawScores = {
    algorithm: algorithmScore,
    security: securityScore,
    implementation: implementationScore,
    collaboration: collaborationScore,
    problemSolving: problemSolvingScore,
    activity: activityScore,
  };
  const fieldDisplayScores = Object.fromEntries(
    Object.entries(fieldRawScores).map(([key, score]) => [
      key,
      toDisplayScore(score, FIELD_DISPLAY_THRESHOLDS[key]),
    ]),
  );

  return {
    totalScore,
    githubScore,
    bojScore,
    dreamhackScore,
    algorithmScore,
    securityScore,
    implementationScore,
    collaborationScore,
    problemSolvingScore,
    activityScore,
    fieldRawScores,
    fieldDisplayScores,
    scoreVersion: SCORE_VERSION,
  };
}

function sortRankableUsers(users) {
  return users
    .map((user) => ({
      id: user.id,
      department: user.department || null,
      nickname: user.nickname || user.name || user.email?.split('@')[0] || '',
      score: toNumber(user.score?.totalScore ?? user.activityStats?.totalRatingScore),
      lastSyncedAt: user.activityStats?.lastSyncedAt?.getTime?.() || 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.lastSyncedAt !== a.lastSyncedAt) return b.lastSyncedAt - a.lastSyncedAt;
      return a.nickname.localeCompare(b.nickname);
    });
}

async function getCurrentRanks(userId) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      nickname: true,
      department: true,
      activityStats: {
        select: {
          totalRatingScore: true,
          lastSyncedAt: true,
        },
      },
      score: {
        select: {
          totalScore: true,
        },
      },
    },
  });
  const rankedUsers = sortRankableUsers(users);
  const targetUser = rankedUsers.find((user) => user.id === userId);

  if (!targetUser) {
    return {
      rankOverall: null,
      rankDepartment: null,
    };
  }

  const departmentUsers = targetUser.department
    ? rankedUsers.filter((user) => user.department === targetUser.department)
    : [];

  return {
    rankOverall: rankedUsers.findIndex((user) => user.id === userId) + 1,
    rankDepartment: departmentUsers.length > 0
      ? departmentUsers.findIndex((user) => user.id === userId) + 1
      : null,
  };
}

async function getSavedUserScore(userId) {
  const [score, recentScoreHistory] = await Promise.all([
    prisma.userScore.findUnique({ where: { userId } }),
    prisma.userScoreSnapshot.findMany({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
      take: 24,
    }),
  ]);

  return {
    score,
    scoreHistory: recentScoreHistory.reverse(),
  };
}

async function calculateAndSaveUserScore(userId, stats, calculatedAt = new Date()) {
  const scoreData = calculateScoreFromStats(stats);
  const previousSnapshot = await prisma.userScoreSnapshot.findFirst({
    where: { userId },
    orderBy: { calculatedAt: 'desc' },
  });

  const score = await prisma.userScore.upsert({
    where: { userId },
    create: {
      userId,
      ...scoreData,
      calculatedAt,
    },
    update: {
      ...scoreData,
      calculatedAt,
    },
  });
  const ranks = await getCurrentRanks(userId);
  const scoreDelta = previousSnapshot
    ? scoreData.totalScore - previousSnapshot.totalScore
    : 0;
  const rankDelta = previousSnapshot?.rankOverall && ranks.rankOverall
    ? previousSnapshot.rankOverall - ranks.rankOverall
    : null;
  const snapshot = await prisma.userScoreSnapshot.create({
    data: {
      userId,
      ...scoreData,
      ...ranks,
      scoreDelta,
      rankDelta,
      calculatedAt,
    },
  });
  const { scoreHistory } = await getSavedUserScore(userId);

  return {
    score,
    snapshot,
    scoreHistory,
  };
}

module.exports = {
  SCORE_VERSION,
  calculateAndSaveUserScore,
  calculateScoreFromStats,
  getSavedUserScore,
};
