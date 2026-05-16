import { useState } from 'react'

export default function Settings() {
  const [notify, setNotify] = useState({ study: true, project: true, ranking: true, system: false })

  const toggle = key => setNotify(n => ({ ...n, [key]: !n[key] }))

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-gray-800">환경 설정</h2>

      {/* 알림 설정 */}
      <div className="bg-white rounded-2xl shadow-md p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">알림 설정</h3>
        <div className="flex flex-col gap-3">
          {[
            { key: 'study', label: '스터디 신청 결과 알림' },
            { key: 'project', label: '프로젝트 지원 결과 알림' },
            { key: 'ranking', label: '랭킹 변동 알림' },
            { key: 'system', label: '시스템 공지 알림' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{item.label}</span>
              <button
                onClick={() => toggle(item.key)}
                className={`relative w-10 h-5.5 rounded-full transition-colors ${notify[item.key] ? 'bg-primary' : 'bg-gray-200'}`}
                style={{ height: '22px', width: '40px' }}
              >
                <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                  notify[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                }`} style={{ width: '18px', height: '18px', left: notify[item.key] ? '18px' : '2px' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 계정 관리 */}
      <div className="bg-white rounded-2xl shadow-md p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">계정 관리</h3>
        <div className="flex flex-col gap-2">
          <button className="text-left text-sm text-gray-700 py-2 border-b border-gray-50 hover:text-primary transition-colors">
            비밀번호 변경
          </button>
          <button className="text-left text-sm text-gray-700 py-2 border-b border-gray-50 hover:text-primary transition-colors">
            이메일 변경
          </button>
          <button className="text-left text-sm text-red-500 py-2 hover:text-red-700 transition-colors">
            회원 탈퇴
          </button>
        </div>
      </div>
    </div>
  )
}
