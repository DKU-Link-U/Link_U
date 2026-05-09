export const ROUTE_PATHS = {
  home: '/',
  ranking: '/ranking',
  study: {
    list: '/study',
    create: '/study/create',
    detail: '/study/:id',
  },
  project: {
    list: '/project',
    create: '/project/create',
    detail: '/project/:id',
  },
  notifications: '/notifications',
  messages: '/messages',
  mypage: {
    root: '/mypage',
    profile: '/mypage/profile',
    accounts: '/mypage/accounts',
    stats: '/mypage/stats',
    studies: '/mypage/studies',
    projects: '/mypage/projects',
    settings: '/mypage/settings',
  },
}

export const DEFAULT_ROUTE = ROUTE_PATHS.home
