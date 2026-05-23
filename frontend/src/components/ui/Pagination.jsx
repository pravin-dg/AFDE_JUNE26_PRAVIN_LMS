import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ skip, limit, total, onPageChange }) {
  const currentPage = Math.floor(skip / limit) + 1
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-cream-200">
      <p className="text-sm text-brown-500">
        Showing <span className="font-medium text-brown-700">{skip + 1}–{Math.min(skip + limit, total)}</span> of <span className="font-medium text-brown-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(skip - limit)} disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cream-200 disabled:opacity-40 text-brown-500 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-brown-600 px-2 font-medium">{currentPage} / {totalPages}</span>
        <button onClick={() => onPageChange(skip + limit)} disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cream-200 disabled:opacity-40 text-brown-500 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
