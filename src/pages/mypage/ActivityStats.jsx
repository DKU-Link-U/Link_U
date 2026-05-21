import { Link } from 'react-router-dom'
import CommitGrass from '../../components/CommitGrass'
import LineChartWidget from '../../components/LineChartWidget'
import RadarChartWidget from '../../components/RadarChartWidget'
import { routeTo } from '../../routes/paths'
import { useAppState, useMyProjectsData, useMyStudiesData } from '../../store'

function CompletedList({ emptyText, items, linkTo, title, tone }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-md">
      <h3 className="mb-3 text-sm font-bold text-gray-700">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-gray-800">{item.title}</p>
                <p className="mt-1 text-[10px] text-gray-400">
                  리더 {item.leaderName} · {item.currentCount}/{item.capacity}명
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${tone}`}>완료</span>
                <Link to={linkTo(item)} className="text-[10px] font-semibold text-primary hover:underline">보기</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ActivityStats() {
  const { rating, syncedPlatforms } = useAppState()
  const { items: myStudies } = useMyStudiesData()
  const { items: myProjects } = useMyProjectsData()
  const completedStudies = myStudies.filter(study => study.status === 'closed')
  const completedProjects = myProjects.filter(project => project.status === 'closed')

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-gray-800">내 활동 통계</h2>

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
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl bg-white p-4 text-center shadow-md">
            <p className="mb-1 text-[10px] text-gray-400">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.value === '연동 필요' ? 'text-sm text-gray-400' : 'text-primary'}`}>
              {stat.value}<span className="ml-0.5 text-xs font-normal text-gray-500">{stat.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RadarChartWidget />
        <CommitGrass />
      </div>

      <LineChartWidget />

      <CompletedList
        emptyText="종료된 스터디가 없습니다."
        items={completedStudies}
        linkTo={item => routeTo.studyDetail(item.groupId)}
        title="종료된 스터디"
        tone="bg-gray-200 text-gray-600"
      />

      <CompletedList
        emptyText="완료된 프로젝트가 없습니다."
        items={completedProjects}
        linkTo={item => routeTo.projectDetail(item.projectId)}
        title="완료된 프로젝트"
        tone="bg-purple-100 text-purple-600"
      />
    </div>
  )
}
