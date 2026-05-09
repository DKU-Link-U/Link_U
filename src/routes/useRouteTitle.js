import { matchPath, useLocation } from 'react-router-dom'
import { routeMeta } from './appRoutes'

export function useRouteTitle() {
  const location = useLocation()
  const match = routeMeta.find(route =>
    matchPath({ path: route.path, end: route.end ?? false }, location.pathname),
  )

  return match?.title ?? 'Link-U'
}
