import { useState, useEffect, useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import Confetti from './Confetti'
import { getMilestones, milestoneCopy, daysBetween, getTodayYMD } from '../../lib/milestones'

export default function MilestoneCard({ startDate, spaceId, todayStr }) {
  const today = todayStr || getTodayYMD()

  const { nextMilestone, latestReached } = useMemo(
    () => getMilestones(startDate, today),
    [startDate, today]
  )

  const isRecent = !!(latestReached && daysBetween(latestReached.date, today) <= 7)
  const [celebrate, setCelebrate] = useState(false)

  useEffect(() => {
    if (!isRecent || !latestReached || !spaceId) return
    const storageKey = `milestone_seen_${spaceId}`
    let seen = []
    try {
      seen = JSON.parse(localStorage.getItem(storageKey) || '[]')
    } catch {
      seen = []
    }
    if (!seen.includes(latestReached.key)) {
      setCelebrate(true)
      seen.push(latestReached.key)
      try {
        localStorage.setItem(storageKey, JSON.stringify(seen))
      } catch {
        // ignore storage failures (private mode, quota, etc.)
      }
      const t = setTimeout(() => setCelebrate(false), 1600)
      return () => clearTimeout(t)
    }
  }, [isRecent, latestReached, spaceId])

  if (!startDate) return null

  if (isRecent && latestReached) {
    return (
      <div
        className="relative rounded-[var(--r-md)] border border-accent/25 p-6 overflow-hidden"
        style={{ background: 'var(--accent-soft)', boxShadow: 'var(--shadow)' }}
      >
        <Confetti active={celebrate} />
        <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-accent bg-surface px-2 py-0.5 rounded-full mb-2">
          New
        </span>
        <p className="text-4xl sm:text-5xl text-ink" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
          {latestReached.label}
        </p>
        <p className="text-ink-muted text-sm mt-2">{milestoneCopy(latestReached.label)}</p>
      </div>
    )
  }

  if (!nextMilestone) return null

  const totalSpan = daysBetween(startDate, nextMilestone.date) || 1
  const elapsed = daysBetween(startDate, today)
  const progress = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100))

  return (
    <div className="rounded-[var(--r-md)] border border-line bg-surface p-6" style={{ boxShadow: 'var(--shadow)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-2 flex items-center gap-1.5">
        <Sparkles size={12} className="text-accent" />
        Next milestone
      </p>
      <p className="text-2xl text-ink" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        {nextMilestone.label} in {nextMilestone.daysAway} {nextMilestone.daysAway === 1 ? 'day' : 'days'}
      </p>
      <p className="text-ink-muted text-sm mt-1 mb-4">{milestoneCopy(nextMilestone.label)}</p>
      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${progress}%`, transitionDuration: 'var(--dur-slow)' }}
        />
      </div>
    </div>
  )
}
