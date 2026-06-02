import { useContext, useEffect, useMemo, useState } from 'react'
import { fetchMyProjects, fetchMyStudies } from '../api'
import { AppStateContext } from './context'

export function useAppState() {
  const context = useContext(AppStateContext)

  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider')
  }

  return context
}

export function useCurrentUser() {
  return useAppState().currentUser
}

export function useNotifications() {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppState()

  return {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  }
}

export function useMessages() {
  const {
    messages,
    receivedMessages,
    sentMessages,
    unreadMessageCount,
    addMessage,
    markMessageRead,
  } = useAppState()

  return {
    messages,
    receivedMessages,
    sentMessages,
    unreadMessageCount,
    addMessage,
    markMessageRead,
  }
}

export function useExternalProfile() {
  const {
    externalProfile,
    loadIntegratedUserData,
    clearExternalProfileError,
  } = useAppState()

  return {
    externalProfile,
    loadIntegratedUserData,
    clearExternalProfileError,
  }
}

export function useAccountLinks() {
  const {
    accountLinks,
    setAccountLink,
    verifyAccountLink,
    disconnectAccountLink,
  } = useAppState()

  return {
    accountLinks,
    setAccountLink,
    verifyAccountLink,
    disconnectAccountLink,
  }
}

export function useStudies() {
  const {
    studies,
    filteredStudies,
    studyFilters,
    studyApplications,
    setStudyFilters,
    addStudy,
    applyStudy,
    getStudyEligibility,
  } = useAppState()

  return {
    studies,
    filteredStudies,
    studyFilters,
    studyApplications,
    setStudyFilters,
    addStudy,
    applyStudy,
    getStudyEligibility,
    getStudyById: groupId => studies.find(study => study.groupId === groupId),
  }
}

export function useProjects() {
  const {
    projects,
    filteredProjects,
    projectFilters,
    projectApplications,
    setProjectFilters,
    addProject,
    applyProject,
    getProjectEligibility,
  } = useAppState()

  return {
    projects,
    filteredProjects,
    projectFilters,
    projectApplications,
    setProjectFilters,
    addProject,
    applyProject,
    getProjectEligibility,
    getProjectById: projectId => projects.find(project => project.projectId === projectId),
  }
}

function getUserId(user) {
  return user?.userId ?? user?.id
}

function useMyCommunityItems({ accessToken, allItems, applications, currentUser, fetcher, idKey }) {
  const userId = getUserId(currentUser)
  const fallbackItems = useMemo(() => {
    if (!userId) return []

    return allItems.filter(item =>
      item.leaderId === userId || Boolean(applications[item[idKey]]),
    )
  }, [allItems, applications, idKey, userId])
  const [remoteState, setRemoteState] = useState({
    userId: '',
    items: null,
  })
  const [error, setError] = useState('')
  const hasRemoteItems = remoteState.userId === userId && Array.isArray(remoteState.items)
  const items = userId
    ? hasRemoteItems ? remoteState.items : fallbackItems
    : []

  useEffect(() => {
    if (!userId) return

    let ignore = false

    async function loadItems() {
      try {
        const result = await fetcher({
          accessToken,
          fallback: () => fallbackItems,
        })

        if (!ignore) {
          setRemoteState({
            userId,
            items: result,
          })
          setError('')
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || '내 모집 정보를 불러오지 못했습니다.')
        }
      }
    }

    loadItems()

    return () => {
      ignore = true
    }
  }, [accessToken, fallbackItems, fetcher, userId])

  return {
    error,
    items,
    loading: false,
  }
}

export function useMyStudiesData() {
  const { accessToken, currentUser } = useAppState()
  const { studies, studyApplications } = useStudies()

  return useMyCommunityItems({
    accessToken,
    allItems: studies,
    applications: studyApplications,
    currentUser,
    fetcher: fetchMyStudies,
    idKey: 'groupId',
  })
}

export function useMyProjectsData() {
  const { accessToken, currentUser } = useAppState()
  const { projects, projectApplications } = useProjects()

  return useMyCommunityItems({
    accessToken,
    allItems: projects,
    applications: projectApplications,
    currentUser,
    fetcher: fetchMyProjects,
    idKey: 'projectId',
  })
}

export function useRanking() {
  const {
    rankingUsers,
    rankingTab,
    visibleRankingUsers,
    myRankingEntry,
    setRankingTab,
  } = useAppState()

  return {
    rankingUsers,
    rankingTab,
    visibleRankingUsers,
    myRankingEntry,
    setRankingTab,
    getRankingUserById: userId => rankingUsers.find(user => user.userId === userId),
  }
}

export function useActivityStats() {
  const {
    rating,
    fieldStats,
    commitActivity,
    syncedPlatforms,
    rankingHistory,
  } = useAppState()

  return {
    rating,
    fieldStats,
    commitActivity,
    syncedPlatforms,
    rankingHistory,
  }
}
