import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Users, AlertTriangle, ArrowLeftRight,
  RefreshCw, TrendingUp, Trophy, Clock, BarChart2,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import axios from 'axios'

// ── Constants ───────────────────────────────────────────────────────────────

const BASE = 'http://localhost:8000/api/v1'

const PIE_COLORS = [
  '#A67C52', '#3730A3', '#2A9D8F', '#E9C46A', '#E76F51',
  '#457B9D', '#6D6875', '#2D6A4F', '#F4A261', '#A8DADC',
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-cream-200 rounded-xl ${className}`} />
  )
}

function RankBadge({ rank }) {
  const gold = 'bg-amber-400 text-amber-900'
  const silver = 'bg-gray-300 text-gray-700'
  const bronze = 'bg-orange-400 text-orange-900'
  const plain = 'bg-cream-100 text-brown-500'
  const cls = rank === 1 ? gold : rank === 2 ? silver : rank === 3 ? bronze : plain
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${cls}`}>
      {rank}
    </span>
  )
}

function CategoryBadge({ category }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-navy-600/10 text-navy-700 border border-navy-600/15 whitespace-nowrap">
      {category}
    </span>
  )
}

function StatusBadge({ isOverdue }) {
  return isOverdue
    ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Overdue</span>
    : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Active</span>
}

// Custom tooltip for Recharts
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-cream-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-brown-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex gap-2">
          <span>{p.name}:</span>
          <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, subtitle, accent = false, delay = 0 }) {
  return (
    <motion.div variants={cardVariants} className={`card p-5 flex gap-4 items-start ${accent ? 'border-red-200 bg-red-50/50' : ''}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ? 'bg-red-100' : 'bg-cream-100'}`}>
        <Icon size={20} className={accent ? 'text-red-600' : 'text-brown-500'} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-brown-400 font-medium uppercase tracking-wide">{label}</p>
        <p className={`font-display text-3xl font-bold mt-0.5 ${accent && value > 0 ? 'text-red-600' : 'text-brown-800'}`}>
          {value?.toLocaleString() ?? '—'}
        </p>
        {subtitle && <p className="text-xs text-brown-400 mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  )
}

function KPICardSkeleton() {
  return (
    <div className="card p-5 flex gap-4 items-start">
      <Skeleton className="w-11 h-11 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  )
}

// ── Popular Books Leaderboard ─────────────────────────────────────────────────

function PopularBooks({ books, loading }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center py-2">
            <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
            <Skeleton className="h-5 w-14" />
          </div>
        ))}
      </div>
    )
  }

  if (!books?.length) {
    return <p className="text-sm text-brown-400 text-center py-10">No data available</p>
  }

  return (
    <div className="space-y-0.5">
      {books.slice(0, 10).map((book, i) => (
        <motion.div
          key={book.book_id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-xl hover:bg-cream-50 transition-colors group"
        >
          <RankBadge rank={book.rank ?? i + 1} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brown-700 truncate group-hover:text-brown-900">{book.title}</p>
            <p className="text-xs text-brown-400 truncate">{book.author}</p>
          </div>
          {book.category && <CategoryBadge category={book.category} />}
          <div className="flex items-center gap-1 flex-shrink-0">
            <BookOpen size={12} className="text-brown-300" />
            <span className="text-sm font-bold text-brown-600">{book.total_borrows}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Category Pie Chart ────────────────────────────────────────────────────────

function CategoryPie({ data, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="w-44 h-44 rounded-full" />
        <div className="w-full space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-3 w-full" />)}
        </div>
      </div>
    )
  }

  if (!data?.length) {
    return <p className="text-sm text-brown-400 text-center py-10">No data available</p>
  }

  const pieData = data.map((d) => ({ name: d.category, value: Number(d.borrow_percentage) || 0 }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#FDF8F0', border: '1px solid #E6D5B8', borderRadius: 10, fontSize: 12 }}
            formatter={(v) => [`${v}%`, 'Borrow share']}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: '#8B6340' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Monthly Trends Chart ──────────────────────────────────────────────────────

function MonthlyChart({ data, loading }) {
  if (loading) {
    return <Skeleton className="w-full h-56" />
  }

  if (!data?.length) {
    return <p className="text-sm text-brown-400 text-center py-16">No data available</p>
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="borrowGradAn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#A67C52" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#A67C52" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="returnGradAn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1E1B4B" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1E1B4B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0E2C8" />
        <XAxis
          dataKey="month_label"
          tick={{ fontSize: 11, fill: '#8B6340' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#8B6340' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8, color: '#8B6340' }}
        />
        <Area
          type="monotone"
          dataKey="total_borrows"
          name="Borrows"
          stroke="#A67C52"
          strokeWidth={2.5}
          fill="url(#borrowGradAn)"
        />
        <Area
          type="monotone"
          dataKey="total_returns"
          name="Returns"
          stroke="#3730A3"
          strokeWidth={2.5}
          fill="url(#returnGradAn)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Overdue Analysis ──────────────────────────────────────────────────────────

function OverdueSection({ data, loading }) {
  const statCards = [
    { label: 'Total Overdue', value: data?.total_overdue, icon: AlertTriangle, accent: true },
    { label: 'Avg Overdue Days', value: data?.avg_overdue_days != null ? `${Number(data.avg_overdue_days).toFixed(1)}d` : null, icon: Clock },
    { label: 'Max Overdue Days', value: data?.max_overdue_days != null ? `${data.max_overdue_days}d` : null, icon: TrendingUp },
  ]

  const topOverdue = data?.top_overdue ?? []

  return (
    <div className="space-y-4">
      {/* Stat mini-cards */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, accent }, i) => (
          <motion.div
            key={label}
            variants={cardVariants}
            className={`card p-4 flex gap-3 items-center ${accent && (data?.total_overdue ?? 0) > 0 ? 'border-red-200 bg-red-50/50' : ''}`}
          >
            {loading ? (
              <>
                <Skeleton className="w-10 h-10 flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </>
            ) : (
              <>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent && (data?.total_overdue ?? 0) > 0 ? 'bg-red-100' : 'bg-cream-100'}`}>
                  <Icon size={18} className={accent && (data?.total_overdue ?? 0) > 0 ? 'text-red-600' : 'text-brown-500'} />
                </div>
                <div>
                  <p className="text-xs text-brown-400 font-medium uppercase tracking-wide">{label}</p>
                  <p className={`font-display text-2xl font-bold ${accent && (data?.total_overdue ?? 0) > 0 ? 'text-red-600' : 'text-brown-800'}`}>
                    {value ?? '—'}
                  </p>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Top overdue table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-cream-100">
          <h3 className="font-display text-base font-semibold text-brown-700">Top Overdue Transactions</h3>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : !topOverdue.length ? (
          <p className="text-sm text-brown-400 text-center py-10">No overdue transactions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-brown-500 uppercase tracking-wide">Title</th>
                  <th className="px-5 py-3 text-xs font-semibold text-brown-500 uppercase tracking-wide">Borrower</th>
                  <th className="px-5 py-3 text-xs font-semibold text-brown-500 uppercase tracking-wide">Overdue Days</th>
                  <th className="px-5 py-3 text-xs font-semibold text-brown-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {topOverdue.map((row, i) => (
                  <motion.tr
                    key={row.transaction_id ?? i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-t border-cream-100 hover:bg-cream-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-brown-700 max-w-[200px] truncate">
                      {row.title ?? row.book?.title ?? `Book #${row.book_id}`}
                    </td>
                    <td className="px-5 py-3 text-brown-500">
                      {row.borrower_name ?? row.borrower?.borrower_name ?? `Borrower #${row.borrower_id}`}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-red-600">
                        {row.overdue_days != null ? `${row.overdue_days}d` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge isOverdue={true} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Analytics Page ───────────────────────────────────────────────────────

export default function Analytics() {
  const [summary, setSummary] = useState(null)
  const [popularBooks, setPopularBooks] = useState([])
  const [monthlyTrends, setMonthlyTrends] = useState([])
  const [categoryTrends, setCategoryTrends] = useState([])
  const [overdueAnalysis, setOverdueAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [sumRes, popRes, monthRes, catRes, overdueRes] = await Promise.all([
        axios.get(`${BASE}/analytics/dashboard-summary`),
        axios.get(`${BASE}/analytics/popular-books`),
        axios.get(`${BASE}/analytics/monthly-trends`),
        axios.get(`${BASE}/analytics/category-trends`),
        axios.get(`${BASE}/analytics/overdue-analysis`),
      ])
      setSummary(sumRes.data)
      // popular-books, monthly-trends, category-trends all return plain arrays now
      setPopularBooks(Array.isArray(popRes.data) ? popRes.data : (popRes.data?.items ?? []))
      setMonthlyTrends(Array.isArray(monthRes.data) ? monthRes.data : (monthRes.data?.items ?? []))
      setCategoryTrends(Array.isArray(catRes.data) ? catRes.data : (catRes.data?.items ?? []))
      // Normalize overdue: flatten summary.* to top level for component compatibility
      const od = overdueRes.data ?? {}
      setOverdueAnalysis({
        total_overdue:    od.summary?.total_overdue    ?? od.total_overdue    ?? 0,
        avg_overdue_days: od.summary?.avg_overdue_days ?? od.avg_overdue_days ?? 0,
        max_overdue_days: od.summary?.max_overdue_days ?? od.max_overdue_days ?? 0,
        top_overdue:      od.top_overdue ?? [],
        frequent_offenders: od.frequent_offenders ?? [],
      })
    } catch (err) {
      console.error('Analytics load error:', err)
      setError(err?.response?.data?.detail ?? err.message ?? 'Failed to load analytics data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ── Error state ────────────────────────────────────────────────────────────
  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold text-brown-800 mb-1">Failed to load analytics</h2>
          <p className="text-sm text-brown-400 max-w-sm">{error}</p>
        </div>
        <button
          onClick={() => fetchAll()}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    )
  }

  const kpiCards = [
    {
      icon: BookOpen,
      label: 'Total Books',
      value: summary?.total_books,
      subtitle: `${summary?.available_books ?? '—'} available`,
    },
    {
      icon: ArrowLeftRight,
      label: 'Active Borrows',
      value: summary?.active_borrows,
      subtitle: `${summary?.borrowed_books ?? '—'} on loan`,
    },
    {
      icon: AlertTriangle,
      label: 'Overdue Books',
      value: summary?.overdue_count,
      subtitle: summary?.overdue_rate != null
        ? `${Number(summary.overdue_rate).toFixed(1)}% overdue rate`
        : undefined,
      accent: true,
    },
    {
      icon: BarChart2,
      label: 'Total Transactions',
      value: summary?.total_transactions,
      subtitle: `${summary?.total_borrowers ?? '—'} borrowers`,
    },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-brown-800">Analytics Dashboard</h1>
          <p className="text-sm text-brown-400 mt-1">
            Insights into library activity, borrowing trends, and overdue patterns.
          </p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing || loading}
          className="btn-secondary flex items-center gap-2 flex-shrink-0"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh Data'}
        </button>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
          : kpiCards.map((card) => (
              <KPICard key={card.label} {...card} />
            ))}
      </motion.div>

      {/* ── Monthly Trends Chart (full width) ── */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Monthly Trends</h2>
            <p className="text-xs text-brown-400 mt-0.5">Books borrowed vs returned per month</p>
          </div>
          <TrendingUp size={16} className="text-brown-300" />
        </div>
        <MonthlyChart data={monthlyTrends} loading={loading} />
      </motion.div>

      {/* ── Two-column row: Leaderboard + Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Popular Books Leaderboard */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="card p-5 lg:col-span-3"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-amber-500" />
            <h2 className="section-title">Popular Books</h2>
            <span className="ml-auto text-xs text-brown-400">Top 10 by borrows</span>
          </div>
          <PopularBooks books={popularBooks} loading={loading} />
        </motion.div>

        {/* Category Distribution Pie */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="card p-5 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={16} className="text-navy-700" />
            <h2 className="section-title">Category Distribution</h2>
          </div>
          <p className="text-xs text-brown-400 mb-4">Borrow share by genre</p>
          <CategoryPie data={categoryTrends} loading={loading} />
        </motion.div>
      </div>

      {/* ── Overdue Analysis ── */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="show"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-red-500" />
          <h2 className="font-display text-lg font-semibold text-brown-700">Overdue Analysis</h2>
        </div>
        <OverdueSection data={overdueAnalysis} loading={loading} />
      </motion.div>

    </div>
  )
}
