import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { toast } from '../components/ui/Toast'
import CapsuleCard from '../components/capsule/CapsuleCard'
import CreateCapsuleModal from '../components/capsule/CreateCapsuleModal'
import { useCapsules } from '../hooks/useCapsules'

function CapsuleSkeleton() {
  return <div className="rounded-[var(--r-md)] border border-line bg-surface h-36 animate-pulse" />
}

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-muted">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export default function Capsules() {
  const { capsules, loading, createCapsule, deleteCapsule } = useCapsules()
  const [creating, setCreating] = useState(false)

  const waiting = useMemo(
    () => capsules.filter((c) => !c.is_open).sort((a, b) => a.opens_at.localeCompare(b.opens_at)),
    [capsules]
  )
  const opened = useMemo(
    () => capsules.filter((c) => c.is_open).sort((a, b) => b.opens_at.localeCompare(a.opens_at)),
    [capsules]
  )

  const handleDelete = async (capsule) => {
    const { error } = await deleteCapsule(capsule)
    toast(error ? error.message || 'Could not delete it' : 'Capsule deleted')
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Capsules</p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Capsules
          </h1>
          <p className="text-ink-muted text-base">Letters and moments sealed in time, to open later.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} className="mr-1.5" /> Seal a capsule
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => <CapsuleSkeleton key={i} />)}
        </div>
      ) : capsules.length === 0 ? (
        <EmptyState
          message="Nothing sealed yet."
          subtitle="Write something for your future selves and set the day it opens."
          action={{ label: '+ Seal a capsule', onClick: () => setCreating(true) }}
        />
      ) : (
        <div className="space-y-10">
          {waiting.length > 0 && (
            <Section title="Waiting to open">
              {waiting.map((c) => <CapsuleCard key={c.id} capsule={c} onDelete={handleDelete} />)}
            </Section>
          )}
          {opened.length > 0 && (
            <Section title="Opened">
              {opened.map((c) => <CapsuleCard key={c.id} capsule={c} onDelete={handleDelete} />)}
            </Section>
          )}
        </div>
      )}

      <CreateCapsuleModal open={creating} onClose={() => setCreating(false)} onCreate={createCapsule} />
    </AppShell>
  )
}
