import { useState } from 'react'
import { updateCurrentUserProfile } from '../../api/userApi'
import { useAppState } from '../../store'

const DEPARTMENT_OPTIONS = [
  '소프트웨어학과',
  '컴퓨터공학과',
  '통계데이터사이언스학과',
  '사이버보안학과',
  '인공지능학과',
  'AI건축융합학과',
  '모바일시스템공학과',
  '기타',
]

function createFormState(user) {
  return {
    nickname: user?.nickname ?? '',
    department: user?.department ?? '',
    oneLiner: user?.oneLiner ?? '',
    techStack: user?.techStack ?? '',
    interestArea: user?.interestArea ?? '',
  }
}

export default function MyProfile() {
  const { accessToken, currentUser, setCurrentUser } = useAppState()
  const [form, setForm] = useState(() => createFormState(currentUser))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => {
    setForm(current => ({ ...current, [e.target.name]: e.target.value }))
    setSaved(false)
    setError('')
  }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')

    try {
      const updatedUser = await updateCurrentUserProfile(form, { accessToken })

      setCurrentUser(updatedUser, accessToken)
      setForm(createFormState(updatedUser))
      setSaved(true)
    } catch (saveError) {
      setError(saveError.message || '프로필 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-gray-800">내 프로필</h2>

      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-md">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-primary/10">
          {currentUser?.profileImage ? (
            <img src={currentUser.profileImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg className="h-9 w-9 text-primary/40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-800">{form.nickname || currentUser?.name || 'Link-U 사용자'}</p>
          <p className="mt-1 text-xs text-gray-500">
            {currentUser?.university ?? '단국대학교'}
            {form.department ? ` · ${form.department}` : ''}
          </p>
          <p className="mt-1.5 text-[11px] leading-5 text-gray-400">
            프로필 정보는 Link-U DB에 저장되며 GitHub 동기화로 덮어쓰지 않습니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">닉네임</label>
          <input
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">학과</label>
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          >
            <option value="">학과 선택</option>
            {DEPARTMENT_OPTIONS.map(department => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">한 줄 소개</label>
          <input
            name="oneLiner"
            value={form.oneLiner}
            onChange={handleChange}
            placeholder="나를 한 줄로 소개해보세요"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">기술 스택</label>
          <input
            name="techStack"
            value={form.techStack}
            onChange={handleChange}
            placeholder="예: Java, Spring, React"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">관심 분야</label>
          <input
            name="interestArea"
            value={form.interestArea}
            onChange={handleChange}
            placeholder="예: Algorithm, Web Backend"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? '저장 중...' : saved ? '저장 완료' : '프로필 저장'}
        </button>
      </form>
    </div>
  )
}
