import { useMemo, useState } from 'react'
import { useActivityStats } from '../store'
import { addDaysToDateKey, parseDateKey, toKoreanDateKey } from '../utils/koreanTime'

const LEVEL_BG = ['bg-gray-100', 'bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-[#1E3A5F]']
const LEVEL_HOVER = ['hover:bg-gray-200', 'hover:bg-blue-200', 'hover:bg-blue-400', 'hover:bg-blue-600', 'hover:bg-[#162d4a]']
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

function toNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function normalizeDay(rawDay) {
  const date = rawDay?.date

  if (!date) return null

  return {
    date,
    github: toNumber(rawDay.github ?? rawDay.count),
  }
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

function getLevel(total) {
  if (total <= 0) return 0
  if (total <= 2) return 1
  if (total <= 5) return 2
  if (total <= 9) return 3
  return 4
}

function buildGrid(activity = []) {
  const activityMap = buildActivityMap(activity)
  const todayKey = toKoreanDateKey()
  const startKey = addDaysToDateKey(todayKey, -(26 * 7) + 1)
  const start = parseDateKey(startKey)

  start.setDate(start.getDate() - start.getDay())

  let cursorKey = toKoreanDateKey(start)
  const weeks = []
  const months = []
  let lastMonth = -1

  while (cursorKey <= todayKey) {
    const week = []

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const cursor = parseDateKey(cursorKey)

      if (dayIndex === 0) {
        const month = cursor.getMonth()

        if (month !== lastMonth) {
          months.push({ weekIndex: weeks.length, label: `${month + 1}월` })
          lastMonth = month
        }
      }

      week.push(activityMap.get(cursorKey) ?? {
        date: cursorKey,
        github: 0,
      })
      cursorKey = addDaysToDateKey(cursorKey, 1)
    }

    weeks.push(week)
  }

  return { weeks, months }
}

function calcStats(weeks) {
  const todayKey = toKoreanDateKey()
  const days = weeks.flat().filter(day => day?.date && day.date <= todayKey)
  const activeDays = days.filter(day => toNumber(day.github) > 0).length
  const totalCommits = days.reduce((sum, day) => sum + toNumber(day.github), 0)
  const weekAvg = Math.round((totalCommits / 26) * 10) / 10
  let streak = 0

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (toNumber(days[index].github) <= 0) break
    streak += 1
  }

  return {
    activeDays,
    streak,
    totalCommits,
    totalDays: days.length,
    weekAvg,
  }
}

function Tooltip({ day, rect }) {
  const count = toNumber(day.github)
  const date = parseDateKey(day.date)
  const dateLabel = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} (${WEEKDAY_KO[date.getDay()]})`
  const showBelow = rect.top < 120
  const stylePos = showBelow
    ? { top: rect.bottom + 10, left: rect.left + rect.width / 2, transform: 'translate(-50%, 0)' }
    : { top: rect.top - 10, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' }

  return (
    <div style={{ position: 'fixed', ...stylePos, zIndex: 9999, pointerEvents: 'none' }}>
      <div className="min-w-[170px] rounded-xl bg-gray-900/95 px-3.5 py-3 text-white shadow-2xl backdrop-blur-sm">
        <p className="mb-2 whitespace-nowrap text-[10px] text-gray-400">{dateLabel}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-white">{count}</span>
          <span className="text-[10px] text-gray-400">GitHub commits</span>
          {count === 0 && <span className="ml-1 text-[10px] text-gray-500">활동 없음</span>}
        </div>
      </div>
    </div>
  )
}

export default function CommitGrass({
  commitActivity: commitActivityOverride,
  syncedPlatforms: syncedPlatformsOverride,
  emptyMessage,
} = {}) {
  const activityStats = useActivityStats()
  const commitActivity = commitActivityOverride ?? activityStats.commitActivity
  const syncedPlatforms = syncedPlatformsOverride ?? activityStats.syncedPlatforms
  const [tooltip, setTooltip] = useState(null)
  const { weeks, months } = useMemo(() => buildGrid(commitActivity), [commitActivity])
  const stats = useMemo(() => calcStats(weeks), [weeks])
  const hasGitHubSynced = Boolean(syncedPlatforms?.github)
  const hasCommitActivity = Array.isArray(commitActivity) && commitActivity.some(day => toNumber(day.github) > 0)
  const weekCount = weeks.length

  const handleEnter = (event, day) => {
    if (!day) return
    setTooltip({ day, rect: event.currentTarget.getBoundingClientRect() })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-800">GitHub 활동 잔디</h3>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#1E3A5F]" />
          <span className="text-[10px] text-gray-500">날짜별 커밋</span>
        </span>
      </div>

      {!hasCommitActivity && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs leading-5 text-gray-500">
          {emptyMessage ?? (hasGitHubSynced
            ? '최근 26주 동안 조회된 GitHub 커밋 기록이 없습니다.'
            : 'GitHub 계정을 연동하고 동기화하면 날짜별 커밋 기록이 표시됩니다.')}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '커밋한 날', value: `${stats.activeDays}일`, sub: `/ ${stats.totalDays}일` },
          { label: '연속 커밋', value: `${stats.streak}일`, sub: 'streak' },
          { label: '총 커밋', value: `${stats.totalCommits}개`, sub: `주간 평균 ${stats.weekAvg}개` },
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
                gridAutoFlow: 'column',
                gridTemplateColumns: `repeat(${weekCount}, 10px)`,
                gridTemplateRows: 'repeat(7, 10px)',
              }}
            >
              {weeks.map((week, weekIndex) =>
                week.map((day, dayIndex) => {
                  const level = getLevel(toNumber(day.github))

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
            {LEVEL_BG.map(className => (
              <div key={className} className={`h-[10px] w-[10px] rounded-sm ${className}`} />
            ))}
            <span className="text-[9px] text-gray-400">많음</span>
          </div>
        </div>
      </div>

      {tooltip && <Tooltip day={tooltip.day} rect={tooltip.rect} />}
    </div>
  )
}
