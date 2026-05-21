import { mockProjects } from '../models'
import { buildQuery, cloneData, requestJson } from './httpClient'

function createProjectFallback(form, currentUser) {
  return {
    projectId: `proj_${Date.now()}`,
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

export async function fetchProjects(filters = {}) {
  return requestJson(`/api/projects${buildQuery(filters)}`, {
    fallback: () => cloneData(mockProjects),
    errorMessage: 'Failed to load projects.',
  })
}

export async function fetchProjectDetail(projectId) {
  return requestJson(`/api/projects/${encodeURIComponent(projectId)}`, {
    fallback: () => cloneData(mockProjects.find(project => project.projectId === projectId) ?? null),
    errorMessage: 'Failed to load project detail.',
  })
}

export async function fetchProjectApplications(projectId, { accessToken } = {}) {
  return requestJson(`/api/projects/${encodeURIComponent(projectId)}/applications`, {
    accessToken,
    fallback: () => [],
    errorMessage: 'Failed to load project applications.',
  })
}

export async function fetchMyProjects({ accessToken, fallback } = {}) {
  return requestJson('/api/users/me/projects', {
    accessToken,
    fallback,
    errorMessage: 'Failed to load my projects.',
  })
}

export async function createProject(form, { currentUser, accessToken } = {}) {
  return requestJson('/api/projects', {
    method: 'POST',
    body: form,
    accessToken,
    fallback: () => createProjectFallback(form, currentUser),
    errorMessage: 'Failed to create project.',
  })
}

export async function applyProject(projectId, { currentUser, accessToken } = {}) {
  return requestJson(`/api/projects/${encodeURIComponent(projectId)}/applications`, {
    method: 'POST',
    body: { userId: currentUser?.userId },
    accessToken,
    fallback: () => createApplicationFallback(currentUser),
    errorMessage: 'Failed to apply to project.',
  })
}
