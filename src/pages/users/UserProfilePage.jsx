import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchRankingUser } from '../../api/rankingApi'
import { ROUTE_PATHS, routeTo } from '../../routes/paths'
import { useAppState, useRanking } from '../../store'
import { getIntegratedTier, getIntegratedTierStyle } from '../../utils/ratingTier'

const PROFILE_PRESETS = {
  u10: {
    oneLiner: '오픈소스 기여와 알고리즘 문제 해결을 꾸준히 이어가는 개발자입니다.',
    interestArea: 'Algorithm, Open Source, Backend',
    techStack: ['Python', 'C++', 'Node.js'],
  },
  u11: {
    oneLiner: '코딩 테스트와 자료구조 스터디를 주도하는 알고리즘 중심 개발자입니다.',
    interestArea: 'Algorithm, CS Study',
    techStack: ['C++', 'Python', 'Java'],
  },
  u12: {
    oneLiner: '안정적인 API 설계와 데이터 모델링에 관심이 많은 백엔드 개발자입니다.',
    interestArea: 'Backend, Database, API',
    techStack: ['Java', 'Spring Boot', 'PostgreSQL'],
  },
  u13: {
    oneLiner: 'AI 서비스와 웹 프론트엔드를 함께 다루는 풀스택 지향 개발자입니다.',
    interestArea: 'AI, Frontend, Full Stack',
    techStack: ['React', 'Python', 'FastAPI'],
  },
  u14: {
    oneLiner: '읽기 쉬운 코드와 협업 흐름을 중요하게 생각하는 개발자입니다.',
    interestArea: 'Clean Code, Web, Collaboration',
    techStack: ['TypeScript', 'React', 'Node.js'],
  },
}

function parseList(value) {
  if (Array.isArray(value)) return value
  if (!value) return []

  return value.split(',').map(item => item.trim()).filter(Boolean)
}

function getTierColor(tier) {
  return getIntegratedTierStyle(tier).badge
}

function getUserId(user) {
  return user?.userId ?? user?.id
}

function createProfile({ fetchedUser, userId, currentUser, rating, rankingUsers, syncedPlatforms }) {
  if (getUserId(currentUser) === userId) {
    const hasSyncedScore = Object.values(syncedPlatforms).some(Boolean) || Number(rating.totalRatingScore) > 0

    return {
      userId,
      nickname: currentUser.nickname,
      department: currentUser.department,
      year: currentUser.year,
      university: currentUser.university,
      oneLiner: currentUser.oneLiner,
      interestArea: currentUser.interestArea,
      techStack: parseList(currentUser.techStack),
      score: rating.totalRatingScore,
      tier: hasSyncedScore ? getIntegratedTier(rating.totalRatingScore) : '연동 필요',
      profileImage: currentUser.profileImage,
      isSelf: true,
    }
  }

  const rankingEntry = fetchedUser || rankingUsers.find(user => user.userId === userId)
  if (!rankingEntry) return null

  return {
    ...rankingEntry,
    tier: rankingEntry.tier || getIntegratedTier(rankingEntry.score),
    university: 'Dankook University',
    oneLiner: PROFILE_PRESETS[userId]?.oneLiner ?? '함께 성장할 팀을 찾고 있는 Link-U 사용자입니다.',
    interestArea: PROFILE_PRESETS[userId]?.interestArea ?? 'Study, Project',
    techStack: PROFILE_PRESETS[userId]?.techStack ?? ['React', 'Node.js'],
    isSelf: false,
  }
}

function formatAffiliation(profile) {
  return [profile.department, profile.year ? `${profile.year}학년` : null]
    .filter(Boolean)
    .join(' · ')
}

export default function UserProfilePage() {
  const { userId } = useParams()
  const { currentUser, rating, syncedPlatforms } = useAppState()
  const { rankingUsers } = useRanking()
  const [fetchedState, setFetchedState] = useState({
    userId: '',
    user: null,
    loading: false,
    error: '',
  })
  const isSelf = getUserId(currentUser) === userId
  const fetchedUser = fetchedState.userId === userId ? fetchedState.user : null
  const loading = fetchedState.userId === userId && fetchedState.loading
  const error = fetchedState.userId === userId ? fetchedState.error : ''
  const profile = useMemo(
    () => createProfile({ fetchedUser, userId, currentUser, rating, rankingUsers, syncedPlatforms }),
    [currentUser, fetchedUser, rankingUsers, rating, syncedPlatforms, userId],
  )

  useEffect(() => {
    if (!userId || isSelf) return

    let ignore = false

    async function loadUserProfile() {
      setFetchedState({
        userId,
        user: null,
        loading: true,
        error: '',
      })

      try {
        const user = await fetchRankingUser(userId)

        if (!ignore) {
          setFetchedState({
            userId,
            user,
            loading: false,
            error: '',
          })
        }
      } catch (profileError) {
        if (!ignore) {
          setFetchedState({
            userId,
            user: null,
            loading: false,
            error: profileError.message || '사용자 프로필을 불러오지 못했습니다.',
          })
        }
      } finally {
        if (!ignore) {
          setFetchedState(currentState =>
            currentState.userId === userId
              ? { ...currentState, loading: false }
              : currentState,
          )
        }
      }
    }

    loadUserProfile()

    return () => {
      ignore = true
    }
  }, [isSelf, userId])

  if (loading && !profile) {
    return (
      <div className="max-w-xl mx-auto text-center py-24 text-gray-400">
        <p className="text-sm">사용자 프로필을 불러오는 중입니다.</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto text-center py-24 text-gray-400">
        <p className="text-sm">{error || '사용자 프로필을 찾을 수 없습니다.'}</p>
        <Link to={ROUTE_PATHS.ranking} className="text-primary text-xs underline mt-2 inline-block">
          랭킹으로 돌아가기
        </Link>
      </div>
    )
  }

  const affiliation = formatAffiliation(profile)

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <Link to={ROUTE_PATHS.ranking} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary w-fit">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        랭킹으로
      </Link>

      <section className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary">{profile.nickname?.[0] ?? 'U'}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium mb-1">{profile.university}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-800">{profile.nickname}</h1>
                {profile.isSelf && (
                  <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">나</span>
                )}
              </div>
              {affiliation && (
                <p className="text-sm text-gray-500 mt-1">{affiliation}</p>
              )}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400 mb-1">통합 점수</p>
            <p className="text-3xl font-bold text-primary">{profile.score?.toLocaleString()}</p>
            <span className={`inline-flex mt-2 text-xs font-bold px-2.5 py-1 rounded-full border ${getTierColor(profile.tier)}`}>
              {profile.tier}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mt-5">{profile.oneLiner}</p>

        <div className="grid grid-cols-2 gap-4 mt-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">관심 분야</p>
            <p className="text-sm font-medium text-gray-800">{profile.interestArea}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">기술 스택</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.techStack.map(skill => (
                <span key={skill} className="text-xs bg-white text-primary border border-primary/10 px-2.5 py-1 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-5 border-t border-gray-100">
          {profile.isSelf ? (
            <Link
              to={ROUTE_PATHS.mypage.profile}
              className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
            >
              내 프로필 수정
            </Link>
          ) : (
            <>
              <Link
                to={routeTo.messagesTo(profile.userId)}
                className="border border-primary/30 text-primary text-xs font-semibold px-4 py-2 rounded-xl hover:bg-primary/5 transition-colors"
              >
                쪽지 보내기
              </Link>
              <Link
                to={ROUTE_PATHS.study.list}
                className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
              >
                스터디 찾아보기
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
