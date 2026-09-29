import AppShell from '../components/layout/AppShell'
export default function TimeMachine() {
  return (
    <AppShell>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Time Machine</p>
        <h1 className="text-4xl lg:text-5xl text-ink leading-tight" style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>
          Time Machine
        </h1>
        <p className="text-ink-muted text-base">Revisit any day in your shared history.</p>
      </div>
    </AppShell>
  )
}
