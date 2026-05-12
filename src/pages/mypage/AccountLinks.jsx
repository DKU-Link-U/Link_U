import { useState } from 'react'

const PLATFORMS = [
  {
    key: 'github',
    name: 'GitHub',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
    color: 'text-gray-800',
    connected: true,
    username: 'honggildong',
    stat: '342 commits (최근 1년)',
  },
  {
    key: 'baekjoon',
    name: '백준',
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" />
      </svg>
    ),
    color: 'text-blue-600',
    connected: true,
    username: 'hgd_coding',
    stat: 'Gold IV · 450문제 해결',
  },
  {
    key: 'programmers',
    name: '프로그래머스',
    icon: (
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    color: 'text-green-600',
    connected: false,
    username: '',
    stat: '',
  },
]

export default function AccountLinks() {
  const [platforms, setPlatforms] = useState(PLATFORMS)
  const [inputMap, setInputMap] = useState({})

  const connect = key => {
    const username = inputMap[key]
    if (!username?.trim()) return
    setPlatforms(prev => prev.map(p => p.key === key ? { ...p, connected: true, username } : p))
    setInputMap(m => ({ ...m, [key]: '' }))
  }

  const disconnect = key => {
    setPlatforms(prev => prev.map(p => p.key === key ? { ...p, connected: false, username: '', stat: '' } : p))
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-gray-800">계정 연동 관리</h2>
      <p className="text-xs text-gray-500 -mt-2">외부 계정을 연동하면 활동 데이터가 자동으로 수집되어 랭킹 점수에 반영됩니다.</p>

      <div className="flex flex-col gap-3">
        {platforms.map(p => (
          <div key={p.key} className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={p.color}>{p.icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">{p.name}</p>
                  {p.connected && <p className="text-xs text-gray-400">@{p.username}</p>}
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                p.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {p.connected ? '연동됨' : '미연동'}
              </span>
            </div>

            {p.connected ? (
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                <p className="text-xs text-gray-600">{p.stat}</p>
                <button onClick={() => disconnect(p.key)}
                  className="text-[10px] text-red-500 hover:underline">연동 해제</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={inputMap[p.key] ?? ''}
                  onChange={e => setInputMap(m => ({ ...m, [p.key]: e.target.value }))}
                  placeholder={`${p.name} 아이디 입력`}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
                />
                <button onClick={() => connect(p.key)}
                  className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
                  연동
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
