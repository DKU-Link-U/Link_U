import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mockRankingList, mockUser } from '../../models'

const TABS = [
  { key: 'overall', label: '개인 전체 랭킹' },
  { key: 'department', label: '개인 학과 랭킹' },
  { key: 'dept-overall', label: '학과 전체 랭킹' },
]

const TIER_COLORS = {
  Diamond: 'text-sky-500',
  Platinum: 'text-teal-500',
  Gold: 'text-yellow-500',
  Silver: 'text-gray-400',
  Bronze: 'text-orange-400',
}

const DEPT_RANKING = [
  { rank: 1, department: 'Computer Science', avgScore: 1450, memberCount: 120 },
  { rank: 2, department: 'Software Engineering', avgScore: 1380, memberCount: 95 },
  { rank: 3, department: 'AI Convergence', avgScore: 1320, memberCount: 80 },
  { rank: 4, department: 'Electrical Engineering', avgScore: 1200, memberCount: 110 },
]

function TierIcon({ tier }) {
  return (
    <svg className={`w-4 h-4 ${TIER_COLORS[tier] ?? 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
    </svg>
  )
}

export default function RankingPage() {
  const [tab, setTab] = useState('overall')

  const myEntry = mockRankingList.find(r => r.userId === mockUser.userId)
  const topList = mockRankingList.filter(r => r.rank <= 5)

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <h1 className="text-lg font-bold text-gray-800">랭킹</h1>

      {/* 내 순위 카드 */}
      {myEntry && (
        <div className="bg-primary text-white rounded-2xl p-5 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-white/60 mb-1">나의 현재 순위</p>
            <p className="text-3xl font-bold">{myEntry.rank}<span className="text-base font-normal text-white/60"> 위</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60 mb-1">점수</p>
            <p className="text-2xl font-bold">{myEntry.score}<span className="text-sm text-white/60">점</span></p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <TierIcon tier={myEntry.tier} />
            <p className="text-sm font-semibold">{myEntry.tier}</p>
          </div>
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-md">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors ${
              tab === t.key ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 랭킹 리스트 */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {tab !== 'dept-overall' ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 w-16">순위</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">닉네임</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">학과</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">점수</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">티어</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(tab === 'department'
                ? mockRankingList.filter(r => r.department === mockUser.department)
                : mockRankingList
              ).map((r, i) => (
                <tr
                  key={r.userId}
                  className={`border-b border-gray-50 last:border-none transition-colors hover:bg-gray-50 ${
                    r.userId === mockUser.userId ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <span className={`font-bold ${i < 3 ? 'text-yellow-500' : 'text-gray-400'}`}>
                      {r.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`font-medium ${r.userId === mockUser.userId ? 'text-primary' : 'text-gray-800'}`}>
                      {r.nickname}
                      {r.userId === mockUser.userId && <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">나</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{r.department}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{r.score.toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <TierIcon tier={r.tier} />
                      <span className="text-xs text-gray-600">{r.tier}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {r.userId !== mockUser.userId && (
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/messages?to=${r.userId}`}
                          className="text-[10px] text-primary border border-primary/30 px-2 py-1 rounded-lg hover:bg-primary/5"
                        >
                          쪽지
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 w-16">순위</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">학과</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">평균 점수</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">인원</th>
              </tr>
            </thead>
            <tbody>
              {DEPT_RANKING.map((d, i) => (
                <tr key={d.rank} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className={`font-bold ${i < 3 ? 'text-yellow-500' : 'text-gray-400'}`}>{d.rank}</span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-800">{d.department}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gray-800">{d.avgScore.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right text-gray-500 text-xs">{d.memberCount}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
