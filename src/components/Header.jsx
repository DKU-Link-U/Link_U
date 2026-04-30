export default function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
      {/* 좌측 여백 (균형용) */}
      <div className="w-24" />

      {/* 중앙 타이틀 */}
      <h1 className="text-base font-semibold text-primary tracking-tight">
        My Dashboard
      </h1>

      {/* 우측 아이콘 그룹 */}
      <div className="flex items-center gap-3 w-24 justify-end">
        {/* 알림 아이콘 */}
        <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M15 17H20L18.595 15.595A2 2 0 0118 14.172V11C18 8.238 16.112 5.923 13.5 5.184V4.5a1.5 1.5 0 00-3 0v.684C7.888 5.923 6 8.238 6 11v3.172a2 2 0 01-.595 1.414L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* 알림 뱃지 */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* My Page 아이콘 */}
        <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-xs font-medium hidden sm:inline">My Page</span>
        </button>
      </div>
    </header>
  )
}
