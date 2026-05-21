import { useMemo, useReducer } from 'react'
import { mockMessages, mockNotifications, mockRating, mockUser } from '../models'
import { AppStateContext } from './context'

const ACTIONS = {
  SET_CURRENT_USER: 'auth/setCurrentUser',
  LOGOUT: 'auth/logout',
  SET_THEME: 'preferences/setTheme',
  MARK_NOTIFICATION_READ: 'notifications/markRead',
  MARK_ALL_NOTIFICATIONS_READ: 'notifications/markAllRead',
  ADD_MESSAGE: 'messages/add',
  MARK_MESSAGE_READ: 'messages/markRead',
}

const createInitialState = () => ({
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
})

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

    default:
      return state
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appStateReducer, undefined, createInitialState)

  const value = useMemo(() => {
    const currentUser = state.auth.user
    const receivedMessages = currentUser
      ? state.messages.filter(message => message.receiverId === currentUser.userId)
      : []
    const sentMessages = currentUser
      ? state.messages.filter(message => message.senderId === currentUser.userId)
      : []

    return {
      state,
      dispatch,
      currentUser,
      rating: state.rating,
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
    }
  }, [state])

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}
