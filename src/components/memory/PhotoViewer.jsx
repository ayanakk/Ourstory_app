import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import SignedImage from '../story/SignedImage'

/**
 * Full-screen photo viewer. Swipe on mobile, arrow keys + click zones on
 * desktop, Esc to close. photos: [{ id, path }]
 * renderOverlay(photo, index): optional caption bar rendered above the counter.
 */
export default function PhotoViewer({ photos = [], initialIndex = 0, onClose, renderOverlay }) {
  const [index, setIndex] = useState(initialIndex)
  const touchStartX = useRef(null)

  useEffect(() => {
    setIndex(initialIndex)
  }, [initialIndex])

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % photos.length)
  }, [photos.length])

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + photos.length) % photos.length)
  }, [photos.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [goNext, goPrev, onClose])

  if (!photos.length) return null
  const current = photos[index]

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 50) goPrev()
    else if (dx < -50) goNext()
    touchStartX.current = null
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          onClick={onClose}
          aria-label="Close viewer"
          className="absolute top-5 right-5 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X size={22} />
        </button>

        {photos.length > 1 && (
          <>
            <button
              onClick={goPrev}
              aria-label="Previous photo"
              className="hidden sm:flex absolute left-5 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors z-10"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              onClick={goNext}
              aria-label="Next photo"
              className="hidden sm:flex absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors z-10"
            >
              <ChevronRight size={26} />
            </button>
          </>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id || current.path}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="relative w-full h-full flex items-center justify-center p-4 sm:p-10"
          >
            <SignedImage
              path={current.path}
              alt=""
              className="max-w-full max-h-full object-contain rounded-[var(--r-xs)]"
            />
          </motion.div>
        </AnimatePresence>

        {renderOverlay && (
          <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md px-4 z-10">
            {renderOverlay(current, index)}
          </div>
        )}

        {photos.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full text-xs font-medium text-white/90 bg-white/10 backdrop-blur-md">
            {index + 1} / {photos.length}
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
