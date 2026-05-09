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
