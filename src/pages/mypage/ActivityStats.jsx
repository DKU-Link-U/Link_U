import CommitGrass from '../../components/CommitGrass'
import LineChartWidget from '../../components/LineChartWidget'
import RadarChartWidget from '../../components/RadarChartWidget'
import { useAppState } from '../../store'

const COMPLETED_STUDIES = [
  { id: 1, title: 'Java 기초 스터디', period: '2025.09 ~ 2025.12', members: 5 },
  { id: 2, title: '자료구조 알고리즘', period: '2026.01 ~ 2026.03', members: 4 },
]

const COMPLETED_PROJECTS = [
  { id: 1, title: '도서관 좌석 예약 시스템', period: '2025.10 ~ 2025.12', role: '백엔드' },
]

export default function ActivityStats() {
  const { rating, syncedPlatforms } = useAppState()

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-gray-800">내 활동 통계</h2>

      {/* 점수 요약 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'GitHub Commits',
            value: syncedPlatforms.github ? rating.githubCommitCount : '연동 필요',
            unit: syncedPlatforms.github ? '개' : '',
          },
          {
            label: '백준 티어',
            value: syncedPlatforms.baekjoon ? rating.baekjoonTier : '연동 필요',
            unit: '',
          },
          {
            label: 'Dreamhack',
            value: syncedPlatforms.dreamhack ? (rating.dreamhackScore ?? 0) : '연동 필요',
            unit: syncedPlatforms.dreamhack ? '점' : '',
          },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-md p-4 text-center">
            <p className="text-[10px] text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.value === '연동 필요' ? 'text-gray-400 text-sm' : 'text-primary'}`}>
              {s.value}<span className="text-xs font-normal text-gray-500 ml-0.5">{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RadarChartWidget />
        <CommitGrass />
      </div>

      <LineChartWidget />

      {/* 종료된 스터디 */}
      <div className="bg-white rounded-2xl shadow-md p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">종료된 스터디</h3>
        {COMPLETED_STUDIES.length === 0
          ? <p className="text-xs text-gray-400">참여한 스터디가 없습니다.</p>
          : <div className="flex flex-col gap-2">
              {COMPLETED_STUDIES.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{s.title}</p>
                    <p className="text-[10px] text-gray-400">{s.period} · {s.members}명</p>
                  </div>
                  <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">완료</span>
                </div>
              ))}
            </div>
        }
      </div>

      {/* 완성된 프로젝트 */}
      <div className="bg-white rounded-2xl shadow-md p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">완성된 프로젝트</h3>
        {COMPLETED_PROJECTS.length === 0
          ? <p className="text-xs text-gray-400">완성된 프로젝트가 없습니다.</p>
          : <div className="flex flex-col gap-2">
              {COMPLETED_PROJECTS.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{p.title}</p>
                    <p className="text-[10px] text-gray-400">{p.period} · 역할: {p.role}</p>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">완료</span>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}
