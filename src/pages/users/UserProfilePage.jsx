import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchRankingUser } from '../../api/rankingApi'
import CommitGrass from '../../components/CommitGrass'
import LineChartWidget from '../../components/LineChartWidget'
import RadarChartWidget from '../../components/RadarChartWidget'
import { ROUTE_PATHS, routeTo } from '../../routes/paths'
import { useAppState } from '../../store'
import { getIntegratedTier, getIntegratedTierStyle } from '../../utils/ratingTier'

function parseList(value) {
  if (Array.isArray(value)) return value
  if (!value) return []

  return value.split(',').map(item => item.trim()).filter(Boolean)
}

function getTierColor(tier) {
  return getIntegratedTierStyle(tier).badge
}

function toNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function getUserId(user) {
  return user?.userId ?? user?.id
}

function createProfile({
  fetchedUser,
  userId,
  currentUser,
  rating,
  fieldStats,
  commitActivity,
  syncedPlatforms,
  rankingHistory,
}) {
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
      fieldStats,
      commitActivity,
      syncedPlatforms,
      ratingHistory: rankingHistory,
      isSelf: true,
    }
  }

  const rankingEntry = fetchedUser
  if (!rankingEntry) return null

  return {
    ...rankingEntry,
    tier: rankingEntry.tier || getIntegratedTier(rankingEntry.score),
    university: rankingEntry.university || '단국대학교',
    oneLiner: rankingEntry.oneLiner || '',
    interestArea: rankingEntry.interestArea || '',
    techStack: parseList(rankingEntry.techStack),
    fieldStats: rankingEntry.fieldStats ?? {},
    commitActivity: rankingEntry.commitActivity ?? [],
    syncedPlatforms: rankingEntry.syncedPlatforms ?? {},
    ratingHistory: rankingEntry.ratingHistory ?? [],
    isSelf: false,
  }
}

function formatAffiliation(profile) {
  return [profile.department, profile.year ? `${profile.year}학년` : null]
    .filter(Boolean)
    .join(' · ')
}

function ProfileHero({ profile }) {
  const affiliation = formatAffiliation(profile)
  const score = toNumber(profile.score)

  return (
    <section className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-primary/10">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg className="h-9 w-9 text-primary/40" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            )}
          </div>

          <div className="min-w-0">
            <p className="mb-0.5 text-xs font-medium text-gray-400">{profile.university}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold text-gray-800">{profile.nickname}</h1>
              {profile.isSelf && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">나</span>
              )}
            </div>
            {affiliation && (
              <p className="mt-1 text-sm text-gray-500">{affiliation}</p>
            )}
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
              {profile.oneLiner || '등록된 한 줄 소개가 없습니다.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 rounded-xl border border-gray-100 lg:min-w-[360px]">
          <div className="px-5 py-3 text-center lg:border-r lg:border-gray-100">
            <p className="mb-1 text-[10px] font-medium text-gray-400">Integrated Ranking Score</p>
            <p className="text-3xl font-bold leading-tight text-primary">{score.toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-center justify-center px-5 py-3 text-center">
            <p className="mb-1 text-[10px] font-medium text-gray-400">Tier</p>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold ${getTierColor(profile.tier)}`}>
              <svg className={`h-3.5 w-3.5 ${getIntegratedTierStyle(profile.tier).icon}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
              </svg>
              {profile.tier}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProfileInfoCard({ profile, techStack }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-md lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700">프로필 정보</h2>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-1 text-xs font-semibold text-gray-400">한 줄 소개</p>
          <p className="text-sm leading-relaxed text-gray-700">{profile.oneLiner || '등록된 한 줄 소개가 없습니다.'}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-gray-400">관심 분야</p>
          <p className="text-sm font-medium text-gray-800">{profile.interestArea || '등록된 관심 분야가 없습니다.'}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-400">기술 스택</p>
          {techStack.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {techStack.map(skill => (
                <span key={skill} className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-gray-800">등록된 기술 스택이 없습니다.</p>
          )}
        </div>
      </div>
    </section>
  )
}

function ExternalAccountsCard({ profile }) {
  const stats = profile.stats ?? {}
  const platforms = [
    {
      key: 'github',
      label: 'GitHub',
      account: profile.githubId,
      synced: profile.syncedPlatforms?.github,
      stat: `${toNumber(stats.githubCommitCount).toLocaleString()} commits`,
    },
    {
      key: 'boj',
      label: 'BOJ',
      account: profile.bojId,
      synced: profile.syncedPlatforms?.baekjoon,
      stat: `${toNumber(stats.bojSolvedCount).toLocaleString()} solved`,
    },
    {
      key: 'dreamhack',
      label: 'Dreamhack',
      account: profile.dreamhackId,
      synced: profile.syncedPlatforms?.dreamhack,
      stat: `${toNumber(stats.dreamhackScore).toLocaleString()} pts`,
    },
  ]

  return (
    <section className="rounded-2xl bg-white p-5 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700">외부 계정</h2>
      </div>

      <div className="space-y-3">
        {platforms.map(platform => (
          <div key={platform.key} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-none last:pb-0">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800">{platform.label}</p>
              <p className="mt-0.5 truncate text-[11px] text-gray-400">{platform.account || '연동 정보 없음'}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-bold text-primary">{platform.stat}</p>
              <p className={`mt-0.5 text-[10px] font-medium ${platform.synced ? 'text-green-600' : 'text-gray-400'}`}>
                {platform.synced ? '연동됨' : '미연동'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ProfileActionBanner({ profile }) {
  const to = profile.isSelf ? ROUTE_PATHS.mypage.profile : routeTo.messagesTo(profile.userId)

  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-2xl bg-primary px-6 py-4 text-white shadow-md transition-opacity hover:opacity-90"
    >
      <div>
        <p className="text-sm font-bold">{profile.isSelf ? '마이페이지 바로가기' : '쪽지 보내기'}</p>
        <p className="mt-0.5 text-xs text-white/60">
          {profile.isSelf ? '프로필, 계정 연동, 활동 통계를 관리하세요' : `${profile.nickname}님에게 프로젝트나 스터디 제안을 보내세요`}
        </p>
      </div>
      <svg className="h-5 w-5 text-white/60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}

export default function UserProfilePage() {
  const { userId } = useParams()
  const {
    currentUser,
    rating,
    fieldStats,
    commitActivity,
    syncedPlatforms,
    rankingHistory,
  } = useAppState()
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
    () => createProfile({
      fetchedUser,
      userId,
      currentUser,
      rating,
      fieldStats,
      commitActivity,
      syncedPlatforms,
      rankingHistory,
    }),
    [commitActivity, currentUser, fetchedUser, fieldStats, rankingHistory, rating, syncedPlatforms, userId],
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

  const techStack = parseList(profile.techStack)
  const publicRating = {
    totalRatingScore: toNumber(profile.score),
  }

  return (
    <div className="mx-auto flex max-w-screen-xl flex-col gap-5">
      <Link to={ROUTE_PATHS.ranking} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary w-fit">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        랭킹으로
      </Link>

      <ProfileHero profile={profile} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5" style={{ minHeight: '300px' }}>
        <div className="lg:col-span-2">
          <RadarChartWidget
            fieldStats={profile.fieldStats}
            syncedPlatforms={profile.syncedPlatforms}
            emptyMessage="연동된 활동 데이터가 없어서 분야별 점수를 표시할 수 없습니다."
          />
        </div>
        <div className="lg:col-span-3">
          <CommitGrass
            commitActivity={profile.commitActivity}
            syncedPlatforms={profile.syncedPlatforms}
            emptyMessage={profile.syncedPlatforms?.github
              ? '최근 26주 동안 조회된 GitHub 커밋 기록이 없습니다.'
              : 'GitHub 연동 데이터가 없어서 날짜별 커밋 기록을 표시할 수 없습니다.'}
          />
        </div>
      </div>

      <div style={{ minHeight: '240px' }}>
        <LineChartWidget
          rankingHistory={profile.ratingHistory}
          rating={publicRating}
          emptyMessage="저장된 점수 이력이 없어서 랭킹 추이를 표시할 수 없습니다."
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ProfileInfoCard profile={profile} techStack={techStack} />
        <ExternalAccountsCard profile={profile} />
      </div>

      <ProfileActionBanner profile={profile} />
    </div>
  )
}
