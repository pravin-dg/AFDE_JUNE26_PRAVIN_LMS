import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftRight, BookOpen, User, CheckCircle2, ArrowRight, AlertCircle, RefreshCw, Search, Clock, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { booksApi, borrowersApi, transactionsApi } from '../services/api'
import { formatDate, formatRelative } from '../utils/format'

const COVER_COLORS = ['#2D6A4F','#E76F51','#264653','#A8DADC','#457B9D','#D4A017','#F4A261','#2A9D8F']
const AVATAR_COLORS = ['#A67C52','#2A9D8F','#E76F51','#264653','#457B9D','#8338EC','#E9C46A','#118AB2']
const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

function BookSelector({ books, value, onChange, loading }) {
  const [search, setSearch] = useState('')
  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-300" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search available books…" className="input-field pl-9" />
      </div>
      <div className="border border-cream-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="p-4 text-center text-sm text-brown-400">Loading books…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-brown-400">No available books found</div>
        ) : (
          filtered.map(book => {
            const color = book.cover_color || COVER_COLORS[book.book_id % COVER_COLORS.length]
            return (
              <button key={book.book_id} type="button" onClick={() => onChange(book)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50 transition-colors text-left border-b border-cream-100 last:border-0 ${value?.book_id === book.book_id ? 'bg-cream-100' : ''}`}>
                <div className="w-8 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: color }}>
                  <BookOpen size={12} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brown-800 truncate">{book.title}</p>
                  <p className="text-xs text-brown-500 truncate">{book.author} · {book.category}</p>
                </div>
                {value?.book_id === book.book_id && <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

function BorrowerSelector({ borrowers, value, onChange, loading }) {
  const [search, setSearch] = useState('')
  const filtered = borrowers.filter(b =>
    b.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
    b.email.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-300" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search borrowers…" className="input-field pl-9" />
      </div>
      <div className="border border-cream-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="p-4 text-center text-sm text-brown-400">Loading borrowers…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-brown-400">No borrowers found</div>
        ) : (
          filtered.map(b => {
            const color = AVATAR_COLORS[(b.borrower_name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
            return (
              <button key={b.borrower_id} type="button" onClick={() => onChange(b)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cream-50 transition-colors text-left border-b border-cream-100 last:border-0 ${value?.borrower_id === b.borrower_id ? 'bg-cream-100' : ''}`}>
                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ background: color }}>
                  {getInitials(b.borrower_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brown-800 truncate">{b.borrower_name}</p>
                  <p className="text-xs text-brown-500 truncate">{b.email}</p>
                </div>
                {value?.borrower_id === b.borrower_id && <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

function ActiveBorrowRow({ tx, onReturn, returning }) {
  const color = tx.book?.cover_color || COVER_COLORS[(tx.book_id || 0) % COVER_COLORS.length]
  const avatarColor = AVATAR_COLORS[((tx.borrower?.borrower_name?.charCodeAt(0)) || 0) % AVATAR_COLORS.length]
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 border border-cream-200 rounded-xl hover:bg-cream-50 transition-colors">
      <div className="w-10 h-12 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: color }}>
        <BookOpen size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-brown-800 text-sm truncate">{tx.book?.title || `Book #${tx.book_id}`}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ background: avatarColor }}>
              {getInitials(tx.borrower?.borrower_name || '')}
            </div>
            <span className="text-xs text-brown-500">{tx.borrower?.borrower_name || `Borrower #${tx.borrower_id}`}</span>
          </div>
          <span className="text-xs text-brown-400 flex items-center gap-1"><Clock size={10} />{formatRelative(tx.borrow_date)}</span>
          {tx.due_date && <span className="text-xs text-amber-600 flex items-center gap-1">Due: {formatDate(tx.due_date)}</span>}
        </div>
      </div>
      <button onClick={() => onReturn(tx)} disabled={returning === tx.transaction_id}
        className="btn-secondary flex items-center gap-2 text-sm flex-shrink-0">
        {returning === tx.transaction_id ? <><RefreshCw size={13} className="animate-spin" />Returning…</> : <><RotateCcw size={13} />Return</>}
      </button>
    </motion.div>
  )
}

export default function BorrowReturn() {
  const [tab, setTab] = useState('borrow')
  const [availableBooks, setAvailableBooks] = useState([])
  const [borrowers, setBorrowers] = useState([])
  const [activeTxs, setActiveTxs] = useState([])
  const [booksLoading, setBooksLoading] = useState(true)
  const [borrowersLoading, setBorrowersLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState(null)
  const [selectedBorrower, setSelectedBorrower] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [returning, setReturning] = useState(null)
  const [success, setSuccess] = useState(null)

  const loadData = async () => {
    setBooksLoading(true)
    setBorrowersLoading(true)
    setTxLoading(true)
    try {
      const [books, borrows, txs] = await Promise.all([
        booksApi.getAll({ availability_status: true, limit: 100 }),
        borrowersApi.getAll({ limit: 100 }),
        transactionsApi.getAll({ is_returned: false, limit: 50 }),
      ])
      setAvailableBooks(books.data.items)
      setBorrowers(borrows.data.items)
      setActiveTxs(txs.data.items)
    } catch (e) { console.error('Load error:', e) }
    finally { setBooksLoading(false); setBorrowersLoading(false); setTxLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleBorrow = async () => {
    if (!selectedBook || !selectedBorrower) {
      toast.error('Please select both a book and borrower')
      return
    }
    setSubmitting(true)
    try {
      const res = await transactionsApi.borrowBook({ book_id: selectedBook.book_id, borrower_id: selectedBorrower.borrower_id })
      setSuccess({ type: 'borrow', message: res.data.message, book: selectedBook, borrower: selectedBorrower })
      setSelectedBook(null)
      setSelectedBorrower(null)
      await loadData()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to borrow book')
    } finally { setSubmitting(false) }
  }

  const handleReturn = async (tx) => {
    setReturning(tx.transaction_id)
    try {
      await transactionsApi.returnBook({ transaction_id: tx.transaction_id })
      toast.success(`"${tx.book?.title}" returned successfully!`)
      setSuccess({ type: 'return', message: `"${tx.book?.title}" has been returned`, book: tx.book })
      await loadData()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to return book')
    } finally { setReturning(null) }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="page-title">Borrow &amp; Return</h1>
        <p className="text-sm text-brown-400 mt-0.5">Issue books to borrowers and process returns</p>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-3 p-4 rounded-xl border ${success.type === 'borrow' ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
            <CheckCircle2 size={20} className={success.type === 'borrow' ? 'text-emerald-500' : 'text-blue-500'} />
            <p className="text-sm font-medium text-brown-800">{success.message}</p>
            <button onClick={() => setSuccess(null)} className="ml-auto text-brown-400 hover:text-brown-600 text-lg leading-none">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream-100 p-1 rounded-xl w-fit">
        {[
          { id: 'borrow', label: 'Issue Book', icon: ArrowRight },
          { id: 'return', label: 'Return Book', icon: RotateCcw },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-white text-brown-800 shadow-sm' : 'text-brown-500 hover:text-brown-700'}`}>
            <Icon size={14} />{label}
            {id === 'return' && activeTxs.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-white text-xs flex items-center justify-center font-bold">{activeTxs.length}</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'borrow' ? (
          <motion.div key="borrow" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Book Selection */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <BookOpen size={15} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-brown-800 text-sm">Select Book</h2>
                  <p className="text-xs text-brown-400">{availableBooks.length} available</p>
                </div>
              </div>
              <BookSelector books={availableBooks} value={selectedBook} onChange={setSelectedBook} loading={booksLoading} />
              {selectedBook && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-amber-600" />
                  <p className="text-xs font-medium text-amber-800 truncate">Selected: {selectedBook.title}</p>
                </motion.div>
              )}
            </div>

            {/* Borrower Selection */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User size={15} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-brown-800 text-sm">Select Borrower</h2>
                  <p className="text-xs text-brown-400">{borrowers.length} members</p>
                </div>
              </div>
              <BorrowerSelector borrowers={borrowers} value={selectedBorrower} onChange={setSelectedBorrower} loading={borrowersLoading} />
              {selectedBorrower && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-600" />
                  <p className="text-xs font-medium text-blue-800 truncate">Selected: {selectedBorrower.borrower_name}</p>
                </motion.div>
              )}
            </div>

            {/* Confirm Borrow */}
            <div className="md:col-span-2">
              <div className={`card p-5 transition-all ${selectedBook && selectedBorrower ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
                <h3 className="font-display font-bold text-brown-800 mb-3">Confirm Borrowing</h3>
                {selectedBook && selectedBorrower ? (
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-cream-200">
                      <div className="w-6 h-8 rounded flex-shrink-0" style={{ background: selectedBook.cover_color || '#A67C52' }} />
                      <span className="text-sm font-medium text-brown-800 max-w-[140px] truncate">{selectedBook.title}</span>
                    </div>
                    <ArrowRight size={16} className="text-brown-400" />
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-cream-200">
                      <div className="w-6 h-6 rounded-md bg-brown-500 flex items-center justify-center text-white text-xs font-bold">{getInitials(selectedBorrower.borrower_name)}</div>
                      <span className="text-sm font-medium text-brown-800 max-w-[140px] truncate">{selectedBorrower.borrower_name}</span>
                    </div>
                    <button onClick={handleBorrow} disabled={submitting} className="btn-primary ml-auto flex items-center gap-2">
                      {submitting ? <><RefreshCw size={14} className="animate-spin" />Processing…</> : <><CheckCircle2 size={14} />Confirm Borrow</>}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-brown-400">
                    <AlertCircle size={16} />
                    <p className="text-sm">Please select both a book and a borrower above to continue.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="return" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">Active Borrowings</h2>
                <p className="text-xs text-brown-400">{activeTxs.length} books currently on loan</p>
              </div>
              <button onClick={loadData} className="btn-ghost flex items-center gap-1 text-xs">
                <RefreshCw size={13} />Refresh
              </button>
            </div>
            {txLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 border border-cream-100 rounded-xl">
                  <div className="w-10 h-12 bg-cream-200 rounded-lg" /><div className="flex-1 space-y-2"><div className="h-4 bg-cream-200 rounded w-1/2" /><div className="h-3 bg-cream-200 rounded w-1/3" /></div>
                  <div className="w-20 h-8 bg-cream-200 rounded-lg" />
                </div>
              ))}</div>
            ) : activeTxs.length === 0 ? (
              <div className="text-center py-12 text-brown-400">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400" />
                <p className="font-medium">All books are returned!</p>
                <p className="text-sm text-brown-300 mt-1">No active borrowings at the moment.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeTxs.map(tx => <ActiveBorrowRow key={tx.transaction_id} tx={tx} onReturn={handleReturn} returning={returning} />)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
