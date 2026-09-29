import { useMemo } from 'react'
import AppShell from '../components/layout/AppShell'
import EmptyState from '../components/ui/EmptyState'
import { useSpace } from '../hooks/useSpace'
import { getMilestones, milestoneCopy, getTodayYMD } from '../lib/milestones'

function formatLongDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function Numbers() {
  const { space } = useSpace()
  const todayStr = useMemo(() => getTodayYMD(), [])

  const { milestones } = useMemo(() => {
    if (!space?.start_date) return { milestones: [] }
    return getMilestones(space.start_date, todayStr)
  }, [space?.start_date, todayStr])

  return (
    <AppShell>
      <div className="space-y-3 mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Numbers</p>
        <h1
          className="text-4xl lg:text-5xl text-ink leading-tight"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          Numbers
        </h1>
        <p className="text-ink-muted text-base">Days together, milestones reached, moments counted.</p>
      </div>

      <div className="space-y-3 mb-6">
        <h2 className="text-xl text-ink" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
          Milestones
        </h2>
      </div>

      {!space?.start_date ? (
        <EmptyState message="Set a start date to begin counting your milestones." />
      ) : milestones.length === 0 ? (
        <EmptyState message="No milestones yet." />
      ) : (
        <div className="relative sm:pl-8">
          <div
            className="hidden sm:block absolute left-[3px] top-1 bottom-1 w-px"
            style={{ background: 'var(--line)' }}
            aria-hidden="true"
          />
          <div className="space-y-5">
            {milestones.map((m) => (
              <div key={m.key} className="relative flex items-start gap-3">
                <span
                  className="hidden sm:block absolute -left-[34px] top-1.5 w-2.5 h-2.5 rounded-full border-2 flex-shrink-0"
                  style={{
                    background: m.reached ? 'var(--accent)' : 'var(--bg)',
                    borderColor: 'var(--accent)',
                  }}
                  aria-hidden="true"
                />
                <div
                  className={`flex-1 flex items-center justify-between gap-3 rounded-[var(--r-sm)] border px-4 py-3 ${
                    m.reached ? 'border-accent/25 bg-accent-soft' : 'border-line bg-surface'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${m.reached ? 'text-ink' : 'text-ink-muted'}`}>
                      {m.label}
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {m.reached ? formatLongDate(m.date) : milestoneCopy(m.label)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                      m.reached ? 'text-accent' : 'text-ink-muted'
                    }`}
                  >
                    {m.reached ? 'Reached' : `in ${m.daysAway} ${m.daysAway === 1 ? 'day' : 'days'}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  )
}
