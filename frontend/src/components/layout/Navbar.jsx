import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Bell, User, BookOpen, AlertTriangle, Clock,
  CheckCircle, X, LogOut, Settings, BarChart2, Shield,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { analyticsApi, transactionsApi } from '../../services/api'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 2)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24)  return `${hrs}h ago`
  return `${days}d ago`
}

// ── Profile Dropdown ──────────────────────────────────────────────────────────

function ProfileDropdown({ stats, onClose, onNavigate }) {
  const menuItems = [
    { icon: BarChart2, label: 'Analytics',   path: '/analytics' },
    { icon: Settings,  label: 'ETL Manager', path: '/etl-manager' },
    { icon: Shield,    label: 'Reports',     path: '/reports' },
  ]

  return (
    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-cream-200 overflow-hidden z-50">
      {/* Profile header */}
      <div className="px-4 py-4 bg-gradient-to-br from-brown-700 to-brown-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Admin</p>
            <p className="text-xs text-white/60">Library Administrator</p>
          </div>
        </div>
        {stats && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/10 rounded-lg py-1.5">
              <p className="text-xs font-bold">{stats.total_books ?? 0}</p>
              <p className="text-[10px] text-white/60">Books</p>
            </div>
            <div className="bg-white/10 rounded-lg py-1.5">
              <p className="text-xs font-bold">{stats.total_borrowers ?? 0}</p>
              <p className="text-[10px] text-white/60">Members</p>
            </div>
            <div className="bg-white/10 rounded-lg py-1.5">
              <p className="text-xs font-bold">{stats.active_borrows ?? 0}</p>
              <p className="text-[10px] text-white/60">Active</p>
            </div>
          </div>
        )}
      </div>

      {/* Menu items */}
      <div className="py-1.5 divide-y divide-cream-100">
        <div className="pb-1.5">
          {menuItems.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => { onNavigate(path); onClose() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-brown-700 hover:bg-cream-50 transition-colors text-left"
            >
              <Icon size={15} className="text-brown-400 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>
        <div className="pt-1.5">
          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
            onClick={onClose}
          >
            <LogOut size={15} className="flex-shrink-0" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Notification Dropdown ─────────────────────────────────────────────────────

export default function Navbar() {
  const { stats } = useApp()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const notifRef   = useRef(null)
  const profileRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    const items = []
    try {
      const [overdueRes, recentRes] = await Promise.allSettled([
        analyticsApi.overdueAnalysis(10),
        transactionsApi.getRecent(5),
      ])

      if (overdueRes.status === 'fulfilled') {
        const od = overdueRes.value.data
        const overdueList = od?.top_overdue ?? (Array.isArray(od) ? od : [])

        overdueList.filter(o => !o.is_returned).slice(0, 5).forEach(o => {
          items.push({
            id: `overdue-${o.transaction_id}`,
            type: 'overdue',
            icon: AlertTriangle,
            iconColor: 'text-red-500',
            iconBg: 'bg-red-50',
            title: 'Book Overdue',
            message: `"${o.book_title}"`,
            sub: `${o.borrower_name} — ${o.overdue_days}d overdue`,
            time: o.due_date,
            urgent: o.overdue_days >= 14,
          })
        })

        overdueList.filter(o => o.is_returned).slice(0, 3).forEach(o => {
          items.push({
            id: `late-${o.transaction_id}`,
            type: 'late_return',
            icon: Clock,
            iconColor: 'text-amber-500',
            iconBg: 'bg-amber-50',
            title: 'Returned Late',
            message: `"${o.book_title}"`,
            sub: `${o.borrower_name} — ${o.overdue_days}d late`,
            time: o.return_date,
            urgent: false,
          })
        })
      }

      if (recentRes.status === 'fulfilled') {
        const txns = recentRes.value.data
        const list = Array.isArray(txns) ? txns : (txns?.items ?? [])
        list.slice(0, 4).forEach(t => {
          const isRet = t.is_returned
          items.push({
            id: `${isRet ? 'return' : 'borrow'}-${t.transaction_id}`,
            type: isRet ? 'return' : 'borrow',
            icon: isRet ? CheckCircle : BookOpen,
            iconColor: isRet ? 'text-emerald-500' : 'text-blue-500',
            iconBg: isRet ? 'bg-emerald-50' : 'bg-blue-50',
            title: isRet ? 'Book Returned' : 'Book Borrowed',
            message: `"${t.book_title ?? t.book?.title ?? 'Book'}"`,
            sub: `by ${t.borrower_name ?? t.borrower?.borrower_name ?? 'Borrower'}`,
            time: isRet ? (t.return_date ?? t.borrow_date) : t.borrow_date,
            urgent: false,
          })
        })
      }
    } catch (_) {}

    items.sort((a, b) => {
      if (a.urgent !== b.urgent) return b.urgent - a.urgent
      return new Date(b.time || 0) - new Date(a.time || 0)
    })

    setNotifications(items)
    setUnread(items.filter(n => n.type === 'overdue' || n.urgent).length)
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
    const timer = setInterval(fetchNotifications, 120000)
    return () => clearInterval(timer)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (q.trim()) { navigate(`/search?q=${encodeURIComponent(q.trim())}`); setQ('') }
  }

  const handleBellClick = () => {
    setProfileOpen(false)
    setNotifOpen(prev => {
      if (!prev) setUnread(0)
      return !prev
    })
  }

  const handleProfileClick = () => {
    setNotifOpen(false)
    setProfileOpen(p => !p)
  }

  const typeLabel = { overdue: 'Overdue', late_return: 'Late Return', borrow: 'Borrowed', return: 'Returned' }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-cream-200 px-6 h-16 flex items-center gap-4 shadow-sm">
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-300 pointer-events-none" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search books, authors, borrowers…"
            className="w-full pl-9 pr-4 py-2 bg-cream-50 border border-cream-200 rounded-full text-sm text-brown-700 placeholder-brown-300 focus:outline-none focus:ring-2 focus:ring-brown-300 focus:bg-white transition-all"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 ml-auto">
        {stats && (
          <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 text-xs text-emerald-700">
            <BookOpen size={11} />
            <span className="font-semibold">{stats.available_books ?? 0}</span>
            <span className="text-emerald-500">available</span>
          </div>
        )}

        {/* ── Bell ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleBellClick}
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 transition-colors text-brown-500"
          >
            <Bell size={17} />
            {unread > 0 ? (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-cream-200 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-cream-100 bg-cream-50">
                <div>
                  <h3 className="text-sm font-semibold text-brown-800">Notifications</h3>
                  <p className="text-xs text-brown-400">{notifications.length} recent alerts</p>
                </div>
                <button onClick={() => setNotifOpen(false)} className="text-brown-300 hover:text-brown-600 transition-colors">
                  <X size={15} />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-cream-100">
                {loading ? (
                  <div className="px-4 py-8 text-center text-sm text-brown-400">
                    <div className="animate-spin w-5 h-5 border-2 border-brown-200 border-t-brown-500 rounded-full mx-auto mb-2" />
                    Loading…
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-brown-700">All caught up!</p>
                    <p className="text-xs text-brown-400 mt-0.5">No overdue books right now.</p>
                  </div>
                ) : (
                  notifications.map(n => {
                    const Icon = n.icon
                    return (
                      <div
                        key={n.id}
                        className={`flex gap-3 px-4 py-3 hover:bg-cream-50 transition-colors ${n.urgent ? 'bg-red-50/40' : ''}`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${n.iconBg} flex items-center justify-center mt-0.5`}>
                          <Icon size={14} className={n.iconColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                              n.type === 'overdue' ? 'text-red-500' :
                              n.type === 'late_return' ? 'text-amber-500' :
                              n.type === 'borrow' ? 'text-blue-500' : 'text-emerald-500'
                            }`}>{typeLabel[n.type]}</span>
                            <span className="text-[10px] text-brown-300 flex-shrink-0">{timeAgo(n.time)}</span>
                          </div>
                          <p className="text-xs font-medium text-brown-800 truncate mt-0.5">{n.message}</p>
                          <p className="text-[11px] text-brown-400 mt-0.5">{n.sub}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div className="border-t border-cream-100 px-4 py-2.5 bg-cream-50">
                  <button
                    onClick={() => { navigate('/reports'); setNotifOpen(false) }}
                    className="w-full text-xs font-medium text-brown-500 hover:text-brown-800 transition-colors text-center"
                  >
                    View full overdue report →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Profile ── */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={handleProfileClick}
            className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              profileOpen ? 'bg-cream-200' : 'hover:bg-cream-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brown-400 to-brown-700 flex items-center justify-center">
              <User size={13} className="text-white" />
            </div>
            <span className="hidden md:block text-sm font-medium text-brown-700">Admin</span>
          </button>

          {profileOpen && (
            <ProfileDropdown
              stats={stats}
              onClose={() => setProfileOpen(false)}
              onNavigate={navigate}
            />
          )}
        </div>
      </div>
    </header>
  )
}
