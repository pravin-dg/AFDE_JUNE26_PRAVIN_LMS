import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Play, RefreshCw, FileText, CheckCircle2, XCircle,
  AlertCircle, Clock, Database, BookOpen, Users, ArrowLeftRight,
  ChevronDown, Activity, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

const BASE_URL = 'http://localhost:8000/api/v1'

const DATASET_TYPES = [
  { label: 'Books', value: 'books' },
  { label: 'Borrowers', value: 'borrowers' },
  { label: 'Transactions', value: 'transactions' },
]

const DATASET_COLUMNS = {
  books: {
    icon: BookOpen,
    color: 'brown',
    columns: ['title', 'author', 'category', 'isbn', 'publisher', 'published_year', 'description'],
  },
  borrowers: {
    icon: Users,
    color: 'navy',
    columns: ['borrower_name', 'email', 'phone', 'address'],
  },
  transactions: {
    icon: ArrowLeftRight,
    color: 'emerald',
    columns: ['book_id', 'borrower_id', 'borrow_date', 'due_date', 'return_date', 'is_returned'],
  },
}

function StatusBadge({ status }) {
  const styles = {
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    running: 'bg-amber-100 text-amber-800',
    pending: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || styles.pending}`}>
      {status === 'running' && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
      )}
      {status}
    </span>
  )
}

function ResultCard({ result, label }) {
  if (!result) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-xl border border-cream-200 bg-cream-50 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={16} className="text-green-600" />
        <span className="text-sm font-semibold text-brown-700">{label} Complete</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-xl font-bold text-green-700">{result.records_loaded ?? 0}</div>
          <div className="text-xs text-gray-500 mt-0.5">Loaded</div>
        </div>
        <div className="text-center border-x border-cream-200">
          <div className="text-xl font-bold text-amber-600">{result.records_skipped ?? 0}</div>
          <div className="text-xs text-gray-500 mt-0.5">Skipped</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">{result.records_failed ?? 0}</div>
          <div className="text-xs text-gray-500 mt-0.5">Failed</div>
        </div>
      </div>
      {result.duration_seconds != null && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <Clock size={12} />
          <span>Completed in {result.duration_seconds.toFixed(2)}s</span>
        </div>
      )}
      {result.message && (
        <p className="mt-2 text-xs text-gray-600 italic">{result.message}</p>
      )}
    </motion.div>
  )
}

function ProgressBar({ active }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!active) { setProgress(0); return }
    setProgress(10)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 85) { clearInterval(interval); return p }
        return p + Math.random() * 8
      })
    }, 400)
    return () => clearInterval(interval)
  }, [active])

  if (!active && progress === 0) return null

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Processing…</span>
        <span>{Math.min(Math.round(progress), 99)}%</span>
      </div>
      <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brown-500 to-brown-400 rounded-full"
          animate={{ width: `${Math.min(progress, 99)}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  )
}

function UploadCard({ onJobComplete }) {
  const [datasetType, setDatasetType] = useState('books')
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const fileInputRef = useRef()

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && (dropped.name.endsWith('.csv') || dropped.type === 'text/csv')) {
      setFile(dropped)
      setResult(null)
    } else {
      toast.error('Please drop a CSV file')
    }
  }, [])

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) { setFile(selected); setResult(null) }
  }

  const handleUpload = async () => {
    if (!file || !datasetType) return
    setUploading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      // Do NOT set Content-Type manually — axios auto-adds the multipart boundary
      const res = await axios.post(
        `${BASE_URL}/etl/upload?dataset_type=${datasetType}`,
        formData
      )
      setResult(res.data)
      toast.success(`Upload complete — ${res.data.records_loaded ?? 0} records loaded`)
      if (onJobComplete) onJobComplete()

    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Upload failed'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-brown-100 flex items-center justify-center">
          <Upload size={18} className="text-brown-600" />
        </div>
        <div>
          <h2 className="font-semibold text-brown-800 text-base">Upload Dataset CSV</h2>
          <p className="text-xs text-gray-500">Import data from a CSV file into the system</p>
        </div>
      </div>

      {/* Dataset type select */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Dataset Type</label>
        <div className="relative">
          <select
            value={datasetType}
            onChange={e => { setDatasetType(e.target.value); setResult(null) }}
            className="w-full appearance-none bg-cream-50 border border-cream-200 rounded-xl px-4 py-2.5 pr-9 text-sm text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-300 cursor-pointer"
            disabled={uploading}
          >
            {DATASET_TYPES.map(dt => (
              <option key={dt.value} value={dt.value}>{dt.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
          py-8 px-4 cursor-pointer transition-all duration-200
          ${dragging ? 'border-brown-400 bg-brown-50' : 'border-cream-300 bg-cream-50 hover:border-brown-300 hover:bg-cream-100'}
          ${uploading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {file ? (
          <>
            <div className="w-10 h-10 rounded-xl bg-brown-100 flex items-center justify-center">
              <FileText size={20} className="text-brown-600" />
            </div>
            <p className="text-sm font-medium text-brown-700">{file.name}</p>
            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB — click to change</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-cream-200 flex items-center justify-center">
              <FileText size={20} className="text-brown-400" />
            </div>
            <p className="text-sm font-medium text-brown-600">Drop CSV file here or click to browse</p>
            <p className="text-xs text-gray-400">Only .csv files are accepted</p>
          </>
        )}
      </div>

      <ProgressBar active={uploading} />

      {file && !uploading && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleUpload}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-brown-600 hover:bg-brown-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
        >
          <Upload size={15} />
          Upload & Process
        </motion.button>
      )}

      <ResultCard result={result} label="Upload" />
    </motion.div>
  )
}

function SyncCard({ onJobComplete }) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)

  const handleSync = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await axios.post(`${BASE_URL}/etl/run`)
      setResult(res.data)
      toast.success('DB sync pipeline completed successfully')
      if (onJobComplete) onJobComplete()
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Sync failed'
      toast.error(msg)
    } finally {
      setRunning(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-navy-800/10 flex items-center justify-center">
          <Database size={18} className="text-navy-700" />
        </div>
        <div>
          <h2 className="font-semibold text-brown-800 text-base">Sync from Database</h2>
          <p className="text-xs text-gray-500">Re-run analytics pipeline on existing data</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-5 leading-relaxed">
        Re-run the analytics pipeline on existing data — no file upload needed. This syncs all tables and refreshes aggregated statistics.
      </p>

      <button
        onClick={handleSync}
        disabled={running}
        className={`
          w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold transition-all
          ${running
            ? 'bg-navy-800/10 text-navy-700 cursor-not-allowed'
            : 'bg-navy-800 hover:bg-navy-900 text-white shadow-sm hover:shadow'}
        `}
      >
        {running ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            Running Pipeline…
          </>
        ) : (
          <>
            <Play size={16} />
            Run DB Sync Pipeline
          </>
        )}
      </button>

      {running && (
        <div className="mt-3">
          <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-navy-700 to-navy-600 rounded-full"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      )}

      <ResultCard result={result} label="Sync" />
    </motion.div>
  )
}

function ActivityLog({ refreshTrigger }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await axios.get(`${BASE_URL}/etl/logs`)
      const data = Array.isArray(res.data) ? res.data : (res.data?.items ?? [])
      setLogs(data.slice(0, 20))
    } catch (err) {
      if (!silent) toast.error('Failed to fetch activity logs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load
  useEffect(() => { fetchLogs() }, [fetchLogs])

  // Refresh when a job completes
  useEffect(() => {
    if (refreshTrigger > 0) fetchLogs(true)
  }, [refreshTrigger, fetchLogs])

  // Auto-refresh if any job is running
  useEffect(() => {
    const hasRunning = logs.some(l => l.status === 'running' || l.status === 'pending')
    if (!hasRunning) return
    const id = setInterval(() => fetchLogs(true), 5000)
    return () => clearInterval(id)
  }, [logs, fetchLogs])

  const formatDuration = (s) => {
    if (s == null) return '—'
    return s < 60 ? `${s.toFixed(1)}s` : `${(s / 60).toFixed(1)}m`
  }

  const formatTime = (ts) => {
    if (!ts) return '—'
    try {
      const d = new Date(ts)
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return ts }
  }

  const typeIcon = (type) => {
    if (!type) return null
    const t = type.toLowerCase()
    if (t.includes('book')) return <BookOpen size={12} className="text-brown-500" />
    if (t.includes('borrow')) return <Users size={12} className="text-navy-700" />
    if (t.includes('trans')) return <ArrowLeftRight size={12} className="text-emerald-600" />
    return <Database size={12} className="text-gray-400" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 h-full"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cream-100 flex items-center justify-center">
            <Activity size={18} className="text-brown-600" />
          </div>
          <div>
            <h2 className="font-semibold text-brown-800 text-base">Pipeline Activity</h2>
            <p className="text-xs text-gray-500">Last {logs.length} jobs</p>
          </div>
        </div>
        <button
          onClick={() => fetchLogs(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 text-xs text-brown-600 hover:text-brown-800 px-3 py-1.5 rounded-lg border border-cream-200 hover:border-brown-300 hover:bg-cream-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-cream-100 rounded-lg animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-cream-100 flex items-center justify-center mb-3">
            <Activity size={22} className="text-brown-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No pipeline activity yet</p>
          <p className="text-xs text-gray-400 mt-1">Run an upload or sync to see logs here</p>
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-cream-100">
                <th className="text-left text-gray-400 font-medium pb-2 pr-2">Type</th>
                <th className="text-left text-gray-400 font-medium pb-2 pr-2">Status</th>
                <th className="text-left text-gray-400 font-medium pb-2 pr-2">Records</th>
                <th className="text-left text-gray-400 font-medium pb-2 pr-2">Duration</th>
                <th className="text-left text-gray-400 font-medium pb-2">Time</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {logs.map((log, i) => (
                  <motion.tr
                    key={log.job_id || i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-cream-50 hover:bg-cream-50 transition-colors"
                  >
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        {typeIcon(log.job_type)}
                        <span className="text-gray-600 capitalize truncate max-w-[60px]" title={log.job_type}>
                          {log.job_type || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-2">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="py-2.5 pr-2 text-gray-600">
                      <span className="text-green-700 font-medium">{log.records_loaded ?? 0}</span>
                      <span className="text-gray-400">/{(log.records_extracted ?? (log.records_loaded ?? 0) + (log.records_skipped ?? 0) + (log.records_failed ?? 0))}</span>
                    </td>
                    <td className="py-2.5 pr-2 text-gray-500">
                      {formatDuration(log.duration_seconds)}
                    </td>
                    <td className="py-2.5 text-gray-400 whitespace-nowrap">
                      {formatTime(log.created_at)}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}

function InfoCard({ type, delay }) {
  const info = DATASET_COLUMNS[type]
  const Icon = info.icon

  const colorMap = {
    brown: { bg: 'bg-brown-100', text: 'text-brown-700', tag: 'bg-brown-50 text-brown-600 border-brown-200', icon: 'text-brown-600' },
    navy: { bg: 'bg-navy-800/10', text: 'text-navy-800', tag: 'bg-navy-800/5 text-navy-700 border-navy-800/20', icon: 'text-navy-700' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800', tag: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'text-emerald-600' },
  }
  const c = colorMap[info.color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-cream-200 shadow-sm p-5"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={16} className={c.icon} />
        </div>
        <h3 className={`font-semibold text-sm ${c.text} capitalize`}>{type}</h3>
      </div>
      <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Expected Columns</p>
      <div className="flex flex-wrap gap-1.5">
        {info.columns.map(col => (
          <span key={col} className={`text-xs px-2 py-0.5 rounded-md border ${c.tag} font-mono`}>
            {col}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export default function ETLManager() {
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleJobComplete = useCallback(() => {
    setRefreshTrigger(t => t + 1)
  }, [])

  return (
    <div className="min-h-screen bg-cream-50 p-6 lg:p-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-brown-800 tracking-tight">
              ETL Manager
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Extract, Transform &amp; Load data pipelines</p>
          </div>
          {/* Status indicator */}
          <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-xl border border-cream-200 shadow-sm self-start sm:self-auto">
            <span className={`relative flex h-2.5 w-2.5`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pipelineRunning ? 'bg-amber-400' : 'bg-green-400'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pipelineRunning ? 'bg-amber-500' : 'bg-green-500'}`} />
            </span>
            <span className={`text-sm font-medium ${pipelineRunning ? 'text-amber-700' : 'text-green-700'}`}>
              {pipelineRunning ? 'Pipeline Running' : 'System Ready'}
            </span>
            <Zap size={14} className={pipelineRunning ? 'text-amber-500' : 'text-green-500'} />
          </div>
        </div>
      </motion.div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* LEFT — 60% (3/5 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <UploadCard onJobComplete={handleJobComplete} />
          <SyncCard onJobComplete={handleJobComplete} />
        </div>

        {/* RIGHT — 40% (2/5 cols) */}
        <div className="lg:col-span-2">
          <ActivityLog refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Bottom info cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoCard type="books" delay={0.3} />
        <InfoCard type="borrowers" delay={0.35} />
        <InfoCard type="transactions" delay={0.4} />
      </div>
    </div>
  )
}
