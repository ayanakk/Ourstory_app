import { useState, useMemo } from 'react'
import { Search as SearchIcon, X, Heart } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import EmptyState from '../components/ui/EmptyState'
import MemoryCard from '../components/memory/MemoryCard'
import { MOODS, getMood } from '../lib/moods'
import { useMemories } from '../hooks/useMemories'

function ResultSkeleton() {
  return (
    <div className="rounded-[var(--r-md)] border border-line bg-surface p-5 animate-pulse space-y-4">
      <div className="w-full aspect-[16/9] rounded-[var(--r-md)] bg-surface-2" />
      <div className="h-4 w-1/3 bg-surface-2 rounded-full" />
      <div className="h-3 w-2/3 bg-surface-2 rounded-full" />
    </div>
  )
}

const chipClass = (active) =>
  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
    active
      ? 'border-accent bg-accent-soft text-ink font-semibold'
      : 'border-line bg-surface hover:bg-surface-2 text-ink-muted'
  }`

const dateInputClass =
  'px-3 py-2 rounded-[var(--r-sm)] border border-line bg-surface-2 text-ink text-base sm:text-sm font-sans ' +
  'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'

export default function Search() {
  const { memories, loading } = useMemories()
  const [query, setQuery] = useState('')
  const [moods, setMoods] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const moodOptions = useMemo(() => {
    const known = new Set(MOODS.map((m) => m.id))
    const extra = [...new Set(memories.map((m) => m.mood).filter((v) => v && !known.has(v)))]
    return [...MOODS, ...extra.map(getMood)]
  }, [memories])

  const hasFilters = moods.length > 0 || from || to || favoritesOnly
  const hasCriteria = query.trim() || hasFilters

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    return memories.filter((m) => {
      if (favoritesOnly && !m.is_favorite) return false
      if (moods.length && !moods.includes(m.mood)) return false
      if (from && m.date < from) return false
      if (to && m.date > to) return false
      if (!terms.length) return true
      const haystack = [m.title, m.body, m.place_name, m.caption]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return terms.every((t) => haystack.includes(t))
    })
  }, [memories, query, moods, from, to, favoritesOnly])

  const toggleMood = (id) =>
    setMoods((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const clearFilters = () => {
    setMoods([])
    setFrom('')
    setTo('')
    setFavoritesOnly(false)
  }

  const clearAll = () => {
    clearFilters()
    setQuery('')
  }

  return (
    <AppShell>
      <div className="space-y-3 mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Search</p>
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          Search
        </h1>
        <p className="text-ink-muted text-base">Find any memory, place, or moment.</p>
      </div>

      <div className="space-y-5 mb-10">
        <div className="relative">
          <SearchIcon
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            autoFocus={typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, stories, places, captions…"
            aria-label="Search memories"
            className="w-full pl-11 pr-11 py-3 rounded-[var(--r-sm)] border border-line bg-surface-2 text-ink text-base sm:text-sm font-sans placeholder:text-ink-muted transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-ink-muted hover:text-ink"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto sm:flex-wrap -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>button]:shrink-0">
          {moodOptions.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMood(m.id)}
              aria-pressed={moods.includes(m.id)}
              className={chipClass(moods.includes(m.id))}
            >
              <span>{m.emoji}</span>
              {m.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            aria-pressed={favoritesOnly}
            className={chipClass(favoritesOnly)}
          >
            <Heart size={12} fill={favoritesOnly ? 'currentColor' : 'none'} />
            Favorites
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">
          <label className="flex items-center gap-2">
            From
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className={dateInputClass}
            />
          </label>
          <label className="flex items-center gap-2">
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className={dateInputClass}
            />
          </label>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-accent hover:underline normal-case tracking-normal text-sm font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-8">
          {[0, 1].map((i) => (
            <ResultSkeleton key={i} />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <EmptyState
          message="Nothing to search yet."
          subtitle="Add your first memory and it will show up here."
        />
      ) : results.length === 0 ? (
        <EmptyState
          message="No memories match that."
          subtitle="Try different words or loosen the filters."
          action={{ label: 'Clear search', onClick: clearAll }}
        />
      ) : (
        <div className="space-y-10">
          <p className="text-sm text-ink-muted" aria-live="polite">
            {hasCriteria
              ? `${results.length} ${results.length === 1 ? 'memory' : 'memories'} found`
              : `All ${results.length} ${results.length === 1 ? 'memory' : 'memories'}`}
          </p>
          {results.map((memory, i) => (
            <MemoryCard key={memory.id} memory={memory} index={i} />
          ))}
        </div>
      )}
    </AppShell>
  )
}
