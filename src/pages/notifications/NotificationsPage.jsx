import { useState } from 'react'
import { useNotifications } from '../../store'

const TYPE_META = {
  MESSAGE:        { label: '쪽지', color: 'bg-green-100 text-green-700', icon: '✉️' },
  STUDY_APPLICATION: { label: '스터디', color: 'bg-blue-100 text-blue-700', icon: '📚' },
  PROJECT_APPLICATION: { label: '프로젝트', color: 'bg-purple-100 text-purple-700', icon: '🔧' },
  STUDY_RESULT:   { label: '스터디', color: 'bg-blue-100 text-blue-700',   icon: '📚' },
  PROJECT_RESULT: { label: '프로젝트', color: 'bg-purple-100 text-purple-700', icon: '🔧' },
  RANKING_CHANGE: { label: '랭킹', color: 'bg-yellow-100 text-yellow-700', icon: '📈' },
  SYSTEM:         { label: '시스템', color: 'bg-gray-100 text-gray-600',   icon: '🔔' },
}

const TABS = ['전체', '쪽지', '스터디', '프로젝트', '랭킹', '시스템']
const TYPE_MAP = {
  '쪽지': ['MESSAGE'],
  '스터디': ['STUDY_APPLICATION', 'STUDY_RESULT'],
  '프로젝트': ['PROJECT_APPLICATION', 'PROJECT_RESULT'],
  '랭킹': ['RANKING_CHANGE'],
  '시스템': ['SYSTEM'],
}

export default function NotificationsPage() {
  const [tab, setTab] = useState('전체')
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useNotifications()

  const filtered = tab === '전체'
    ? notifications
    : notifications.filter(n => TYPE_MAP[tab]?.includes(n.type))

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-800">알림 센터</h1>
          {unreadNotificationCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadNotificationCount}</span>
          )}
        </div>
        {unreadNotificationCount > 0 && (
          <button onClick={markAllNotificationsRead} className="text-xs text-primary hover:underline font-medium">
            전체 읽음 처리
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-md">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors ${
              tab === t ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 알림 목록 */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">알림이 없습니다.</div>
        )}
        {filtered.map(n => {
          const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM
          return (
            <button
              key={n.notificationId}
              onClick={() => markNotificationRead(n.notificationId)}
              className={`w-full text-left bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-shadow border-l-4 ${
                n.isRead ? 'border-transparent opacity-70' : 'border-primary'
              }`}
            >
              <span className="text-xl flex-shrink-0">{meta.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                  {!n.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                  )}
                </div>
                <p className="text-sm text-gray-800 leading-snug">{n.content}</p>
                <p className="text-[10px] text-gray-400 mt-1">{n.createdAt}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
