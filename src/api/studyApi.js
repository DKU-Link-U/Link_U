import { mockStudyGroups } from '../models'
import { toKoreanDateKey, toKoreanIsoString } from '../utils/koreanTime'
import { buildQuery, cloneData, requestJson } from './httpClient'

function createStudyFallback(form, currentUser) {
  return {
    groupId: `sg_${Date.now()}`,
    leaderId: currentUser?.userId ?? 'guest',
    leaderName: currentUser?.nickname ?? 'Guest',
    title: form.title.trim(),
    description: form.description.trim(),
    requiredRating: Number(form.requiredRating) || 0,
    capacity: Number(form.capacity) || 2,
    currentCount: 1,
    techStack: form.techStack
      .split(',')
      .map(item => item.trim())
      .filter(Boolean),
    applicantList: [],
    status: 'recruiting',
    createdAt: toKoreanDateKey(),
  }
}

function createApplicationFallback(currentUser) {
  return {
    userId: currentUser?.userId ?? 'guest',
    status: 'pending',
    appliedAt: toKoreanIsoString(),
  }
}

function scoreStudyFallback(study, context = {}) {
  const techStack = Array.isArray(study.techStack) ? study.techStack : []
  const profileText = [
    context.currentUser?.techStack,
    context.currentUser?.interestArea,
    context.currentUser?.department,
  ].filter(Boolean).join(', ').toLowerCase()
  const matchedSkills = techStack.filter(skill => profileText.includes(String(skill).toLowerCase()))
  const userScore = Number(context.rating?.totalRatingScore) || 0
  const requiredRating = Number(study.requiredRating) || 0
  const scoreGap = Math.max(0, requiredRating - userScore)
  const fitScore = Math.max(55, Math.min(100, 88 + matchedSkills.length * 4 - Math.ceil(scoreGap / 100)))

  return {
    ...study,
    fitScore,
    matchedSkills,
    reason: matchedSkills.length > 0
      ? `${matchedSkills.join(', ')} 역량과 잘 맞는 스터디입니다.`
      : '현재 프로필과 모집 조건을 기준으로 추천된 스터디입니다.',
  }
}

function createRecommendationFallback(context = {}) {
  return (context.studies ?? [])
    .filter(study => study.status === 'recruiting')
    .map(study => scoreStudyFallback(study, context))
    .sort((left, right) => right.fitScore - left.fitScore)
    .slice(0, 3)
}

export async function fetchStudies(filters = {}) {
  return requestJson(`/api/studies${buildQuery(filters)}`, {
    fallback: () => cloneData(mockStudyGroups),
    errorMessage: 'Failed to load studies.',
  })
}

export async function fetchStudyRecommendations(context = {}, { accessToken } = {}) {
  return requestJson('/api/studies/ai-recommendations', {
    method: 'POST',
    body: {},
    accessToken,
    fallback: () => createRecommendationFallback(context),
    errorMessage: 'Failed to load study recommendations.',
  })
}

export async function fetchStudyDetail(groupId) {
  return requestJson(`/api/studies/${encodeURIComponent(groupId)}`, {
    fallback: () => cloneData(mockStudyGroups.find(study => study.groupId === groupId) ?? null),
    errorMessage: 'Failed to load study detail.',
  })
}

export async function fetchStudyApplications(groupId, { accessToken } = {}) {
  return requestJson(`/api/studies/${encodeURIComponent(groupId)}/applications`, {
    accessToken,
    fallback: () => [],
    errorMessage: 'Failed to load study applications.',
  })
}

export async function fetchMyStudies({ accessToken, fallback } = {}) {
  return requestJson('/api/users/me/studies', {
    accessToken,
    fallback,
    errorMessage: 'Failed to load my studies.',
  })
}

export async function createStudy(form, { currentUser, accessToken } = {}) {
  return requestJson('/api/studies', {
    method: 'POST',
    body: form,
    accessToken,
    fallback: () => createStudyFallback(form, currentUser),
    errorMessage: 'Failed to create study.',
  })
}

export async function applyStudy(groupId, { currentUser, accessToken } = {}) {
  return requestJson(`/api/studies/${encodeURIComponent(groupId)}/applications`, {
    method: 'POST',
    body: { userId: currentUser?.userId },
    accessToken,
    fallback: () => createApplicationFallback(currentUser),
    errorMessage: 'Failed to apply to study.',
  })
}
