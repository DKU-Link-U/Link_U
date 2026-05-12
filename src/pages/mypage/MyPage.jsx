import { NavLink, Outlet } from 'react-router-dom'

const SUB_NAV = [
  { to: 'profile',  label: '내 프로필' },
  { to: 'accounts', label: '계정 연동 관리' },
  { to: 'stats',    label: '내 활동 통계' },
  { to: 'studies',  label: '참여 중인 스터디' },
  { to: 'projects', label: '참여 중인 프로젝트' },
  { to: 'settings', label: '환경 설정' },
]

export default function MyPage() {
  return (
    <div className="max-w-5xl mx-auto flex gap-5">
      {/* 사이드 서브 네비 */}
      <aside className="w-44 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-md p-2 sticky top-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-2 pb-1.5">마이페이지</p>
          {SUB_NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </aside>

      {/* 서브 페이지 콘텐츠 */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
