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
  users: {
    profile: '/users/:userId',
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

function fillPath(path, params) {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replace(`:${key}`, encodeURIComponent(String(value))),
    path,
  )
}

export const routeTo = {
  studyDetail: id => fillPath(ROUTE_PATHS.study.detail, { id }),
  projectDetail: id => fillPath(ROUTE_PATHS.project.detail, { id }),
  userProfile: userId => fillPath(ROUTE_PATHS.users.profile, { userId }),
  messagesTo: userId => `${ROUTE_PATHS.messages}?to=${encodeURIComponent(String(userId))}`,
}
