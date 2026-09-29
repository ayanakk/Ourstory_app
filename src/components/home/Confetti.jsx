import { useMemo } from 'react'
import { motion } from 'framer-motion'

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Small accent-dot confetti burst, capped at 40 particles and ~1.5s.
 * Renders nothing when inactive; collapses to a fade when motion is reduced.
 */
export default function Confetti({ active, count = 36 }) {
  const particles = useMemo(() => {
    if (!active) return []
    return Array.from({ length: Math.min(count, 40) }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 220,
      y: -(60 + Math.random() * 140),
      rotate: Math.random() * 180 - 90,
      delay: Math.random() * 0.15,
      size: 4 + Math.random() * 5,
    }))
  }, [active, count])

  if (!active || particles.length === 0) return null
  const reduced = prefersReducedMotion()

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{ width: p.size, height: p.size, background: 'var(--accent)' }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
          animate={
            reduced
              ? { opacity: [0, 1, 0] }
              : { opacity: [0, 1, 0], x: p.x, y: p.y, rotate: p.rotate, scale: 1 }
          }
          transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}
