export async function fetchIntegratedUserData({ githubId, bojId, dhId }) {
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

  const contentType = response.headers.get('content-type') ?? ''
  const result = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null

  if (!response.ok || !result?.success) {
    const detail = result?.errors
      ? Object.values(result.errors).map(error => error.message).join(' / ')
      : ''
    const error = new Error(detail || result?.message || '외부 활동 데이터를 불러오지 못했습니다.')
    error.errors = result?.errors ?? {}

    throw error
  }

  return {
    data: result.data ?? {},
    errors: result.errors ?? {},
    partialSuccess: Boolean(result.partialSuccess),
    message: result.message,
  }
}
