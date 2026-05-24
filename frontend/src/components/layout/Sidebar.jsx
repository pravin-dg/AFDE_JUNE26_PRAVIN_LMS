import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, BookOpen, Users, ArrowLeftRight, ClipboardList, Search, ChevronLeft, ChevronRight, Library, BarChart2, Database, FileText } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { cn } from '../../utils/cn'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/books', icon: BookOpen, label: 'Books' },
  { to: '/borrowers', icon: Users, label: 'Borrowers' },
  { to: '/borrow-return', icon: ArrowLeftRight, label: 'Borrow / Return' },
  { to: '/transactions', icon: ClipboardList, label: 'Transactions' },
  { to: '/search', icon: Search, label: 'Search' },
]

const NAV_ANALYTICS = [
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/etl-manager', icon: Database, label: 'ETL Manager' },
  { to: '/reports', icon: FileText, label: 'Reports' },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useApp()
  const location = useLocation()

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-full z-50 flex flex-col overflow-hidden select-none"
      style={{ background: 'linear-gradient(180deg, #2D1F0F 0%, #4A3520 45%, #1E1B4B 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 min-h-[68px]">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-brown-300 to-brown-500 flex items-center justify-center shadow-lg">
          <Library size={18} className="text-cream-100" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
              <p className="font-display font-bold text-amber-100 text-base leading-tight">LibraryOS</p>
              <p className="text-white/40 text-xs">Management System</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto scrollbar-thin">
        <div className="space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => {
            const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
            return (
              <NavLink key={to} to={to} className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium relative group',
                active ? 'bg-white/15 text-white shadow-sm' : 'text-white/55 hover:text-white hover:bg-white/8'
              )}>
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} className="flex-shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="truncate">
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!sidebarOpen && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-brown-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-lg transition-opacity">
                    {label}
                  </span>
                )}
              </NavLink>
            )
          })}
        </div>

        {/* Analytics section divider */}
        <div className="my-3 px-3">
          <AnimatePresence>
            {sidebarOpen ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-white/30 text-xs uppercase tracking-widest font-semibold mb-2">
                Analytics
              </motion.p>
            ) : (
              <div className="border-t border-white/10 mb-2" />
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-0.5">
          {NAV_ANALYTICS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname.startsWith(to)
            return (
              <NavLink key={to} to={to} className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium relative group',
                active ? 'bg-white/15 text-white shadow-sm' : 'text-white/55 hover:text-white hover:bg-white/8'
              )}>
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} className="flex-shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="truncate">
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!sidebarOpen && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-brown-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-lg transition-opacity">
                    {label}
                  </span>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-white/10">
        <button onClick={toggleSidebar} className="flex items-center justify-center w-full gap-2 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all text-xs font-medium">
          {sidebarOpen ? <><ChevronLeft size={15} /><span>Collapse</span></> : <ChevronRight size={15} />}
        </button>
      </div>
    </motion.aside>
  )
}
