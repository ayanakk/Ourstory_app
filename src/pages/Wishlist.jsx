import AppShell from '../components/layout/AppShell'
import EmptyState from '../components/ui/EmptyState'

export default function Wishlist() {
  return (
    <AppShell>
      <div className="space-y-3 mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Wishlist</p>
        <h1
          className="text-4xl lg:text-5xl text-ink leading-tight"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          Wishlist
        </h1>
        <p className="text-ink-muted text-base">Things to do, places to go, dreams to chase.</p>
      </div>
      <EmptyState
        message="Some adventures haven't happened yet."
        subtitle="Start planning the places you'll go and the things you'll do together."
      />
    </AppShell>
  )
}
