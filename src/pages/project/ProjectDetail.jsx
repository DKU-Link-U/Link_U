import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchProjectApplications, updateApplicationStatus } from '../../api'
import ApplicationReviewPanel from '../../components/ApplicationReviewPanel'
import EligibilityBadge from '../../components/EligibilityBadge'
import { ROUTE_PATHS } from '../../routes/paths'
import { useAppState, useProjects } from '../../store'

function getUserId(user) {
  return user?.userId ?? user?.id
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { accessToken, currentUser, rating } = useAppState()
  const { getProjectById, applyProject, getProjectEligibility } = useProjects()
  const [applicationError, setApplicationError] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [applications, setApplications] = useState([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [applicationsError, setApplicationsError] = useState('')
  const [updatingApplicationId, setUpdatingApplicationId] = useState('')
  const project = getProjectById(id)
  const isOwner = Boolean(project && project.leaderId === getUserId(currentUser))

  const projectId = project?.projectId

  useEffect(() => {
    if (!projectId || !isOwner) return

    let ignore = false

    async function loadInitialApplications() {
      try {
        const list = await fetchProjectApplications(projectId, { accessToken })

        if (!ignore) {
          setApplications(list)
          setApplicationsError('')
        }
      } catch (error) {
        if (!ignore) {
          setApplicationsError(error.message || '신청자 목록을 불러오지 못했습니다.')
        }
      }
    }

    loadInitialApplications()

    return () => {
      ignore = true
    }
  }, [accessToken, isOwner, projectId])

  const loadApplications = async () => {
    if (!project?.projectId || !isOwner) return

    setApplicationsLoading(true)
    setApplicationsError('')

    try {
      const list = await fetchProjectApplications(project.projectId, { accessToken })
      setApplications(list)
    } catch (error) {
      setApplicationsError(error.message || '신청자 목록을 불러오지 못했습니다.')
    } finally {
      setApplicationsLoading(false)
    }
  }

  if (!project) {
    return (
      <div className="py-24 text-center text-gray-400">
        <p className="text-sm">프로젝트를 찾을 수 없습니다.</p>
        <Link to={ROUTE_PATHS.project.list} className="mt-2 inline-block text-xs text-primary underline">목록으로</Link>
      </div>
    )
  }

  const eligibility = getProjectEligibility(project)

  const handleApply = async () => {
    setApplicationError('')
    setIsApplying(true)

    try {
      await applyProject(project.projectId)
    } catch (error) {
      setApplicationError(error.message || '프로젝트 참여 신청에 실패했습니다.')
    } finally {
      setIsApplying(false)
    }
  }

  const handleUpdateApplication = async (applicationId, status) => {
    setUpdatingApplicationId(applicationId)
    setApplicationsError('')

    try {
      const updatedApplication = await updateApplicationStatus(applicationId, status, { accessToken })
      setApplications(current =>
        current.map(application =>
          application.id === updatedApplication.id ? updatedApplication : application,
        ),
      )
    } catch (error) {
      setApplicationsError(error.message || '신청 상태 변경에 실패했습니다.')
    } finally {
      setUpdatingApplicationId('')
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <button onClick={() => navigate(-1)} className="flex w-fit items-center gap-1 text-xs text-gray-500 hover:text-primary">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        목록으로
      </button>

      <div className="rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {project.status === 'recruiting'
            ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">모집중</span>
            : <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">마감</span>
          }
          {!isOwner && <EligibilityBadge eligibility={eligibility} />}
          {isOwner && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">작성자</span>}
          <span className="text-[10px] text-gray-400">{project.createdAt}</span>
        </div>

        <h1 className="mb-3 text-xl font-bold text-gray-800">{project.title}</h1>
        <p className="mb-5 text-sm leading-relaxed text-gray-600">{project.description}</p>

        <div className="mb-5 flex flex-wrap gap-1.5">
          {project.techStack.map(tech => (
            <span key={tech} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">{tech}</span>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 text-sm">
          <div>
            <p className="mb-0.5 text-xs text-gray-400">리더</p>
            <p className="font-semibold text-gray-800">{project.leaderName}</p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-gray-400">모집 인원</p>
            <p className="font-semibold text-gray-800">{project.currentCount}/{project.capacity}명</p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-gray-400">최소 요구 점수</p>
            <p className={`font-semibold ${eligibility.canApply ? 'text-green-600' : 'text-red-500'}`}>{project.requiredRating}점</p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-gray-400">내 점수</p>
            <p className="font-semibold text-primary">{rating.totalRatingScore}점</p>
          </div>
        </div>

        {isOwner ? (
          <div className="rounded-xl bg-primary/5 px-4 py-3 text-center text-xs font-medium text-primary">
            내가 작성한 모집글입니다. 아래에서 신청자를 관리할 수 있습니다.
          </div>
        ) : eligibility.canApply ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isApplying ? '신청 중...' : '프로젝트 참여 신청'}
            </button>
            {applicationError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-xs text-red-500">
                {applicationError}
              </p>
            )}
          </div>
        ) : (
          <div className={`rounded-xl py-3 text-center ${
            eligibility.status === 'applied' ? 'bg-primary/10' : 'bg-red-50'
          }`}>
            <p className={`text-xs font-medium ${
              eligibility.status === 'applied' ? 'text-primary' : 'text-red-500'
            }`}>
              {eligibility.label}
            </p>
            <p className={`mt-0.5 text-xs ${
              eligibility.status === 'applied' ? 'text-primary/70' : 'text-red-400'
            }`}>
              {eligibility.reason}
            </p>
          </div>
        )}
      </div>

      {isOwner && (
        <ApplicationReviewPanel
          applications={applications}
          error={applicationsError}
          loading={applicationsLoading}
          onReload={loadApplications}
          onUpdateStatus={handleUpdateApplication}
          title="프로젝트 신청자 목록"
          updatingId={updatingApplicationId}
        />
      )}
    </div>
  )
}
