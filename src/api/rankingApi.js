import { mockRankingList } from '../models'
import { buildQuery, cloneData, requestJson } from './httpClient'

function filterRankingFallback({ scope, department }) {
  if (scope === 'departments') {
    const groups = mockRankingList.reduce((map, user) => {
      const current = map.get(user.department) || {
        department: user.department,
        totalScore: 0,
        memberCount: 0,
      }

      current.totalScore += user.score
      current.memberCount += 1
      map.set(user.department, current)

      return map
    }, new Map())

    return [...groups.values()]
      .map(group => ({
        department: group.department,
        avgScore: Math.round(group.totalScore / group.memberCount),
        memberCount: group.memberCount,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .map((group, index) => ({
        rank: index + 1,
        ...group,
      }))
  }

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
