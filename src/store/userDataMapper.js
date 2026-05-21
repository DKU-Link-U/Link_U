const SOLVED_AC_TIERS = [
  ['Unrated'],
  ['Bronze V', 'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I'],
  ['Silver V', 'Silver IV', 'Silver III', 'Silver II', 'Silver I'],
  ['Gold V', 'Gold IV', 'Gold III', 'Gold II', 'Gold I'],
  ['Platinum V', 'Platinum IV', 'Platinum III', 'Platinum II', 'Platinum I'],
  ['Diamond V', 'Diamond IV', 'Diamond III', 'Diamond II', 'Diamond I'],
  ['Ruby V', 'Ruby IV', 'Ruby III', 'Ruby II', 'Ruby I'],
]

function toNumber(value, fallback = 0) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

export function formatSolvedAcTier(tier) {
  const tierNumber = toNumber(tier)

  if (tierNumber <= 0) return 'Unrated'

  const tierGroup = Math.ceil(tierNumber / 5)
  const tierOffset = (tierNumber - 1) % 5

  return SOLVED_AC_TIERS[tierGroup]?.[tierOffset] ?? `Tier ${tierNumber}`
}

function calculateDraftRatingScore(rating) {
  return Math.round(
    toNumber(rating.githubCommitCount) * 2 +
    toNumber(rating.githubPrCount) * 25 +
    toNumber(rating.githubPublicRepoCount) * 10 +
    toNumber(rating.baekjoonSolvedCount) * 3 +
    toNumber(rating.baekjoonTierNumber) * 30 +
    toNumber(rating.baekjoonRating) * 0.1 +
    toNumber(rating.dreamhackScore) +
    toNumber(rating.dreamhackSolvedCount) * 20,
  )
}

function getSavedGithubDailyCommits(saved) {
  const githubSnapshot = (saved.snapshots ?? []).find(snapshot =>
    snapshot.platform === 'GITHUB' && snapshot.status === 'SUCCESS',
  )

  return githubSnapshot?.summary?.dailyCommits ?? githubSnapshot?.rawData?.stats?.dailyCommits
}

function buildSyncedActivity(data, saved = {}) {
  const dailyCommits = data.github?.stats?.dailyCommits ?? getSavedGithubDailyCommits(saved)

  if (!Array.isArray(dailyCommits)) return []

  return dailyCommits
    .map(day => ({
      date: day.date,
      github: toNumber(day.count),
    }))
    .filter(day => day.date && day.github > 0)
}

function buildFieldStats(rating) {
  const algorithm = Math.round(
    toNumber(rating.baekjoonSolvedCount) * 3 +
    toNumber(rating.baekjoonTierNumber) * 30 +
    toNumber(rating.baekjoonRating) * 0.1,
  )
  const security = Math.round(
    toNumber(rating.dreamhackScore) +
    toNumber(rating.dreamhackSolvedCount) * 20,
  )
  const implementation = Math.round(
    toNumber(rating.githubCommitCount) * 2 +
    toNumber(rating.githubPublicRepoCount) * 10,
  )
  const collaboration = Math.round(toNumber(rating.githubPrCount) * 25)
  const problemSolving = Math.round(algorithm * 0.7 + security * 0.3)
  const activity = Math.round(
    toNumber(rating.githubCommitCount) +
    toNumber(rating.githubPrCount) * 10 +
    toNumber(rating.baekjoonSolvedCount) +
    toNumber(rating.dreamhackSolvedCount) * 5,
  )

  return {
    userId: rating.userId,
    algorithm: Math.min(100, Math.round((algorithm / 1500) * 100)),
    security: Math.min(100, Math.round((security / 1500) * 100)),
    implementation: Math.min(100, Math.round((implementation / 1000) * 100)),
    collaboration: Math.min(100, Math.round((collaboration / 500) * 100)),
    problemSolving: Math.min(100, Math.round((problemSolving / 1600) * 100)),
    activity: Math.min(100, Math.round((activity / 1000) * 100)),
  }
}

function formatHistoryLabel(dateValue) {
  if (!dateValue) return ''
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return ''

  return `${date.getMonth() + 1}.${date.getDate()}`
}

function buildScoreHistory(scoreHistory = [], score) {
  const source = scoreHistory.length > 0
    ? scoreHistory
    : score
      ? [score]
      : []

  return source.map((snapshot, index) => ({
    month: snapshot.month || formatHistoryLabel(snapshot.date || snapshot.calculatedAt || snapshot.recordedAt || snapshot.createdAt) || `${index + 1}`,
    score: toNumber(snapshot.score ?? snapshot.totalScore),
  }))
}

function applySavedStats(rating, stats) {
  if (!stats) return

  rating.githubCommitCount = toNumber(stats.githubCommitCount)
  rating.githubPrCount = toNumber(stats.githubPrCount)
  rating.githubPublicRepoCount = toNumber(stats.githubPublicRepoCount)
  rating.baekjoonTier = formatSolvedAcTier(stats.bojTierNumber)
  rating.baekjoonTierNumber = toNumber(stats.bojTierNumber)
  rating.baekjoonSolvedCount = toNumber(stats.bojSolvedCount)
  rating.baekjoonRating = toNumber(stats.bojRating)
  rating.baekjoonRank = toNumber(stats.bojRank)
  rating.dreamhackScore = toNumber(stats.dreamhackScore)
  rating.dreamhackRank = toNumber(stats.dreamhackRank)
  rating.dreamhackSolvedCount = toNumber(stats.dreamhackSolvedCount)
  rating.dreamhackContributionLevel = toNumber(stats.dreamhackContributionLevel)
  rating.dreamhackContributionRank = toNumber(stats.dreamhackContributionRank)
}

function applySavedScore(rating, score, scoreHistory) {
  if (!score) return

  rating.totalRatingScore = toNumber(score.totalScore)
  rating.githubScore = toNumber(score.githubScore)
  rating.bojScore = toNumber(score.bojScore)
  rating.dreamhackPlatformScore = toNumber(score.dreamhackScore)
  rating.scoreBreakdown = {
    githubScore: toNumber(score.githubScore),
    bojScore: toNumber(score.bojScore),
    dreamhackScore: toNumber(score.dreamhackScore),
    algorithmScore: toNumber(score.algorithmScore),
    securityScore: toNumber(score.securityScore),
    implementationScore: toNumber(score.implementationScore),
    collaborationScore: toNumber(score.collaborationScore),
    problemSolvingScore: toNumber(score.problemSolvingScore),
    activityScore: toNumber(score.activityScore),
    scoreVersion: score.scoreVersion,
    calculatedAt: score.calculatedAt,
  }
  rating.history = buildScoreHistory(scoreHistory, score)
}

function hasSuccessfulSavedSnapshot(saved, platform) {
  return (saved.snapshots ?? []).some(snapshot =>
    snapshot.platform === platform && snapshot.status === 'SUCCESS',
  )
}

function buildSyncedPlatforms(data, saved) {
  const savedStats = saved.stats

  return {
    github: Boolean(
      data.github?.stats ||
      hasSuccessfulSavedSnapshot(saved, 'GITHUB') ||
      toNumber(savedStats?.githubCommitCount) ||
      toNumber(savedStats?.githubPrCount) ||
      toNumber(savedStats?.githubPublicRepoCount),
    ),
    baekjoon: Boolean(
      data.boj ||
      hasSuccessfulSavedSnapshot(saved, 'BOJ') ||
      toNumber(savedStats?.bojSolvedCount) ||
      toNumber(savedStats?.bojTierNumber) ||
      toNumber(savedStats?.bojRating),
    ),
    dreamhack: Boolean(
      data.dreamhack ||
      hasSuccessfulSavedSnapshot(saved, 'DREAMHACK') ||
      toNumber(savedStats?.dreamhackScore) ||
      toNumber(savedStats?.dreamhackSolvedCount) ||
      toNumber(savedStats?.dreamhackContributionLevel),
    ),
  }
}

export function mapIntegratedUserData(data = {}, previousState, ids, saved = {}) {
  const githubProfile = data.github?.profile
  const githubStats = data.github?.stats
  const bojInfo = data.boj
  const dreamhackStats = data.dreamhack
  const previousUser = previousState.auth.user
  const previousRating = previousState.rating
  const user = {
    ...previousUser,
    githubId: githubProfile?.login ?? ids.githubId ?? previousUser?.githubId,
    bojId: bojInfo?.handle ?? ids.bojId ?? previousUser?.bojId,
    dreamhackId: dreamhackStats?.nickname ?? ids.dhId ?? previousUser?.dreamhackId,
  }
  const rating = {
    ...previousRating,
  }

  if (githubStats) {
    rating.githubCommitCount = toNumber(githubStats.totalCommits)
    rating.githubPrCount = toNumber(githubStats.totalPRs)
    rating.githubPublicRepoCount = toNumber(githubProfile?.public_repos)
  }

  if (bojInfo) {
    rating.baekjoonTier = formatSolvedAcTier(bojInfo.tier)
    rating.baekjoonTierNumber = toNumber(bojInfo.tier)
    rating.baekjoonSolvedCount = toNumber(bojInfo.solvedCount)
    rating.baekjoonRating = toNumber(bojInfo.rating)
  }

  if (dreamhackStats) {
    rating.dreamhackScore = toNumber(dreamhackStats.wargame?.score)
    rating.dreamhackRank = toNumber(dreamhackStats.wargame?.rank)
    rating.dreamhackSolvedCount = toNumber(dreamhackStats.wargame?.solvedCount)
    rating.dreamhackContributionLevel = toNumber(dreamhackStats.contributions?.level)
    rating.dreamhackContributionRank = toNumber(dreamhackStats.contributions?.rank)
  }

  applySavedStats(rating, saved.stats)
  rating.totalRatingScore = calculateDraftRatingScore(rating)
  applySavedScore(rating, saved.score, saved.ratingHistory ?? saved.scoreHistory)
  const hasRawActivity = Boolean(githubStats || bojInfo || dreamhackStats)

  return {
    user,
    rating,
    activity: {
      fieldStats: saved.score?.fieldDisplayScores ?? buildFieldStats(rating),
      commitActivity: hasRawActivity || getSavedGithubDailyCommits(saved)
        ? buildSyncedActivity(data, saved)
        : previousState.activity.commitActivity,
      syncedPlatforms: buildSyncedPlatforms(data, saved),
    },
  }
}
