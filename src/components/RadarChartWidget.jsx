import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

// ── Mock 데이터 ──────────────────────────────────────────────────────────────
const LABELS = [
  'Algorithm',
  'CS Knowledge',
  'Collaboration',
  'Problem\nSolving',
  'Study\nActivity',
  'Project\nContrib',
]

const MY_SCORES    = [82, 68, 74, 88, 62, 76]
const AVG_SCORES   = [60, 60, 60, 60, 60, 60]   // 평균선 (reference)

// ── 색상 상수 ────────────────────────────────────────────────────────────────
const PRIMARY      = '#1E3A5F'
const PRIMARY_MID  = 'rgba(30, 58, 95, 0.35)'
const GRID_COLOR   = 'rgba(30, 58, 95, 0.08)'
const TICK_COLOR   = 'rgba(30, 58, 95, 0.45)'

// ── Chart.js 데이터 ──────────────────────────────────────────────────────────
const data = {
  labels: LABELS,
  datasets: [
    {
      label: 'My Stats',
      data: MY_SCORES,
      backgroundColor: PRIMARY_MID,
      borderColor: PRIMARY,
      borderWidth: 2.5,
      pointBackgroundColor: PRIMARY,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: PRIMARY,
      pointHoverBorderColor: '#fff',
      fill: true,
    },
    {
      label: 'Average',
      data: AVG_SCORES,
      backgroundColor: 'transparent',
      borderColor: 'rgba(156, 163, 175, 0.5)',
      borderWidth: 1.5,
      borderDash: [5, 4],
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
    },
  ],
}

// ── Chart.js 옵션 ────────────────────────────────────────────────────────────
const options = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 900,
    easing: 'easeInOutQuart',
  },
  scales: {
    r: {
      min: 0,
      max: 100,
      ticks: {
        stepSize: 25,
        display: false,            // 숫자 눈금 숨김 → 깔끔
        backdropColor: 'transparent',
      },
      grid: {
        color: GRID_COLOR,
        lineWidth: 1,
      },
      angleLines: {
        color: GRID_COLOR,
        lineWidth: 1,
      },
      pointLabels: {
        color: TICK_COLOR,
        font: {
          size: 11,
          family: "'Inter', 'Noto Sans KR', sans-serif",
          weight: '600',
        },
        padding: 8,
      },
    },
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        borderRadius: 3,
        useBorderRadius: true,
        color: '#6B7280',
        font: { size: 11, family: "'Inter', sans-serif" },
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      titleColor: '#F1F5F9',
      bodyColor: '#CBD5E1',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 10,
      callbacks: {
        label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}점`,
      },
    },
  },
}

// ── 점수별 색상 배지 ─────────────────────────────────────────────────────────
function ScorePill({ label, value }) {
  const color =
    value >= 80 ? 'bg-blue-100 text-blue-700' :
    value >= 60 ? 'bg-indigo-50 text-indigo-600' :
                  'bg-gray-100 text-gray-500'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}>
      {label.replace('\n', ' ')} <span className="opacity-70">{value}</span>
    </span>
  )
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function RadarChartWidget() {
  const total = Math.round(MY_SCORES.reduce((a, b) => a + b, 0) / MY_SCORES.length)

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Field-specific Stats</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">도메인별 역량 지수</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400">종합 평균</p>
          <p className="text-xl font-bold text-primary">{total}<span className="text-xs font-normal text-gray-400">/100</span></p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="flex-1 relative" style={{ minHeight: '220px' }}>
        <Radar data={data} options={options} />
      </div>

      {/* 점수 배지 요약 */}
      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
        {LABELS.map((label, i) => (
          <ScorePill key={label} label={label} value={MY_SCORES[i]} />
        ))}
      </div>
    </div>
  )
}
