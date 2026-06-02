import { useActivityStats } from '../store'

const TREND_SLOT_COUNT = 14
const CHART_LEFT = 12
const CHART_WIDTH = 276
const CHART_VIEWBOX_WIDTH = 300
const CHART_VIEWBOX_HEIGHT = 120
const CHART_MID_Y = 61

function toNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getHistoryDate(item) {
  return item.date ?? item.recordedDate ?? ''
}

function getHistoryLabel(item) {
  const date = getHistoryDate(item)

  return item.month ?? date.slice(5) ?? ''
}

function pickRecentTwoWeekHistory(history) {
  const today = new Date()
  const todayKey = toDateKey(today)
  const startDate = new Date(today)

  startDate.setDate(today.getDate() - (TREND_SLOT_COUNT - 1))

  const startKey = toDateKey(startDate)
  const byDate = new Map()

  history.forEach(item => {
    const key = getHistoryDate(item)

    if (!key || key < startKey || key > todayKey) return

    byDate.set(key, {
      ...item,
      label: getHistoryLabel(item),
      score: toNumber(item.score),
    })
  })

  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, item]) => item)
    .slice(0, TREND_SLOT_COUNT)
}

function getSlotX(slotIndex) {
  return CHART_LEFT + (slotIndex * CHART_WIDTH) / (TREND_SLOT_COUNT - 1)
}

function toChartPercent(value, max) {
  return `${(value / max) * 100}%`
}

function buildSlots(history) {
  return Array.from({ length: TREND_SLOT_COUNT }, (_, slotIndex) => ({
    slotIndex,
    item: history[slotIndex] ?? null,
  }))
}

function buildPoints(history) {
  if (history.length === 0) return []

  const scores = history.map(item => toNumber(item.score))
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min

  return history.map((item, index) => {
    const x = getSlotX(index)
    const y = range === 0
      ? CHART_MID_Y
      : 98 - ((toNumber(item.score) - min) / range) * 74

    return {
      ...item,
      x,
      y,
    }
  })
}

export default function LineChartWidget({
  rankingHistory: rankingHistoryOverride,
  rating: ratingOverride,
  emptyMessage = '활동 데이터를 동기화하면 하루 1회 기준 점수 이력이 표시됩니다.',
} = {}) {
  const activityStats = useActivityStats()
  const rankingHistory = rankingHistoryOverride ?? activityStats.rankingHistory
  const rating = ratingOverride ?? activityStats.rating
  const rawHistory = rankingHistory?.length ? rankingHistory : []
  const current = toNumber(rating.totalRatingScore ?? rawHistory.at(-1)?.score)
  const history = pickRecentTwoWeekHistory(rawHistory)
  const slots = buildSlots(history)
  const hasHistory = history.length > 0
  const points = buildPoints(history)
  const path = points.map(point => `${point.x},${point.y}`).join(' ')
  const first = history[0]?.score ?? current
  const growth = current - first
  const peak = Math.max(...history.map(item => toNumber(item.score)), current)

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
        {!hasHistory && (
          <div className="flex h-[150px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center">
            <p className="text-xs text-gray-400">{emptyMessage}</p>
          </div>
        )}

        {hasHistory && (
          <div className="relative h-[150px]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 120" preserveAspectRatio="none" role="img" aria-label="Ranking score trend line chart">
              {[24, 61, 98].map(y => (
                <line key={y} x1="12" y1={y} x2="288" y2={y} stroke="#eef2ff" strokeWidth="1" />
              ))}
              {points.length > 1 && (
                <polyline points={path} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            {points.map((point, index) => (
              <span
                key={`${point.date ?? point.label}-${index}`}
                className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600 ring-2 ring-white"
                style={{
                  left: toChartPercent(point.x, CHART_VIEWBOX_WIDTH),
                  top: toChartPercent(point.y, CHART_VIEWBOX_HEIGHT),
                }}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
          {slots.map(({ item, slotIndex }) => (
            <div key={slotIndex} className="min-h-[34px] text-center">
              <p className="truncate text-[10px] text-gray-400">{item?.label ?? ''}</p>
              <p className="text-[10px] font-semibold text-gray-700">{item?.score ?? ''}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
