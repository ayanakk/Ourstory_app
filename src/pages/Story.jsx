import { useState, useMemo } from 'react'
import AppShell from '../components/layout/AppShell'
import EmptyState from '../components/ui/EmptyState'
import MemoryCard from '../components/memory/MemoryCard'
import CreateMemoryWizard from '../components/memory/CreateMemoryWizard'
import { useMemories } from '../hooks/useMemories'
import { groupMemoriesByYearMonth } from '../lib/milestones'
import { getTodayYMD } from '../lib/milestones'

function ChapterSkeleton() {
  return (
    <div className="rounded-[var(--r-md)] border border-line bg-surface p-5 animate-pulse space-y-4">
      <div className="w-full aspect-[16/9] rounded-[var(--r-md)] bg-surface-2" />
      <div className="h-4 w-1/3 bg-surface-2 rounded-full" />
      <div className="h-3 w-2/3 bg-surface-2 rounded-full" />
    </div>
  )
}

export default function Story() {
  const { memories, loading, refresh } = useMemories()
  const grouped = useMemo(() => groupMemoriesByYearMonth(memories), [memories])
  const [wizardOpen, setWizardOpen] = useState(false)

  let globalIndex = -1

  return (
    <AppShell>
      <div className="space-y-3 mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Our Story</p>
        <h1
          className="text-4xl lg:text-5xl text-ink leading-tight"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          Our Story
        </h1>
        <p className="text-ink-muted text-base">A chronicle of moments, places and feelings.</p>
      </div>

      {loading ? (
        <div className="space-y-8">
          {[0, 1, 2].map((i) => (
            <ChapterSkeleton key={i} />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <EmptyState
          message="This chapter is still waiting to be written."
          subtitle="Add your first memory and watch your story unfold."
          action={{ label: '+ Create a Memory', onClick: () => setWizardOpen(true) }}
        />
      ) : (
        <div className="relative sm:pl-10">
          <div
            className="hidden sm:block absolute left-[3px] top-1 bottom-1 w-px"
            style={{ background: 'var(--line)' }}
            aria-hidden="true"
          />
          {grouped.map((yearGroup) => (
            <div key={yearGroup.year} className="mb-14 last:mb-0">
              <div
                className="sticky top-2 z-10 mb-8 inline-block px-3 py-1 rounded-full backdrop-blur-md"
                style={{ background: 'var(--glass)' }}
              >
                <h2
                  className="text-2xl text-ink"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
                >
                  {yearGroup.year}
                </h2>
              </div>

              {yearGroup.months.map((monthGroup) => (
                <div key={monthGroup.month} className="mb-10 last:mb-0">
                  <p
                    className="sticky top-14 z-[5] mb-5 inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-ink-muted backdrop-blur-md"
                    style={{ background: 'var(--glass)' }}
                  >
                    {monthGroup.monthLabel}
                  </p>
                  <div className="space-y-10">
                    {monthGroup.memories.map((memory) => {
                      globalIndex += 1
                      return (
                        <div key={memory.id} className="relative">
                          <span
                            className="hidden sm:block absolute -left-[38px] top-2 w-2.5 h-2.5 rounded-full border-2"
                            style={{ background: 'var(--bg)', borderColor: 'var(--accent)' }}
                            aria-hidden="true"
                          />
                          <MemoryCard memory={memory} index={globalIndex} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <CreateMemoryWizard
        open={wizardOpen}
        initialDate={getTodayYMD()}
        onClose={() => setWizardOpen(false)}
        onSuccess={refresh}
      />
    </AppShell>
  )
}
