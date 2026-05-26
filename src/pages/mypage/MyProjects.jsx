import { Link } from 'react-router-dom'
import { ROUTE_PATHS, routeTo } from '../../routes/paths'
import { useCurrentUser, useProjects } from '../../store'

export default function MyProjects() {
  const currentUser = useCurrentUser()
  const { projects, projectApplications } = useProjects()
  const myProjects = projects.filter(project =>
    project.leaderId === currentUser?.userId || projectApplications[project.projectId],
  )

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-gray-800">참여 중인 프로젝트</h2>
      {myProjects.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <p>참여 중인 프로젝트가 없습니다.</p>
          <Link to={ROUTE_PATHS.project.list} className="text-primary text-xs underline mt-2 inline-block">프로젝트 찾아보기</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {myProjects.map(p => (
            <div key={p.projectId} className="bg-white rounded-2xl shadow-md p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-800">{p.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  p.status === 'recruiting' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>{p.status === 'recruiting' ? '모집중' : '진행중'}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{p.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {p.techStack.map(t => (
                  <span key={t} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-50">
                <span>리더: {p.leaderName}</span>
                <span>{p.currentCount}/{p.capacity}명</span>
                <Link to={routeTo.projectDetail(p.projectId)} className="text-primary font-medium hover:underline">상세 보기</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
