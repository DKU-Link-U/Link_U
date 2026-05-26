import { useContext } from 'react'
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
    rankingHistory,
  } = useAppState()

  return {
    rating,
    fieldStats,
    commitActivity,
    rankingHistory,
  }
}
