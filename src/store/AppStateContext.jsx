import { useEffect, useMemo, useReducer } from 'react'
import {
  applyProject as applyProjectRequest,
  applyStudy as applyStudyRequest,
  createProject as createProjectRequest,
  createStudy as createStudyRequest,
  markMessageRead as markMessageReadRequest,
  sendMessage as sendMessageRequest,
} from '../api'
import { clearStoredAccessToken, setStoredAccessToken } from '../api/httpClient'
import { fetchIntegratedUserData } from '../api/userApi'
import {
  mockMessages,
  mockNotifications,
  mockProjects,
  mockRankingList,
  mockRating,
  mockStudyGroups,
  mockUser,
} from '../models'
import { AppStateContext } from './context'
import { getApplicationEligibility } from './communityEligibility'
import { mapIntegratedUserData } from './userDataMapper'

const ACTIONS = {
  SET_CURRENT_USER: 'auth/setCurrentUser',
  LOGOUT: 'auth/logout',
  SET_THEME: 'preferences/setTheme',
  MARK_NOTIFICATION_READ: 'notifications/markRead',
  MARK_ALL_NOTIFICATIONS_READ: 'notifications/markAllRead',
  ADD_MESSAGE: 'messages/add',
  MARK_MESSAGE_READ: 'messages/markRead',
  LOAD_EXTERNAL_PROFILE_START: 'externalProfile/loadStart',
  LOAD_EXTERNAL_PROFILE_SUCCESS: 'externalProfile/loadSuccess',
  LOAD_EXTERNAL_PROFILE_ERROR: 'externalProfile/loadError',
  CLEAR_EXTERNAL_PROFILE_ERROR: 'externalProfile/clearError',
  SET_AUTH_TOKEN: 'auth/setToken',
  SET_ACCOUNT_LINK: 'accountLinks/set',
  VERIFY_ACCOUNT_LINK: 'accountLinks/verify',
  DISCONNECT_ACCOUNT_LINK: 'accountLinks/disconnect',
  SET_STUDY_FILTERS: 'studies/setFilters',
  ADD_STUDY: 'studies/add',
  APPLY_STUDY: 'studies/apply',
  SET_PROJECT_FILTERS: 'projects/setFilters',
  ADD_PROJECT: 'projects/add',
  APPLY_PROJECT: 'projects/apply',
  SET_RANKING_TAB: 'ranking/setTab',
}

const STORAGE_KEY = 'link-u-app-state'
const INITIAL_ACCESS_TOKEN = import.meta.env.VITE_API_ACCESS_TOKEN ?? ''

const ACCOUNT_LINK_IDS = {
  github: 'githubId',
  boj: 'bojId',
  dreamhack: 'dhId',
}

const baseAccountLinks = {
  github: {
    username: '',
    verified: false,
    verificationCode: '',
    verifiedAt: null,
  },
  boj: {
    username: '',
    verified: false,
    verificationCode: '',
    verifiedAt: null,
  },
  dreamhack: {
    username: '',
    verified: false,
    verificationCode: '',
    verifiedAt: null,
  },
}

const baseStudyFilters = {
  keyword: '',
  status: 'all',
}

const baseProjectFilters = {
  keyword: '',
  status: 'all',
}

const baseInitialState = {
  auth: {
    isAuthenticated: true,
    user: mockUser,
    accessToken: INITIAL_ACCESS_TOKEN,
  },
  rating: mockRating,
  notifications: mockNotifications,
  messages: mockMessages,
  studies: {
    items: mockStudyGroups,
    filters: baseStudyFilters,
    applications: {},
  },
  projects: {
    items: mockProjects,
    filters: baseProjectFilters,
    applications: {},
  },
  ranking: {
    tab: 'overall',
    users: mockRankingList,
  },
  preferences: {
    theme: 'light',
  },
  externalProfile: {
    ids: {
      githubId: '',
      bojId: '',
      dhId: '',
    },
    data: null,
    loading: false,
    error: null,
    errors: {},
    partialSuccess: false,
    message: null,
    loadedAt: null,
  },
  accountLinks: baseAccountLinks,
}

function getPersistedState() {
  if (typeof window === 'undefined') return null

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY)
    return rawState ? JSON.parse(rawState) : null
  } catch {
    return null
  }
}

function createInitialState() {
  const persistedState = getPersistedState()

  if (!persistedState) return baseInitialState
  const persistedUser = persistedState.auth?.user ?? {}
  const persistedIds = persistedState.externalProfile?.ids ?? {}
  const restoredAccountLinks = Object.entries(baseAccountLinks).reduce((links, [platform, baseLink]) => {
    const idKey = ACCOUNT_LINK_IDS[platform]
    const persistedLink = persistedState.accountLinks?.[platform] ?? {}
    const username = persistedLink.username || persistedUser[idKey] || persistedIds[idKey] || ''
    const wasSynced = Boolean(persistedState.externalProfile?.loadedAt && persistedIds[idKey])

    links[platform] = {
      ...baseLink,
      ...persistedLink,
      username,
      verified: Boolean(persistedLink.verified || wasSynced),
    }

    return links
  }, {})

  return {
    ...baseInitialState,
    auth: {
      ...baseInitialState.auth,
      ...persistedState.auth,
      user: {
        ...baseInitialState.auth.user,
        ...persistedState.auth?.user,
      },
    },
    rating: {
      ...baseInitialState.rating,
      ...persistedState.rating,
    },
    studies: {
      ...baseInitialState.studies,
      ...persistedState.studies,
      filters: {
        ...baseInitialState.studies.filters,
        ...persistedState.studies?.filters,
      },
      applications: {
        ...baseInitialState.studies.applications,
        ...persistedState.studies?.applications,
      },
    },
    projects: {
      ...baseInitialState.projects,
      ...persistedState.projects,
      filters: {
        ...baseInitialState.projects.filters,
        ...persistedState.projects?.filters,
      },
      applications: {
        ...baseInitialState.projects.applications,
        ...persistedState.projects?.applications,
      },
    },
    ranking: {
      ...baseInitialState.ranking,
      ...persistedState.ranking,
    },
    preferences: {
      ...baseInitialState.preferences,
      ...persistedState.preferences,
    },
    externalProfile: {
      ...baseInitialState.externalProfile,
      ...persistedState.externalProfile,
      loading: false,
      error: null,
      errors: {},
      partialSuccess: false,
      message: null,
    },
    accountLinks: restoredAccountLinks,
  }
}

function persistState(state) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      auth: state.auth,
      rating: state.rating,
      studies: state.studies,
      projects: state.projects,
      ranking: {
        tab: state.ranking.tab,
        users: state.ranking.users,
      },
      preferences: state.preferences,
      externalProfile: {
        ids: state.externalProfile.ids,
        data: state.externalProfile.data,
        loadedAt: state.externalProfile.loadedAt,
      },
      accountLinks: state.accountLinks,
    }))
  } catch {
    // 저장 공간 제한이나 private mode에서는 세션 상태만 유지한다.
  }
}

function appStateReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CURRENT_USER:
      return {
        ...state,
        auth: {
          isAuthenticated: Boolean(action.payload?.user ?? action.payload),
          user: action.payload?.user ?? action.payload,
          accessToken: action.payload?.accessToken ?? state.auth.accessToken,
        },
      }

    case ACTIONS.LOGOUT:
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          user: null,
          accessToken: '',
        },
      }

    case ACTIONS.SET_AUTH_TOKEN:
      return {
        ...state,
        auth: {
          ...state.auth,
          accessToken: action.payload ?? '',
        },
      }

    case ACTIONS.SET_THEME:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          theme: action.payload,
        },
      }

    case ACTIONS.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.notificationId === action.payload
            ? { ...notification, isRead: true }
            : notification,
        ),
      }

    case ACTIONS.MARK_ALL_NOTIFICATIONS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
        })),
      }

    case ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messages: [
          action.payload,
          ...state.messages,
        ],
      }

    case ACTIONS.MARK_MESSAGE_READ:
      return {
        ...state,
        messages: state.messages.map(message =>
          message.messageId === action.payload
            ? { ...message, isRead: true }
            : message,
        ),
      }

    case ACTIONS.LOAD_EXTERNAL_PROFILE_START:
      return {
        ...state,
        externalProfile: {
          ...state.externalProfile,
          ids: action.payload,
          loading: true,
          error: null,
          errors: {},
          partialSuccess: false,
          message: null,
        },
      }

    case ACTIONS.LOAD_EXTERNAL_PROFILE_SUCCESS:
      return {
        ...state,
        auth: {
          ...state.auth,
          user: action.payload.user,
        },
        rating: action.payload.rating,
        externalProfile: {
          ids: action.payload.ids,
          data: action.payload.data,
          loading: false,
          error: null,
          errors: action.payload.errors,
          partialSuccess: action.payload.partialSuccess,
          message: action.payload.message,
          loadedAt: action.payload.loadedAt,
        },
      }

    case ACTIONS.LOAD_EXTERNAL_PROFILE_ERROR:
      return {
        ...state,
        externalProfile: {
          ...state.externalProfile,
          ids: action.payload.ids,
          loading: false,
          error: action.payload.error,
          errors: action.payload.errors ?? {},
          partialSuccess: false,
          message: null,
        },
      }

    case ACTIONS.CLEAR_EXTERNAL_PROFILE_ERROR:
      return {
        ...state,
        externalProfile: {
          ...state.externalProfile,
          error: null,
          errors: {},
          partialSuccess: false,
          message: null,
        },
      }

    case ACTIONS.SET_ACCOUNT_LINK:
      return {
        ...state,
        accountLinks: {
          ...state.accountLinks,
          [action.payload.platform]: {
            ...state.accountLinks[action.payload.platform],
            username: action.payload.username,
            verified: false,
            verificationCode: action.payload.verificationCode,
            verifiedAt: null,
          },
        },
      }

    case ACTIONS.VERIFY_ACCOUNT_LINK:
      return {
        ...state,
        accountLinks: {
          ...state.accountLinks,
          [action.payload.platform]: {
            ...state.accountLinks[action.payload.platform],
            verified: true,
            verifiedAt: action.payload.verifiedAt,
          },
        },
      }

    case ACTIONS.DISCONNECT_ACCOUNT_LINK:
      return {
        ...state,
        accountLinks: {
          ...state.accountLinks,
          [action.payload]: baseAccountLinks[action.payload],
        },
      }

    case ACTIONS.SET_STUDY_FILTERS:
      return {
        ...state,
        studies: {
          ...state.studies,
          filters: {
            ...state.studies.filters,
            ...action.payload,
          },
        },
      }

    case ACTIONS.ADD_STUDY:
      return {
        ...state,
        studies: {
          ...state.studies,
          items: [
            action.payload,
            ...state.studies.items,
          ],
        },
      }

    case ACTIONS.APPLY_STUDY:
      return {
        ...state,
        studies: {
          ...state.studies,
          applications: {
            ...state.studies.applications,
            [action.payload.groupId]: action.payload.application,
          },
        },
      }

    case ACTIONS.SET_PROJECT_FILTERS:
      return {
        ...state,
        projects: {
          ...state.projects,
          filters: {
            ...state.projects.filters,
            ...action.payload,
          },
        },
      }

    case ACTIONS.ADD_PROJECT:
      return {
        ...state,
        projects: {
          ...state.projects,
          items: [
            action.payload,
            ...state.projects.items,
          ],
        },
      }

    case ACTIONS.APPLY_PROJECT:
      return {
        ...state,
        projects: {
          ...state.projects,
          applications: {
            ...state.projects.applications,
            [action.payload.projectId]: action.payload.application,
          },
        },
      }

    case ACTIONS.SET_RANKING_TAB:
      return {
        ...state,
        ranking: {
          ...state.ranking,
          tab: action.payload,
        },
      }

    default:
      return state
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appStateReducer, undefined, createInitialState)

  useEffect(() => {
    persistState(state)
  }, [state])

  useEffect(() => {
    if (state.auth.accessToken) {
      setStoredAccessToken(state.auth.accessToken)
      return
    }

    clearStoredAccessToken()
  }, [state.auth.accessToken])

  const value = useMemo(() => {
    const currentUser = state.auth.user
    const accessToken = state.auth.accessToken
    const receivedMessages = currentUser
      ? state.messages.filter(message => message.receiverId === currentUser.userId)
      : []
    const sentMessages = currentUser
      ? state.messages.filter(message => message.senderId === currentUser.userId)
      : []
    const getStudyEligibility = study =>
      getApplicationEligibility(study, {
        score: state.rating.totalRatingScore,
        application: state.studies.applications[study?.groupId],
      })
    const getProjectEligibility = project =>
      getApplicationEligibility(project, {
        score: state.rating.totalRatingScore,
        application: state.projects.applications[project?.projectId],
      })
    const matchCommunityFilters = (item, filters, eligibility) => {
      const keyword = filters.keyword.trim().toLowerCase()
      const statusMatch = filters.status === 'all' ||
        (filters.status === 'eligible' ? eligibility.canApply : item.status === filters.status)
      const keywordMatch = !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.techStack.some(tech => tech.toLowerCase().includes(keyword))

      return statusMatch && keywordMatch
    }
    const filteredStudies = state.studies.items.filter(study =>
      matchCommunityFilters(study, state.studies.filters, getStudyEligibility(study)),
    )
    const filteredProjects = state.projects.items.filter(project =>
      matchCommunityFilters(project, state.projects.filters, getProjectEligibility(project)),
    )
    const visibleRankingUsers = state.ranking.tab === 'department'
      ? state.ranking.users.filter(user => user.department === currentUser?.department)
      : state.ranking.users
    const myRankingEntry = currentUser
      ? state.ranking.users.find(user => user.userId === currentUser.userId)
      : null
    const loadIntegratedUserData = async ids => {
      dispatch({ type: ACTIONS.LOAD_EXTERNAL_PROFILE_START, payload: ids })

      try {
        const result = await fetchIntegratedUserData(ids)
        const mappedData = mapIntegratedUserData(result.data, state, ids)

        dispatch({
          type: ACTIONS.LOAD_EXTERNAL_PROFILE_SUCCESS,
          payload: {
            ...mappedData,
            ids,
            data: result.data,
            errors: result.errors,
            partialSuccess: result.partialSuccess,
            message: result.message,
            loadedAt: new Date().toISOString(),
          },
        })

        return {
          ...mappedData,
          errors: result.errors,
          partialSuccess: result.partialSuccess,
        }
      } catch (error) {
        dispatch({
          type: ACTIONS.LOAD_EXTERNAL_PROFILE_ERROR,
          payload: {
            ids,
            error: error.message,
            errors: error.errors,
          },
        })

        throw error
      }
    }
    const addMessage = async message => {
      const createdMessage = await sendMessageRequest(message, { currentUser, accessToken })

      dispatch({ type: ACTIONS.ADD_MESSAGE, payload: createdMessage })
      return createdMessage
    }
    const markMessageRead = async messageId => {
      await markMessageReadRequest(messageId, { accessToken })
      dispatch({ type: ACTIONS.MARK_MESSAGE_READ, payload: messageId })
    }
    const addStudy = async form => {
      const createdStudy = await createStudyRequest(form, { currentUser, accessToken })

      dispatch({ type: ACTIONS.ADD_STUDY, payload: createdStudy })
      return createdStudy
    }
    const applyStudy = async groupId => {
      const study = state.studies.items.find(item => item.groupId === groupId)
      const eligibility = getStudyEligibility(study)

      if (!eligibility.canApply) {
        throw new Error(eligibility.reason)
      }

      const application = await applyStudyRequest(groupId, { currentUser, accessToken })

      dispatch({
        type: ACTIONS.APPLY_STUDY,
        payload: { groupId, application },
      })

      return application
    }
    const addProject = async form => {
      const createdProject = await createProjectRequest(form, { currentUser, accessToken })

      dispatch({ type: ACTIONS.ADD_PROJECT, payload: createdProject })
      return createdProject
    }
    const applyProject = async projectId => {
      const project = state.projects.items.find(item => item.projectId === projectId)
      const eligibility = getProjectEligibility(project)

      if (!eligibility.canApply) {
        throw new Error(eligibility.reason)
      }

      const application = await applyProjectRequest(projectId, { currentUser, accessToken })

      dispatch({
        type: ACTIONS.APPLY_PROJECT,
        payload: { projectId, application },
      })

      return application
    }

    return {
      state,
      dispatch,
      currentUser,
      accessToken,
      rating: state.rating,
      externalProfile: state.externalProfile,
      accountLinks: state.accountLinks,
      isAuthenticated: state.auth.isAuthenticated,
      theme: state.preferences.theme,
      notifications: state.notifications,
      unreadNotificationCount: state.notifications.filter(notification => !notification.isRead).length,
      messages: state.messages,
      receivedMessages,
      sentMessages,
      unreadMessageCount: receivedMessages.filter(message => !message.isRead).length,
      studies: state.studies.items,
      studyFilters: state.studies.filters,
      studyApplications: state.studies.applications,
      filteredStudies,
      getStudyEligibility,
      projects: state.projects.items,
      projectFilters: state.projects.filters,
      projectApplications: state.projects.applications,
      filteredProjects,
      getProjectEligibility,
      rankingUsers: state.ranking.users,
      rankingTab: state.ranking.tab,
      visibleRankingUsers,
      myRankingEntry,
      setCurrentUser: (user, accessTokenValue) =>
        dispatch({
          type: ACTIONS.SET_CURRENT_USER,
          payload: accessTokenValue === undefined ? user : { user, accessToken: accessTokenValue },
        }),
      setAccessToken: accessTokenValue =>
        dispatch({ type: ACTIONS.SET_AUTH_TOKEN, payload: accessTokenValue }),
      logout: () => dispatch({ type: ACTIONS.LOGOUT }),
      setTheme: theme => dispatch({ type: ACTIONS.SET_THEME, payload: theme }),
      markNotificationRead: notificationId =>
        dispatch({ type: ACTIONS.MARK_NOTIFICATION_READ, payload: notificationId }),
      markAllNotificationsRead: () =>
        dispatch({ type: ACTIONS.MARK_ALL_NOTIFICATIONS_READ }),
      addMessage,
      markMessageRead,
      loadIntegratedUserData,
      clearExternalProfileError: () =>
        dispatch({ type: ACTIONS.CLEAR_EXTERNAL_PROFILE_ERROR }),
      setAccountLink: ({ platform, username, verificationCode }) =>
        dispatch({
          type: ACTIONS.SET_ACCOUNT_LINK,
          payload: { platform, username, verificationCode },
        }),
      verifyAccountLink: platform =>
        dispatch({
          type: ACTIONS.VERIFY_ACCOUNT_LINK,
          payload: { platform, verifiedAt: new Date().toISOString() },
        }),
      disconnectAccountLink: platform =>
        dispatch({ type: ACTIONS.DISCONNECT_ACCOUNT_LINK, payload: platform }),
      setStudyFilters: filters =>
        dispatch({ type: ACTIONS.SET_STUDY_FILTERS, payload: filters }),
      addStudy,
      applyStudy,
      setProjectFilters: filters =>
        dispatch({ type: ACTIONS.SET_PROJECT_FILTERS, payload: filters }),
      addProject,
      applyProject,
      setRankingTab: tab => dispatch({ type: ACTIONS.SET_RANKING_TAB, payload: tab }),
    }
  }, [state])

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}
