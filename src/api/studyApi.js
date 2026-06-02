import { mockStudyGroups } from '../models'
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
    createdAt: new Date().toISOString().slice(0, 10),
  }
}

function createApplicationFallback(currentUser) {
  return {
    userId: currentUser?.userId ?? 'guest',
    status: 'pending',
    appliedAt: new Date().toISOString(),
  }
}

export async function fetchStudies(filters = {}) {
  return requestJson(`/api/studies${buildQuery(filters)}`, {
    fallback: () => cloneData(mockStudyGroups),
    errorMessage: 'Failed to load studies.',
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
