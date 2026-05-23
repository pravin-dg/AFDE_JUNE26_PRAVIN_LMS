import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #FDF8F0, #FAF0DC)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-md">
        {/* Animated book */}
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-xl"
          style={{ background: 'linear-gradient(135deg, #2D1F0F, #4A3520)' }}>
          <BookOpen size={40} className="text-amber-300" strokeWidth={1.5} />
        </motion.div>

        <h1 className="font-display text-8xl font-bold mb-2" style={{ color: '#A67C52', opacity: 0.3 }}>404</h1>
        <h2 className="font-display text-2xl font-bold text-brown-800 mb-3">Page Not Found</h2>
        <p className="text-brown-500 mb-8">The page you're looking for seems to have wandered off the shelf. Let's guide you back to the library.</p>

        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home size={15} />Back to Dashboard
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary flex items-center gap-2">
            <ArrowLeft size={15} />Go Back
          </button>
        </div>

        {/* Decorative books */}
        <div className="flex justify-center gap-3 mt-10 opacity-30">
          {['#2D6A4F','#E76F51','#264653','#D4A017','#8338EC'].map((c, i) => (
            <motion.div key={i} animate={{ y: [0, -5 * ((i % 2) ? 1 : -1), 0] }} transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
              className="rounded" style={{ width: 24, height: 40 + i * 6, background: c }} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
