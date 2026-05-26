import { useActivityStats } from '../store'

const PLATFORMS = [
  { key: 'github', label: 'GitHub', color: 'bg-emerald-500' },
  { key: 'baekjoon', label: 'Baekjoon', color: 'bg-blue-500' },
  { key: 'programmers', label: 'Programmers', color: 'bg-violet-500' },
]

function getTotal(day) {
  return PLATFORMS.reduce((sum, platform) => sum + Number(day[platform.key] ?? 0), 0)
}

function getIntensity(total) {
  if (total >= 12) return 'bg-emerald-700'
  if (total >= 8) return 'bg-emerald-500'
  if (total >= 4) return 'bg-emerald-300'
  if (total > 0) return 'bg-emerald-100'
  return 'bg-gray-100'
}

function chunkWeeks(activity) {
  const weeks = []

  activity.forEach((day, index) => {
    const weekIndex = Math.floor(index / 7)

    if (!weeks[weekIndex]) weeks[weekIndex] = []
    weeks[weekIndex].push(day)
  })

  return weeks
}

export default function CommitGrass() {
  const { commitActivity } = useActivityStats()
  const activity = commitActivity ?? []
  const weeks = chunkWeeks(activity)
  const totalByPlatform = PLATFORMS.map(platform => ({
    ...platform,
    value: activity.reduce((sum, day) => sum + Number(day[platform.key] ?? 0), 0),
  }))
  const totalActivity = totalByPlatform.reduce((sum, platform) => sum + platform.value, 0)
  const lastSevenDays = activity.slice(-7)
  const lastSevenTotal = lastSevenDays.reduce((sum, day) => sum + getTotal(day), 0)
  const activeDays = activity.filter(day => getTotal(day) > 0).length

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Commit Activity</h3>
        <span className="text-xs font-bold text-primary">{totalActivity} total</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {totalByPlatform.map(platform => (
          <div key={platform.key} className="bg-gray-50 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${platform.color}`} />
              <span className="text-[10px] text-gray-500 truncate">{platform.label}</span>
            </div>
            <p className="text-base font-bold text-gray-800">{platform.value}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <div className="overflow-hidden">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
              gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
              gridAutoFlow: 'column',
            }}
          >
            {weeks.map((week, weekIndex) =>
              week.map(day => {
                const total = getTotal(day)

                return (
                  <div
                    key={`${weekIndex}-${day.date}`}
                    className={`aspect-square rounded-[3px] ${getIntensity(total)}`}
                    title={`${day.date}: ${total} activities`}
                    aria-label={`${day.date} 활동 ${total}개`}
                  />
                )
              }),
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-[10px] text-green-700 mb-1">최근 7일</p>
            <p className="text-lg font-bold text-green-700">{lastSevenTotal}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 mb-1">활동한 날</p>
            <p className="text-lg font-bold text-gray-800">{activeDays}/{activity.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
