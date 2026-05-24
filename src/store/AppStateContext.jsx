import { useEffect, useMemo, useReducer } from 'react'
import { fetchIntegratedUserData } from '../api/userApi'
import { mockMessages, mockNotifications, mockRating, mockUser } from '../models'
import { AppStateContext } from './context'
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
  SET_ACCOUNT_LINK: 'accountLinks/set',
  VERIFY_ACCOUNT_LINK: 'accountLinks/verify',
  DISCONNECT_ACCOUNT_LINK: 'accountLinks/disconnect',
}

const STORAGE_KEY = 'link-u-app-state'

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

const baseInitialState = {
  auth: {
    isAuthenticated: true,
    user: mockUser,
  },
  rating: mockRating,
  notifications: mockNotifications,
  messages: mockMessages,
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

function createMessage(currentUser, message) {
  const sender = currentUser ?? { userId: 'guest', nickname: 'Guest' }

  return {
    messageId: `msg_${Date.now()}`,
    senderId: sender.userId,
    senderName: sender.nickname,
    receiverId: message.receiverId ?? message.to,
    receiverName: message.to,
    content: message.content,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    isRead: true,
  }
}

function appStateReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CURRENT_USER:
      return {
        ...state,
        auth: {
          isAuthenticated: Boolean(action.payload),
          user: action.payload,
        },
      }

    case ACTIONS.LOGOUT:
      return {
        ...state,
        auth: {
          isAuthenticated: false,
          user: null,
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
          createMessage(state.auth.user, action.payload),
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

    default:
      return state
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appStateReducer, undefined, createInitialState)

  useEffect(() => {
    persistState(state)
  }, [state])

  const value = useMemo(() => {
    const currentUser = state.auth.user
    const receivedMessages = currentUser
      ? state.messages.filter(message => message.receiverId === currentUser.userId)
      : []
    const sentMessages = currentUser
      ? state.messages.filter(message => message.senderId === currentUser.userId)
      : []
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

    return {
      state,
      dispatch,
      currentUser,
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
      setCurrentUser: user => dispatch({ type: ACTIONS.SET_CURRENT_USER, payload: user }),
      logout: () => dispatch({ type: ACTIONS.LOGOUT }),
      setTheme: theme => dispatch({ type: ACTIONS.SET_THEME, payload: theme }),
      markNotificationRead: notificationId =>
        dispatch({ type: ACTIONS.MARK_NOTIFICATION_READ, payload: notificationId }),
      markAllNotificationsRead: () =>
        dispatch({ type: ACTIONS.MARK_ALL_NOTIFICATIONS_READ }),
      addMessage: message => dispatch({ type: ACTIONS.ADD_MESSAGE, payload: message }),
      markMessageRead: messageId =>
        dispatch({ type: ACTIONS.MARK_MESSAGE_READ, payload: messageId }),
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
    }
  }, [state])

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}
