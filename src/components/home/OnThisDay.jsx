import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X, Camera, PenLine } from 'lucide-react'
import SignedImage from '../story/SignedImage'
import Button from '../ui/Button'
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

function ThenVsNow({ thenMemory, todayStr, todayMemory, onAddPhoto, onWriteToday, onClose }) {
  const [sliderPos, setSliderPos] = useState(50)
  const thenCover = coverPath(thenMemory)
  const nowCover = coverPath(todayMemory)
  const canCompare = !!thenCover && !!nowCover

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
        <motion.div
          className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-[var(--r-md)] overflow-hidden border border-line flex flex-col"
          style={{ background: 'var(--bg)' }}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 p-2 rounded-full text-white bg-black/30 hover:bg-black/50 transition-colors backdrop-blur-md"
          >
            <X size={18} />
          </button>

          {/* Mobile draggable reveal slider */}
          {canCompare && (
            <div className="sm:hidden relative w-full aspect-[4/5] select-none touch-none">
              <SignedImage path={thenCover} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <SignedImage path={nowCover} alt="" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div
                className="absolute inset-y-0 w-0.5 bg-white/90"
                style={{ left: `${sliderPos}%` }}
                aria-hidden="true"
              />
              <input
                type="range"
                min={0}
                max={100}
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                aria-label="Compare then and now"
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              />
              <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-widest text-white bg-black/40 px-2 py-1 rounded-full">
                Then
              </span>
              <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-widest text-white bg-black/40 px-2 py-1 rounded-full">
                Now
              </span>
            </div>
          )}

          <div className={`flex-1 overflow-y-auto grid grid-cols-1 ${canCompare ? 'hidden sm:grid' : ''} sm:grid-cols-2`}>
            {/* Then */}
            <div className="flex flex-col">
              <div className="relative w-full aspect-[4/3] sm:aspect-auto sm:h-72 bg-surface-2">
                <SignedImage path={thenCover} alt={thenMemory.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute top-4 left-4 text-[10px] font-semibold uppercase tracking-widest text-white/85">
                  Then
                </p>
              </div>
              <div className="p-5 space-y-1.5">
                <p className="text-xs text-ink-muted">{formatLongDate(thenMemory.date)}</p>
                <h3 className="text-xl text-ink" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  {thenMemory.title}
                </h3>
                {thenMemory.place_name && (
                  <p className="text-xs text-ink-muted flex items-center gap-1">
                    <MapPin size={11} /> {thenMemory.place_name}
                  </p>
                )}
              </div>
            </div>

            {/* Now */}
            <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-line">
              {todayMemory ? (
                <>
                  <div className="relative w-full aspect-[4/3] sm:aspect-auto sm:h-72 bg-surface-2">
                    <SignedImage path={nowCover} alt={todayMemory.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="absolute top-4 left-4 text-[10px] font-semibold uppercase tracking-widest text-white/85">
                      Now
                    </p>
                  </div>
                  <div className="p-5 space-y-1.5">
                    <p className="text-xs text-ink-muted">{formatLongDate(todayMemory.date)}</p>
                    <h3 className="text-xl text-ink" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {todayMemory.title}
                    </h3>
                    {todayMemory.place_name && (
                      <p className="text-xs text-ink-muted flex items-center gap-1">
                        <MapPin size={11} /> {todayMemory.place_name}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-8">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted">Now</p>
                  <p
                    className="text-xl italic text-ink-muted leading-relaxed max-w-[220px]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Where are you today?
                  </p>
                  <div className="flex flex-col gap-2 w-full max-w-[220px]">
                    <Button variant="secondary" size="sm" onClick={onAddPhoto}>
                      <Camera size={14} className="mr-1.5" />+ Add a photo from today
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onWriteToday}>
                      <PenLine size={14} className="mr-1.5" />
                      Write about today
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

export default function OnThisDay({ memories, todayStr, onAddMemory }) {
  const matches = useMemo(() => {
    if (!memories?.length || !todayStr) return []
    const target = parseYMD(todayStr)
    if (!target) return []
    return memories
      .filter((m) => {
        if (!m.date) return false
        const d = parseYMD(m.date)
        return d && d.year < target.year && d.month === target.month && d.day === target.day
      })
      .map((m) => ({ ...m, yearsAgo: target.year - parseYMD(m.date).year }))
      .sort((a, b) => b.yearsAgo - a.yearsAgo)
  }, [memories, todayStr])

  const [selected, setSelected] = useState(0)
  const [compareOpen, setCompareOpen] = useState(false)

  if (matches.length === 0) return null

  const active = matches[Math.min(selected, matches.length - 1)]
  const todayMemory = memories.find((m) => m.date === todayStr) || null
  const cover = coverPath(active)

  return (
    <div className="space-y-3">
      {matches.length > 1 && (
        <div className="flex items-center gap-2">
          {matches.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setSelected(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                i === selected
                  ? 'bg-accent-soft text-accent border-accent/30'
                  : 'bg-surface text-ink-muted border-line hover:bg-surface-2'
              }`}
            >
              {m.yearsAgo} {m.yearsAgo === 1 ? 'year' : 'years'} ago
            </button>
          ))}
        </div>
      )}

      <div
        className="relative w-full aspect-[16/9] sm:aspect-[3/1] rounded-[24px] overflow-hidden bg-surface-2"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <SignedImage path={cover} alt={active.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 space-y-2">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/80">
            {active.yearsAgo === 1 ? 'One year ago today' : `${active.yearsAgo} years ago today`}
          </p>
          <h3 className="text-2xl sm:text-3xl text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
            {active.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80">
            {active.place_name && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} /> {active.place_name}
              </span>
            )}
          </div>
          {active.body && <p className="text-white/80 text-sm line-clamp-2 max-w-xl">{active.body}</p>}
          <div className="pt-1">
            <Button variant="secondary" size="sm" onClick={() => setCompareOpen(true)}>
              Then vs Now
            </Button>
          </div>
        </div>
      </div>

      {compareOpen && (
        <ThenVsNow
          thenMemory={active}
          todayStr={todayStr}
          todayMemory={todayMemory}
          onAddPhoto={() => {
            setCompareOpen(false)
            onAddMemory?.(todayStr)
          }}
          onWriteToday={() => {
            setCompareOpen(false)
            onAddMemory?.(todayStr)
          }}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </div>
  )
}
