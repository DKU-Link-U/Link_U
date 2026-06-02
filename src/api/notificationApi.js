import { mockNotifications } from '../models'
import { buildQuery, cloneData, requestJson } from './httpClient'

export async function fetchNotifications(params = {}, { accessToken } = {}) {
  return requestJson(`/api/notifications${buildQuery(params)}`, {
    accessToken,
    fallback: () => cloneData(mockNotifications),
    errorMessage: 'Failed to load notifications.',
  })
}

export async function markNotificationRead(notificationId, { accessToken } = {}) {
  return requestJson(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
    accessToken,
    fallback: () => ({ notificationId, isRead: true }),
    errorMessage: 'Failed to mark notification as read.',
  })
}

export async function markAllNotificationsRead({ accessToken } = {}) {
  return requestJson('/api/notifications/read-all', {
    method: 'PATCH',
    accessToken,
    fallback: () => cloneData(mockNotifications).map(notification => ({
      ...notification,
      isRead: true,
    })),
    errorMessage: 'Failed to mark notifications as read.',
  })
}
