import AppShell from '../components/layout/AppShell'
export default function Places() {
  return (
    <AppShell>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Places</p>
        <h1 className="text-4xl lg:text-5xl text-ink leading-tight" style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>
          Places
        </h1>
        <p className="text-ink-muted text-base">All the places that hold a piece of your story.</p>
      </div>
    </AppShell>
  )
}
