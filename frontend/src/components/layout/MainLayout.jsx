import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useApp } from '../../context/AppContext'

export default function MainLayout() {
  const { sidebarOpen } = useApp()
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-cream-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300" style={{ marginLeft: sidebarOpen ? 260 : 72 }}>
        <Navbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin bg-cream-100">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="p-6 min-h-full">
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
