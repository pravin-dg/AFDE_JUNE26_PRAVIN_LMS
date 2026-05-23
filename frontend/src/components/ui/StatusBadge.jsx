import { CheckCircle2, Clock, RotateCcw } from 'lucide-react'

export default function StatusBadge({ status }) {
  if (status === true || status === 'available') return (
    <span className="badge-available gap-1"><CheckCircle2 size={10} />Available</span>
  )
  if (status === false || status === 'borrowed') return (
    <span className="badge-borrowed gap-1"><Clock size={10} />Borrowed</span>
  )
  if (status === 'returned') return (
    <span className="badge-returned gap-1"><RotateCcw size={10} />Returned</span>
  )
  return <span className="badge-available">{String(status)}</span>
}
