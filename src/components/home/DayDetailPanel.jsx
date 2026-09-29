import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Calendar, Sparkles, MapPin, Lock, CheckCircle2,
  Clock, Plus, ArrowRight, Heart
} from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import { getSignedPhotoUrl } from '../../hooks/useMemories'
import { parseYMD, getTodayYMD } from '../../lib/milestones'

function MemoryThumb({ memory }) {
  const [photoUrl, setPhotoUrl] = useState(null)
  const photoPath = memory.photos?.find(p => p.id === memory.cover_photo_id)?.path || memory.photos?.[0]?.path

  useEffect(() => {
    let active = true
    if (photoPath) {
      getSignedPhotoUrl(photoPath).then((url) => {
        if (active && url) setPhotoUrl(url)
      })
    }
    return () => { active = false }
  }, [photoPath])

  const moodEmojis = {
    romantic: '✨',
    celebratory: '🥂',
    peaceful: '🌿',
    adventurous: '🚀',
    happy: '☀️',
    grateful: '🤍',
  }

  const emoji = memory.mood ? (moodEmojis[memory.mood] || '✨') : '📷'

  return (
    <div className="relative w-14 h-14 rounded-[var(--r-xs)] overflow-hidden bg-surface-2 border border-line flex-shrink-0 flex items-center justify-center">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={memory.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="text-2xl select-none">{emoji}</span>
      )}
    </div>
  )
}

function formatDateHeader(dateStr) {
  const parsed = parseYMD(dateStr)
  if (!parsed) return dateStr
  const d = new Date(parsed.year, parsed.month - 1, parsed.day)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DayDetailPanel({
  date,
  memories = [],
  milestones = [],
  plans = [],
  capsules = [],
  onThisDayMemories = [],
  onClose,
  onAddMemory,
  onAddPlan,
  isMobile = false,
}) {
  const todayStr = getTodayYMD()
  const isPastOrToday = date <= todayStr
  const isFuture = date > todayStr

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-0.5">
            {date === todayStr ? 'Today' : 'Selected Day'}
          </p>
          <h3
            className="text-2xl text-ink font-display"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            {formatDateHeader(date)}
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close details"
            className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Relationship Milestone Banner */}
      {milestones.length > 0 && (
        <div className="space-y-2">
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--r-xs)] border border-accent/25 bg-accent-soft text-ink text-xs font-medium"
            >
              <Sparkles size={14} className="text-accent flex-shrink-0" />
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Memories on this day */}
      {memories.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Memories ({memories.length})
          </p>
          <div className="space-y-2.5">
            {memories.map((mem) => (
              <div
                key={mem.id}
                className="group flex items-center gap-3.5 p-3 rounded-[var(--r-xs)] border border-line bg-surface hover:bg-surface-2 transition-colors"
              >
                <MemoryThumb memory={mem} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-ink truncate">
                      {mem.title}
                    </h4>
                    {mem.is_favorite && (
                      <Heart size={12} className="text-accent fill-accent flex-shrink-0" />
                    )}
                  </div>
                  {mem.place_name && (
                    <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5 truncate">
                      <MapPin size={11} className="flex-shrink-0" />
                      <span>{mem.place_name}</span>
                    </p>
                  )}
                  {mem.caption && (
                    <p className="text-xs text-ink-muted/80 italic mt-1 truncate">
                      "{mem.caption}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planned items / Wishlist */}
      {plans.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Planned Adventures
          </p>
          <div className="space-y-2">
            {plans.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-[var(--r-xs)] border border-line bg-surface"
              >
                <div className="w-5 h-5 rounded-full border border-accent flex items-center justify-center text-accent flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink truncate">{item.title}</p>
                  {item.place_name && (
                    <p className="text-[11px] text-ink-muted">{item.place_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Capsules opening */}
      {capsules.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Time Capsules & Letters
          </p>
          <div className="space-y-2">
            {capsules.map((cap) => (
              <div
                key={cap.id}
                className="flex items-center gap-3 p-3 rounded-[var(--r-xs)] border border-line bg-surface"
              >
                <div className="p-2 rounded-full bg-accent-soft text-accent flex-shrink-0">
                  <Lock size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink truncate">
                    {cap.title || (cap.kind === 'letter' ? 'Sealed Letter' : 'Time Capsule')}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {cap.is_open ? 'Unlocked' : 'Unlocks on this date'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* "On this day in previous years" section */}
      {onThisDayMemories.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-line">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-accent" />
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              On this day in past years
            </p>
          </div>
          <div className="space-y-2.5">
            {onThisDayMemories.map((mem) => {
              const memParsed = parseYMD(mem.date)
              const yearLabel = memParsed ? memParsed.year : ''
              return (
                <div
                  key={mem.id}
                  className="flex items-center gap-3 p-3 rounded-[var(--r-xs)] border border-line bg-surface"
                >
                  <MemoryThumb memory={mem} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold text-accent uppercase">
                      {yearLabel} ({mem.yearsAgo} {mem.yearsAgo === 1 ? 'year' : 'years'} ago)
                    </span>
                    <p className="text-xs font-medium text-ink truncate">{mem.title}</p>
                    {mem.place_name && (
                      <p className="text-[11px] text-ink-muted truncate">{mem.place_name}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty States */}
      {memories.length === 0 && plans.length === 0 && capsules.length === 0 && milestones.length === 0 && (
        <div className="py-6 text-center space-y-4">
          <p
            className="text-base text-ink-muted italic font-display"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isPastOrToday
              ? 'Nothing written for this day yet.'
              : 'A future day waiting for your story.'}
          </p>

          {isPastOrToday ? (
            <Button
              variant="secondary"
              size="sm"
              className="mx-auto"
              onClick={() => onAddMemory?.(date)}
            >
              <Plus size={14} className="mr-1.5" />
              + Add a memory for this day
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="mx-auto"
              onClick={() => onAddPlan?.(date)}
            >
              <Plus size={14} className="mr-1.5" />
              Plan something for this day
            </Button>
          )}
        </div>
      )}

      {/* Quick Action footer if memories already exist */}
      {memories.length > 0 && isPastOrToday && (
        <div className="pt-2 border-t border-line">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-ink-muted hover:text-ink"
            onClick={() => onAddMemory?.(date)}
          >
            <Plus size={13} className="mr-1.5" />
            Add another memory on this date
          </Button>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-[var(--r-lg)] border-t border-line backdrop-blur-2xl p-6 shadow-2xl z-10"
            style={{ background: 'var(--glass)' }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-ink-muted/30 mx-auto mb-5" />
            {content}
          </motion.div>
        </div>
      </AnimatePresence>
    )
  }

  return (
    <Card glass className="p-6">
      {content}
    </Card>
  )
}
