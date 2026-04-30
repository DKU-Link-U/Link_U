// TODO: Step 2에서 실제 Chart.js Line 차트로 구현 예정
export default function LineChartWidget() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Ranking Rise Trend</h3>
      <div className="flex-1 flex items-center justify-center bg-indigo-50/50 rounded-xl border-2 border-dashed border-indigo-200 min-h-[180px]">
        <div className="text-center text-indigo-300">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <polyline points="3,17 7,11 11,14 16,7 21,9" />
          </svg>
          <p className="text-sm font-medium">LineChartWidget</p>
          <p className="text-xs mt-1 text-indigo-200">Jan ~ Dec 월별 랭킹 추이</p>
        </div>
      </div>
    </div>
  )
}
