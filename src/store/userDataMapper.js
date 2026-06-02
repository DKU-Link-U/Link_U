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
    toNumber(rating.githubCommitCount) * 1.2 +
    toNumber(rating.githubPrCount) * 5 +
    toNumber(rating.baekjoonSolvedCount) * 2.5 +
    toNumber(rating.baekjoonRating) * 0.35 +
    toNumber(rating.dreamhackScore) * 0.4 +
    toNumber(rating.dreamhackSolvedCount) * 3,
  )
}

function createEmptyCommitActivity() {
  return Array.from({ length: 24 * 7 }, (_, index) => ({
    date: new Date(Date.now() - (24 * 7 - index) * 86400000).toISOString().slice(0, 10),
    github: 0,
    baekjoon: 0,
    dreamhack: 0,
  }))
}

function buildSyncedActivity(data) {
  const activity = createEmptyCommitActivity()
  const githubStats = data.github?.stats
  const bojInfo = data.boj
  const dreamhackStats = data.dreamhack

  if (githubStats) {
    const totalCommits = toNumber(githubStats.totalCommits)
    activity.forEach((day, index) => {
      day.github = totalCommits > 0 && index % 3 !== 0 ? 1 + (index % 4) : 0
    })
  }

  if (bojInfo) {
    const solvedCount = toNumber(bojInfo.solvedCount)
    activity.forEach((day, index) => {
      day.baekjoon = solvedCount > 0 && index % 5 === 0 ? 1 + (index % 3) : 0
    })
  }

  if (dreamhackStats) {
    const solvedCount = toNumber(dreamhackStats.wargame?.solvedCount)
    activity.forEach((day, index) => {
      day.dreamhack = solvedCount > 0 && index % 7 === 0 ? 1 + (index % 2) : 0
    })
  }

  return activity
}

function buildFieldStats(rating) {
  return {
    userId: rating.userId,
    algorithm: Math.min(100, Math.round(toNumber(rating.baekjoonSolvedCount) * 0.45)),
    csKnowledge: Math.min(100, Math.round(toNumber(rating.baekjoonRating) * 0.04)),
    collaboration: Math.min(100, Math.round(toNumber(rating.githubPrCount) * 3.5)),
    problemSolving: Math.min(100, Math.round(toNumber(rating.baekjoonTierNumber) * 3.2)),
    studyActivity: Math.min(100, Math.round(toNumber(rating.githubCommitCount) * 0.08)),
    projectContrib: Math.min(100, Math.round(toNumber(rating.dreamhackScore) * 0.08)),
  }
}

export function mapIntegratedUserData(data, previousState, ids) {
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
  }

  rating.totalRatingScore = calculateDraftRatingScore(rating)

  return {
    user,
    rating,
    activity: {
      fieldStats: buildFieldStats(rating),
      commitActivity: buildSyncedActivity(data),
      syncedPlatforms: {
        github: Boolean(githubStats),
        baekjoon: Boolean(bojInfo),
        dreamhack: Boolean(dreamhackStats),
      },
    },
  }
}
