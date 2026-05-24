import { Link } from 'react-router-dom'
import { ROUTE_PATHS, routeTo } from '../../routes/paths'
import { useProjects } from '../../store'

const FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'recruiting', label: '모집중' },
  { value: 'closed', label: '마감' },
]

export default function ProjectBoard() {
  const { filteredProjects, projectFilters, setProjectFilters } = useProjects()

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">프로젝트 게시판</h1>
        <Link
          to={ROUTE_PATHS.project.create}
          className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          프로젝트 모집글 작성
        </Link>
      </div>

      {/* 검색 */}
      <div className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={projectFilters.keyword}
            onChange={e => setProjectFilters({ keyword: e.target.value })}
            placeholder="프로젝트명, 기술스택 검색"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
        </div>
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setProjectFilters({ status: f.value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                projectFilters.status === f.value ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 프로젝트 목록 */}
      <div className="flex flex-col gap-3">
        {filteredProjects.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">검색 결과가 없습니다.</div>
        )}
        {filteredProjects.map(p => (
          <Link
            key={p.projectId}
            to={routeTo.projectDetail(p.projectId)}
            className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  {p.status === 'recruiting'
                    ? <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">모집중</span>
                    : <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">마감</span>
                  }
                  <span className="text-[10px] text-gray-400">{p.createdAt}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">{p.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <div className="flex gap-1 flex-wrap">
                {p.techStack.map(t => (
                  <span key={t} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                <span>리더: {p.leaderName}</span>
                <span>{p.currentCount}/{p.capacity}명</span>
                <span className="text-primary font-medium">최소 {p.requiredRating}점</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
