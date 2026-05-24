import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, FileText, ChevronUp, ChevronDown, ChevronsUpDown,
  AlertTriangle, Clock, TrendingUp,
} from 'lucide-react'
import axios from 'axios'

// ── Constants ────────────────────────────────────────────────────────────────

const BASE = 'http://localhost:8000/api/v1'
const ROWS_PER_PAGE = 20

const TABS = [
  { id: 'popular',   label: 'Popular Books',    exportPath: 'popular-books' },
  { id: 'monthly',   label: 'Monthly Trends',   exportPath: 'monthly-trends' },
  { id: 'category',  label: 'Category Analysis', exportPath: 'categories' },
  { id: 'overdue',   label: 'Overdue Report',   exportPath: 'overdue' },
]

// ── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

// ── Small helpers ────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-cream-200 rounded-xl ${className}`} />
}

function SkeletonRows({ cols = 5, rows = 8 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-cream-50/50'}>
          {Array.from({ length: cols }).map((__, ci) => (
            <td key={ci} className="px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={99}>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-brown-300">
          <FileText size={32} />
          <p className="text-sm font-medium">No data available</p>
        </div>
      </td>
    </tr>
  )
}

function RankBadge({ rank }) {
  const cls =
    rank === 1 ? 'bg-amber-400 text-amber-900' :
    rank === 2 ? 'bg-gray-300 text-gray-700' :
    rank === 3 ? 'bg-orange-400 text-orange-900' :
                 'bg-cream-100 text-brown-500'
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

function OverdueDaysBadge({ days }) {
  const cls =
    days > 30 ? 'bg-red-100 text-red-700 font-bold' :
    days > 7  ? 'bg-orange-100 text-orange-700 font-semibold' :
                'bg-yellow-100 text-yellow-700 font-medium'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${cls}`}>
      {days}d
    </span>
  )
}

function TxStatusBadge({ status }) {
  const s = (status ?? '').toLowerCase()
  if (s === 'overdue')
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Overdue</span>
  if (s === 'returned')
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Returned</span>
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Active</span>
}

function RecordBadge({ count, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brown-100 text-brown-700 border border-brown-200">
      <span className="font-bold text-brown-800">{count ?? '—'}</span>
      {label}
    </span>
  )
}

// ── Sort header cell ─────────────────────────────────────────────────────────

function SortTh({ col, label, sortKey, sortDir, onSort, className = '' }) {
  const active = sortKey === col
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:bg-cream-100 transition-colors ${className}`}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? sortDir === 'asc'
            ? <ChevronUp size={13} className="text-brown-500" />
            : <ChevronDown size={13} className="text-brown-500" />
          : <ChevronsUpDown size={13} className="text-brown-300" />
        }
      </span>
    </th>
  )
}

// ── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, total, perPage, onPage }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-cream-100 bg-white rounded-b-2xl">
      <p className="text-xs text-brown-400">
        Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1 rounded-lg text-xs font-medium text-brown-600 border border-brown-200 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              p === page
                ? 'bg-brown-600 text-white'
                : 'text-brown-600 border border-brown-200 hover:bg-cream-100'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1 rounded-lg text-xs font-medium text-brown-600 border border-brown-200 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

// ── Export button ────────────────────────────────────────────────────────────

function ExportButton({ exportPath }) {
  return (
    <button
      onClick={() => window.open(`${BASE}/analytics/export/${exportPath}`, '_blank')}
      className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
    >
      <Download size={14} />
      Export CSV
    </button>
  )
}

// ── Card wrapper with header ─────────────────────────────────────────────────

function TabCard({ title, count, exportPath, children }) {
  return (
    <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-cream-100">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-base font-semibold text-brown-700">{title}</h2>
          {count != null && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-brown-100 text-brown-700">
              {count}
            </span>
          )}
        </div>
        <ExportButton exportPath={exportPath} />
      </div>
      {children}
    </div>
  )
}

// ── useSortedPaged hook ───────────────────────────────────────────────────────

function useSortedPaged(data, defaultKey, defaultDir = 'asc') {
  const [sortKey, setSortKey] = useState(defaultKey)
  const [sortDir, setSortDir] = useState(defaultDir)
  const [page, setPage] = useState(1)

  const onSort = useCallback((col) => {
    setSortKey((prev) => {
      if (prev === col) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return col
      }
      setSortDir('asc')
      return col
    })
    setPage(1)
  }, [])

  const sorted = useMemo(() => {
    if (!data?.length) return []
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const paged = useMemo(
    () => sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [sorted, page]
  )

  return { sorted, paged, sortKey, sortDir, onSort, page, setPage, total: sorted.length }
}

// ── Tab: Popular Books ────────────────────────────────────────────────────────

function PopularBooksTab({ data, loading }) {
  const { paged, sortKey, sortDir, onSort, page, setPage, total } =
    useSortedPaged(data, 'rank', 'asc')

  const th = (col, label, cls) => (
    <SortTh col={col} label={label} sortKey={sortKey} sortDir={sortDir} onSort={onSort} className={cls} />
  )

  return (
    <TabCard title="Popular Books" count={data?.length} exportPath="popular-books">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream-50 border-b border-cream-100">
              {th('rank', 'Rank', 'w-16')}
              {th('title', 'Title')}
              {th('author', 'Author')}
              {th('category', 'Category')}
              {th('total_borrows', 'Total Borrows', 'text-right')}
              {th('total_returns', 'Total Returns', 'text-right')}
              {th('active_borrows', 'Active Borrows', 'text-right')}
              {th('avg_borrow_days', 'Avg Days', 'text-right')}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={8} />
            ) : !paged.length ? (
              <EmptyState />
            ) : (
              paged.map((row, i) => (
                <tr
                  key={row.book_id ?? i}
                  className={`border-b border-cream-100/60 hover:bg-cream-100/40 transition-colors ${
                    i % 2 === 0 ? 'bg-white' : 'bg-cream-50/50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <RankBadge rank={row.rank ?? i + 1} />
                  </td>
                  <td className="px-4 py-3 font-medium text-brown-800 max-w-[200px]">
                    <span className="block truncate" title={row.title}>{row.title}</span>
                  </td>
                  <td className="px-4 py-3 text-brown-500 max-w-[160px]">
                    <span className="block truncate" title={row.author}>{row.author}</span>
                  </td>
                  <td className="px-4 py-3">
                    {row.category ? <CategoryBadge category={row.category} /> : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-brown-700">{row.total_borrows ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-brown-500">{row.total_returns ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-brown-500">{row.active_borrows ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-brown-500">
                    {row.avg_borrow_days != null ? Number(row.avg_borrow_days).toFixed(1) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} perPage={ROWS_PER_PAGE} onPage={setPage} />
    </TabCard>
  )
}

// ── Tab: Monthly Trends ───────────────────────────────────────────────────────

function MonthlyTrendsTab({ data, loading }) {
  // default newest first
  const { paged, sortKey, sortDir, onSort, page, setPage, total } =
    useSortedPaged(data, 'year', 'desc')

  const th = (col, label, cls) => (
    <SortTh col={col} label={label} sortKey={sortKey} sortDir={sortDir} onSort={onSort} className={cls} />
  )

  return (
    <TabCard title="Monthly Trends" count={data?.length} exportPath="monthly-trends">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream-50 border-b border-cream-100">
              {th('month_label', 'Month')}
              {th('year', 'Year')}
              {th('total_borrows', 'Total Borrows', 'text-right')}
              {th('total_returns', 'Total Returns', 'text-right')}
              {th('active_borrows', 'Active Borrows', 'text-right')}
              {th('overdue_count', 'Overdue', 'text-right')}
              {th('unique_borrowers', 'Unique Borrowers', 'text-right')}
              {th('unique_books', 'Unique Books', 'text-right')}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={8} />
            ) : !paged.length ? (
              <EmptyState />
            ) : (
              paged.map((row, i) => (
                <tr
                  key={`${row.year}-${row.month}`}
                  className={`border-b border-cream-100/60 hover:bg-cream-100/40 transition-colors ${
                    i % 2 === 0 ? 'bg-white' : 'bg-cream-50/50'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-brown-800">{row.month_label}</td>
                  <td className="px-4 py-3 text-brown-500">{row.year}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brown-700">{row.total_borrows ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-brown-500">{row.total_returns ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-brown-500">{row.active_borrows ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {(row.overdue_count ?? 0) > 0
                      ? <span className="font-semibold text-red-600">{row.overdue_count}</span>
                      : <span className="text-brown-400">0</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right text-brown-500">{row.unique_borrowers ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-brown-500">{row.unique_books ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} perPage={ROWS_PER_PAGE} onPage={setPage} />
    </TabCard>
  )
}

// ── Tab: Category Analysis ────────────────────────────────────────────────────

function CategoryAnalysisTab({ data, loading }) {
  const { paged, sortKey, sortDir, onSort, page, setPage, total } =
    useSortedPaged(data, 'total_borrows', 'desc')

  const th = (col, label, cls) => (
    <SortTh col={col} label={label} sortKey={sortKey} sortDir={sortDir} onSort={onSort} className={cls} />
  )

  return (
    <TabCard title="Category Analysis" count={data?.length} exportPath="categories">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream-50 border-b border-cream-100">
              {th('category', 'Category')}
              {th('total_books', 'Total Books', 'text-right')}
              {th('available_books', 'Available', 'text-right')}
              {th('borrowed_books', 'Borrowed', 'text-right')}
              {th('total_borrows', 'Total Borrows', 'text-right')}
              <th className="px-4 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wide whitespace-nowrap">
                Borrow Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={6} />
            ) : !paged.length ? (
              <EmptyState />
            ) : (
              paged.map((row, i) => {
                const pct = Number(row.borrow_percentage) || 0
                return (
                  <tr
                    key={row.category ?? i}
                    className={`border-b border-cream-100/60 hover:bg-cream-100/40 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-cream-50/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      {row.category ? <CategoryBadge category={row.category} /> : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brown-700">{row.total_books ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{row.available_books ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-amber-600 font-medium">{row.borrowed_books ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-brown-500">{row.total_borrows ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 bg-cream-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-brown-500 rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-brown-600 w-12 text-right">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} perPage={ROWS_PER_PAGE} onPage={setPage} />
    </TabCard>
  )
}

// ── Tab: Overdue Report ───────────────────────────────────────────────────────

function OverdueReportTab({ data, loading }) {
  const topOverdue = data?.top_overdue ?? []

  const { paged, sortKey, sortDir, onSort, page, setPage, total } =
    useSortedPaged(topOverdue, 'overdue_days', 'desc')

  const th = (col, label, cls) => (
    <SortTh col={col} label={label} sortKey={sortKey} sortDir={sortDir} onSort={onSort} className={cls} />
  )

  const kpis = [
    {
      icon: AlertTriangle,
      label: 'Total Overdue',
      value: data?.total_overdue,
      accent: (data?.total_overdue ?? 0) > 0,
    },
    {
      icon: Clock,
      label: 'Avg Overdue Days',
      value: data?.avg_overdue_days != null ? `${Number(data.avg_overdue_days).toFixed(1)}d` : null,
    },
    {
      icon: TrendingUp,
      label: 'Max Overdue Days',
      value: data?.max_overdue_days != null ? `${data.max_overdue_days}d` : null,
    },
  ]

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(({ icon: Icon, label, value, accent }) => (
          <div
            key={label}
            className={`bg-white rounded-2xl border shadow-sm p-5 flex gap-4 items-center ${
              accent ? 'border-red-200 bg-red-50/50' : 'border-cream-200'
            }`}
          >
            {loading ? (
              <>
                <Skeleton className="w-11 h-11 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </>
            ) : (
              <>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ? 'bg-red-100' : 'bg-cream-100'}`}>
                  <Icon size={20} className={accent ? 'text-red-600' : 'text-brown-500'} />
                </div>
                <div>
                  <p className="text-xs text-brown-400 font-medium uppercase tracking-wide">{label}</p>
                  <p className={`font-display text-3xl font-bold mt-0.5 ${accent ? 'text-red-600' : 'text-brown-800'}`}>
                    {value ?? '—'}
                  </p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Table card */}
      <TabCard title="Top Overdue Transactions" count={topOverdue.length} exportPath="overdue">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-50 border-b border-cream-100">
                {th('book_title', 'Book')}
                {th('borrower_name', 'Borrower')}
                {th('borrower_email', 'Email')}
                {th('due_date', 'Due Date')}
                {th('overdue_days', 'Overdue Days', 'text-right')}
                <th className="px-4 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={6} />
              ) : !paged.length ? (
                <EmptyState />
              ) : (
                paged.map((row, i) => (
                  <tr
                    key={row.transaction_id ?? i}
                    className={`border-b border-cream-100/60 hover:bg-cream-100/40 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-cream-50/50'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-brown-800 max-w-[180px]">
                      <span className="block truncate" title={row.book_title}>{row.book_title ?? `Book #${row.book_id}`}</span>
                    </td>
                    <td className="px-4 py-3 text-brown-600">{row.borrower_name ?? `#${row.borrower_id}`}</td>
                    <td className="px-4 py-3 text-brown-400 text-xs">{row.borrower_email ?? '—'}</td>
                    <td className="px-4 py-3 text-brown-500 text-xs">
                      {row.due_date ? new Date(row.due_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.overdue_days != null
                        ? <OverdueDaysBadge days={row.overdue_days} />
                        : '—'
                      }
                    </td>
                    <td className="px-4 py-3">
                      <TxStatusBadge status={row.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} perPage={ROWS_PER_PAGE} onPage={setPage} />
      </TabCard>
    </div>
  )
}

// ── Main Reports Page ─────────────────────────────────────────────────────────

export default function Reports() {
  const [activeTab, setActiveTab] = useState('popular')

  const [popularBooks,   setPopularBooks]   = useState([])
  const [monthlyTrends,  setMonthlyTrends]  = useState([])
  const [categoryTrends, setCategoryTrends] = useState([])
  const [overdueData,    setOverdueData]    = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [popRes, monthRes, catRes, overdueRes] = await Promise.all([
        axios.get(`${BASE}/analytics/popular-books?limit=50`),
        axios.get(`${BASE}/analytics/monthly-trends`),
        axios.get(`${BASE}/analytics/category-trends`),
        axios.get(`${BASE}/analytics/overdue-analysis`),
      ])
      // Unwrap arrays (backend returns plain arrays)
      setPopularBooks(Array.isArray(popRes.data) ? popRes.data : (popRes.data?.items ?? []))
      setMonthlyTrends(Array.isArray(monthRes.data) ? monthRes.data : (monthRes.data?.items ?? []))
      setCategoryTrends(Array.isArray(catRes.data) ? catRes.data : (catRes.data?.items ?? []))
      // Normalize overdue: flatten summary.* to top level
      const od = overdueRes.data ?? {}
      setOverdueData({
        total_overdue:    od.summary?.total_overdue    ?? od.total_overdue    ?? 0,
        avg_overdue_days: od.summary?.avg_overdue_days ?? od.avg_overdue_days ?? 0,
        max_overdue_days: od.summary?.max_overdue_days ?? od.max_overdue_days ?? 0,
        top_overdue:      od.top_overdue ?? [],
        frequent_offenders: od.frequent_offenders ?? [],
      })
    } catch (err) {
      console.error('Reports load error:', err)
      setError(err?.response?.data?.detail ?? err.message ?? 'Failed to load reports.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Total record summary for header badges
  const totalRecords = {
    popular:  popularBooks.length,
    monthly:  monthlyTrends.length,
    category: categoryTrends.length,
    overdue:  overdueData?.total_overdue ?? 0,
  }

  return (
    <div className="space-y-6 bg-cream-50 min-h-full p-0">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-brown-800">Reports</h1>
          <p className="text-sm text-brown-400 mt-1">Export and analyze library data</p>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2">
          {!loading && (
            <>
              <RecordBadge count={totalRecords.popular}  label="books tracked" />
              <RecordBadge count={totalRecords.monthly}  label="months" />
              <RecordBadge count={totalRecords.category} label="categories" />
              {totalRecords.overdue > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                  <span className="font-bold">{totalRecords.overdue}</span>
                  overdue
                </span>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* ── Error banner ── */}
      {error && !loading && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchAll}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Tab navigation ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-brown-600 text-white shadow-sm'
                : 'text-brown-600 border border-brown-200 hover:bg-cream-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* ── Tab panels ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
        >
          {activeTab === 'popular' && (
            <PopularBooksTab data={popularBooks} loading={loading} />
          )}
          {activeTab === 'monthly' && (
            <MonthlyTrendsTab data={monthlyTrends} loading={loading} />
          )}
          {activeTab === 'category' && (
            <CategoryAnalysisTab data={categoryTrends} loading={loading} />
          )}
          {activeTab === 'overdue' && (
            <OverdueReportTab data={overdueData} loading={loading} />
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  )
}
