import AppShell from '../components/layout/AppShell'
export default function Search() {
  return (
    <AppShell>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Search</p>
        <h1 className="text-4xl lg:text-5xl text-ink leading-tight" style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>
          Search
        </h1>
        <p className="text-ink-muted text-base">Find any memory, place, or moment.</p>
      </div>
    </AppShell>
  )
}
