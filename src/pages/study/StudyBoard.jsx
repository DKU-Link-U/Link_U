import { useState } from 'react'
import { Link } from 'react-router-dom'
import EligibilityBadge from '../../components/EligibilityBadge'
import { ROUTE_PATHS, routeTo } from '../../routes/paths'
import { useStudies } from '../../store'

const FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'eligible', label: '지원 가능' },
  { value: 'recruiting', label: '모집중' },
  { value: 'closed', label: '마감' },
]

export default function StudyBoard() {
  const {
    filteredStudies,
    studyFilters,
    setStudyFilters,
    getStudyEligibility,
    recommendStudies,
  } = useStudies()
  const [recommendationState, setRecommendationState] = useState({
    loading: false,
    error: '',
    items: [],
  })

  const handleRecommend = async () => {
    setRecommendationState(current => ({
      ...current,
      loading: true,
      error: '',
    }))

    try {
      const recommendations = await recommendStudies()

      setRecommendationState({
        loading: false,
        error: '',
        items: Array.isArray(recommendations) ? recommendations : [],
      })
    } catch (error) {
      setRecommendationState({
        loading: false,
        error: error.message || 'AI 스터디 추천을 불러오지 못했습니다.',
        items: [],
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">스터디 게시판</h1>
        <Link
          to={ROUTE_PATHS.study.create}
          className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          스터디 모집글 작성
        </Link>
      </div>

      {/* 검색 + 필터 */}
      <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 sm:flex-1">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={studyFilters.keyword}
            onChange={e => setStudyFilters({ keyword: e.target.value })}
            placeholder="스터디명, 기술스택 검색"
            className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStudyFilters({ status: f.value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                studyFilters.status === f.value ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 스터디 추천 배너 */}
      <div className="bg-gradient-to-r from-primary to-blue-500 rounded-2xl p-5 flex items-center justify-between text-white shadow-md">
        <div>
          <p className="text-xs text-white/70 mb-1">AI 기반 스터디 추천</p>
          <p className="text-sm font-bold">나에게 맞는 스터디를 추천받아보세요</p>
        </div>
        <button
          type="button"
          onClick={handleRecommend}
          disabled={recommendationState.loading}
          className="bg-white/20 hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {recommendationState.loading ? '추천 중...' : '추천받기'}
        </button>
      </div>

      {(recommendationState.error || recommendationState.items.length > 0) && (
        <div className="bg-white rounded-2xl shadow-md p-4">
          {recommendationState.error && (
            <p className="text-xs font-medium text-red-500">{recommendationState.error}</p>
          )}

          {recommendationState.items.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {recommendationState.items.map(item => (
                <Link
                  key={item.groupId}
                  to={routeTo.studyDetail(item.groupId)}
                  className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 transition-colors hover:border-primary/40 hover:bg-blue-50"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-primary">AI 추천</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-primary">
                      {item.fitScore ?? 0}%
                    </span>
                  </div>
                  <h2 className="line-clamp-2 text-sm font-bold text-gray-800">{item.title}</h2>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-500">{item.reason}</p>
                  {item.matchedSkills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.matchedSkills.slice(0, 3).map(skill => (
                        <span key={skill} className="rounded-full bg-white px-2 py-0.5 text-[10px] text-blue-600">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 스터디 목록 */}
      <div className="flex flex-col gap-3">
        {filteredStudies.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">검색 결과가 없습니다.</div>
        )}
        {filteredStudies.map(sg => {
          const eligibility = getStudyEligibility(sg)

          return (
            <Link
              key={sg.groupId}
              to={routeTo.studyDetail(sg.groupId)}
              className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    {sg.status === 'recruiting'
                      ? <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">모집중</span>
                      : <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">마감</span>
                    }
                    <EligibilityBadge eligibility={eligibility} />
                    <span className="text-[10px] text-gray-400">{sg.createdAt}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 mb-1">{sg.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{sg.description}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
              <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-gray-50 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-1 flex-wrap">
                  {sg.techStack.map(t => (
                    <span key={t} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>리더: {sg.leaderName}</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    {sg.currentCount}/{sg.capacity}명
                  </span>
                  <span className={eligibility.canApply ? 'text-primary font-medium' : 'text-red-500 font-medium'}>
                    {eligibility.canApply ? `최소 ${sg.requiredRating}점` : eligibility.reason}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
