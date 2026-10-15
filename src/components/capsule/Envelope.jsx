import { motion } from 'framer-motion'

/**
 * Envelope with a flap that opens. open=false is sealed (flap down, wax seal);
 * open=true swings the flap up and shows a letter peeking out.
 */
export default function Envelope({ open = false, className = '' }) {
  return (
    <div className={`relative w-full aspect-[5/3] ${className}`} style={{ perspective: 600 }} aria-hidden="true">
      <motion.div
        className="absolute left-[10%] right-[10%] top-[8%] bottom-[30%] rounded-[var(--r-xs)] bg-surface border border-line"
        animate={{ y: open ? '-28%' : '0%' }}
        transition={{ duration: 0.6, delay: open ? 0.25 : 0 }}
      />
      <div
        className="absolute inset-x-0 bottom-0 top-[18%] rounded-[var(--r-sm)] border border-line bg-accent-soft"
        style={{ boxShadow: 'var(--shadow)' }}
      />
      <motion.div
        className="absolute inset-x-0 top-[18%] h-[42%] border border-line bg-accent-soft"
        style={{
          transformOrigin: 'top',
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
          zIndex: open ? 0 : 2,
        }}
        animate={{ rotateX: open ? 180 : 0 }}
        transition={{ duration: 0.5 }}
      />
      {!open && (
        <div
          className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-accent text-accent-ink flex items-center justify-center text-xs z-[3]"
        >
          ♥
        </div>
      )}
    </div>
  )
}
