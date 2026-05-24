import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mockStudyGroups } from '../../models'
import { ROUTE_PATHS, routeTo } from '../../routes/paths'

const FILTERS = ['전체', '모집중', '마감']

export default function StudyBoard() {
  const [filter, setFilter] = useState('전체')
  const [keyword, setKeyword] = useState('')

  const filtered = mockStudyGroups.filter(sg => {
    const statusMatch = filter === '전체' || (filter === '모집중' ? sg.status === 'recruiting' : sg.status === 'closed')
    const kwMatch = sg.title.includes(keyword) || sg.techStack.some(t => t.includes(keyword))
    return statusMatch && kwMatch
  })

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
      <div className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="스터디명, 기술스택 검색"
            className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
          />
        </div>
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f}
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
        <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
          추천받기
        </button>
      </div>

      {/* 스터디 목록 */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">검색 결과가 없습니다.</div>
        )}
        {filtered.map(sg => (
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
                  <span className="text-[10px] text-gray-400">{sg.createdAt}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">{sg.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{sg.description}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <div className="flex gap-1 flex-wrap">
                {sg.techStack.map(t => (
                  <span key={t} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                <span>리더: {sg.leaderName}</span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  {sg.currentCount}/{sg.capacity}명
                </span>
                <span className="text-primary font-medium">최소 {sg.requiredRating}점</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
