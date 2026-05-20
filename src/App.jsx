import { BrowserRouter, Navigate, Outlet, useLocation, useRoutes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import LoginPage from './pages/LoginPage'
import { appRoutes } from './routes/appRoutes'
import { AppStateProvider, useAppState } from './store'
import { canAccessApp, DANKOOK_EMAIL_DOMAIN, isDankookEmail } from './utils/auth'
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

function AuthStatusScreen({ title, description, action }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-gray-900">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-base font-bold text-white">
          L
        </div>
        <h1 className="text-lg font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">{description}</p>
        {action}
      </section>
    </main>
  )
}

function ProtectedApp() {
  const { logout, state } = useAppState()
  const location = useLocation()
  const { auth } = state

  if (auth.initialized === false) {
    return (
      <AuthStatusScreen
        title="로그인 상태를 확인하는 중입니다"
        description="저장된 인증 정보가 아직 유효한지 확인하고 있습니다."
      />
    )
  }

  if (auth.user?.email && !isDankookEmail(auth.user.email)) {
    return (
      <AuthStatusScreen
        title="단국대 계정만 접근할 수 있습니다"
        description={`${DANKOOK_EMAIL_DOMAIN} Google 계정으로 다시 로그인해 주세요.`}
        action={(
          <button
            type="button"
            onClick={logout}
            className="mt-6 h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            다시 로그인하기
          </button>
        )}
      />
    )
  }

  if (!canAccessApp(auth)) {
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
