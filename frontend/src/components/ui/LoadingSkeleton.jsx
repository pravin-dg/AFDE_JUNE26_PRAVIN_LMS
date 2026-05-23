export function BookCardSkeleton() {
  return (
    <div className="card p-4 space-y-3 animate-pulse">
      <div className="h-32 bg-cream-200 rounded-xl" />
      <div className="h-4 bg-cream-200 rounded w-3/4" />
      <div className="h-3 bg-cream-200 rounded w-1/2" />
      <div className="h-3 bg-cream-200 rounded w-1/3" />
      <div className="flex justify-between items-center pt-1">
        <div className="h-5 w-16 bg-cream-200 rounded-full" />
        <div className="h-7 w-7 bg-cream-200 rounded-full" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="animate-pulse border-b border-cream-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-cream-200 rounded w-full" /></td>
      ))}
    </tr>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-4 bg-cream-200 rounded w-1/2" />
        <div className="w-9 h-9 bg-cream-200 rounded-xl" />
      </div>
      <div className="h-8 bg-cream-200 rounded w-1/3" />
      <div className="h-3 bg-cream-200 rounded w-2/3" />
    </div>
  )
}
