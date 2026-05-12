// TODO: Step 2에서 실제 Chart.js Radar 차트로 구현 예정
export default function RadarChartWidget() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Field-specific Stats</h3>
      <div className="flex-1 flex items-center justify-center bg-blue-50/50 rounded-xl border-2 border-dashed border-blue-200">
        <div className="text-center text-blue-300">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
          </svg>
          <p className="text-sm font-medium">RadarChartWidget</p>
          <p className="text-xs mt-1 text-blue-200">6축: Algorithm, CS Knowledge,<br/>Collaboration, Problem Solving, ...</p>
        </div>
      </div>
    </div>
  )
}
