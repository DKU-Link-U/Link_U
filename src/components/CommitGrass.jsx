import { useState, useMemo } from 'react'

/* ═══════════════════════════════════════════════════════════
   Mock Data  ─  최근 26주(약 6개월)의 랜덤 활동 데이터 생성
   플랫폼: GitHub / 백준(BOJ) / 프로그래머스
═══════════════════════════════════════════════════════════ */
function generateMockData() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const map = {}

  for (let i = 0; i < 26 * 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const isWeekday = d.getDay() >= 1 && d.getDay() <= 5
    const active = Math.random() < (isWeekday ? 0.68 : 0.32)

    map[key] = {
      date:        key,
      github:      active && Math.random() < 0.75 ? Math.floor(Math.random() * 8) + 1 : 0,
      boj:         active && Math.random() < 0.55 ? Math.floor(Math.random() * 6) + 1 : 0,
      programmers: active && Math.random() < 0.40 ? Math.floor(Math.random() * 4) + 1 : 0,
    }
  }
  return map
}

const MOCK_DATA = generateMockData()

/* ═══════════════════════════════════════════════════════════
   상수
═══════════════════════════════════════════════════════════ */
const PLATFORMS = [
  { key: 'github',      label: 'GitHub',      color: '#1E3A5F' },
  { key: 'boj',         label: '백준',          color: '#FB923C' },
  { key: 'programmers', label: '프로그래머스',   color: '#14B8A6' },
]

// 단국대 네이비 기반 5단계 색상 스케일
const LEVEL_BG    = ['bg-gray-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-600', 'bg-[#1E3A5F]']
const LEVEL_HOVER = ['hover:bg-gray-200', 'hover:bg-blue-300', 'hover:bg-blue-500', 'hover:bg-blue-700', 'hover:bg-[#162d4a]']

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

/* ═══════════════════════════════════════════════════════════
   유틸리티
═══════════════════════════════════════════════════════════ */
const getTotal = day => PLATFORMS.reduce((s, p) => s + (day?.[p.key] ?? 0), 0)

function getLevel(total) {
  if (total === 0) return 0
  if (total <= 2)  return 1
  if (total <= 5)  return 2
  if (total <= 9)  return 3
  return 4
}

/** 26주 × 7일 격자와 월 레이블 목록을 반환 */
function buildGrid() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 26주 전 날짜의 일요일로 정렬
  const start = new Date(today)
  start.setDate(start.getDate() - 26 * 7 + 1)
  start.setDate(start.getDate() - start.getDay())

  const weeks  = []
  const months = [] // { wIdx, label }
  let lastMonth = -1
  const cur = new Date(start)

  while (cur <= today) {
    const week = []
    for (let d = 0; d < 7; d++) {
      // 새 달 감지 → 월 레이블 기록 (주의 첫째 날 기준)
      if (d === 0) {
        const m = cur.getMonth()
        if (m !== lastMonth) {
          months.push({ wIdx: weeks.length, label: `${m + 1}월` })
          lastMonth = m
        }
      }
      const isFuture = cur > today
      const ds = cur.toISOString().split('T')[0]
      week.push(
        isFuture ? null : (MOCK_DATA[ds] ?? { date: ds, github: 0, boj: 0, programmers: 0 }),
      )
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }
  return { weeks, months }
}

/** 활동 날짜 수, 연속 달성(streak), 주간 평균 계산 */
function calcStats() {
  const vals      = Object.values(MOCK_DATA)
  const activeDays = vals.filter(d => getTotal(d) > 0).length
  const totalActs  = vals.reduce((s, d) => s + getTotal(d), 0)
  const weekAvg    = Math.round((totalActs / 26) * 10) / 10

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const c = new Date(today)
    c.setDate(c.getDate() - i)
    const ds  = c.toISOString().split('T')[0]
    const day = MOCK_DATA[ds]
    if (day && getTotal(day) > 0) streak++
    else break
  }
  return { activeDays, weekAvg, streak, totalDays: vals.length }
}

/* ═══════════════════════════════════════════════════════════
   Tooltip 컴포넌트  (fixed 포지셔닝, 플랫폼별 기여도 표시)
═══════════════════════════════════════════════════════════ */
function Tooltip({ day, rect }) {
  const total = getTotal(day)
  const d = new Date(day.date)
  const dateLabel = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${WEEKDAY_KO[d.getDay()]})`

  // 화면 위쪽 여유가 없으면 아래쪽으로 뒤집기
  const showBelow = rect.top < 120
  const stylePos = showBelow
    ? { top: rect.bottom + 10, left: rect.left + rect.width / 2, transform: 'translate(-50%, 0)' }
    : { top: rect.top - 10,    left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' }

  return (
    <div
      style={{ position: 'fixed', ...stylePos, zIndex: 9999, pointerEvents: 'none' }}
    >
      <div className="bg-gray-900/95 backdrop-blur-sm text-white rounded-xl px-3.5 py-3 shadow-2xl min-w-[175px]">
        {/* 날짜 */}
        <p className="text-[10px] text-gray-400 mb-2 whitespace-nowrap">{dateLabel}</p>

        {/* 총 활동량 */}
        <div className="flex items-baseline gap-1 mb-2.5">
          <span className="text-lg font-bold text-white">{total}</span>
          <span className="text-[10px] text-gray-400">회 활동</span>
          {total === 0 && <span className="text-[10px] text-gray-500 ml-1">— 활동 없음</span>}
        </div>

        {/* 플랫폼별 분해 */}
        <div className="flex flex-col gap-1.5">
          {PLATFORMS.map(p => {
            const val = day[p.key] ?? 0
            const pct = total > 0 ? Math.round((val / total) * 100) : 0
            return (
              <div key={p.key} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: p.color }}
                />
                <span className="text-[10px] text-gray-300 flex-1 whitespace-nowrap">{p.label}</span>
                {/* 미니 바 */}
                <div className="w-14 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: p.color }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-white w-5 text-right">{val}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 캐럿 (위에 표시될 때만) */}
      {!showBelow && (
        <div className="flex justify-center">
          <div
            style={{
              width: 0, height: 0,
              borderLeft:  '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop:   '5px solid rgba(17,24,39,0.95)',
            }}
          />
        </div>
      )}
      {showBelow && (
        <div className="flex justify-center order-first" style={{ marginBottom: -1 }}>
          <div
            style={{
              width: 0, height: 0,
              borderLeft:   '5px solid transparent',
              borderRight:  '5px solid transparent',
              borderBottom: '5px solid rgba(17,24,39,0.95)',
            }}
          />
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   CommitGrass  ─  메인 컴포넌트
═══════════════════════════════════════════════════════════ */
export default function CommitGrass() {
  const [tooltip, setTooltip] = useState(null)
  const { weeks, months } = useMemo(() => buildGrid(), [])
  const stats = useMemo(() => calcStats(), [])
  const W = weeks.length

  const handleEnter = (e, day) => {
    if (!day) return
    setTooltip({ day, rect: e.currentTarget.getBoundingClientRect() })
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col gap-4">

      {/* ── 헤더 ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-800">활동 잔디</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {PLATFORMS.map(p => (
            <span key={p.key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-[10px] text-gray-500">{p.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── 통계 카드 3개 ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '활동 날짜',  value: `${stats.activeDays}일`,  sub: `/ ${stats.totalDays}일` },
          { label: '연속 달성',  value: `${stats.streak}일`,      sub: 'streak'                  },
          { label: '주간 평균',  value: `${stats.weekAvg}회`,     sub: '26주 기준'                },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 mb-0.5">{s.label}</p>
            <p className="text-base font-bold text-primary leading-tight">{s.value}</p>
            <p className="text-[9px] text-gray-300 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── 잔디 그리드 ── */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${W * 12 + 28}px` }}>

          {/* 월 레이블 행 */}
          <div className="flex ml-[26px] mb-1 gap-[2px]">
            {weeks.map((_, wIdx) => {
              const m = months.find(mo => mo.wIdx === wIdx)
              return (
                <div key={wIdx} className="w-[10px] shrink-0 relative h-3.5">
                  {m && (
                    <span className="absolute left-0 text-[9px] text-gray-400 whitespace-nowrap font-medium">
                      {m.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* 요일 레이블 + 셀 */}
          <div className="flex gap-[4px]">

            {/* 요일 (월·수·금만 표시) */}
            <div className="flex flex-col gap-[2px] w-[20px] shrink-0">
              {WEEKDAY_KO.map((label, i) => (
                <div key={i} className="h-[10px] flex items-center justify-end">
                  {(i === 1 || i === 3 || i === 5) && (
                    <span className="text-[8px] text-gray-300 leading-none pr-0.5">{label}</span>
                  )}
                </div>
              ))}
            </div>

            {/* 잔디 셀 그리드 — gridAutoFlow:column 으로 주(週) 순서 렌더링 */}
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${W}, 10px)`,
                gridTemplateRows:    'repeat(7, 10px)',
                gridAutoFlow:        'column',
              }}
            >
              {weeks.map((week, wIdx) =>
                week.map((day, dIdx) => {
                  const total = getTotal(day)
                  const lvl   = getLevel(total)
                  return (
                    <div
                      key={`${wIdx}-${dIdx}`}
                      className={[
                        'w-[10px] h-[10px] rounded-sm cursor-default',
                        'transition-colors duration-100',
                        LEVEL_BG[lvl],
                        day ? LEVEL_HOVER[lvl] : '',
                      ].join(' ')}
                      onMouseEnter={e => handleEnter(e, day)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  )
                })
              )}
            </div>
          </div>

          {/* 범례 */}
          <div className="flex items-center gap-1.5 justify-end mt-2.5">
            <span className="text-[9px] text-gray-400">없음</span>
            {LEVEL_BG.map((cls, i) => (
              <div key={i} className={`w-[10px] h-[10px] rounded-sm ${cls}`} />
            ))}
            <span className="text-[9px] text-gray-400">많음</span>
          </div>
        </div>
      </div>

      {/* 툴팁 */}
      {tooltip && <Tooltip day={tooltip.day} rect={tooltip.rect} />}
    </div>
  )
}
