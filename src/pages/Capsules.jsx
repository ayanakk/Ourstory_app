import AppShell from '../components/layout/AppShell'
export default function Capsules() {
  return (
    <AppShell>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Capsules</p>
        <h1 className="text-4xl lg:text-5xl text-ink leading-tight" style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>
          Capsules
        </h1>
        <p className="text-ink-muted text-base">Letters and moments sealed in time, to open later.</p>
      </div>
    </AppShell>
  )
}
