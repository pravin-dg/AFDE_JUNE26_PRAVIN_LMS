import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Users, Edit2, Trash2, RefreshCw, Mail, Phone, MapPin, BookOpen, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useBorrowers } from '../hooks/useBorrowers'
import { useDebounce } from '../hooks/useDebounce'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import { TableRowSkeleton } from '../components/ui/LoadingSkeleton'

const EMPTY_FORM = { borrower_name: '', email: '', phone: '', address: '' }
const AVATAR_COLORS = ['#A67C52','#2A9D8F','#E76F51','#264653','#457B9D','#8338EC','#E9C46A','#118AB2']

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function BorrowerForm({ initial, onSubmit, loading, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.borrower_name.trim()) e.borrower_name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => { e.preventDefault(); if (validate()) onSubmit(form) }
  const set = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: '' })) }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Avatar preview */}
      <div className="flex justify-center mb-2">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md"
          style={{ background: AVATAR_COLORS[(form.borrower_name.charCodeAt(0) || 0) % AVATAR_COLORS.length] }}>
          {getInitials(form.borrower_name) || '?'}
        </div>
      </div>
      <div>
        <label className="label">Full Name *</label>
        <input className={`input-field ${errors.borrower_name ? 'border-red-400' : ''}`} value={form.borrower_name}
          onChange={e => set('borrower_name', e.target.value)} placeholder="Full name" />
        {errors.borrower_name && <p className="text-red-500 text-xs mt-1">{errors.borrower_name}</p>}
      </div>
      <div>
        <label className="label">Email *</label>
        <input type="email" className={`input-field ${errors.email ? 'border-red-400' : ''}`} value={form.email}
          onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Phone</label>
          <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1-555-0000" />
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input-field" value={form.address} onChange={e => set('address', e.target.value)} placeholder="City, State" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading ? <><RefreshCw size={14} className="animate-spin" />Saving…</> : (initial?.borrower_id ? 'Update Borrower' : 'Add Borrower')}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  )
}

function BorrowerCard({ borrower, onEdit, onDelete, index }) {
  const color = AVATAR_COLORS[(borrower.borrower_name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      className="card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm"
          style={{ background: color }}>
          {getInitials(borrower.borrower_name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-brown-800 truncate">{borrower.borrower_name}</h3>
          {borrower.active_borrows > 0 && (
            <span className="badge-borrowed text-xs">{borrower.active_borrows} active</span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(borrower)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cream-100 text-brown-400 hover:text-brown-700"><Edit2 size={13} /></button>
          <button onClick={() => onDelete(borrower)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-brown-400 hover:text-red-500"><Trash2 size={13} /></button>
        </div>
      </div>
      <div className="space-y-1.5 text-xs text-brown-500">
        {borrower.email && <div className="flex items-center gap-2"><Mail size={11} className="text-brown-300 flex-shrink-0" /><span className="truncate">{borrower.email}</span></div>}
        {borrower.phone && <div className="flex items-center gap-2"><Phone size={11} className="text-brown-300 flex-shrink-0" /><span>{borrower.phone}</span></div>}
        {borrower.address && <div className="flex items-center gap-2"><MapPin size={11} className="text-brown-300 flex-shrink-0" /><span className="truncate">{borrower.address}</span></div>}
      </div>
    </motion.div>
  )
}

export default function Borrowers() {
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editBorrower, setEditBorrower] = useState(null)
  const [deleteBorrower, setDeleteBorrower] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [viewMode, setViewMode] = useState('table')

  const debouncedSearch = useDebounce(searchInput, 400)
  const { borrowers, total, loading, params, setParams, createBorrower, updateBorrower, deleteBorrower: doDelete } = useBorrowers()

  useEffect(() => {
    setParams(p => ({ ...p, skip: 0, search: debouncedSearch || undefined }))
  }, [debouncedSearch])

  const handleCreate = async (data) => {
    setFormLoading(true)
    try { await createBorrower(data); setModalOpen(false) }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to add borrower') }
    finally { setFormLoading(false) }
  }

  const handleUpdate = async (data) => {
    setFormLoading(true)
    try { await updateBorrower(editBorrower.borrower_id, data); setEditBorrower(null) }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to update borrower') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try { await doDelete(deleteBorrower.borrower_id, deleteBorrower.borrower_name); setDeleteBorrower(null) }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to delete borrower') }
    finally { setDeleteLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Borrowers</h1>
          <p className="text-sm text-brown-400 mt-0.5">{total} registered members</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />Add Borrower
        </button>
      </div>

      {/* Search + View Toggle */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-300" />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search name, email, phone…" className="input-field pl-9" />
        </div>
        {searchInput && (
          <button onClick={() => setSearchInput('')} className="btn-ghost flex items-center gap-1 text-xs">
            <X size={13} />Clear
          </button>
        )}
        <div className="flex gap-1 ml-auto">
          {['table', 'grid'].map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${viewMode === m ? 'bg-brown-100 text-brown-700' : 'text-brown-400 hover:bg-cream-100'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-50 border-b border-cream-200">
                {['Member', 'Email', 'Phone', 'Address', 'Active Borrows', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-brown-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              ) : borrowers.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-brown-400">No borrowers found</td></tr>
              ) : (
                <AnimatePresence>
                  {borrowers.map((b, i) => {
                    const color = AVATAR_COLORS[(b.borrower_name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
                    return (
                      <motion.tr key={b.borrower_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-b border-cream-100 hover:bg-cream-50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: color }}>
                              {getInitials(b.borrower_name)}
                            </div>
                            <span className="font-medium text-brown-800">{b.borrower_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-brown-600">{b.email}</td>
                        <td className="px-4 py-3 text-brown-500">{b.phone || '—'}</td>
                        <td className="px-4 py-3 text-brown-500 max-w-[160px] truncate">{b.address || '—'}</td>
                        <td className="px-4 py-3">
                          {b.active_borrows > 0 ? <span className="badge-borrowed">{b.active_borrows} book{b.active_borrows !== 1 ? 's' : ''}</span>
                            : <span className="text-brown-400 text-xs">None</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditBorrower(b)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cream-100 text-brown-400 hover:text-brown-700"><Edit2 size={13} /></button>
                            <button onClick={() => setDeleteBorrower(b)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-brown-400 hover:text-red-500"><Trash2 size={13} /></button>
                          </div>
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
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse space-y-3">
                <div className="flex gap-3"><div className="w-12 h-12 bg-cream-200 rounded-xl" /><div className="flex-1 space-y-2"><div className="h-4 bg-cream-200 rounded" /><div className="h-3 bg-cream-200 rounded w-2/3" /></div></div>
                <div className="space-y-2"><div className="h-3 bg-cream-200 rounded" /><div className="h-3 bg-cream-200 rounded" /></div>
              </div>
            ))}
          </div>
        ) : borrowers.length === 0 ? (
          <EmptyState icon={Users} title="No borrowers found" message="Add your first library member"
            action={<button onClick={() => setModalOpen(true)} className="btn-primary">Add Borrower</button>} />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {borrowers.map((b, i) => <BorrowerCard key={b.borrower_id} borrower={b} onEdit={setEditBorrower} onDelete={setDeleteBorrower} index={i} />)}
            </div>
            <Pagination skip={params.skip} limit={params.limit} total={total} onPageChange={s => setParams(p => ({ ...p, skip: s }))} />
          </>
        )
      )}

      {/* Modals */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Borrower">
        <BorrowerForm onSubmit={handleCreate} loading={formLoading} onCancel={() => setModalOpen(false)} />
      </Modal>
      <Modal isOpen={!!editBorrower} onClose={() => setEditBorrower(null)} title="Edit Borrower">
        {editBorrower && <BorrowerForm initial={editBorrower} onSubmit={handleUpdate} loading={formLoading} onCancel={() => setEditBorrower(null)} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleteBorrower} onClose={() => setDeleteBorrower(null)} onConfirm={handleDelete}
        title="Delete Borrower" message={`Remove "${deleteBorrower?.borrower_name}" from the system? Active borrows must be returned first.`}
        loading={deleteLoading} />
    </div>
  )
}
