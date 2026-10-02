import { Link } from 'react-router-dom'
import { MapPin, Calendar } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import EmptyState from '../components/ui/EmptyState'
import { categoryIcon } from '../components/home/AddBucketItemModal'
import { useWishlist } from '../hooks/useWishlist'
import { parseYMD } from '../lib/milestones'

function formatShortDate(dateStr) {
  const p = parseYMD(dateStr)
  if (!p) return ''
  return new Date(p.year, p.month - 1, p.day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ItemRow({ item }) {
  const Icon = categoryIcon(item.category)
  return (
    <Link
      to={`/wishlist/${item.id}`}
      className="flex items-center gap-3 p-3.5 rounded-[var(--r-xs)] border border-line bg-surface hover:bg-surface-2 transition-colors"
    >
      <Icon size={15} className="text-accent flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${item.is_done ? 'text-ink-muted line-through' : 'text-ink'}`}>
          {item.title}
        </p>
        {(item.place_name || item.target_date) && (
          <p className="text-xs text-ink-muted flex items-center gap-3 mt-0.5">
            {item.target_date && (
              <span className="inline-flex items-center gap-1"><Calendar size={11} /> {formatShortDate(item.target_date)}</span>
            )}
            {item.place_name && (
              <span className="inline-flex items-center gap-1 truncate"><MapPin size={11} /> {item.place_name}</span>
            )}
          </p>
        )}
      </div>
    </Link>
  )
}

export default function Wishlist() {
  const { items, loading } = useWishlist()
  const todo = items.filter((it) => !it.is_done)
  const done = items.filter((it) => it.is_done)

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

      {loading ? (
        <div className="h-32 rounded-[var(--r-md)] bg-surface-2 animate-pulse" />
      ) : items.length === 0 ? (
        <EmptyState
          message="Some adventures haven't happened yet."
          subtitle="Start planning the places you'll go and the things you'll do together."
        />
      ) : (
        <div className="space-y-8 max-w-lg">
          {todo.length > 0 && (
            <section className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">To do ({todo.length})</p>
              {todo.map((it) => <ItemRow key={it.id} item={it} />)}
            </section>
          )}
          {done.length > 0 && (
            <section className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Done ({done.length})</p>
              {done.map((it) => <ItemRow key={it.id} item={it} />)}
            </section>
          )}
        </div>
      )}
    </AppShell>
  )
}
