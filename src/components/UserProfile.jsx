export default function UserProfile() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-6">
      {/* 프로필 이미지 */}
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-primary/20">
        <svg className="w-9 h-9 text-primary/40" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      </div>

      {/* 이름 + 소속 */}
      <div className="flex-1">
        <p className="text-xs text-gray-400 font-medium mb-0.5">Dankook University</p>
        <h2 className="text-xl font-bold text-gray-800">Hong Gil-dong</h2>
        <p className="text-sm text-gray-500 mt-0.5">Computer Science · 3rd Year</p>
      </div>

      {/* 랭킹 점수 */}
      <div className="text-center px-5 border-l border-gray-100">
        <p className="text-xs text-gray-400 font-medium mb-1">Integrated Ranking Score</p>
        <p className="text-3xl font-bold text-primary">1200</p>
      </div>

      {/* 티어 */}
      <div className="text-center px-5 border-l border-gray-100">
        <p className="text-xs text-gray-400 font-medium mb-1">Tier</p>
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-yellow-50 border border-yellow-200">
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
          </svg>
          <span className="text-sm font-bold text-yellow-600">Gold</span>
        </span>
      </div>
    </div>
  )
}
