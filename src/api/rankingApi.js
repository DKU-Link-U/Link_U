import { mockRankingList } from '../models'
import { buildQuery, cloneData, requestJson } from './httpClient'

function filterRankingFallback({ scope, department }) {
  if (scope === 'department' && department) {
    return cloneData(mockRankingList.filter(user => user.department === department))
  }

  return cloneData(mockRankingList)
}

export async function fetchRankingUsers(params = {}) {
  return requestJson(`/api/rankings${buildQuery(params)}`, {
    fallback: () => filterRankingFallback(params),
    errorMessage: 'Failed to load ranking users.',
  })
}

export async function fetchRankingUser(userId) {
  return requestJson(`/api/rankings/users/${encodeURIComponent(userId)}`, {
    fallback: () => cloneData(mockRankingList.find(user => user.userId === userId) ?? null),
    errorMessage: 'Failed to load ranking user.',
  })
}
