export const DANKOOK_EMAIL_DOMAIN = '@dankook.ac.kr'

export function isDankookEmail(email) {
  return typeof email === 'string' && email.trim().toLowerCase().endsWith(DANKOOK_EMAIL_DOMAIN)
}

export function canAccessApp(auth) {
  return Boolean(auth?.isAuthenticated && auth?.accessToken && isDankookEmail(auth.user?.email))
}

export function getUserDisplayName(user) {
  return user?.nickname || user?.name || user?.email?.split('@')[0] || 'Link_U User'
}
