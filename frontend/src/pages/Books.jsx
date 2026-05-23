import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Filter, BookOpen, Edit2, Trash2, Grid, List,
  ChevronDown, X, RefreshCw, BookMarked
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useBooks } from '../hooks/useBooks'
import { useDebounce } from '../hooks/useDebounce'
import { booksApi } from '../services/api'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import StatusBadge from '../components/ui/StatusBadge'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import { BookCardSkeleton, TableRowSkeleton } from '../components/ui/LoadingSkeleton'
import { formatDate } from '../utils/format'

const COVER_COLORS = ['#2D6A4F','#E76F51','#264653','#A8DADC','#457B9D','#D4A017','#F4A261','#2A9D8F','#E9C46A','#6D6875','#B5838D','#8338EC']
const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Romance', 'Biography', 'History', 'Technology', 'Self-Help', 'Business', 'Psychology', 'Philosophy', 'Classic', 'Horror', 'Thriller']

const EMPTY_FORM = { title: '', author: '', category: '', isbn: '', description: '', publisher: '', published_year: '', cover_color: '' }

function BookForm({ initial, onSubmit, loading, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.author.trim()) e.author = 'Author is required'
    if (!form.category.trim()) e.category = 'Category is required'
    if (!form.isbn.trim()) e.isbn = 'ISBN is required'
    else if (form.isbn.replace(/[-\s]/g, '').length < 10) e.isbn = 'ISBN must be at least 10 digits'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const data = { ...form, published_year: form.published_year ? parseInt(form.published_year) : null }
    onSubmit(data)
  }

  const set = (field, val) => { setForm(f => ({ ...f, [field]: val })); setErrors(e => ({ ...e, [field]: '' })) }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Book Title *</label>
          <input className={`input-field ${errors.title ? 'border-red-400' : ''}`} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. The Great Gatsby" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="label">Author *</label>
          <input className={`input-field ${errors.author ? 'border-red-400' : ''}`} value={form.author} onChange={e => set('author', e.target.value)} placeholder="Author name" />
          {errors.author && <p className="text-red-500 text-xs mt-1">{errors.author}</p>}
        </div>
        <div>
          <label className="label">ISBN *</label>
          <input className={`input-field ${errors.isbn ? 'border-red-400' : ''}`} value={form.isbn} onChange={e => set('isbn', e.target.value)} placeholder="978-0-xxx-xxxxx-x" />
          {errors.isbn && <p className="text-red-500 text-xs mt-1">{errors.isbn}</p>}
        </div>
        <div>
          <label className="label">Category *</label>
          <select className={`input-field ${errors.category ? 'border-red-400' : ''}`} value={form.category} onChange={e => set('category', e.target.value)}>
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>
        <div>
          <label className="label">Publisher</label>
          <input className="input-field" value={form.publisher} onChange={e => set('publisher', e.target.value)} placeholder="Publisher name" />
        </div>
        <div>
          <label className="label">Published Year</label>
          <input type="number" className="input-field" value={form.published_year} onChange={e => set('published_year', e.target.value)} placeholder="e.g. 2020" min="1000" max="2100" />
        </div>
        <div>
          <label className="label">Cover Color</label>
          <div className="flex gap-2 flex-wrap">
            {COVER_COLORS.map(c => (
              <button key={c} type="button" onClick={() => set('cover_color', c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${form.cover_color === c ? 'border-brown-700 scale-110' : 'border-transparent'}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input-field resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of the book…" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading ? <><RefreshCw size={14} className="animate-spin" />Saving…</> : <>{initial?.book_id ? 'Update Book' : 'Add Book'}</>}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  )
}

function BookCard({ book, onEdit, onDelete, index }) {
  const color = book.cover_color || COVER_COLORS[book.book_id % COVER_COLORS.length]
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.04 }}
      className="card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      {/* Book cover */}
      <div className="relative h-36 overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}ee, ${color}77)` }}>
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/20" />
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <StatusBadge status={book.availability_status ? 'available' : 'borrowed'} />
            <BookOpen size={14} className="text-white/70" />
          </div>
          <div>
            <p className="text-white font-bold text-sm line-clamp-2 drop-shadow leading-snug">{book.title}</p>
            <p className="text-white/70 text-xs mt-1 truncate">{book.author}</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-brown-800 text-sm leading-snug line-clamp-1">{book.title}</h3>
            <p className="text-brown-500 text-xs mt-0.5 truncate">{book.author}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs bg-cream-100 text-brown-600 px-2 py-0.5 rounded-full font-medium border border-cream-200">{book.category}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(book)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cream-100 text-brown-400 hover:text-brown-700 transition-colors">
              <Edit2 size={13} />
            </button>
            <button onClick={() => onDelete(book)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-brown-400 hover:text-red-500 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <p className="text-xs text-brown-400 mt-2 font-mono truncate">ISBN: {book.isbn}</p>
      </div>
    </motion.div>
  )
}

export default function Books() {
  const [viewMode, setViewMode] = useState('grid')
  const [searchInput, setSearchInput] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [availFilter, setAvailFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editBook, setEditBook] = useState(null)
  const [deleteBook, setDeleteBook] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const debouncedSearch = useDebounce(searchInput, 400)
  const { books, total, loading, params, setParams, createBook, updateBook, deleteBook: doDelete } = useBooks()

  useEffect(() => {
    booksApi.getCategories().then(r => setCategories(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const newParams = { skip: 0, limit: params.limit }
    if (debouncedSearch) newParams.search = debouncedSearch
    if (categoryFilter) newParams.category = categoryFilter
    if (availFilter !== '') newParams.availability_status = availFilter === 'true'
    setParams(newParams)
  }, [debouncedSearch, categoryFilter, availFilter])

  const handleCreate = async (data) => {
    setFormLoading(true)
    try { await createBook(data); setModalOpen(false) }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to add book') }
    finally { setFormLoading(false) }
  }

  const handleUpdate = async (data) => {
    setFormLoading(true)
    try { await updateBook(editBook.book_id, data); setEditBook(null) }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to update book') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try { await doDelete(deleteBook.book_id, deleteBook.title); setDeleteBook(null) }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to delete book') }
    finally { setDeleteLoading(false) }
  }

  const clearFilters = () => { setSearchInput(''); setCategoryFilter(''); setAvailFilter('') }
  const hasFilters = searchInput || categoryFilter || availFilter !== ''

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Books Management</h1>
          <p className="text-sm text-brown-400 mt-0.5">{total} books in catalog</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />Add Book
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-300" />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search title, author, ISBN…" className="input-field pl-9" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-field w-auto min-w-[140px]">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={availFilter} onChange={e => setAvailFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="true">Available</option>
          <option value="false">Borrowed</option>
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost flex items-center gap-1 text-xs">
            <X size={13} />Clear
          </button>
        )}
        <div className="flex gap-1 ml-auto">
          <button onClick={() => setViewMode('grid')} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-brown-100 text-brown-700' : 'text-brown-400 hover:bg-cream-100'}`}>
            <Grid size={15} />
          </button>
          <button onClick={() => setViewMode('list')} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${viewMode === 'list' ? 'bg-brown-100 text-brown-700' : 'text-brown-400 hover:bg-cream-100'}`}>
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1'}`}>
          {Array.from({ length: 10 }).map((_, i) => <BookCardSkeleton key={i} />)}
        </div>
      ) : books.length === 0 ? (
        <EmptyState icon={BookOpen} title="No books found" message={hasFilters ? "Try adjusting your search filters" : "Get started by adding your first book"}
          action={<button onClick={() => setModalOpen(true)} className="btn-primary">Add First Book</button>} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {books.map((book, i) => (
            <BookCard key={book.book_id} book={book} onEdit={setEditBook} onDelete={setDeleteBook} index={i} />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-50 border-b border-cream-200">
                {['Title', 'Author', 'Category', 'ISBN', 'Year', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-brown-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {books.map((book, i) => (
                  <motion.tr key={book.book_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-cream-100 hover:bg-cream-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-8 rounded flex-shrink-0" style={{ background: book.cover_color || '#A67C52' }} />
                        <span className="font-medium text-brown-800 line-clamp-1">{book.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brown-600">{book.author}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-cream-100 text-brown-600 px-2 py-0.5 rounded-full">{book.category}</span></td>
                    <td className="px-4 py-3 text-brown-500 font-mono text-xs">{book.isbn}</td>
                    <td className="px-4 py-3 text-brown-500">{book.published_year ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={book.availability_status ? 'available' : 'borrowed'} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditBook(book)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cream-100 text-brown-400 hover:text-brown-700"><Edit2 size={13} /></button>
                        <button onClick={() => setDeleteBook(book)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-brown-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          <Pagination skip={params.skip} limit={params.limit} total={total} onPageChange={s => setParams(p => ({ ...p, skip: s }))} />
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New Book" size="lg">
        <BookForm onSubmit={handleCreate} loading={formLoading} onCancel={() => setModalOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editBook} onClose={() => setEditBook(null)} title="Edit Book" size="lg">
        {editBook && <BookForm initial={editBook} onSubmit={handleUpdate} loading={formLoading} onCancel={() => setEditBook(null)} />}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog isOpen={!!deleteBook} onClose={() => setDeleteBook(null)} onConfirm={handleDelete}
        title="Delete Book" message={`Are you sure you want to delete "${deleteBook?.title}"? This action cannot be undone.`}
        loading={deleteLoading} />
    </div>
  )
}
