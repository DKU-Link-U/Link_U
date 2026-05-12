import { Navigate } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import RankingPage from '../pages/ranking/RankingPage'
import StudyBoard from '../pages/study/StudyBoard'
import StudyDetail from '../pages/study/StudyDetail'
import StudyCreate from '../pages/study/StudyCreate'
import ProjectBoard from '../pages/project/ProjectBoard'
import ProjectDetail from '../pages/project/ProjectDetail'
import ProjectCreate from '../pages/project/ProjectCreate'
import NotificationsPage from '../pages/notifications/NotificationsPage'
import MyPage from '../pages/mypage/MyPage'
import MyProfile from '../pages/mypage/MyProfile'
import AccountLinks from '../pages/mypage/AccountLinks'
import ActivityStats from '../pages/mypage/ActivityStats'
import MyStudies from '../pages/mypage/MyStudies'
import MyProjects from '../pages/mypage/MyProjects'
import Settings from '../pages/mypage/Settings'
import MessagesPage from '../pages/messages/MessagesPage'
import UserProfilePage from '../pages/users/UserProfilePage'
import { DEFAULT_ROUTE, ROUTE_PATHS } from './paths'

export const routeMeta = [
  { path: ROUTE_PATHS.home, title: 'My Dashboard', end: true },
  { path: ROUTE_PATHS.ranking, title: '랭킹' },
  { path: ROUTE_PATHS.study.list, title: '스터디 게시판', end: true },
  { path: ROUTE_PATHS.study.create, title: '스터디 모집 작성' },
  { path: ROUTE_PATHS.study.detail, title: '스터디 상세' },
  { path: ROUTE_PATHS.project.list, title: '프로젝트 게시판', end: true },
  { path: ROUTE_PATHS.project.create, title: '프로젝트 모집 작성' },
  { path: ROUTE_PATHS.project.detail, title: '프로젝트 상세' },
  { path: ROUTE_PATHS.users.profile, title: '사용자 프로필' },
  { path: ROUTE_PATHS.notifications, title: '알림 센터' },
  { path: ROUTE_PATHS.messages, title: '쪽지함' },
  { path: ROUTE_PATHS.mypage.root, title: '마이페이지', end: true },
  { path: ROUTE_PATHS.mypage.profile, title: '내 프로필' },
  { path: ROUTE_PATHS.mypage.accounts, title: '계정 연동 관리' },
  { path: ROUTE_PATHS.mypage.stats, title: '내 활동 통계' },
  { path: ROUTE_PATHS.mypage.studies, title: '참여 중인 스터디' },
  { path: ROUTE_PATHS.mypage.projects, title: '참여 중인 프로젝트' },
  { path: ROUTE_PATHS.mypage.settings, title: '환경 설정' },
]

export const appRoutes = [
  { path: DEFAULT_ROUTE, element: <Dashboard /> },
  { path: ROUTE_PATHS.ranking, element: <RankingPage /> },
  { path: ROUTE_PATHS.study.list, element: <StudyBoard /> },
  { path: ROUTE_PATHS.study.create, element: <StudyCreate /> },
  { path: ROUTE_PATHS.study.detail, element: <StudyDetail /> },
  { path: ROUTE_PATHS.project.list, element: <ProjectBoard /> },
  { path: ROUTE_PATHS.project.create, element: <ProjectCreate /> },
  { path: ROUTE_PATHS.project.detail, element: <ProjectDetail /> },
  { path: ROUTE_PATHS.users.profile, element: <UserProfilePage /> },
  { path: ROUTE_PATHS.notifications, element: <NotificationsPage /> },
  {
    path: ROUTE_PATHS.mypage.root,
    element: <MyPage />,
    children: [
      { index: true, element: <Navigate to="profile" replace /> },
      { path: 'profile', element: <MyProfile /> },
      { path: 'accounts', element: <AccountLinks /> },
      { path: 'stats', element: <ActivityStats /> },
      { path: 'studies', element: <MyStudies /> },
      { path: 'projects', element: <MyProjects /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: ROUTE_PATHS.messages, element: <MessagesPage /> },
  { path: '*', element: <Navigate to={DEFAULT_ROUTE} replace /> },
]
