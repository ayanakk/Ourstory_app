import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

let addToast = () => {}

/**
 * ToastProvider — mount once near root.
 * Usage: import { toast } from './Toast'; toast('Hello!')
 */
export function ToastProvider() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    addToast = (message, duration = 3000) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
    return () => { addToast = () => {} }
  }, [])

  return createPortal(
    <div
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="px-5 py-3 rounded-full text-sm font-medium font-sans border border-line backdrop-blur-xl pointer-events-auto"
            style={{ background: 'var(--glass)', color: 'var(--ink)', boxShadow: 'var(--shadow)' }}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}

export function toast(message, duration) {
  addToast(message, duration)
}
