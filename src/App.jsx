import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

// Pages
import Dashboard from './pages/Dashboard'
import RankingPage from './pages/ranking/RankingPage'
import StudyBoard from './pages/study/StudyBoard'
import StudyDetail from './pages/study/StudyDetail'
import StudyCreate from './pages/study/StudyCreate'
import ProjectBoard from './pages/project/ProjectBoard'
import ProjectDetail from './pages/project/ProjectDetail'
import ProjectCreate from './pages/project/ProjectCreate'
import NotificationsPage from './pages/notifications/NotificationsPage'
import MyPage from './pages/mypage/MyPage'
import MyProfile from './pages/mypage/MyProfile'
import AccountLinks from './pages/mypage/AccountLinks'
import ActivityStats from './pages/mypage/ActivityStats'
import MyStudies from './pages/mypage/MyStudies'
import MyProjects from './pages/mypage/MyProjects'
import Settings from './pages/mypage/Settings'
import MessagesPage from './pages/messages/MessagesPage'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-background font-sans">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              {/* 홈 */}
              <Route path="/" element={<Dashboard />} />

              {/* 랭킹 */}
              <Route path="/ranking" element={<RankingPage />} />

              {/* 스터디 게시판 */}
              <Route path="/study" element={<StudyBoard />} />
              <Route path="/study/create" element={<StudyCreate />} />
              <Route path="/study/:id" element={<StudyDetail />} />

              {/* 프로젝트 게시판 */}
              <Route path="/project" element={<ProjectBoard />} />
              <Route path="/project/create" element={<ProjectCreate />} />
              <Route path="/project/:id" element={<ProjectDetail />} />

              {/* 알림 센터 */}
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* 마이페이지 */}
              <Route path="/mypage" element={<MyPage />}>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<MyProfile />} />
                <Route path="accounts" element={<AccountLinks />} />
                <Route path="stats" element={<ActivityStats />} />
                <Route path="studies" element={<MyStudies />} />
                <Route path="projects" element={<MyProjects />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* 쪽지함 */}
              <Route path="/messages" element={<MessagesPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
