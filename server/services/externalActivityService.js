const prisma = require('../config/prisma');
const github = require('../crawlers/github');
const solvedac = require('../crawlers/solvedac');
const dreamhack = require('../crawlers/dreamhack');
const {
  calculateAndSaveUserScore,
  calculateScoreFromStats,
  getSavedUserScore,
} = require('./scoreService');

const PLATFORM_LABELS = {
  github: 'GitHub',
  boj: 'Solved.ac',
  dreamhack: 'Dreamhack',
};

const PLATFORM_ENUMS = {
  github: 'GITHUB',
  boj: 'BOJ',
  dreamhack: 'DREAMHACK',
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function getKstRecordedDate(date = new Date()) {
  const shiftedDate = new Date(date.getTime() + KST_OFFSET_MS);

  return new Date(Date.UTC(
    shiftedDate.getUTCFullYear(),
    shiftedDate.getUTCMonth(),
    shiftedDate.getUTCDate(),
  ));
}

function toRatingHistoryData(userId, stats, syncedAt) {
  return {
    userId,
    recordedDate: getKstRecordedDate(syncedAt),
    totalRatingScore: toNumber(stats?.totalRatingScore),
    githubCommitCount: toNumber(stats?.githubCommitCount),
    githubPrCount: toNumber(stats?.githubPrCount),
    bojSolvedCount: toNumber(stats?.bojSolvedCount),
    bojTierNumber: stats?.bojTierNumber ?? null,
    bojRating: stats?.bojRating ?? null,
    dreamhackScore: toNumber(stats?.dreamhackScore),
    dreamhackSolvedCount: toNumber(stats?.dreamhackSolvedCount),
    dreamhackRank: stats?.dreamhackRank ?? null,
    recordedAt: syncedAt,
  };
}

function toRatingHistoryDto(item) {
  const date = item.recordedDate.toISOString().slice(0, 10);

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
}

function normalizeAccountId(value) {
  return String(value || '').trim();
}

function normalizeExternalIds(ids = {}) {
  return {
    github: normalizeAccountId(ids.githubId || ids.github),
    boj: normalizeAccountId(ids.bojId || ids.boj || ids.baekjoon),
    dreamhack: normalizeAccountId(ids.dhId || ids.dreamhackId || ids.dreamhack),
  };
}

function summarizeGithubActivity(data, accountId) {
  const profile = data?.profile || {};
  const stats = data?.stats || {};
  const login = profile.login || accountId;

  return {
    platform: 'github',
    accountId: login,
    displayName: profile.name || login,
    profileUrl: profile.html_url || `https://github.com/${encodeURIComponent(login)}`,
    avatarUrl: profile.avatar_url || null,
    githubCommitCount: toNumber(stats.totalCommits),
    githubPrCount: toNumber(stats.totalPRs),
    githubPublicRepoCount: toNumber(profile.public_repos),
    followers: toNumber(profile.followers),
    following: toNumber(profile.following),
  };
}

function summarizeBojActivity(data, accountId) {
  const handle = data?.handle || accountId;

  return {
    platform: 'boj',
    accountId: handle,
    displayName: handle,
    profileUrl: `https://solved.ac/profile/${encodeURIComponent(handle)}`,
    bojSolvedCount: toNumber(data?.solvedCount),
    bojTierNumber: toNumber(data?.tier),
    bojRating: toNumber(data?.rating),
    bojRank: toNumber(data?.rank),
    class: toNumber(data?.class),
  };
}

function summarizeDreamhackActivity(data, accountId) {
  const nickname = data?.nickname || accountId;
  const wargame = data?.wargame || {};
  const contributions = data?.contributions || {};

  return {
    platform: 'dreamhack',
    accountId: nickname,
    displayName: nickname,
    profileUrl: `https://dreamhack.io/users/${encodeURIComponent(nickname)}`,
    dreamhackScore: toNumber(wargame.score),
    dreamhackRank: toNumber(wargame.rank),
    dreamhackSolvedCount: toNumber(wargame.solvedCount),
    dreamhackContributionLevel: toNumber(contributions.level),
    dreamhackContributionRank: toNumber(contributions.rank),
  };
}

function summarizePlatformActivity(platform, data, accountId) {
  if (platform === 'github') return summarizeGithubActivity(data, accountId);
  if (platform === 'boj') return summarizeBojActivity(data, accountId);
  if (platform === 'dreamhack') return summarizeDreamhackActivity(data, accountId);

  return {
    platform,
    accountId,
  };
}

async function collectPlatformData(platform, accountId, loader) {
  try {
    const data = await loader();

    return {
      platform,
      platformName: PLATFORM_LABELS[platform],
      accountId,
      ok: true,
      data,
      summary: summarizePlatformActivity(platform, data, accountId),
    };
  } catch (error) {
    console.error(`[${PLATFORM_LABELS[platform]}] 데이터 수집 실패:`, error.message);

    return {
      platform,
      platformName: PLATFORM_LABELS[platform],
      accountId,
      ok: false,
      error: error.publicMessage || error.message,
    };
  }
}

async function collectExternalActivityByIds(ids) {
  const normalizedIds = normalizeExternalIds(ids);
  const tasks = [];

  if (normalizedIds.github) {
    tasks.push(collectPlatformData('github', normalizedIds.github, async () => {
      const [profile, stats] = await Promise.all([
        github.getUserProfile(normalizedIds.github),
        github.getUserContributionStats(normalizedIds.github),
      ]);

      return { profile, stats };
    }));
  }

  if (normalizedIds.boj) {
    tasks.push(collectPlatformData('boj', normalizedIds.boj, () => solvedac.getUserInfo(normalizedIds.boj)));
  }

  if (normalizedIds.dreamhack) {
    tasks.push(collectPlatformData('dreamhack', normalizedIds.dreamhack, () => dreamhack.getUserStats(normalizedIds.dreamhack)));
  }

  if (tasks.length === 0) {
    return {
      hasTasks: false,
      results: [],
      data: {},
      errors: {},
      successCount: 0,
      errorCount: 0,
      partialSuccess: false,
    };
  }

  const results = await Promise.all(tasks);
  const data = {};
  const errors = {};

  results.forEach((result) => {
    if (result.ok) {
      data[result.platform] = result.data;
      return;
    }

    errors[result.platform] = {
      platform: result.platformName,
      message: result.error,
    };
  });

  const successCount = Object.keys(data).length;
  const errorCount = Object.keys(errors).length;

  return {
    hasTasks: true,
    results,
    data,
    errors,
    successCount,
    errorCount,
    partialSuccess: errorCount > 0,
  };
}

async function collectExternalActivityForUser(user) {
  return collectExternalActivityByIds({
    githubId: user.githubId,
    bojId: user.bojId,
    dreamhackId: user.dreamhackId,
  });
}

function applySummaryToStats(stats, summary) {
  if (summary.platform === 'github') {
    stats.githubCommitCount = summary.githubCommitCount;
    stats.githubPrCount = summary.githubPrCount;
    stats.githubPublicRepoCount = summary.githubPublicRepoCount;
  }

  if (summary.platform === 'boj') {
    stats.bojSolvedCount = summary.bojSolvedCount;
    stats.bojTierNumber = summary.bojTierNumber;
    stats.bojRating = summary.bojRating;
    stats.bojRank = summary.bojRank;
  }

  if (summary.platform === 'dreamhack') {
    stats.dreamhackScore = summary.dreamhackScore;
    stats.dreamhackSolvedCount = summary.dreamhackSolvedCount;
    stats.dreamhackRank = summary.dreamhackRank;
    stats.dreamhackContributionLevel = summary.dreamhackContributionLevel;
    stats.dreamhackContributionRank = summary.dreamhackContributionRank;
  }
}

async function upsertUserActivityStats(userId, summaries, syncedAt) {
  const currentStats = await prisma.userActivityStats.findUnique({
    where: { userId },
  });
  const mergedStats = {
    githubCommitCount: currentStats?.githubCommitCount ?? 0,
    githubPrCount: currentStats?.githubPrCount ?? 0,
    githubPublicRepoCount: currentStats?.githubPublicRepoCount ?? 0,
    bojSolvedCount: currentStats?.bojSolvedCount ?? 0,
    bojTierNumber: currentStats?.bojTierNumber ?? null,
    bojRating: currentStats?.bojRating ?? null,
    bojRank: currentStats?.bojRank ?? null,
    dreamhackScore: currentStats?.dreamhackScore ?? 0,
    dreamhackSolvedCount: currentStats?.dreamhackSolvedCount ?? 0,
    dreamhackRank: currentStats?.dreamhackRank ?? null,
    dreamhackContributionLevel: currentStats?.dreamhackContributionLevel ?? 0,
    dreamhackContributionRank: currentStats?.dreamhackContributionRank ?? null,
  };

  summaries.forEach((summary) => applySummaryToStats(mergedStats, summary));

  mergedStats.totalRatingScore = calculateScoreFromStats(mergedStats).totalScore;
  mergedStats.lastSyncedAt = syncedAt;

  return prisma.userActivityStats.upsert({
    where: { userId },
    create: {
      userId,
      ...mergedStats,
    },
    update: mergedStats,
  });
}

async function upsertUserRatingHistory(userId, stats, syncedAt) {
  if (!stats) return null;

  const data = toRatingHistoryData(userId, stats, syncedAt);

  return prisma.userRatingHistory.upsert({
    where: {
      userId_recordedDate: {
        userId,
        recordedDate: data.recordedDate,
      },
    },
    create: data,
    update: {
      totalRatingScore: data.totalRatingScore,
      githubCommitCount: data.githubCommitCount,
      githubPrCount: data.githubPrCount,
      bojSolvedCount: data.bojSolvedCount,
      bojTierNumber: data.bojTierNumber,
      bojRating: data.bojRating,
      dreamhackScore: data.dreamhackScore,
      dreamhackSolvedCount: data.dreamhackSolvedCount,
      dreamhackRank: data.dreamhackRank,
      recordedAt: data.recordedAt,
    },
  });
}

async function saveExternalActivitySync(userId, collection) {
  const syncedAt = new Date();
  const snapshots = await Promise.all(collection.results.map((result) => prisma.externalActivitySnapshot.create({
    data: {
      userId,
      platform: PLATFORM_ENUMS[result.platform],
      accountId: result.summary?.accountId || result.accountId,
      status: result.ok ? 'SUCCESS' : 'FAILED',
      rawData: result.ok ? result.data : undefined,
      summary: result.ok ? result.summary : undefined,
      errorMessage: result.ok ? null : result.error,
      syncedAt,
    },
  })));
  const summaries = collection.results
    .filter((result) => result.ok)
    .map((result) => result.summary);
  const stats = summaries.length > 0
    ? await upsertUserActivityStats(userId, summaries, syncedAt)
    : await prisma.userActivityStats.findUnique({ where: { userId } });
  const ratingHistory = summaries.length > 0
    ? await upsertUserRatingHistory(userId, stats, syncedAt)
    : null;
  const savedScore = stats
    ? await calculateAndSaveUserScore(userId, stats, syncedAt)
    : await getSavedUserScore(userId);

  return {
    snapshots,
    stats,
    ratingHistory: ratingHistory ? toRatingHistoryDto(ratingHistory) : null,
    score: savedScore.score,
    scoreSnapshot: savedScore.snapshot || null,
    scoreHistory: savedScore.scoreHistory || [],
  };
}

async function getUserRatingHistory(userId, { limit = 30 } = {}) {
  const take = Math.min(Math.max(Number(limit) || 30, 1), 90);
  const history = await prisma.userRatingHistory.findMany({
    where: { userId },
    orderBy: { recordedDate: 'desc' },
    take,
  });

  return history.reverse().map(toRatingHistoryDto);
}

async function getSavedExternalActivity(userId) {
  const [stats, snapshots, ratingHistory, savedScore] = await Promise.all([
    prisma.userActivityStats.findUnique({ where: { userId } }),
    prisma.externalActivitySnapshot.findMany({
      where: { userId },
      orderBy: { syncedAt: 'desc' },
      take: 30,
    }),
    getUserRatingHistory(userId),
    getSavedUserScore(userId),
  ]);

  return {
    stats,
    snapshots,
    ratingHistory,
    score: savedScore.score,
    scoreHistory: savedScore.scoreHistory,
  };
}

module.exports = {
  collectExternalActivityByIds,
  collectExternalActivityForUser,
  getSavedExternalActivity,
  getUserRatingHistory,
  saveExternalActivitySync,
};
