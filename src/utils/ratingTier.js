function toNumber(value, fallback = 0) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

export function getIntegratedTier(score) {
  const ratingScore = toNumber(score)

  if (ratingScore >= 2500) return 'Diamond'
  if (ratingScore >= 1600) return 'Platinum'
  if (ratingScore >= 900) return 'Gold'
  if (ratingScore >= 400) return 'Silver'
  return 'Bronze'
}

const TIER_STYLES = {
  Diamond: {
    badge: 'bg-sky-50 text-sky-600 border-sky-200',
    icon: 'text-sky-500',
  },
  Platinum: {
    badge: 'bg-teal-50 text-teal-600 border-teal-200',
    icon: 'text-teal-500',
  },
  Gold: {
    badge: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    icon: 'text-yellow-500',
  },
  Silver: {
    badge: 'bg-gray-50 text-gray-500 border-gray-200',
    icon: 'text-gray-400',
  },
  Bronze: {
    badge: 'bg-orange-50 text-orange-500 border-orange-200',
    icon: 'text-orange-400',
  },
  unsynced: {
    badge: 'bg-gray-50 text-gray-500 border-gray-200',
    icon: 'text-gray-400',
  },
}

export function getIntegratedTierStyle(tier) {
  return TIER_STYLES[tier] ?? TIER_STYLES.unsynced
}
