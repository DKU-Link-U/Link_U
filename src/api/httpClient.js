const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND_API === 'true'

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

export async function requestJson(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    fallback,
    errorMessage = 'API request failed.',
  } = options

  if (!USE_BACKEND_API && fallback) {
    return fallback()
  }

  let response

  try {
    response = await fetch(endpoint, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
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
