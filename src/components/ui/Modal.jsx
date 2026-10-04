import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Modal
 * open: boolean
 * onClose: () => void (guard this yourself if a close should be blocked, e.g. mid-upload)
 * title: optional header content, pinned at top
 * children: scrollable body content
 * footer: optional pinned footer content (e.g. action buttons)
 * bodyClassName: extra classes for the scrollable body container
 */
export default function Modal({ open, onClose, title, children, footer, bodyClassName = '', maxWidthClass = 'max-w-md' }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            className={`relative w-full ${maxWidthClass} rounded-[var(--r-md)] border border-line z-10 flex flex-col overflow-hidden`}
            style={{ background: 'var(--surface)', boxShadow: 'var(--shadow)', maxHeight: 'calc(100dvh - 24px)' }}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="relative flex-none px-8 pt-8 pb-4">
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
                style={{ transitionDuration: 'var(--dur-fast)' }}
              >
                <X size={18} />
              </button>

              {title && (
                <h2
                  className="font-display text-2xl font-medium text-ink pr-8"
                  style={{ fontWeight: 600 }}
                >
                  {title}
                </h2>
              )}
            </div>

            {/* Body */}
            <div
              className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-8 pb-4 ${bodyClassName}`}
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className="flex-none px-8 pt-4 border-t border-line"
                style={{ position: 'static', background: 'var(--surface)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
