import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import SignedImage from '../story/SignedImage'
import { parseYMD } from '../../lib/milestones'

function formatShortDate(dateStr) {
  const p = parseYMD(dateStr)
  if (!p) return ''
  const d = new Date(p.year, p.month - 1, p.day)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const tileVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function PhotoTile({ photo, index, onOpen, onToggleFavorite }) {
  const [loaded, setLoaded] = useState(false)
  const memory = photo.memories

  return (
    <motion.div
      variants={tileVariants}
      custom={(index % 8) * 0.05}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className="mb-3 break-inside-avoid"
    >
      <div
        className="relative w-full rounded-[16px] overflow-hidden bg-surface-2 cursor-pointer group"
        onClick={() => onOpen(photo)}
      >
        <SignedImage
          path={photo.path}
          alt={memory?.title || ''}
          className="w-full h-auto block"
          placeholderClassName="w-full h-40 sm:h-48"
          onLoad={() => setLoaded(true)}
        />

        {memory && loaded && (
          <div className="hidden sm:flex absolute inset-0 flex-col justify-end p-3 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <p className="text-white text-xs font-medium truncate">{memory.title}</p>
            <p className="text-white/75 text-[11px]">{formatShortDate(memory.date)}</p>
          </div>
        )}

        {loaded && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite(photo.id)
            }}
            whileTap={{ scale: 1.4 }}
            aria-label={photo.is_favorite ? 'Remove favorite' : 'Mark as favorite'}
            className={`absolute top-2 right-2 p-1.5 rounded-full transition-opacity ${
              photo.is_favorite ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
            style={{ background: 'rgba(0,0,0,0.35)' }}
          >
            <Heart size={14} className={photo.is_favorite ? 'fill-white text-white' : 'text-white'} />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
