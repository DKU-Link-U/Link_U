import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function StudyCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', techStack: '', capacity: 4, requiredRating: 800,
  })

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    alert('스터디 모집글이 등록되었습니다.')
    navigate('/study')
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary w-fit">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        취소
      </button>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-base font-bold text-gray-800 mb-5">스터디 모집글 작성</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">스터디 제목 *</label>
            <input
              name="title" value={form.title} onChange={handleChange} required
              placeholder="예: 알고리즘 코딩테스트 완전정복 스터디"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">스터디 설명 *</label>
            <textarea
              name="description" value={form.description} onChange={handleChange} required
              rows={4} placeholder="스터디 목표, 진행 방식, 일정 등을 자유롭게 작성해주세요."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">기술 스택 (쉼표 구분)</label>
            <input
              name="techStack" value={form.techStack} onChange={handleChange}
              placeholder="예: Python, Algorithm, C++"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">모집 인원</label>
              <input
                type="number" name="capacity" value={form.capacity} onChange={handleChange}
                min={2} max={20}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">최소 요구 점수</label>
              <input
                type="number" name="requiredRating" value={form.requiredRating} onChange={handleChange}
                min={0} step={50}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            모집글 등록
          </button>
        </form>
      </div>
    </div>
  )
}
