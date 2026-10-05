import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Plus } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import AddBucketItemModal, { categoryIcon } from '../components/home/AddBucketItemModal'
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
  const { items, loading, addItem } = useWishlist()
  const [addOpen, setAddOpen] = useState(false)
  const todo = items.filter((it) => !it.is_done)
  const dated = todo.filter((it) => it.target_date)
  const someday = todo.filter((it) => !it.target_date)
  const done = items.filter((it) => it.is_done)

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-4 mb-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Bucket list</p>
          <h1
            className="text-4xl lg:text-5xl text-ink leading-tight"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Bucket list
          </h1>
          <p className="text-ink-muted text-base">Things to do, places to go, dreams to chase.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)} className="hidden sm:inline-flex flex-shrink-0">
          <Plus size={14} className="mr-1.5" />
          Add
        </Button>
      </div>

      {loading ? (
        <div className="h-32 rounded-[var(--r-md)] bg-surface-2 animate-pulse" />
      ) : items.length === 0 ? (
        <div className="space-y-5">
          <EmptyState
            message="Some adventures haven't happened yet."
            subtitle="Start planning the places you'll go and the things you'll do together."
          />
          <div className="flex justify-center">
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus size={14} className="mr-1.5" />
              Add to your bucket list
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 max-w-lg">
          {dated.length > 0 && (
            <section className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Planned ({dated.length})</p>
              {dated.map((it) => <ItemRow key={it.id} item={it} />)}
            </section>
          )}
          {someday.length > 0 && (
            <section className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Someday ({someday.length})</p>
              {someday.map((it) => <ItemRow key={it.id} item={it} />)}
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

      <button
        onClick={() => setAddOpen(true)}
        aria-label="Add to bucket list"
        className="sm:hidden fixed right-5 bottom-24 z-30 w-14 h-14 rounded-full bg-accent text-accent-ink shadow-[var(--shadow)] flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>

      <AddBucketItemModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addItem} />
    </AppShell>
  )
}
