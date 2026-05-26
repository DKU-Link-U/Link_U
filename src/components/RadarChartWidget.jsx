import { useActivityStats } from '../store'

const FIELDS = [
  { key: 'algorithm', label: 'Algorithm', color: 'bg-blue-500' },
  { key: 'csKnowledge', label: 'CS Knowledge', color: 'bg-indigo-500' },
  { key: 'collaboration', label: 'Collaboration', color: 'bg-emerald-500' },
  { key: 'problemSolving', label: 'Problem Solving', color: 'bg-amber-500' },
  { key: 'studyActivity', label: 'Study Activity', color: 'bg-sky-500' },
  { key: 'projectContrib', label: 'Project Contrib', color: 'bg-violet-500' },
]

function getPoint(index, value, radius) {
  const angle = (Math.PI * 2 * index) / FIELDS.length - Math.PI / 2
  const distance = radius * (value / 100)

  return {
    x: 100 + Math.cos(angle) * distance,
    y: 100 + Math.sin(angle) * distance,
  }
}

export default function RadarChartWidget() {
  const { fieldStats } = useActivityStats()
  const values = FIELDS.map(field => ({
    ...field,
    value: Number(fieldStats[field.key] ?? 0),
  }))
  const average = Math.round(values.reduce((sum, field) => sum + field.value, 0) / values.length)
  const polygon = values
    .map((field, index) => getPoint(index, field.value, 76))
    .map(point => `${point.x},${point.y}`)
    .join(' ')

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Field-specific Stats</h3>
        <span className="text-xs font-bold text-primary">{average} avg</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[190px_1fr] gap-4 flex-1">
        <div className="relative flex items-center justify-center min-h-[190px]">
          <svg className="w-[190px] h-[190px]" viewBox="0 0 200 200" role="img" aria-label="Field-specific stats radar chart">
            {[25, 50, 75, 100].map(level => {
              const points = FIELDS
                .map((_, index) => getPoint(index, level, 76))
                .map(point => `${point.x},${point.y}`)
                .join(' ')

              return (
                <polygon
                  key={level}
                  points={points}
                  fill="none"
                  stroke="#dbeafe"
                  strokeWidth="1"
                />
              )
            })}
            {FIELDS.map((_, index) => {
              const point = getPoint(index, 100, 76)

              return (
                <line
                  key={index}
                  x1="100"
                  y1="100"
                  x2={point.x}
                  y2={point.y}
                  stroke="#e0e7ff"
                  strokeWidth="1"
                />
              )
            })}
            <polygon points={polygon} fill="rgba(37, 99, 235, 0.18)" stroke="#2563eb" strokeWidth="2" />
            {values.map((field, index) => {
              const point = getPoint(index, field.value, 76)

              return (
                <circle key={field.key} cx={point.x} cy={point.y} r="3.5" fill="#2563eb" />
              )
            })}
          </svg>
        </div>

        <div className="grid grid-cols-1 gap-2 content-center">
          {values.map(field => (
            <div key={field.key} className="grid grid-cols-[1fr_auto] gap-3 items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${field.color}`} />
                  <span className="text-[11px] text-gray-600 truncate">{field.label}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${field.color}`} style={{ width: `${field.value}%` }} />
                </div>
              </div>
              <span className="text-xs font-bold text-gray-800 tabular-nums">{field.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
