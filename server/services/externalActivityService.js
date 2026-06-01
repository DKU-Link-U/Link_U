const prisma = require('../config/prisma');
const github = require('../crawlers/github');
const solvedac = require('../crawlers/solvedac');
const dreamhack = require('../crawlers/dreamhack');

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

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
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

function calculateTotalRatingScore(stats) {
  return Math.round(
    toNumber(stats.githubCommitCount) * 1.2
      + toNumber(stats.githubPrCount) * 5
      + toNumber(stats.bojSolvedCount) * 2.5
      + toNumber(stats.bojRating) * 0.35
      + toNumber(stats.dreamhackScore) * 0.4
      + toNumber(stats.dreamhackSolvedCount) * 3,
  );
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
    publicRepos: toNumber(profile.public_repos),
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
  }

  if (summary.platform === 'boj') {
    stats.bojSolvedCount = summary.bojSolvedCount;
    stats.bojTierNumber = summary.bojTierNumber;
    stats.bojRating = summary.bojRating;
  }

  if (summary.platform === 'dreamhack') {
    stats.dreamhackScore = summary.dreamhackScore;
    stats.dreamhackSolvedCount = summary.dreamhackSolvedCount;
    stats.dreamhackRank = summary.dreamhackRank;
  }
}

async function upsertUserActivityStats(userId, summaries, syncedAt) {
  const currentStats = await prisma.userActivityStats.findUnique({
    where: { userId },
  });
  const mergedStats = {
    githubCommitCount: currentStats?.githubCommitCount ?? 0,
    githubPrCount: currentStats?.githubPrCount ?? 0,
    bojSolvedCount: currentStats?.bojSolvedCount ?? 0,
    bojTierNumber: currentStats?.bojTierNumber ?? null,
    bojRating: currentStats?.bojRating ?? null,
    dreamhackScore: currentStats?.dreamhackScore ?? 0,
    dreamhackSolvedCount: currentStats?.dreamhackSolvedCount ?? 0,
    dreamhackRank: currentStats?.dreamhackRank ?? null,
  };

  summaries.forEach((summary) => applySummaryToStats(mergedStats, summary));

  mergedStats.totalRatingScore = calculateTotalRatingScore(mergedStats);
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

  return {
    snapshots,
    stats,
  };
}

async function getSavedExternalActivity(userId) {
  const [stats, snapshots] = await Promise.all([
    prisma.userActivityStats.findUnique({ where: { userId } }),
    prisma.externalActivitySnapshot.findMany({
      where: { userId },
      orderBy: { syncedAt: 'desc' },
      take: 30,
    }),
  ]);

  return {
    stats,
    snapshots,
  };
}

module.exports = {
  collectExternalActivityByIds,
  collectExternalActivityForUser,
  getSavedExternalActivity,
  saveExternalActivitySync,
};
