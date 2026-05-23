import { motion } from 'framer-motion'

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-cream-200 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={28} className="text-brown-300" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-brown-700 mb-2">{title}</h3>
      <p className="text-sm text-brown-400 max-w-xs mb-5">{message}</p>
      {action}
    </motion.div>
  )
}
