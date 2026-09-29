import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import SignedImage from '../story/SignedImage'
import { parseYMD } from '../../lib/milestones'
import { MOODS } from './CreateMemoryWizard'

const LAYOUTS = ['hero', 'split', 'collage', 'quote']
const MOOD_MAP = Object.fromEntries(MOODS.map((m) => [m.id, m]))

export function layoutForMemory(memory, index) {
  if (memory.layout && LAYOUTS.includes(memory.layout)) return memory.layout
  return LAYOUTS[index % LAYOUTS.length]
}

function formatLongDate(dateStr) {
  const p = parseYMD(dateStr)
  if (!p) return ''
  const d = new Date(p.year, p.month - 1, p.day)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function coverPath(memory) {
  return memory.photos?.find((p) => p.id === memory.cover_photo_id)?.path || memory.photos?.[0]?.path || null
}

function Meta({ memory, dark = false }) {
  const mood = memory.mood ? MOOD_MAP[memory.mood] : null
  const tone = dark ? 'text-white/85' : 'text-ink-muted'
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium ${tone}`}>
      <span>{formatLongDate(memory.date)}</span>
      {memory.place_name && (
        <span className="inline-flex items-center gap-1">
          <MapPin size={11} />
          {memory.place_name}
        </span>
      )}
      {mood && (
        <span className="inline-flex items-center gap-1">
          <span>{mood.emoji}</span>
          {mood.label}
        </span>
      )}
    </div>
  )
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export default function MemoryCard({ memory, index = 0, layout }) {
  const resolvedLayout = layout || layoutForMemory(memory, index)
  const cover = coverPath(memory)
  const extraPhotos = (memory.photos || []).filter((p) => p.path !== cover).slice(0, 3)

  let inner
  if (resolvedLayout === 'hero') {
    inner = (
      <div className="relative w-full aspect-[16/9] rounded-[var(--r-md)] overflow-hidden bg-surface-2">
        <SignedImage path={cover} alt={memory.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 space-y-2">
          <Meta memory={memory} dark />
          <h3 className="font-display text-2xl sm:text-3xl text-white" style={{ fontWeight: 600 }}>
            {memory.title}
          </h3>
          {memory.body && (
            <p className="text-white/80 text-sm line-clamp-2 max-w-xl">{memory.body}</p>
          )}
        </div>
      </div>
    )
  } else if (resolvedLayout === 'split') {
    const reversed = index % 2 === 1
    inner = (
      <div className={`flex flex-col md:flex-row ${reversed ? 'md:flex-row-reverse' : ''} gap-6 items-stretch`}>
        <div className="md:w-1/2 relative aspect-[4/3] rounded-[var(--r-md)] overflow-hidden bg-surface-2 flex-shrink-0">
          <SignedImage path={cover} alt={memory.title} className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="md:w-1/2 flex flex-col justify-center space-y-3 py-2">
          <Meta memory={memory} />
          <h3 className="font-display text-2xl text-ink" style={{ fontWeight: 600 }}>
            {memory.title}
          </h3>
          {memory.body && (
            <p className="text-ink-muted text-sm leading-relaxed line-clamp-2">{memory.body}</p>
          )}
        </div>
      </div>
    )
  } else if (resolvedLayout === 'collage') {
    inner = (
      <div className="space-y-4">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-72 sm:h-80">
          <div className="col-span-4 sm:col-span-2 row-span-2 relative rounded-[var(--r-md)] overflow-hidden bg-surface-2">
            <SignedImage path={cover} alt={memory.title} className="absolute inset-0 w-full h-full object-cover" />
          </div>
          {extraPhotos.map((p) => (
            <div
              key={p.id}
              className="hidden sm:block col-span-1 row-span-1 relative rounded-[var(--r-xs)] overflow-hidden bg-surface-2"
            >
              <SignedImage path={p.path} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Meta memory={memory} />
          <h3 className="font-display text-2xl text-ink" style={{ fontWeight: 600 }}>
            {memory.title}
          </h3>
          {memory.body && (
            <p className="text-ink-muted text-sm leading-relaxed line-clamp-2">{memory.body}</p>
          )}
        </div>
      </div>
    )
  } else {
    inner = (
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-2 border border-line flex-shrink-0">
          <SignedImage path={cover} alt={memory.title} className="w-full h-full object-cover" />
        </div>
        <div className="space-y-2 min-w-0">
          <Meta memory={memory} />
          <h3
            className="font-display text-xl sm:text-2xl italic text-ink leading-snug"
            style={{ fontStyle: 'italic', fontWeight: 500 }}
          >
            {memory.title}
          </h3>
          {memory.body && (
            <p className="text-ink-muted text-sm leading-relaxed line-clamp-2">{memory.body}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      <Link to={`/memory/${memory.id}`} className="block group">
        <div className="rounded-[var(--r-md)] border border-line bg-surface p-4 sm:p-5 transition-shadow hover:shadow-[var(--shadow)]">
          {inner}
        </div>
      </Link>
    </motion.div>
  )
}
