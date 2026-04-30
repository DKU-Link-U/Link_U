import { useState } from 'react'
import { mockUser } from '../../models'

export default function MyProfile() {
  const [form, setForm] = useState({
    nickname: mockUser.nickname,
    department: mockUser.department,
    oneLiner: mockUser.oneLiner,
    techStack: mockUser.techStack,
    interestArea: mockUser.interestArea,
  })
  const [saved, setSaved] = useState(false)
  const handleChange = e => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setSaved(false) }
  const handleSave = e => { e.preventDefault(); setSaved(true) }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-gray-800">내 프로필</h2>

      {/* 프로필 이미지 */}
      <div className="bg-white rounded-2xl shadow-md p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 flex-shrink-0">
          <svg className="w-9 h-9 text-primary/40" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{form.nickname}</p>
          <p className="text-xs text-gray-500">{mockUser.university} · {form.department} {mockUser.year}학년</p>
          <button className="mt-1.5 text-[10px] text-primary border border-primary/30 px-2.5 py-1 rounded-lg hover:bg-primary/5 transition-colors">
            프로필 사진 변경
          </button>
        </div>
      </div>

      {/* 수정 폼 */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-md p-5 flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">닉네임</label>
          <input name="nickname" value={form.nickname} onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">한 줄 소개</label>
          <input name="oneLiner" value={form.oneLiner} onChange={handleChange}
            placeholder="나를 한 줄로 소개해보세요"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">기술 스택</label>
          <input name="techStack" value={form.techStack} onChange={handleChange}
            placeholder="예: Java, Spring, React"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">관심 분야</label>
          <input name="interestArea" value={form.interestArea} onChange={handleChange}
            placeholder="예: Algorithm, Web Backend"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" />
        </div>
        <button type="submit"
          className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          {saved ? '✓ 저장 완료' : '프로필 저장'}
        </button>
      </form>
    </div>
  )
}
