import { buildQuery, requestJson, resolveAccessToken } from './httpClient'

function getAuthHeaders(accessToken) {
  const authToken = resolveAccessToken(accessToken)

  return authToken
    ? { Authorization: `Bearer ${authToken}` }
    : {}
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') ?? ''

  return contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null
}

function toIntegratedUserResult(result) {
  return {
    data: result.data ?? {},
    errors: result.errors ?? {},
    partialSuccess: Boolean(result.partialSuccess),
    message: result.message,
    saved: result.saved,
  }
}

export async function fetchCurrentUser({ accessToken } = {}) {
  const result = await requestJson('/api/users/me', {
    accessToken,
    errorMessage: 'Failed to load current user.',
  })

  return result.user
}

export async function updateCurrentUserProfile(profile, { accessToken } = {}) {
  const result = await requestJson('/api/users/me', {
    method: 'PATCH',
    body: profile,
    accessToken,
    errorMessage: 'Failed to save profile.',
  })

  return result.user
}

export async function fetchRatingHistory({ accessToken, limit = 30 } = {}) {
  const result = await requestJson(`/api/users/me/activity/history${buildQuery({ limit })}`, {
    accessToken,
    errorMessage: 'Failed to load rating history.',
  })

  return result.history ?? []
}

export async function fetchIntegratedUserData({ githubId, bojId, dhId }, options = {}) {
  const authHeaders = getAuthHeaders(options.accessToken)

  if (authHeaders.Authorization) {
    let response

    try {
      response = await fetch('/api/users/me/activity/sync', {
        method: 'POST',
        headers: authHeaders,
      })
    } catch {
      throw new Error('백엔드 서버에 연결할 수 없습니다. npm.cmd run dev:server를 실행했는지 확인하세요.')
    }

    const result = await parseJsonResponse(response)

    if (!response.ok || !result?.success) {
      const detail = result?.errors
        ? Object.values(result.errors).map(error => error.message).join(' / ')
        : ''
      const error = new Error(detail || result?.message || '외부 활동 데이터를 DB에 저장하지 못했습니다.')
      error.errors = result?.errors ?? {}

      throw error
    }

    return toIntegratedUserResult(result)
  }

  const params = new URLSearchParams()

  if (githubId?.trim()) params.set('githubId', githubId.trim())
  if (bojId?.trim()) params.set('bojId', bojId.trim())
  if (dhId?.trim()) params.set('dhId', dhId.trim())

  if ([...params.keys()].length === 0) {
    throw new Error('동기화할 외부 플랫폼 아이디를 하나 이상 입력해야 합니다.')
  }

  const endpoint = `/api/user?${params.toString()}`

  let response

  try {
    response = await fetch(endpoint)
  } catch {
    throw new Error('백엔드 서버에 연결할 수 없습니다. npm.cmd run dev:server를 실행했는지 확인하세요.')
  }

  const result = await parseJsonResponse(response)

  if (!response.ok || !result?.success) {
    const detail = result?.errors
      ? Object.values(result.errors).map(error => error.message).join(' / ')
      : ''
    const error = new Error(detail || result?.message || '외부 활동 데이터를 불러오지 못했습니다.')
    error.errors = result?.errors ?? {}

    throw error
  }

  return toIntegratedUserResult(result)
}
