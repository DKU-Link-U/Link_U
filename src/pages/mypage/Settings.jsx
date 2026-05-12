import { useState } from 'react'

const NOTIFICATION_OPTIONS = [
  { key: 'study', label: '스터디 신청 결과 알림', description: '스터디 지원 승인과 거절 결과를 알려줍니다.' },
  { key: 'project', label: '프로젝트 지원 결과 알림', description: '프로젝트 참여 신청 상태가 바뀌면 알려줍니다.' },
  { key: 'ranking', label: '랭킹 변동 알림', description: '내 순위나 점수에 변화가 생기면 알려줍니다.' },
  { key: 'system', label: '시스템 공지 알림', description: '점검, 정책 변경 같은 서비스 공지를 알려줍니다.' },
]

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onChange}
      className={`relative h-7 w-12 flex-shrink-0 rounded-full border transition-colors duration-200 ${
        checked
          ? 'border-primary bg-primary'
          : 'border-gray-200 bg-gray-100'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function Settings() {
  const [notify, setNotify] = useState({ study: true, project: true, ranking: true, system: false })

  const toggle = key => setNotify(n => ({ ...n, [key]: !n[key] }))

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-gray-800">환경 설정</h2>

      {/* 알림 설정 */}
      <div className="bg-white rounded-2xl shadow-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">알림 설정</h3>
          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {Object.values(notify).filter(Boolean).length}개 활성화
          </span>
        </div>
        <div className="flex flex-col divide-y divide-gray-100">
          {NOTIFICATION_OPTIONS.map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{item.description}</p>
              </div>
              <ToggleSwitch
                checked={notify[item.key]}
                onChange={() => toggle(item.key)}
              />
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
