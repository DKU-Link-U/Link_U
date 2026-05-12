export async function verifyExternalAccount({ platform, accountId, token }) {
  const params = new URLSearchParams({
    platform,
    accountId,
    token,
  })

  let response

  try {
    response = await fetch(`/api/verify-account?${params.toString()}`)
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
