import { Link } from 'react-router-dom'
import UserProfile from '../components/UserProfile'
import RadarChartWidget from '../components/RadarChartWidget'
import CommitGrass from '../components/CommitGrass'
import LineChartWidget from '../components/LineChartWidget'
import { ROUTE_PATHS, routeTo } from '../routes/paths'
import { useNotifications, useProjects, useStudies } from '../store'

const ANNOUNCEMENTS = [
  { id: 1, title: '2026년 1학기 스터디 모집 기간 안내', date: '2026-05-10', isNew: true },
  { id: 2, title: '외부 API 연동 (GitHub/백준) 점검 완료', date: '2026-05-08', isNew: false },
  { id: 3, title: 'Link-U v2.0 업데이트 안내', date: '2026-05-01', isNew: false },
]

function SectionTitle({ title, to, linkLabel = '전체보기' }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold text-gray-700">{title}</h2>
      {to && (
        <Link to={to} className="text-xs text-primary font-medium hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  return status === 'recruiting'
    ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">모집중</span>
    : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">마감</span>
}

export default function Dashboard() {
  const { notifications, unreadNotificationCount } = useNotifications()
  const { studies } = useStudies()
  const { projects } = useProjects()

  return (
    <div className="flex flex-col gap-5 max-w-screen-xl mx-auto">

      {/* ── 상단: UserProfile ── */}
      <UserProfile />

      {/* ── 중단: RadarChart + CommitGrass ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5" style={{ minHeight: '300px' }}>
        <div className="lg:col-span-2"><RadarChartWidget /></div>
        <div className="lg:col-span-3"><CommitGrass /></div>
      </div>

      {/* ── 랭킹 추이 ── */}
      <div style={{ minHeight: '240px' }}>
        <LineChartWidget />
      </div>

      {/* ── 하단 3열 섹션 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* 스터디 목록 미리보기 */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <SectionTitle title="스터디 목록" to={ROUTE_PATHS.study.list} />
          <div className="space-y-2.5">
            {studies.slice(0, 3).map(sg => (
              <Link
                key={sg.groupId}
                to={routeTo.studyDetail(sg.groupId)}
                className="block p-3 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 flex-1">{sg.title}</p>
                  <StatusBadge status={sg.status} />
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {sg.techStack.slice(0, 2).map(t => (
                    <span key={t} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{sg.currentCount}/{sg.capacity}명 · 최소 {sg.requiredRating}점</p>
              </Link>
            ))}
          </div>
        </div>

        {/* 프로젝트 목록 미리보기 */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <SectionTitle title="프로젝트 목록" to={ROUTE_PATHS.project.list} />
          <div className="space-y-2.5">
            {projects.slice(0, 3).map(p => (
              <Link
                key={p.projectId}
                to={routeTo.projectDetail(p.projectId)}
                className="block p-3 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 flex-1">{p.title}</p>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {p.techStack.slice(0, 2).map(t => (
                    <span key={t} className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{p.currentCount}/{p.capacity}명 · 최소 {p.requiredRating}점</p>
              </Link>
            ))}
          </div>
        </div>

        {/* 알림 + 공지사항 */}
        <div className="flex flex-col gap-4">
          {/* 미확인 알림 요약 */}
          <div className="bg-white rounded-2xl shadow-md p-5">
            <SectionTitle title="알림" to={ROUTE_PATHS.notifications} />
            {unreadNotificationCount > 0 ? (
              <div className="space-y-2">
                {notifications.filter(n => !n.isRead).map(n => (
                  <div key={n.notificationId} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    <p className="text-xs text-gray-700 leading-snug">{n.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">새 알림이 없습니다.</p>
            )}
          </div>

          {/* 공지사항 */}
          <div className="bg-white rounded-2xl shadow-md p-5">
            <SectionTitle title="공지사항" />
            <div className="space-y-2">
              {ANNOUNCEMENTS.map(a => (
                <div key={a.id} className="flex items-center gap-2">
                  {a.isNew && (
                    <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex-shrink-0">NEW</span>
                  )}
                  <p className="text-xs text-gray-700 truncate flex-1">{a.title}</p>
                  <p className="text-[10px] text-gray-400 flex-shrink-0">{a.date.slice(5)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 마이페이지 바로가기 */}
      <Link
        to={ROUTE_PATHS.mypage.root}
        className="flex items-center justify-between bg-primary text-white rounded-2xl px-6 py-4 shadow-md hover:opacity-90 transition-opacity"
      >
        <div>
          <p className="text-sm font-bold">마이페이지 바로가기</p>
          <p className="text-xs text-white/60 mt-0.5">프로필, 계정 연동, 활동 통계를 관리하세요</p>
        </div>
        <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>
    </div>
  )
}
