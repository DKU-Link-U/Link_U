import { useMemo, useState } from 'react'
import { useActivityStats } from '../store'

const PLATFORMS = [
  { key: 'github', label: 'GitHub', color: '#1E3A5F', aliases: ['github'] },
  { key: 'baekjoon', label: '백준', color: '#2563EB', aliases: ['baekjoon', 'boj'] },
  { key: 'dreamhack', label: 'Dreamhack', color: '#7C3AED', aliases: ['dreamhack'] },
]

const LEVEL_BG = ['bg-gray-100', 'bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-[#1E3A5F]']
const LEVEL_HOVER = ['hover:bg-gray-200', 'hover:bg-blue-200', 'hover:bg-blue-400', 'hover:bg-blue-600', 'hover:bg-[#162d4a]']
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

function toNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10)
}

function normalizeDay(rawDay) {
  const date = rawDay?.date

  if (!date) return null

  return PLATFORMS.reduce((day, platform) => {
    const value = platform.aliases.reduce((sum, key) => sum + toNumber(rawDay[key]), 0)
    day[platform.key] = value
    return day
  }, { date })
}

function buildActivityMap(activity = []) {
  return activity.reduce((map, rawDay) => {
    const day = normalizeDay(rawDay)

    if (day) {
      map.set(day.date, day)
    }

    return map
  }, new Map())
}

const getTotal = day => PLATFORMS.reduce((sum, platform) => sum + toNumber(day?.[platform.key]), 0)

function getLevel(total) {
  if (total <= 0) return 0
  if (total <= 2) return 1
  if (total <= 5) return 2
  if (total <= 9) return 3
  return 4
}

function buildGrid(activity = []) {
  const activityMap = buildActivityMap(activity)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(today)
  start.setDate(start.getDate() - (26 * 7) + 1)
  start.setDate(start.getDate() - start.getDay())

  const weeks = []
  const months = []
  let lastMonth = -1
  const cursor = new Date(start)

  while (cursor <= today) {
    const week = []

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      if (dayIndex === 0) {
        const month = cursor.getMonth()

        if (month !== lastMonth) {
          months.push({ weekIndex: weeks.length, label: `${month + 1}월` })
          lastMonth = month
        }
      }

      const date = toDateKey(cursor)
      week.push(activityMap.get(date) ?? {
        date,
        github: 0,
        baekjoon: 0,
        dreamhack: 0,
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    weeks.push(week)
  }

  return { weeks, months }
}

function calcStats(weeks) {
  const days = weeks.flat().filter(Boolean)
  const activeDays = days.filter(day => getTotal(day) > 0).length
  const totalActs = days.reduce((sum, day) => sum + getTotal(day), 0)
  const weekAvg = Math.round((totalActs / 26) * 10) / 10
  let streak = 0

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (getTotal(days[index]) <= 0) break
    streak += 1
  }

  return {
    activeDays,
    weekAvg,
    streak,
    totalDays: days.length,
    totalActs,
  }
}

function Tooltip({ day, rect }) {
  const total = getTotal(day)
  const date = new Date(day.date)
  const dateLabel = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} (${WEEKDAY_KO[date.getDay()]})`
  const showBelow = rect.top < 120
  const stylePos = showBelow
    ? { top: rect.bottom + 10, left: rect.left + rect.width / 2, transform: 'translate(-50%, 0)' }
    : { top: rect.top - 10, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' }

  return (
    <div style={{ position: 'fixed', ...stylePos, zIndex: 9999, pointerEvents: 'none' }}>
      <div className="min-w-[175px] rounded-xl bg-gray-900/95 px-3.5 py-3 text-white shadow-2xl backdrop-blur-sm">
        <p className="mb-2 whitespace-nowrap text-[10px] text-gray-400">{dateLabel}</p>
        <div className="mb-2.5 flex items-baseline gap-1">
          <span className="text-lg font-bold text-white">{total}</span>
          <span className="text-[10px] text-gray-400">개 활동</span>
          {total === 0 && <span className="ml-1 text-[10px] text-gray-500">활동 없음</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          {PLATFORMS.map(platform => {
            const value = toNumber(day[platform.key])
            const pct = total > 0 ? Math.round((value / total) * 100) : 0

            return (
              <div key={platform.key} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: platform.color }}
                />
                <span className="flex-1 whitespace-nowrap text-[10px] text-gray-300">{platform.label}</span>
                <div className="h-1 w-14 overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: platform.color }}
                  />
                </div>
                <span className="w-5 text-right text-[10px] font-semibold text-white">{value}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function CommitGrass() {
  const { commitActivity, syncedPlatforms } = useActivityStats()
  const [tooltip, setTooltip] = useState(null)
  const { weeks, months } = useMemo(() => buildGrid(commitActivity), [commitActivity])
  const stats = useMemo(() => calcStats(weeks), [weeks])
  const hasActivityData = Array.isArray(commitActivity) && commitActivity.length > 0
  const hasSyncedPlatform = Object.values(syncedPlatforms ?? {}).some(Boolean)
  const weekCount = weeks.length

  const handleEnter = (event, day) => {
    if (!day) return
    setTooltip({ day, rect: event.currentTarget.getBoundingClientRect() })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-800">활동 잔디</h3>
        <div className="flex flex-wrap items-center gap-3">
          {PLATFORMS.map(platform => (
            <span key={platform.key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: platform.color }} />
              <span className="text-[10px] text-gray-500">{platform.label}</span>
            </span>
          ))}
        </div>
      </div>

      {!hasActivityData && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs leading-5 text-gray-500">
          {hasSyncedPlatform
            ? '동기화된 활동 기록이 아직 없습니다. 계정 동기화를 다시 실행해 주세요.'
            : 'GitHub, 백준, Dreamhack 계정을 연동하고 동기화하면 활동 기록이 표시됩니다.'}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '활동 일수', value: `${stats.activeDays}일`, sub: `/ ${stats.totalDays}일` },
          { label: '연속 활동', value: `${stats.streak}일`, sub: 'streak' },
          { label: '주간 평균', value: `${stats.weekAvg}개`, sub: '26주 기준' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl bg-gray-50 p-3 text-center">
            <p className="mb-0.5 text-[10px] text-gray-400">{stat.label}</p>
            <p className="text-base font-bold leading-tight text-primary">{stat.value}</p>
            <p className="mt-0.5 text-[9px] text-gray-300">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${weekCount * 12 + 28}px` }}>
          <div className="mb-1 ml-[26px] flex gap-[2px]">
            {weeks.map((_, weekIndex) => {
              const month = months.find(item => item.weekIndex === weekIndex)

              return (
                <div key={weekIndex} className="relative h-3.5 w-[10px] shrink-0">
                  {month && (
                    <span className="absolute left-0 whitespace-nowrap text-[9px] font-medium text-gray-400">
                      {month.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-[4px]">
            <div className="flex w-[20px] shrink-0 flex-col gap-[2px]">
              {WEEKDAY_KO.map((label, index) => (
                <div key={label} className="flex h-[10px] items-center justify-end">
                  {(index === 1 || index === 3 || index === 5) && (
                    <span className="pr-0.5 text-[8px] leading-none text-gray-300">{label}</span>
                  )}
                </div>
              ))}
            </div>

            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${weekCount}, 10px)`,
                gridTemplateRows: 'repeat(7, 10px)',
                gridAutoFlow: 'column',
              }}
            >
              {weeks.map((week, weekIndex) =>
                week.map((day, dayIndex) => {
                  const total = getTotal(day)
                  const level = getLevel(total)

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={[
                        'h-[10px] w-[10px] cursor-default rounded-sm transition-colors duration-100',
                        LEVEL_BG[level],
                        LEVEL_HOVER[level],
                      ].join(' ')}
                      onMouseEnter={event => handleEnter(event, day)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  )
                }),
              )}
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-end gap-1.5">
            <span className="text-[9px] text-gray-400">적음</span>
            {LEVEL_BG.map((className, index) => (
              <div key={className} className={`h-[10px] w-[10px] rounded-sm ${LEVEL_BG[index]}`} />
            ))}
            <span className="text-[9px] text-gray-400">많음</span>
          </div>
        </div>
      </div>

      {tooltip && <Tooltip day={tooltip.day} rect={tooltip.rect} />}
    </div>
  )
}
