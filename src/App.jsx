import { BrowserRouter, Navigate, Outlet, useLocation, useRoutes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import LoginPage from './pages/LoginPage'
import { appRoutes } from './routes/appRoutes'
import { AppStateProvider, useAppState } from './store'
import { canAccessApp } from './utils/auth'
import './index.css'

function AppFrame() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function ProtectedApp() {
  const { state } = useAppState()
  const location = useLocation()

  if (!canAccessApp(state.auth)) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <AppFrame />
}

function AppRoutes() {
  return useRoutes([
    { path: '/login', element: <LoginPage /> },
    {
      path: '/',
      element: <ProtectedApp />,
      children: appRoutes,
    },
  ])
}

function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppStateProvider>
  )
}

export default App
