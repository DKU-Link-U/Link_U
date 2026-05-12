import { NavLink, useLocation } from 'react-router-dom'
import { mockNotifications } from '../models'

const NAV_GROUPS = [
  {
    items: [
      {
        to: '/',
        label: '홈',
        exact: true,
        icon: (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" />
          </svg>
        ),
      },
    ],
  },
  {
    label: '커뮤니티',
    items: [
      {
        to: '/ranking',
        label: '랭킹',
        icon: (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
        ),
      },
      {
        to: '/study',
        label: '스터디 게시판',
        icon: (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        ),
      },
      {
        to: '/project',
        label: '프로젝트 게시판',
        icon: (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="3" y="3" width="8" height="8" rx="1" />
            <rect x="13" y="3" width="8" height="8" rx="1" />
            <rect x="3" y="13" width="8" height="8" rx="1" />
            <rect x="13" y="13" width="8" height="8" rx="1" />
          </svg>
        ),
      },
    ],
  },
  {
    label: '내 활동',
    items: [
      {
        to: '/notifications',
        label: '알림 센터',
        badge: mockNotifications.filter(n => !n.isRead).length,
        icon: (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M15 17H20L18.595 15.595A2 2 0 0118 14.172V11C18 8.238 16.112 5.923 13.5 5.184V4.5a1.5 1.5 0 00-3 0v.684C7.888 5.923 6 8.238 6 11v3.172a2 2 0 01-.595 1.414L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
      },
      {
        to: '/messages',
        label: '쪽지함',
        icon: (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        to: '/mypage',
        label: '마이페이지',
        icon: (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
    ],
  },
]

function NavItem({ to, label, icon, badge, exact }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
          isActive
            ? 'bg-white/20 text-white'
            : 'text-white/60 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge > 0 && (
        <span className="ml-auto flex-shrink-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen flex flex-col bg-primary text-white shadow-xl flex-shrink-0">
      {/* 로고 */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
          L
        </div>
        <div>
          <span className="text-base font-bold tracking-wide">Link-U</span>
          <p className="text-[10px] text-white/40 leading-none mt-0.5">스터디 매칭 플랫폼</p>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* 하단 사용자 영역 */}
      <div className="px-4 py-4 border-t border-white/10">
        <NavLink
          to="/mypage/profile"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
            H
          </div>
          <div className="leading-tight overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">Hong Gil-dong</p>
            <p className="text-[10px] text-white/40">Gold · 1200점</p>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}
