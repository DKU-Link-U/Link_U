import { requestJson } from './httpClient'

function toRecruitmentStatus(status) {
  if (status === 'recruiting') return 'OPEN'
  if (status === 'closed') return 'CLOSED'

  return String(status || '').toUpperCase()
}

export async function updateRecruitmentStatus(recruitmentId, status, { accessToken } = {}) {
  return requestJson(`/api/recruitments/${encodeURIComponent(recruitmentId)}`, {
    method: 'PATCH',
    body: {
      status: toRecruitmentStatus(status),
    },
    accessToken,
    errorMessage: 'Failed to update recruitment status.',
  })
}
