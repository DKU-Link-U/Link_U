import { resolveAccessToken } from './httpClient'

export const GITHUB_OAUTH_MESSAGE_TYPES = {
  success: 'LINK_U_GITHUB_OAUTH_SUCCESS',
  error: 'LINK_U_GITHUB_OAUTH_ERROR',
}

export const GOOGLE_OAUTH_MESSAGE_TYPES = {
  success: 'LINK_U_GOOGLE_OAUTH_SUCCESS',
  error: 'LINK_U_GOOGLE_OAUTH_ERROR',
}

function getAuthHeaders(accessToken) {
  const authToken = resolveAccessToken(accessToken)

  return authToken
    ? { Authorization: `Bearer ${authToken}` }
    : {}
}

export function buildGithubOAuthUrl(accessToken) {
  const params = new URLSearchParams()
  const authToken = resolveAccessToken(accessToken)

  if (typeof window !== 'undefined') {
    params.set('origin', window.location.origin)
  }

  if (authToken) {
    params.set('linkToken', authToken)
  }

  const query = params.toString()
  return `/api/auth/github${query ? `?${query}` : ''}`
}

export function buildGoogleLoginUrl() {
  const params = new URLSearchParams()

  if (typeof window !== 'undefined') {
    params.set('origin', window.location.origin)
  }

  const query = params.toString()
  return `/api/auth/google${query ? `?${query}` : ''}`
}

export async function verifyExternalAccount({ platform, accountId, token, accessToken }) {
  const params = new URLSearchParams({
    platform,
    accountId,
    token,
  })

  let response

  try {
    response = await fetch(`/api/verify-account?${params.toString()}`, {
      headers: getAuthHeaders(accessToken),
    })
  } catch {
    throw new Error('백엔드 서버에 연결할 수 없습니다. npm.cmd run dev:server를 실행했는지 확인하세요.')
  }

  const contentType = response.headers.get('content-type') ?? ''
  const result = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null

  if (!response.ok || !result?.success) {
    throw new Error(result?.message ?? '계정 소유 확인에 실패했습니다.')
  }

  return result
}

export async function disconnectExternalAccount({ platform, accessToken }) {
  let response

  try {
    response = await fetch(`/api/users/me/account-links/${encodeURIComponent(platform)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(accessToken),
    })
  } catch {
    throw new Error('백엔드 서버에 연결할 수 없습니다. npm.cmd run dev:server를 실행했는지 확인하세요.')
  }

  const contentType = response.headers.get('content-type') ?? ''
  const result = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null

  if (!response.ok || !result?.success) {
    throw new Error(result?.message ?? '계정 연동 해제에 실패했습니다.')
  }

  return result.data ?? result
}
