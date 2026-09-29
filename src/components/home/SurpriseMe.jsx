import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import Button from '../ui/Button'
import SignedImage from '../story/SignedImage'
import { parseYMD } from '../../lib/milestones'

function formatLongDate(dateStr) {
  const p = parseYMD(dateStr)
  if (!p) return ''
  const d = new Date(p.year, p.month - 1, p.day)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function coverPath(memory) {
  return memory?.photos?.find((p) => p.id === memory.cover_photo_id)?.path || memory?.photos?.[0]?.path || null
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function SurpriseMe({ memories = [] }) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState('opening')
  const [memory, setMemory] = useState(null)
  const lastIdRef = useRef(null)
  const timerRef = useRef(null)

  const pickRandom = useCallback(() => {
    if (!memories.length) return null
    if (memories.length === 1) return memories[0]
    let candidate
    do {
      candidate = memories[Math.floor(Math.random() * memories.length)]
    } while (candidate.id === lastIdRef.current)
    return candidate
  }, [memories])

  const startReveal = useCallback(() => {
    const picked = pickRandom()
    setMemory(picked)
    lastIdRef.current = picked?.id ?? null
    setPhase('opening')
    clearTimeout(timerRef.current)
    const delay = prefersReducedMotion() ? 200 : 1600
    timerRef.current = setTimeout(() => setPhase('revealed'), delay)
  }, [pickRandom])

  const handleOpen = () => {
    setOpen(true)
    startReveal()
  }

  const handleClose = useCallback(() => {
    setOpen(false)
    clearTimeout(timerRef.current)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, handleClose])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const cover = memory ? coverPath(memory) : null
  const reduced = prefersReducedMotion()

  return (
    <>
      <Button variant="primary" size="md" onClick={handleOpen}>
        Surprise me
      </Button>

      {open &&
        createPortal(
          <AnimatePresence>
            <motion.div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                onClick={handleClose}
                aria-label="Close"
                className="absolute top-5 right-5 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={22} />
              </button>

              {!memories.length ? (
                <p
                  className="text-xl italic text-white/80 text-center max-w-xs"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Your next memory could start here.
                </p>
              ) : phase === 'opening' ? (
                <motion.div key="opening" className="flex flex-col items-center gap-6">
                  <motion.div
                    className="w-20 h-20 rounded-full"
                    style={{ border: '1px solid var(--accent)' }}
                    animate={reduced ? {} : { scale: [1, 1.3, 1], opacity: [0.4, 0.9, 0.4] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.p
                    className="text-white/80 text-sm tracking-wide"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    Opening a memory…
                  </motion.p>
                </motion.div>
              ) : memory ? (
                <motion.div
                  key={memory.id}
                  className="w-full max-w-md flex flex-col items-center text-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="relative w-full aspect-[4/3] rounded-[var(--r-md)] overflow-hidden bg-surface-2"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <SignedImage path={cover} alt={memory.title} className="absolute inset-0 w-full h-full object-cover" />
                  </motion.div>

                  <motion.p
                    className="italic text-lg text-white/70"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                  >
                    Remember this day?
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="space-y-1.5"
                  >
                    <h3 className="text-2xl text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {memory.title}
                    </h3>
                    <p className="text-white/70 text-xs">
                      {formatLongDate(memory.date)}
                      {memory.place_name ? ` · ${memory.place_name}` : ''}
                    </p>
                    {memory.body && (
                      <p className="text-white/70 text-sm max-w-sm mx-auto line-clamp-3">{memory.body}</p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, duration: 0.4 }}
                    className="flex items-center gap-3 pt-2"
                  >
                    <Link to={`/memory/${memory.id}`}>
                      <Button variant="primary" size="sm">
                        Open memory
                      </Button>
                    </Link>
                    <Button variant="secondary" size="sm" onClick={startReveal}>
                      Another one
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                      Close
                    </Button>
                  </motion.div>
                </motion.div>
              ) : null}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
