// TODO: Step 2에서 실제 히트맵 그리드로 구현 예정
export default function CommitGrass() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Commit Activity (GitHub · Baekjoon · Programmers)</h3>
      <div className="flex-1 flex items-center justify-center bg-green-50/50 rounded-xl border-2 border-dashed border-green-200">
        <div className="text-center text-green-300">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <rect x="3" y="3" width="4" height="4" rx="0.5" />
            <rect x="9" y="3" width="4" height="4" rx="0.5" />
            <rect x="15" y="3" width="4" height="4" rx="0.5" />
            <rect x="3" y="9" width="4" height="4" rx="0.5" />
            <rect x="9" y="9" width="4" height="4" rx="0.5" />
            <rect x="15" y="9" width="4" height="4" rx="0.5" />
            <rect x="3" y="15" width="4" height="4" rx="0.5" />
            <rect x="9" y="15" width="4" height="4" rx="0.5" />
            <rect x="15" y="15" width="4" height="4" rx="0.5" />
          </svg>
          <p className="text-sm font-medium">CommitGrass</p>
          <p className="text-xs mt-1 text-green-200">3행 × 연간 그리드 히트맵<br/>Algorithm / CS Knowledge / Collaboration</p>
        </div>
      </div>
    </div>
  )
}
