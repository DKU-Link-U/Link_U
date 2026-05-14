import { useActivityStats } from '../store'

function buildPoints(history) {
  const scores = history.map(item => Number(item.score ?? 0))
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = Math.max(max - min, 1)

  return history.map((item, index) => {
    const x = history.length === 1 ? 150 : 12 + (index * 276) / (history.length - 1)
    const y = 98 - ((Number(item.score ?? 0) - min) / range) * 74

    return {
      ...item,
      x,
      y,
    }
  })
}

export default function LineChartWidget() {
  const { rankingHistory, rating } = useActivityStats()
  const history = rankingHistory?.length ? rankingHistory : []
  const points = buildPoints(history)
  const path = points.map(point => `${point.x},${point.y}`).join(' ')
  const current = history.at(-1)?.score ?? rating.totalRatingScore
  const first = history[0]?.score ?? current
  const growth = current - first
  const peak = Math.max(...history.map(item => Number(item.score ?? 0)), current)

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Ranking Rise Trend</h3>
        <span className={`text-xs font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {growth >= 0 ? '+' : ''}{growth} pts
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-indigo-50 rounded-xl px-3 py-2">
          <p className="text-[10px] text-indigo-600 mb-1">현재 점수</p>
          <p className="text-lg font-bold text-indigo-700">{current}</p>
        </div>
        <div className="bg-green-50 rounded-xl px-3 py-2">
          <p className="text-[10px] text-green-600 mb-1">상승폭</p>
          <p className="text-lg font-bold text-green-700">{growth >= 0 ? '+' : ''}{growth}</p>
        </div>
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="text-[10px] text-gray-500 mb-1">최고점</p>
          <p className="text-lg font-bold text-gray-800">{peak}</p>
        </div>
      </div>

      <div className="flex-1 min-h-[160px]">
        <svg className="w-full h-[150px]" viewBox="0 0 300 120" preserveAspectRatio="none" role="img" aria-label="Ranking score trend line chart">
          {[24, 61, 98].map(y => (
            <line key={y} x1="12" y1={y} x2="288" y2={y} stroke="#eef2ff" strokeWidth="1" />
          ))}
          <polyline points={path} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {points.map(point => (
            <circle key={point.month} cx={point.x} cy={point.y} r="3.5" fill="#4f46e5" />
          ))}
        </svg>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
          {history.map(item => (
            <div key={item.month} className="text-center">
              <p className="text-[10px] text-gray-400">{item.month}</p>
              <p className="text-[10px] font-semibold text-gray-700">{item.score}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
