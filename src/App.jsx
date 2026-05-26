import { BrowserRouter, useRoutes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { appRoutes } from './routes/appRoutes'
import { AppStateProvider } from './store'
import './index.css'

function AppLayout() {
  const routes = useRoutes(appRoutes)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {routes}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppStateProvider>
  )
}

export default App
