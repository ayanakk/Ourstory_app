import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Calendar, Sparkles, MapPin, Lock, CheckCircle2,
  Clock, Plus, ArrowRight, Heart, Check, Trash2
} from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import SignedImage from '../story/SignedImage'
import PhotoViewer from '../memory/PhotoViewer'
import AddBucketItemModal, { categoryIcon, CATEGORIES } from './AddBucketItemModal'
import AddYearlyDateModal from './AddYearlyDateModal'
import CreateMemoryWizard from '../memory/CreateMemoryWizard'
import { getSignedPhotoUrl } from '../../hooks/useMemories'
import { useSpace } from '../../hooks/useSpace'
import { parseYMD, getTodayYMD } from '../../lib/milestones'
import { uploaderLabel } from '../../lib/people'

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

function categoryLabel(category) {
  return CATEGORIES.find((c) => c.id === category)?.label || 'Bucket list'
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
  specialDays = [],
  onAddYearlyDate,
  onDeleteYearlyDate,
  onThisDayMemories = [],
  bucketItems = [],
  onAddBucketItem,
  onToggleBucketDone,
  onConvertBucketItem,
  onMemoryCreated,
  onClose,
  onAddMemory,
  onAddPlan,
  isMobile = false,
}) {
  const todayStr = getTodayYMD()
  const isPastOrToday = date <= todayStr
  const isFuture = date > todayStr

  const { member, partner } = useSpace()
  const [personFilter, setPersonFilter] = useState('both')
  const [viewerIndex, setViewerIndex] = useState(null)
  const [addBucketOpen, setAddBucketOpen] = useState(false)
  const [addYearlyOpen, setAddYearlyOpen] = useState(false)
  const [convertWizard, setConvertWizard] = useState(null) // { itemId, title, place }

  const handleToggleBucketDone = (item) => {
    const next = !item.is_done
    onToggleBucketDone?.(item.id, next)
  }

  const handleTurnIntoMemory = (item) => {
    setConvertWizard({ itemId: item.id, title: item.title, place: item.place_name })
  }

  const dayPhotos = useMemo(() => {
    const list = []
    for (const mem of memories) {
      for (const p of mem.photos || []) {
        list.push({ ...p, memoryTitle: mem.title, uploaderName: uploaderLabel(p.uploaded_by, member, partner) })
      }
    }
    return list
  }, [memories, member, partner])

  const filteredDayPhotos = useMemo(() => {
    if (personFilter === 'me') return dayPhotos.filter((p) => p.uploaded_by === member?.user_id)
    if (personFilter === 'partner') return dayPhotos.filter((p) => p.uploaded_by === partner?.user_id)
    return dayPhotos
  }, [dayPhotos, personFilter, member, partner])

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

      {/* Special days (built-in couple days + yearly dates) */}
      {specialDays.length > 0 && (
        <div className="space-y-2">
          {specialDays.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-[var(--r-xs)] border border-line bg-surface text-ink text-xs"
            >
              <span className="text-base leading-none select-none" aria-hidden="true">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{s.title}</p>
                {s.description && <p className="text-[11px] text-ink-muted mt-0.5">{s.description}</p>}
              </div>
              {!s.builtIn && onDeleteYearlyDate && (
                <button
                  onClick={() => onDeleteYearlyDate(s.id)}
                  aria-label={`Remove ${s.title}`}
                  className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              )}
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
              <Link
                key={mem.id}
                to={`/memory/${mem.id}`}
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
                <ArrowRight size={14} className="text-ink-muted flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bucket list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Bucket list{bucketItems.length > 0 ? ` (${bucketItems.length})` : ''}
          </p>
          <button
            onClick={() => setAddBucketOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:opacity-80 transition-opacity"
          >
            <Plus size={12} />Add to bucket list
          </button>
        </div>

        {bucketItems.length === 0 ? (
          isFuture ? (
            <p className="text-xs text-ink-muted italic">Some adventures haven't happened yet.</p>
          ) : null
        ) : (
          <div className="space-y-2">
            {bucketItems.map((item) => {
              const Icon = categoryIcon(item.category)
              return (
                <div key={item.id}>
                  <div
                    className={`group relative flex items-center gap-3 p-3.5 rounded-[var(--r-sm)] border transition-all hover:-translate-y-px hover:shadow-[var(--shadow)] hover:border-accent/40 ${
                      item.is_done ? 'border-line bg-surface-2' : 'border-line bg-surface'
                    }`}
                    style={{ transitionDuration: 'var(--dur-fast)' }}
                  >
                    {/* Checkbox sits above the card-wide link; gone once the item is a memory */}
                    {!item.converted_memory_id && (
                      <button
                        onClick={() => handleToggleBucketDone(item)}
                        aria-label={item.is_done ? 'Mark as not done' : 'Mark as done'}
                        className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          item.is_done ? 'bg-accent border-accent text-accent-ink' : 'border-line text-transparent hover:border-accent'
                        }`}
                      >
                        <motion.span
                          initial={false}
                          animate={{ scale: item.is_done ? 1 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-center"
                        >
                          <Check size={13} strokeWidth={3} />
                        </motion.span>
                      </button>
                    )}
                    <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* after: stretches the link over the whole card */}
                      <Link
                        to={`/wishlist/${item.id}`}
                        className={`block text-sm font-medium truncate after:absolute after:inset-0 after:content-[''] after:rounded-[var(--r-sm)] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent ${
                          item.is_done ? 'text-ink-muted line-through' : 'text-ink'
                        }`}
                      >
                        {item.title}
                      </Link>
                      <p className="text-[11px] text-ink-muted truncate mt-0.5 flex items-center gap-1">
                        {categoryLabel(item.category)}
                        {item.place_name && (
                          <>
                            <span aria-hidden="true">·</span>
                            <MapPin size={10} className="flex-shrink-0" />
                            <span className="truncate">{item.place_name}</span>
                          </>
                        )}
                      </p>
                      {item.is_done && !item.converted_memory_id && (
                        <button
                          onClick={() => handleTurnIntoMemory(item)}
                          className="relative z-10 mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:opacity-80 transition-opacity"
                        >
                          <Sparkles size={11} /> Turn into Memory
                        </button>
                      )}
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-ink-muted flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Day photos */}
      {dayPhotos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
              Day photos ({dayPhotos.length})
            </p>
            {partner && (
              <div className="flex items-center gap-1 rounded-full border border-line p-0.5">
                {[
                  { id: 'both', label: 'Both' },
                  { id: 'me', label: 'Me' },
                  { id: 'partner', label: partner.display_name || 'Partner' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPersonFilter(opt.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                      personFilter === opt.id ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredDayPhotos.length === 0 ? (
            <p className="text-xs text-ink-muted italic">
              {personFilter === 'partner'
                ? `${partner?.display_name || 'Your partner'} hasn't added photos for this day yet.`
                : 'No photos for this filter.'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredDayPhotos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setViewerIndex(i)}
                  className="relative w-16 h-16 rounded-[var(--r-xs)] overflow-hidden bg-surface-2 border border-line flex-shrink-0"
                >
                  <SignedImage path={p.path} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  {p.uploaderName && (
                    <span className="absolute bottom-0.5 left-0.5 right-0.5 text-[8px] leading-tight text-white bg-black/50 rounded px-1 py-0.5 truncate">
                      {p.uploaderName === 'you' ? 'You' : p.uploaderName}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
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
                <Link
                  key={mem.id}
                  to={`/memory/${mem.id}`}
                  className="flex items-center gap-3 p-3 rounded-[var(--r-xs)] border border-line bg-surface hover:bg-surface-2 transition-colors"
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
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty States */}
      {memories.length === 0 && plans.length === 0 && capsules.length === 0 && milestones.length === 0 && specialDays.length === 0 && (
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

      {onAddYearlyDate && (
        <button
          onClick={() => setAddYearlyOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:opacity-80 transition-opacity"
        >
          <Plus size={12} />Add a yearly date (birthday, anniversary...)
        </button>
      )}

      {/* Quick Action footer when the day has other content (memories, plans, capsules, milestones) */}
      {(memories.length > 0 || plans.length > 0 || capsules.length > 0 || milestones.length > 0 || specialDays.length > 0) && isPastOrToday && (
        <div className="pt-2 border-t border-line">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-ink-muted hover:text-ink"
            onClick={() => onAddMemory?.(date)}
          >
            <Plus size={13} className="mr-1.5" />
            {memories.length > 0 ? 'Add another memory on this date' : 'Add a memory for this day'}
          </Button>
        </div>
      )}
    </div>
  )

  const viewer = viewerIndex !== null && (
    <PhotoViewer photos={filteredDayPhotos} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
  )

  const overlays = (
    <>
      <AddBucketItemModal
        open={addBucketOpen}
        date={date}
        onClose={() => setAddBucketOpen(false)}
        onAdd={(item) => onAddBucketItem?.(item)}
      />
      <AddYearlyDateModal
        open={addYearlyOpen}
        date={date}
        onClose={() => setAddYearlyOpen(false)}
        onAdd={(item) => onAddYearlyDate?.(item)}
      />
      <CreateMemoryWizard
        open={!!convertWizard}
        initialDate={date}
        initialTitle={convertWizard?.title}
        initialPlace={convertWizard?.place}
        onClose={() => setConvertWizard(null)}
        onSuccess={async (createdMemory) => {
          if (convertWizard) {
            await onConvertBucketItem?.(convertWizard.itemId, createdMemory?.id)
          }
          setConvertWizard(null)
          onMemoryCreated?.()
        }}
      />
    </>
  )

  if (isMobile) {
    return (
      <>
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
        {viewer}
        {overlays}
      </>
    )
  }

  return (
    <>
      <Card glass className="p-6">
        {content}
      </Card>
      {viewer}
      {overlays}
    </>
  )
}
