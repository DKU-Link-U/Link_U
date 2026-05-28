const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND_API === 'true'
const ENV_ACCESS_TOKEN = import.meta.env.VITE_API_ACCESS_TOKEN?.trim() ?? ''

export const ACCESS_TOKEN_STORAGE_KEY = 'link-u-access-token'

export class ApiError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'ApiError'
    this.details = details
  }
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.set(key, String(value))
  })

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export function cloneData(data) {
  return JSON.parse(JSON.stringify(data))
}

export function getStoredAccessToken() {
  if (typeof window === 'undefined') return ''

  try {
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function setStoredAccessToken(accessToken) {
  if (typeof window === 'undefined') return

  try {
    if (accessToken) {
      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken)
      return
    }

    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    // localStorage가 막힌 환경에서는 메모리 상태의 토큰만 사용한다.
  }
}

export function clearStoredAccessToken() {
  setStoredAccessToken('')
}

export function resolveAccessToken(accessToken) {
  return accessToken?.trim?.() || getStoredAccessToken() || ENV_ACCESS_TOKEN
}

export async function requestJson(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    accessToken,
    fallback,
    headers = {},
    errorMessage = 'API request failed.',
  } = options

  if (!USE_BACKEND_API && fallback) {
    return fallback()
  }

  let response

  try {
    const authToken = resolveAccessToken(accessToken)
    const requestHeaders = {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    }

    response = await fetch(endpoint, {
      method,
      headers: Object.keys(requestHeaders).length > 0 ? requestHeaders : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (fallback) return fallback()
    throw new ApiError('Backend server is not reachable.', { cause: error })
  }

  const contentType = response.headers.get('content-type') ?? ''
  const result = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null

  if (!response.ok || result?.success === false) {
    throw new ApiError(result?.message ?? errorMessage, {
      status: response.status,
      errors: result?.errors,
    })
  }

  return result?.data ?? result
}
