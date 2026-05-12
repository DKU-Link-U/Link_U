import { Link } from 'react-router-dom'
import { ROUTE_PATHS, routeTo } from '../../routes/paths'
import { useCurrentUser, useStudies } from '../../store'

export default function MyStudies() {
  const currentUser = useCurrentUser()
  const { studies, studyApplications } = useStudies()
  const myStudies = studies.filter(study =>
    study.leaderId === currentUser?.userId || studyApplications[study.groupId],
  )

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-gray-800">참여 중인 스터디</h2>
      {myStudies.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <p>참여 중인 스터디가 없습니다.</p>
          <Link to={ROUTE_PATHS.study.list} className="text-primary text-xs underline mt-2 inline-block">스터디 찾아보기</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {myStudies.map(sg => (
            <div key={sg.groupId} className="bg-white rounded-2xl shadow-md p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-800">{sg.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  sg.status === 'recruiting' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>{sg.status === 'recruiting' ? '모집중' : '진행중'}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{sg.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {sg.techStack.map(t => (
                  <span key={t} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-50">
                <span>리더: {sg.leaderName}</span>
                <span>{sg.currentCount}/{sg.capacity}명</span>
                <Link to={routeTo.studyDetail(sg.groupId)} className="text-primary font-medium hover:underline">상세 보기</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
