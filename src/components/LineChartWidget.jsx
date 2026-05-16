import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

// ── Mock 데이터 ──────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const SCORES = [820, 900, 950, 980, 1020, 1050, 1100, 1080, 1120, 1150, 1180, 1200]

// ── 색상 상수 ────────────────────────────────────────────────────────────────
const PRIMARY = '#1E3A5F'

// ── 그라데이션 배경 (canvas API) ─────────────────────────────────────────────
function createGradient(ctx, chartArea) {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  gradient.addColorStop(0,   'rgba(30, 58, 95, 0.30)')
  gradient.addColorStop(0.5, 'rgba(30, 58, 95, 0.10)')
  gradient.addColorStop(1,   'rgba(30, 58, 95, 0.00)')
  return gradient
}

// ── Chart.js 데이터 ──────────────────────────────────────────────────────────
const data = {
  labels: MONTHS,
  datasets: [
    {
      label: 'Ranking Score',
      data: SCORES,
      borderColor: PRIMARY,
      borderWidth: 2.5,
      tension: 0.42,                    // 부드러운 곡선
      fill: true,
      backgroundColor: (context) => {
        const chart = context.chart
        const { ctx, chartArea } = chart
        if (!chartArea) return 'transparent'
        return createGradient(ctx, chartArea)
      },
      pointBackgroundColor: PRIMARY,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointHoverBackgroundColor: PRIMARY,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2.5,
    },
  ],
}

// ── Chart.js 옵션 ────────────────────────────────────────────────────────────
const options = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1000,
    easing: 'easeInOutCubic',
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: '#9CA3AF',
        font: { size: 11, family: "'Inter', sans-serif" },
        maxRotation: 0,
      },
    },
    y: {
      position: 'right',
      grid: {
        color: 'rgba(0, 0, 0, 0.04)',
        lineWidth: 1,
        drawTicks: false,
      },
      border: { display: false, dash: [4, 4] },
      ticks: {
        color: '#9CA3AF',
        font: { size: 11, family: "'Inter', sans-serif" },
        padding: 8,
        callback: val => `${(val / 1000).toFixed(1)}k`,
      },
      min: 700,
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      titleColor: '#F1F5F9',
      bodyColor: '#94A3B8',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 12,
      caretSize: 5,
      callbacks: {
        title: items => `${items[0].label} 2026`,
        label: ctx => ` 점수: ${ctx.raw.toLocaleString()}점`,
        afterLabel: ctx => {
          const prev = SCORES[ctx.dataIndex - 1]
          if (prev == null) return ''
          const diff = ctx.raw - prev
          return ` 전월 대비: ${diff >= 0 ? '+' : ''}${diff}점`
        },
      },
    },
  },
}

// ── 통계 요약 카드 ────────────────────────────────────────────────────────────
function StatChip({ label, value, highlight }) {
  return (
    <div className={`flex flex-col items-center px-4 py-2 rounded-xl ${highlight ? 'bg-primary/8' : 'bg-gray-50'}`}
         style={{ backgroundColor: highlight ? 'rgba(30,58,95,0.07)' : undefined }}>
      <p className="text-[10px] text-gray-400 whitespace-nowrap">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-primary' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function LineChartWidget() {
  const current  = SCORES.at(-1)
  const first    = SCORES[0]
  const maxScore = Math.max(...SCORES)
  const totalRise = current - first
  const bestMonth = MONTHS[SCORES.indexOf(maxScore)]
  const lastDiff  = SCORES.at(-1) - SCORES.at(-2)

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Ranking Rise Trend</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">2026년 연간 랭킹 점수 추이</p>
        </div>

        {/* 현재 점수 + 월별 증감 */}
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{current.toLocaleString()}<span className="text-xs font-normal text-gray-400 ml-1">점</span></p>
          <p className={`text-xs font-semibold mt-0.5 ${lastDiff >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
            {lastDiff >= 0 ? '▲' : '▼'} {Math.abs(lastDiff)}점 (전월 대비)
          </p>
        </div>
      </div>

      {/* 차트 */}
      <div className="relative" style={{ height: '180px' }}>
        <Line data={data} options={options} />
      </div>

      {/* 요약 통계 */}
      <div className="flex justify-around mt-4 pt-3 border-t border-gray-50">
        <StatChip label="연간 상승" value={`+${totalRise.toLocaleString()}점`} highlight />
        <StatChip label="최고 점수" value={maxScore.toLocaleString()} />
        <StatChip label="최고 달성월" value={bestMonth} />
        <StatChip label="현재 티어" value="Gold" />
      </div>
    </div>
  )
}
