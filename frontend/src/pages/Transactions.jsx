import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Filter, CheckCircle2, Clock, BookOpen, User, Calendar, RotateCcw, X } from 'lucide-react'
import { transactionsApi } from '../services/api'
import { formatDate, formatDateTime, formatRelative } from '../utils/format'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import { TableRowSkeleton } from '../components/ui/LoadingSkeleton'

const COVER_COLORS = ['#2D6A4F','#E76F51','#264653','#A8DADC','#457B9D','#D4A017','#F4A261','#2A9D8F']
const AVATAR_COLORS = ['#A67C52','#2A9D8F','#E76F51','#264653','#457B9D','#8338EC']
const getInitials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState({ skip: 0, limit: 20 })
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchTxs = useCallback(async () => {
    setLoading(true)
    try {
      const p = { ...params }
      if (filterStatus === 'active') p.is_returned = false
      if (filterStatus === 'returned') p.is_returned = true
      const res = await transactionsApi.getAll(p)
      setTransactions(res.data.items)
      setTotal(res.data.total)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [params, filterStatus])

  useEffect(() => { fetchTxs() }, [fetchTxs])
  useEffect(() => { setParams(p => ({ ...p, skip: 0 })) }, [filterStatus])

  const FILTER_OPTIONS = [
    { id: 'all', label: 'All', icon: ClipboardList },
    { id: 'active', label: 'Active', icon: Clock },
    { id: 'returned', label: 'Returned', icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="text-sm text-brown-400 mt-0.5">{total} total records</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-cream-100 p-1 rounded-xl w-fit">
        {FILTER_OPTIONS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setFilterStatus(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterStatus === id ? 'bg-white text-brown-800 shadow-sm' : 'text-brown-500 hover:text-brown-700'}`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Timeline / Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream-50 border-b border-cream-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-brown-500 uppercase tracking-wide">#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brown-500 uppercase tracking-wide">Book</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brown-500 uppercase tracking-wide">Borrower</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brown-500 uppercase tracking-wide">Borrowed</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brown-500 uppercase tracking-wide">Due Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brown-500 uppercase tracking-wide">Returned</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-brown-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
            ) : transactions.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState icon={ClipboardList} title="No transactions found" message={filterStatus === 'all' ? "Transactions will appear here once books are borrowed" : `No ${filterStatus} transactions`} />
              </td></tr>
            ) : (
              <AnimatePresence>
                {transactions.map((tx, i) => {
                  const bookColor = tx.book?.cover_color || COVER_COLORS[tx.book_id % COVER_COLORS.length]
                  const avatarColor = AVATAR_COLORS[((tx.borrower?.borrower_name?.charCodeAt(0)) || 0) % AVATAR_COLORS.length]
                  return (
                    <motion.tr key={tx.transaction_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-cream-100 hover:bg-cream-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-brown-400 font-mono">#{tx.transaction_id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-8 rounded flex-shrink-0 flex items-center justify-center" style={{ background: bookColor }}>
                            <BookOpen size={10} className="text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-brown-800 text-xs truncate max-w-[140px]">{tx.book?.title || `Book #${tx.book_id}`}</p>
                            <p className="text-brown-400 text-xs truncate">{tx.book?.author || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: avatarColor }}>
                            {getInitials(tx.borrower?.borrower_name || '')}
                          </div>
                          <span className="text-xs text-brown-700 truncate max-w-[120px]">{tx.borrower?.borrower_name || `Borrower #${tx.borrower_id}`}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-brown-700">{formatDate(tx.borrow_date)}</p>
                        <p className="text-xs text-brown-400">{formatRelative(tx.borrow_date)}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-brown-600">{formatDate(tx.due_date)}</td>
                      <td className="px-4 py-3 text-xs text-brown-600">{tx.return_date ? formatDate(tx.return_date) : <span className="text-brown-300">—</span>}</td>
                      <td className="px-4 py-3">
                        {tx.is_returned ? (
                          <span className="badge-returned gap-1 flex items-center w-fit"><CheckCircle2 size={10} />Returned</span>
                        ) : (
                          <span className="badge-borrowed gap-1 flex items-center w-fit"><Clock size={10} />Active</span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
        <Pagination skip={params.skip} limit={params.limit} total={total} onPageChange={s => setParams(p => ({ ...p, skip: s }))} />
      </div>
    </div>
  )
}
