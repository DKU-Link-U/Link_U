import { useParams, Link, useNavigate } from 'react-router-dom'
import { mockProjects } from '../../models'
import { useAppState } from '../../store'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { rating } = useAppState()
  const p = mockProjects.find(x => x.projectId === id)

  if (!p) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-sm">프로젝트를 찾을 수 없습니다.</p>
        <Link to="/project" className="text-primary text-xs underline mt-2 inline-block">목록으로</Link>
      </div>
    )
  }

  const canApply = rating.totalRatingScore >= p.requiredRating && p.status === 'recruiting'

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary w-fit">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        목록으로
      </button>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-3">
          {p.status === 'recruiting'
            ? <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">모집중</span>
            : <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">마감</span>
          }
          <span className="text-[10px] text-gray-400">{p.createdAt}</span>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-3">{p.title}</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-5">{p.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {p.techStack.map(t => (
            <span key={t} className="text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-full font-medium">{t}</span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl text-sm mb-5">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">리더</p>
            <p className="font-semibold text-gray-800">{p.leaderName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">모집 인원</p>
            <p className="font-semibold text-gray-800">{p.currentCount}/{p.capacity}명</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">최소 요구 점수</p>
            <p className={`font-semibold ${canApply ? 'text-green-600' : 'text-red-500'}`}>{p.requiredRating}점</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">내 점수</p>
            <p className="font-semibold text-primary">{rating.totalRatingScore}점</p>
          </div>
        </div>

        {canApply ? (
          <button className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
            프로젝트 참여 신청
          </button>
        ) : p.status !== 'recruiting' ? (
          <button disabled className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl font-semibold text-sm cursor-not-allowed">
            모집 마감
          </button>
        ) : (
          <div className="text-center py-3 bg-red-50 rounded-xl">
            <p className="text-xs text-red-500 font-medium">점수가 부족합니다.</p>
            <p className="text-xs text-red-400 mt-0.5">필요: {p.requiredRating}점 / 현재: {rating.totalRatingScore}점</p>
          </div>
        )}
      </div>
    </div>
  )
}
