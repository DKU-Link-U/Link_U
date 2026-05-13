export function getApplicationEligibility(item, { score = 0, application } = {}) {
  if (!item) {
    return {
      canApply: false,
      status: 'missing',
      label: '항목 없음',
      reason: '모집 정보를 찾을 수 없습니다.',
    }
  }

  if (application) {
    return {
      canApply: false,
      status: 'applied',
      label: '신청 완료',
      reason: '이미 신청한 모집글입니다.',
    }
  }

  if (item.status !== 'recruiting') {
    return {
      canApply: false,
      status: 'closed',
      label: '모집 마감',
      reason: '모집이 마감되어 신청할 수 없습니다.',
    }
  }

  if (item.currentCount >= item.capacity) {
    return {
      canApply: false,
      status: 'full',
      label: '정원 마감',
      reason: '모집 정원이 모두 찼습니다.',
    }
  }

  const shortage = Math.max(0, Number(item.requiredRating) - Number(score))

  if (shortage > 0) {
    return {
      canApply: false,
      status: 'score_short',
      label: '점수 부족',
      reason: `최소 요구 점수보다 ${shortage}점 부족합니다.`,
      shortage,
    }
  }

  return {
    canApply: true,
    status: 'eligible',
    label: '지원 가능',
    reason: '모든 지원 조건을 충족했습니다.',
  }
}
