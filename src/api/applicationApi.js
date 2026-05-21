import { requestJson } from './httpClient'

export async function updateApplicationStatus(applicationId, status, { accessToken } = {}) {
  return requestJson(`/api/applications/${encodeURIComponent(applicationId)}/status`, {
    method: 'PATCH',
    body: { status },
    accessToken,
    errorMessage: 'Failed to update application status.',
  })
}
