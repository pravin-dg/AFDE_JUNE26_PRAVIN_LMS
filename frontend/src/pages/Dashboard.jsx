import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  BookOpen, Users, ArrowLeftRight, ClipboardList,
  TrendingUp, BookMarked, Star, ChevronRight, CheckCircle2,
  Clock, Library, Sparkles
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'
import StatCard from '../components/ui/StatCard'
import { StatCardSkeleton } from '../components/ui/LoadingSkeleton'
import { dashboardApi } from '../services/api'
import { formatRelative, formatDate } from '../utils/format'

// ── Demo chart data (replace with real API data in production) ──
const activityData = [
  { month: 'Jan', borrowed: 12, returned: 8 },
  { month: 'Feb', borrowed: 19, returned: 15 },
  { month: 'Mar', borrowed: 15, returned: 12 },
  { month: 'Apr', borrowed: 22, returned: 18 },
  { month: 'May', borrowed: 28, returned: 24 },
  { month: 'Jun', borrowed: 25, returned: 22 },
]

const categoryData = [
  { name: 'Fiction', value: 35, color: '#A67C52' },
  { name: 'Science', value: 20, color: '#2A9D8F' },
  { name: 'Tech', value: 18, color: '#3730A3' },
  { name: 'Self-Help', value: 15, color: '#E9C46A' },
  { name: 'Other', value: 12, color: '#E76F51' },
]

const COLORS = categoryData.map(d => d.color)

const COVER_COLORS = ['#2D6A4F','#E76F51','#264653','#A8DADC','#457B9D','#D4A017','#F4A261','#2A9D8F','#E9C46A','#6D6875']

function BookCover({ book, index }) {
  const color = book.cover_color || COVER_COLORS[index % COVER_COLORS.length]
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="group relative"
    >
      <div
        className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 cursor-pointer"
        style={{ background: `linear-gradient(135deg, ${color}ee, ${color}99)` }}
      >
        {/* Book spine effect */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20" />
        {/* Book content */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between">
          <div className="flex justify-end">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <BookOpen size={12} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-white font-semibold text-xs leading-tight line-clamp-2 drop-shadow">{book.title}</p>
            <p className="text-white/70 text-[10px] mt-1 truncate">{book.author}</p>
          </div>
        </div>
        {/* Availability indicator */}
        <div className={`absolute top-2 left-3 w-2 h-2 rounded-full ${book.availability_status ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-xs font-medium text-brown-700 line-clamp-1">{book.title}</p>
        <p className="text-xs text-brown-400 truncate">{book.category}</p>
      </div>
    </motion.div>
  )
}

function TransactionRow({ tx, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 py-3 border-b border-cream-100 last:border-0 hover:bg-cream-50 rounded-lg px-2 -mx-2 transition-colors"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tx.is_returned ? 'bg-blue-100' : 'bg-amber-100'}`}>
        {tx.is_returned ? <CheckCircle2 size={14} className="text-blue-600" /> : <Clock size={14} className="text-amber-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brown-700 truncate">{tx.book?.title ?? `Book #${tx.book_id}`}</p>
        <p className="text-xs text-brown-400 truncate">{tx.borrower?.borrower_name ?? `Borrower #${tx.borrower_id}`}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <span className={tx.is_returned ? 'badge-returned' : 'badge-borrowed'}>
          {tx.is_returned ? 'Returned' : 'Active'}
        </span>
        <p className="text-xs text-brown-400 mt-0.5">{formatRelative(tx.borrow_date)}</p>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentTx, setRecentTx] = useState([])
  const [recentBooks, setRecentBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, tx, books] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentTransactions(),
          dashboardApi.getRecentBooks(),
        ])
        setStats(s.data)
        setRecentTx(tx.data)
        setRecentBooks(books.data)
      } catch (e) {
        console.error('Dashboard load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2D1F0F 0%, #4A3520 40%, #1E1B4B 100%)' }}
      >
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/20"
              style={{ width: `${80 + i * 60}px`, height: `${80 + i * 60}px`, top: `${20 - i * 10}%`, right: `${5 + i * 3}%`, opacity: 0.5 - i * 0.07 }} />
          ))}
        </div>
        <div className="relative px-8 py-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Library Dashboard</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome to LibraryOS</h1>
            <p className="text-white/60 text-sm max-w-md">
              Your modern library management hub. Track books, borrowers, and transactions all in one place.
            </p>
            <div className="flex gap-3 mt-5">
              <Link to="/books" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-brown-900 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-lg">
                <BookOpen size={14} />Browse Books
              </Link>
              <Link to="/borrow-return" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-white/20">
                <ArrowLeftRight size={14} />Borrow Book
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            {[Library, BookMarked, Star].map((Icon, i) => (
              <motion.div key={i} animate={{ y: [0, -8, 0] }} transition={{ duration: 3, delay: i * 0.8, repeat: Infinity }}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Icon size={22} className="text-amber-300" strokeWidth={1.5} />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Total Books" value={stats?.total_books ?? 0} icon={BookOpen} color="brown" delay={0} subtitle="In library catalog" trend={`${stats?.total_categories ?? 0} categories`} />
            <StatCard label="Available" value={stats?.available_books ?? 0} icon={CheckCircle2} color="emerald" delay={0.05} subtitle="Ready to borrow" trend="Ready to borrow" />
            <StatCard label="On Loan" value={stats?.borrowed_books ?? 0} icon={Clock} color="amber" delay={0.1} subtitle="Currently borrowed" />
            <StatCard label="Borrowers" value={stats?.total_borrowers ?? 0} icon={Users} color="blue" delay={0.15} subtitle="Registered members" trend={`${stats?.active_borrowers ?? 0} active`} />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Borrowing Activity</h2>
              <p className="text-xs text-brown-400">Books borrowed vs returned over 6 months</p>
            </div>
            <TrendingUp size={16} className="text-brown-300" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="borrowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A67C52" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#A67C52" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="returnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2A9D8F" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2A9D8F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E6C8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B6340' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8B6340' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#FDF8F0', border: '1px solid #E6B168', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="borrowed" stroke="#A67C52" strokeWidth={2} fill="url(#borrowGrad)" name="Borrowed" />
              <Area type="monotone" dataKey="returned" stroke="#2A9D8F" strokeWidth={2} fill="url(#returnGrad)" name="Returned" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="card p-5">
          <h2 className="section-title mb-1">Categories</h2>
          <p className="text-xs text-brown-400 mb-4">Distribution by genre</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#FDF8F0', border: '1px solid #E6B168', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {categoryData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-brown-600">{item.name}</span>
                </div>
                <span className="font-medium text-brown-700">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Transactions */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Transactions</h2>
            <Link to="/transactions" className="text-xs text-brown-500 hover:text-brown-700 flex items-center gap-1 font-medium">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {recentTx.length === 0 && !loading ? (
            <p className="text-sm text-brown-400 text-center py-8">No transactions yet</p>
          ) : (
            <div>
              {recentTx.slice(0, 6).map((tx, i) => <TransactionRow key={tx.transaction_id} tx={tx} index={i} />)}
            </div>
          )}
        </div>

        {/* Recently Added Books */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Featured Books</h2>
              <p className="text-xs text-brown-400">Recently added to the library</p>
            </div>
            <Link to="/books" className="text-xs text-brown-500 hover:text-brown-700 flex items-center gap-1 font-medium">
              Browse all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recentBooks.map((book, i) => (
              <BookCover key={book.book_id} book={book} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Add Book', icon: BookOpen, to: '/books', color: 'bg-brown-500', desc: 'Add to catalog' },
          { label: 'New Borrower', icon: Users, to: '/borrowers', color: 'bg-blue-600', desc: 'Register member' },
          { label: 'Borrow Book', icon: ArrowLeftRight, to: '/borrow-return', color: 'bg-amber-500', desc: 'Issue a book' },
          { label: 'Transactions', icon: ClipboardList, to: '/transactions', color: 'bg-navy-700', desc: 'View history' },
        ].map(({ label, icon: Icon, to, color, desc }) => (
          <Link key={to} to={to}
            className="card p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-3 group">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
              <Icon size={17} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brown-700">{label}</p>
              <p className="text-xs text-brown-400">{desc}</p>
            </div>
          </Link>
        ))}
      </motion.div>
    </div>
  )
}
