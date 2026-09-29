import { Sparkles, Calendar, Lock, ArrowRight, Plus } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import { parseYMD, getTodayYMD } from '../../lib/milestones'

function formatDaysRemaining(targetDateStr) {
  const todayStr = getTodayYMD()
  const today = parseYMD(todayStr)
  const target = parseYMD(targetDateStr)
  if (!today || !target) return ''

  const todayUtc = Date.UTC(today.year, today.month - 1, today.day)
  const targetUtc = Date.UTC(target.year, target.month - 1, target.day)
  const diffDays = Math.round((targetUtc - todayUtc) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 0) return `${Math.abs(diffDays)}d ago`
  return `in ${diffDays} days`
}

function formatDateShort(dateStr) {
  const p = parseYMD(dateStr)
  if (!p) return dateStr
  const d = new Date(p.year, p.month - 1, p.day)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function UpcomingList({
  upcomingMilestone,
  upcomingPlan,
  upcomingCapsule,
  onSelectDate,
  onAddMemory,
  onAddPlan,
}) {
  const hasUpcoming = Boolean(upcomingMilestone || upcomingPlan || upcomingCapsule)

  return (
    <Card glass className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-0.5">
            Ahead
          </p>
          <h3
            className="text-2xl text-ink font-display"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Upcoming
          </h3>
        </div>
      </div>

      {!hasUpcoming ? (
        <div className="py-8 text-center space-y-4">
          <p
            className="text-lg text-ink-muted italic font-display max-w-xs mx-auto leading-relaxed"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            "Your next memory could start here."
          </p>
          <p className="text-xs text-ink-muted max-w-xs mx-auto">
            Mark an anniversary, plan an adventure, or seal a capsule for the future.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAddMemory?.()}
            >
              <Plus size={13} className="mr-1.5" />
              Add a memory
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Next Relationship Milestone */}
          {upcomingMilestone && (
            <div
              onClick={() => onSelectDate?.(upcomingMilestone.date)}
              className="group cursor-pointer p-4 rounded-[var(--r-sm)] border border-accent/30 bg-accent-soft/50 hover:bg-accent-soft transition-all"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 font-semibold text-accent uppercase tracking-wider text-[10px]">
                  <Sparkles size={13} />
                  Milestone
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface text-ink-muted border border-line shadow-xs">
                  {formatDaysRemaining(upcomingMilestone.date)}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                {upcomingMilestone.label}
              </h4>
              <p className="text-xs text-ink-muted mt-1">
                {formatDateShort(upcomingMilestone.date)}
              </p>
            </div>
          )}

          {/* Next Planned Wishlist Item */}
          {upcomingPlan && (
            <div
              onClick={() => onSelectDate?.(upcomingPlan.target_date)}
              className="group cursor-pointer p-4 rounded-[var(--r-sm)] border border-line bg-surface hover:bg-surface-2 transition-all"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 font-semibold text-ink-muted uppercase tracking-wider text-[10px]">
                  <Calendar size={13} className="text-accent" />
                  Planned Adventure
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-2 text-ink-muted border border-line">
                  {formatDaysRemaining(upcomingPlan.target_date)}
                </span>
              </div>
              <h4 className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                {upcomingPlan.title}
              </h4>
              <p className="text-xs text-ink-muted mt-1">
                {formatDateShort(upcomingPlan.target_date)}
                {upcomingPlan.place_name && ` · ${upcomingPlan.place_name}`}
              </p>
            </div>
          )}

          {/* Next Capsule Opening */}
          {upcomingCapsule && (
            <div
              onClick={() => onSelectDate?.(upcomingCapsule.opens_at?.split('T')[0])}
              className="group cursor-pointer p-4 rounded-[var(--r-sm)] border border-line bg-surface hover:bg-surface-2 transition-all"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 font-semibold text-ink-muted uppercase tracking-wider text-[10px]">
                  <Lock size={13} className="text-accent" />
                  {upcomingCapsule.kind === 'letter' ? 'Future Letter' : 'Time Capsule'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-2 text-ink-muted border border-line">
                  {formatDaysRemaining(upcomingCapsule.opens_at?.split('T')[0])}
                </span>
              </div>
              <h4 className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                {upcomingCapsule.title || 'Sealed for the future'}
              </h4>
              <p className="text-xs text-ink-muted mt-1">
                Unlocks on {formatDateShort(upcomingCapsule.opens_at?.split('T')[0])}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
