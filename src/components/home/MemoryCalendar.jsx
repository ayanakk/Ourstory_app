import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, Lock, Star } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { formatYMD, getTodayYMD, onThisDay } from '../../lib/milestones'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 36 : -36,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 350, damping: 30 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (direction) => ({
    x: direction > 0 ? -36 : 36,
    opacity: 0,
    transition: {
      x: { type: 'spring', stiffness: 350, damping: 30 },
      opacity: { duration: 0.15 },
    },
  }),
}

export default function MemoryCalendar({
  selectedDate,
  onSelectDate,
  memories = [],
  milestones = [],
  plans = [],
  capsules = [],
}) {
  const todayStr = useMemo(() => getTodayYMD(), [])
  const today = useMemo(() => new Date(), [])

  // Current viewed month & year (0-indexed month)
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split('-').map(Number)
      return { year: y, month: m - 1 }
    }
    return { year: today.getFullYear(), month: today.getMonth() }
  })

  // Direction of transition: +1 for next, -1 for prev
  const [direction, setDirection] = useState(0)

  // Map data by date strings (YYYY-MM-DD)
  const memoriesByDate = useMemo(() => {
    const map = new Map()
    for (const mem of memories) {
      if (!mem.date) continue
      const d = mem.date.split('T')[0]
      if (!map.has(d)) map.set(d, [])
      map.get(d).push(mem)
    }
    return map
  }, [memories])

  const milestonesByDate = useMemo(() => {
    const map = new Map()
    for (const m of milestones) {
      if (!m.date) continue
      const d = m.date.split('T')[0]
      if (!map.has(d)) map.set(d, [])
      map.get(d).push(m)
    }
    return map
  }, [milestones])

  const plansByDate = useMemo(() => {
    const map = new Map()
    for (const p of plans) {
      if (!p.target_date) continue
      const d = p.target_date.split('T')[0]
      if (!map.has(d)) map.set(d, [])
      map.get(d).push(p)
    }
    return map
  }, [plans])

  // Bucket list ring: hollow while any item is unfinished, filled once all are done
  const bucketStatusByDate = useMemo(() => {
    const map = new Map()
    for (const [d, items] of plansByDate.entries()) {
      map.set(d, items.every((it) => it.is_done))
    }
    return map
  }, [plansByDate])

  const capsulesByDate = useMemo(() => {
    const map = new Map()
    for (const c of capsules) {
      if (!c.opens_at) continue
      const d = c.opens_at.split('T')[0]
      if (!map.has(d)) map.set(d, [])
      map.get(d).push(c)
    }
    return map
  }, [capsules])

  // Month navigation handlers
  const handlePrevMonth = useCallback(() => {
    setDirection(-1)
    setViewDate((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 }
      }
      return { year: prev.year, month: prev.month - 1 }
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setDirection(1)
    setViewDate((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 }
      }
      return { year: prev.year, month: prev.month + 1 }
    })
  }, [])

  const handleToday = useCallback(() => {
    const now = new Date()
    const nowYear = now.getFullYear()
    const nowMonth = now.getMonth()
    setDirection(
      viewDate.year < nowYear || (viewDate.year === nowYear && viewDate.month < nowMonth)
        ? 1
        : -1
    )
    setViewDate({ year: nowYear, month: nowMonth })
    onSelectDate?.(todayStr)
  }, [viewDate, onSelectDate, todayStr])

  // Build grid days
  const calendarDays = useMemo(() => {
    const { year, month } = viewDate

    // First day of current month
    const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sunday
    const daysInCurrMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days = []

    // 1. Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      const dateStr = formatYMD(prevYear, prevMonth + 1, dayNum)

      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
      })
    }

    // 2. Days of current month
    for (let d = 1; d <= daysInCurrMonth; d++) {
      const dateStr = formatYMD(year, month + 1, d)
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
      })
    }

    // 3. Trailing days to fill last week
    const totalCurrent = days.length
    const trailingCount = (7 - (totalCurrent % 7)) % 7
    for (let d = 1; d <= trailingCount; d++) {
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      const dateStr = formatYMD(nextYear, nextMonth + 1, d)

      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
      })
    }

    return days
  }, [viewDate])

  const monthLabel = useMemo(() => {
    const d = new Date(viewDate.year, viewDate.month, 1)
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [viewDate])

  // Swipe detection on mobile
  const handleDragEnd = (e, { offset, velocity }) => {
    const swipeThreshold = 45
    if (offset.x < -swipeThreshold || velocity.x < -400) {
      handleNextMonth()
    } else if (offset.x > swipeThreshold || velocity.x > 400) {
      handlePrevMonth()
    }
  }

  return (
    <Card glass className="p-5 lg:p-7 select-none overflow-hidden">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2
            className="text-2xl lg:text-3xl font-display text-ink tracking-tight capitalize"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            {monthLabel}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="text-xs px-2.5 py-1.5 text-ink-muted hover:text-ink font-medium"
          >
            Today
          </Button>

          <div className="flex items-center gap-0.5 border border-line rounded-[var(--r-xs)] p-0.5 bg-surface-2">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-[var(--r-xs)] text-ink-muted hover:text-ink hover:bg-surface transition-colors"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-[var(--r-xs)] text-ink-muted hover:text-ink hover:bg-surface transition-colors"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Weekday Headers ─────────────────────────────────── */}
      <div className="grid grid-cols-7 mb-2 text-center">
        {WEEKDAYS.map((wd, i) => (
          <div
            key={i}
            className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase py-1"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* ── Month Grid with Slide Animation & Mobile Drag ───── */}
      <div className="relative overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={`${viewDate.year}-${viewDate.month}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="grid grid-cols-7 gap-1 lg:gap-1.5 touch-pan-y"
          >
            {calendarDays.map((cell) => {
              const { dayNum, dateStr, isCurrentMonth } = cell
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate

              // Markers
              const hasMemory = memoriesByDate.has(dateStr)
              const hasMilestone = milestonesByDate.has(dateStr)
              const hasPlan = plansByDate.has(dateStr)
              const hasCapsule = capsulesByDate.has(dateStr)

              // "On this day" in previous years
              const onThisDayMatches = onThisDay(memories, dateStr)
              const hasOnThisDay = onThisDayMatches.length > 0

              // Collect markers (max 3)
              const markerItems = []
              if (hasMemory) {
                markerItems.push({
                  key: 'mem',
                  node: <span className="w-1.5 h-1.5 rounded-full bg-accent" />,
                })
              }
              if (hasMilestone) {
                markerItems.push({
                  key: 'mile',
                  node: (
                    <span className="w-1.5 h-1.5 rotate-45 bg-accent" />
                  ),
                })
              }
              if (hasPlan) {
                const allDone = bucketStatusByDate.get(dateStr)
                markerItems.push({
                  key: 'plan',
                  node: allDone ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full border border-accent bg-transparent" />
                  ),
                })
              }
              if (hasCapsule) {
                markerItems.push({
                  key: 'cap',
                  node: <Lock size={9} className="text-accent" />,
                })
              }

              const displayMarkers = markerItems.slice(0, 3)

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => onSelectDate?.(dateStr)}
                  className={[
                    'relative flex flex-col items-center justify-between p-1.5 rounded-[var(--r-sm)]',
                    'min-h-[44px] min-w-[44px] w-full transition-all text-xs font-sans',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
                    isSelected
                      ? 'border border-accent shadow-sm'
                      : 'border border-transparent hover:bg-surface-2',
                    hasOnThisDay && !isSelected ? 'bg-accent-soft/40' : '',
                    isToday ? 'ring-1 ring-inset ring-accent' : '',
                    !isCurrentMonth ? 'opacity-30' : 'text-ink',
                  ].join(' ')}
                  style={{
                    ...(isSelected
                      ? { background: 'var(--surface-2)' }
                      : {}),
                  }}
                >
                  {/* Day number */}
                  <span
                    className={[
                      'font-medium text-xs flex items-center justify-center w-6 h-6 rounded-full',
                      isToday
                        ? 'font-bold text-accent'
                        : isSelected
                        ? 'font-semibold text-ink'
                        : 'text-ink',
                    ].join(' ')}
                  >
                    {dayNum}
                  </span>

                  {/* Markers (max 3) */}
                  <div className="flex items-center justify-center gap-1 h-2 mt-0.5">
                    {displayMarkers.map((m) => (
                      <span key={m.key} className="flex items-center justify-center">
                        {m.node}
                      </span>
                    ))}
                  </div>
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Legend Row ─────────────────────────────────────── */}
      <div className="mt-6 pt-4 border-t border-line flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-ink-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span>Memory</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rotate-45 bg-accent" />
          <span>Milestone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full border border-accent bg-transparent" />
          <span>Bucket list</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock size={10} className="text-accent" />
          <span>Capsule</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-accent-soft border border-accent/25" />
          <span>On this day</span>
        </div>
      </div>
    </Card>
  )
}
