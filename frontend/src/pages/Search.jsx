import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon, BookOpen, Users, X, Loader2 } from 'lucide-react'
import { searchApi } from '../services/api'
import { useDebounce } from '../hooks/useDebounce'
import StatusBadge from '../components/ui/StatusBadge'

const COVER_COLORS = ['#2D6A4F','#E76F51','#264653','#A8DADC','#457B9D','#D4A017','#F4A261','#2A9D8F']
const AVATAR_COLORS = ['#A67C52','#2A9D8F','#E76F51','#264653','#457B9D','#8338EC']
const getInitials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults(null); return }
    const doSearch = async () => {
      setLoading(true)
      try {
        const res = await searchApi.search(debouncedQuery)
        setResults(res.data)
        setSearchParams({ q: debouncedQuery }, { replace: true })
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    doSearch()
  }, [debouncedQuery])

  const totalResults = results ? (results.books.total + results.borrowers.total) : 0

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="page-title">Search</h1>
        <p className="text-sm text-brown-400 mt-0.5">Search across books and borrowers</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-300" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search books, authors, categories, borrowers…"
          className="w-full pl-12 pr-10 py-3.5 border-2 border-cream-200 focus:border-brown-400 rounded-2xl bg-white text-brown-800 placeholder-brown-300 text-base focus:outline-none transition-colors shadow-sm"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin text-brown-400" />}
          {query && !loading && <button onClick={() => setQuery('')} className="text-brown-300 hover:text-brown-500"><X size={16} /></button>}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {!query.trim() ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-16 h-16 bg-cream-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <SearchIcon size={28} className="text-brown-300" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-lg font-semibold text-brown-600 mb-2">Start searching</h3>
            <p className="text-sm text-brown-400">Type to search books by title, author, category, or borrowers by name</p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['Fiction', 'Tolkien', 'Science', 'Alice', 'Python', 'Philosophy'].map(s => (
                <button key={s} onClick={() => setQuery(s)}
                  className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-brown-600 text-sm rounded-full border border-cream-200 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        ) : loading && !results ? (
          <motion.div key="loading" className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse flex items-center gap-3">
                <div className="w-10 h-12 bg-cream-200 rounded-lg" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-cream-200 rounded w-1/2" /><div className="h-3 bg-cream-200 rounded w-1/3" /></div>
              </div>
            ))}
          </motion.div>
        ) : results ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <p className="text-sm text-brown-500">
              Found <span className="font-semibold text-brown-700">{totalResults}</span> result{totalResults !== 1 ? 's' : ''} for "<span className="text-brown-700">{results.query}</span>"
            </p>

            {/* Books */}
            {results.books.items.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={15} className="text-brown-500" />
                  <h2 className="font-display font-bold text-brown-700 text-sm uppercase tracking-wide">Books ({results.books.total})</h2>
                </div>
                <div className="space-y-2">
                  {results.books.items.map((book, i) => {
                    const color = book.cover_color || COVER_COLORS[book.book_id % COVER_COLORS.length]
                    return (
                      <motion.div key={book.book_id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="card p-4 flex items-center gap-4 hover:shadow-md transition-all">
                        <div className="w-10 h-14 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
                          <BookOpen size={14} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-brown-800 truncate">{book.title}</p>
                          <p className="text-xs text-brown-500 mt-0.5">{book.author} · {book.category}</p>
                          {book.description && <p className="text-xs text-brown-400 mt-1 line-clamp-1">{book.description}</p>}
                        </div>
                        <div className="flex-shrink-0"><StatusBadge status={book.availability_status ? 'available' : 'borrowed'} /></div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Borrowers */}
            {results.borrowers.items.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={15} className="text-brown-500" />
                  <h2 className="font-display font-bold text-brown-700 text-sm uppercase tracking-wide">Borrowers ({results.borrowers.total})</h2>
                </div>
                <div className="space-y-2">
                  {results.borrowers.items.map((b, i) => {
                    const color = AVATAR_COLORS[(b.borrower_name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
                    return (
                      <motion.div key={b.borrower_id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="card p-4 flex items-center gap-4 hover:shadow-md transition-all">
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ background: color }}>
                          {getInitials(b.borrower_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-brown-800">{b.borrower_name}</p>
                          <p className="text-xs text-brown-500 mt-0.5">{b.email}{b.phone ? ` · ${b.phone}` : ''}</p>
                        </div>
                        {b.active_borrows > 0 && (
                          <span className="badge-borrowed flex-shrink-0">{b.active_borrows} active</span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {totalResults === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-cream-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <SearchIcon size={24} className="text-brown-300" strokeWidth={1.5} />
                </div>
                <p className="font-display font-semibold text-brown-600">No results for "{query}"</p>
                <p className="text-sm text-brown-400 mt-1">Try different keywords or check spelling</p>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
