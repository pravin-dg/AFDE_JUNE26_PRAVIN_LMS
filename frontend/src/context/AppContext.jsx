import { createContext, useContext, useState, useEffect } from 'react'
import { dashboardApi } from '../services/api'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [stats, setStats] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const fetchStats = async () => {
    try { const r = await dashboardApi.getStats(); setStats(r.data) }
    catch (e) { console.error('Stats error:', e) }
  }

  useEffect(() => { fetchStats() }, [])

  return (
    <AppContext.Provider value={{ stats, fetchStats, sidebarOpen, toggleSidebar: () => setSidebarOpen(p => !p) }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => { const c = useContext(AppContext); if (!c) throw new Error('useApp outside AppProvider'); return c }
