const BADGE_STYLES = {
  eligible: 'bg-green-100 text-green-700',
  applied: 'bg-primary/10 text-primary',
  score_short: 'bg-red-100 text-red-600',
  closed: 'bg-gray-100 text-gray-500',
  full: 'bg-yellow-100 text-yellow-700',
  missing: 'bg-gray-100 text-gray-500',
}

export default function EligibilityBadge({ eligibility }) {
  const className = BADGE_STYLES[eligibility.status] ?? BADGE_STYLES.missing

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${className}`}>
      {eligibility.label}
    </span>
  )
}
