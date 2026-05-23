import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, User, BookOpen } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function Navbar() {
  const { stats } = useApp()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (q.trim()) { navigate(`/search?q=${encodeURIComponent(q.trim())}`); setQ('') }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-cream-200 px-6 h-16 flex items-center gap-4 shadow-sm">
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-300 pointer-events-none" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search books, authors, borrowers…"
            className="w-full pl-9 pr-4 py-2 bg-cream-50 border border-cream-200 rounded-full text-sm text-brown-700 placeholder-brown-300 focus:outline-none focus:ring-2 focus:ring-brown-300 focus:bg-white transition-all" />
        </div>
      </form>
      <div className="flex items-center gap-2 ml-auto">
        {stats && (
          <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 text-xs text-emerald-700">
            <BookOpen size={11} /><span className="font-semibold">{stats.available_books ?? 0}</span><span className="text-emerald-500">available</span>
          </div>
        )}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 transition-colors text-brown-500">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-white" />
        </button>
        <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-cream-100 transition-colors cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brown-400 to-brown-700 flex items-center justify-center">
            <User size={13} className="text-white" />
          </div>
          <span className="hidden md:block text-sm font-medium text-brown-700">Admin</span>
        </div>
      </div>
    </header>
  )
}
