import { useParams, Link, useNavigate } from 'react-router-dom'
import { mockStudyGroups, mockUser, mockRating } from '../../models'

export default function StudyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const sg = mockStudyGroups.find(g => g.groupId === id)

  if (!sg) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-sm">스터디를 찾을 수 없습니다.</p>
        <Link to="/study" className="text-primary text-xs underline mt-2 inline-block">목록으로</Link>
      </div>
    )
  }

  const canApply = mockRating.totalRatingScore >= sg.requiredRating && sg.status === 'recruiting'

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      {/* 뒤로가기 */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary w-fit">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        목록으로
      </button>

      {/* 메인 카드 */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-3">
          {sg.status === 'recruiting'
            ? <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">모집중</span>
            : <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">마감</span>
          }
          <span className="text-[10px] text-gray-400">{sg.createdAt}</span>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-3">{sg.title}</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-5">{sg.description}</p>

        {/* 기술스택 */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {sg.techStack.map(t => (
            <span key={t} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">{t}</span>
          ))}
        </div>

        {/* 상세 정보 그리드 */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl text-sm mb-5">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">리더</p>
            <p className="font-semibold text-gray-800">{sg.leaderName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">모집 인원</p>
            <p className="font-semibold text-gray-800">{sg.currentCount}/{sg.capacity}명</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">최소 요구 점수</p>
            <p className={`font-semibold ${canApply ? 'text-green-600' : 'text-red-500'}`}>{sg.requiredRating}점</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">내 점수</p>
            <p className="font-semibold text-primary">{mockRating.totalRatingScore}점</p>
          </div>
        </div>

        {/* 지원 버튼 */}
        {canApply ? (
          <button className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
            스터디 참여 신청
          </button>
        ) : sg.status !== 'recruiting' ? (
          <button disabled className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl font-semibold text-sm cursor-not-allowed">
            모집 마감
          </button>
        ) : (
          <div className="text-center py-3 bg-red-50 rounded-xl">
            <p className="text-xs text-red-500 font-medium">점수가 부족하여 지원할 수 없습니다.</p>
            <p className="text-xs text-red-400 mt-0.5">
              필요: {sg.requiredRating}점 / 현재: {mockRating.totalRatingScore}점 (부족: {sg.requiredRating - mockRating.totalRatingScore}점)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
