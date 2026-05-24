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

  if (githubProfile) {
    user.userId = previousUser?.userId ?? githubProfile.login ?? ids.githubId
    user.nickname = githubProfile.name || githubProfile.login || previousUser?.nickname
    user.profileImage = githubProfile.avatar_url ?? previousUser?.profileImage
    user.oneLiner = githubProfile.bio || previousUser?.oneLiner
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
  }
}
