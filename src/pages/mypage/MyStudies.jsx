import { Link } from 'react-router-dom'
import { ROUTE_PATHS, routeTo } from '../../routes/paths'
import { useMyStudiesData } from '../../store'

const STATUS_LABELS = {
  recruiting: '모집중',
  closed: '마감',
}

const APPLICATION_LABELS = {
  pending: '신청 대기',
  accepted: '참여 승인',
  rejected: '신청 거절',
  canceled: '신청 취소',
}

function getRoleLabel(study) {
  if (study.role === 'owner') return '내가 만든 스터디'
  return APPLICATION_LABELS[study.applicationStatus] ?? '참여 신청'
}

export default function MyStudies() {
  const { error, items: myStudies, loading } = useMyStudiesData()
  const activeStudies = myStudies.filter(study => study.status !== 'closed')
  const closedStudies = myStudies.filter(study => study.status === 'closed')

  const renderStudy = study => (
    <div key={study.groupId} className="rounded-2xl bg-white p-5 shadow-md">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-gray-800">{study.title}</h3>
          <p className="mt-1 text-[10px] font-semibold text-primary">{getRoleLabel(study)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          study.status === 'recruiting' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {STATUS_LABELS[study.status] ?? study.status}
        </span>
      </div>
      <p className="mb-3 line-clamp-2 text-xs text-gray-500">{study.description}</p>
      <div className="mb-3 flex flex-wrap gap-1">
        {study.techStack.map(tech => (
          <span key={tech} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">{tech}</span>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-50 pt-3 text-xs text-gray-500">
        <span>리더: {study.leaderName}</span>
        <span>{study.currentCount}/{study.capacity}명</span>
        <Link to={routeTo.studyDetail(study.groupId)} className="font-medium text-primary hover:underline">상세 보기</Link>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-gray-800">내 스터디</h2>

      {loading && (
        <div className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-gray-400 shadow-md">
          내 스터디를 불러오는 중입니다.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-500">
          {error}
        </div>
      )}

      {!loading && myStudies.length === 0 && (
        <div className="py-16 text-center text-sm text-gray-400">
          <p>참여 중인 스터디가 없습니다.</p>
          <Link to={ROUTE_PATHS.study.list} className="mt-2 inline-block text-xs text-primary underline">스터디 찾아보기</Link>
        </div>
      )}

      {activeStudies.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-gray-500">진행 중</h3>
          {activeStudies.map(renderStudy)}
        </section>
      )}

      {closedStudies.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-gray-500">종료됨</h3>
          {closedStudies.map(renderStudy)}
        </section>
      )}
    </div>
  )
}
