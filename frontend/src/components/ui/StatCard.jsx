import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export default function StatCard({ label, value, icon: Icon, color = 'brown', trend, subtitle, delay = 0 }) {
  const colors = {
    brown: 'from-brown-500 to-brown-700',
    emerald: 'from-emerald-500 to-emerald-700',
    amber: 'from-amber-500 to-amber-600',
    blue: 'from-blue-500 to-blue-700',
    purple: 'from-purple-500 to-purple-700',
    navy: 'from-navy-700 to-navy-900',
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }}
      className="card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-brown-400 uppercase tracking-wider mb-0.5">{label}</p>
          {subtitle && <p className="text-xs text-brown-300">{subtitle}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm', colors[color])}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.1 }}
        className="font-display text-3xl font-bold text-brown-800">
        {value ?? '—'}
      </motion.p>
      {trend && <p className="text-xs text-brown-400 mt-1">{trend}</p>}
    </motion.div>
  )
}
