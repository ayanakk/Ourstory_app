import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ArrowUpRight } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import PhotoTile from '../components/photos/PhotoTile'
import PhotoViewer from '../components/memory/PhotoViewer'
import { usePhotos } from '../hooks/usePhotos'
import { useSpace } from '../hooks/useSpace'
import { getSignedUrls } from '../lib/photos'
import { parseYMD } from '../lib/milestones'
import { uploaderLabel } from '../lib/people'

const BATCH_SIZE = 40

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'recent', label: 'Recently added' },
  { id: 'year', label: 'By year' },
  { id: 'location', label: 'By location' },
  { id: 'memory', label: 'By memory' },
]

function sortByMemoryDateDesc(items) {
  return [...items].sort((a, b) => {
    const da = a.memories?.date || a.created_at || ''
    const db = b.memories?.date || b.created_at || ''
    return db.localeCompare(da)
  })
}

function buildSections(photos, filter) {
  if (filter === 'favorites') {
    const favs = photos.filter((p) => p.is_favorite)
    return favs.length ? [{ key: 'favorites', heading: null, items: sortByMemoryDateDesc(favs) }] : []
  }

  if (filter === 'recent') {
    const recent = [...photos]
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 30)
    return recent.length ? [{ key: 'recent', heading: null, items: recent }] : []
  }

  if (filter === 'year') {
    const map = new Map()
    for (const p of photos) {
      const year = p.memories?.date ? parseYMD(p.memories.date)?.year : null
      const key = year || 'Undated'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(p)
    }
    return Array.from(map.entries())
      .sort((a, b) => {
        if (a[0] === 'Undated') return 1
        if (b[0] === 'Undated') return -1
        return b[0] - a[0]
      })
      .map(([year, items]) => ({ key: `year-${year}`, heading: String(year), items: sortByMemoryDateDesc(items) }))
  }

  if (filter === 'location') {
    const map = new Map()
    for (const p of photos) {
      const key = p.memories?.place_name?.trim() || 'Unspecified'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(p)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([place, items]) => ({ key: `place-${place}`, heading: place, items: sortByMemoryDateDesc(items) }))
  }

  if (filter === 'memory') {
    const map = new Map()
    for (const p of photos) {
      const key = p.memories?.id || 'unlinked'
      if (!map.has(key)) {
        map.set(key, { title: p.memories?.title || 'Unlinked photos', date: p.memories?.date, items: [] })
      }
      map.get(key).items.push(p)
    }
    return Array.from(map.values())
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .map((g, i) => ({ key: `memory-${i}`, heading: g.title, items: g.items }))
  }

  // all
  return photos.length ? [{ key: 'all', heading: null, items: sortByMemoryDateDesc(photos) }] : []
}

function formatLongDate(dateStr) {
  const p = parseYMD(dateStr)
  if (!p) return ''
  const d = new Date(p.year, p.month - 1, p.day)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function PhotoWall() {
  const { photos, loading, toggleFavorite } = usePhotos()
  const { member, partner } = useSpace()
  const [filter, setFilter] = useState('all')
  const [personFilter, setPersonFilter] = useState('both')
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const [viewerId, setViewerId] = useState(null)
  const warmedCount = useRef(0)
  const sentinelRef = useRef(null)

  const personFiltered = useMemo(() => {
    if (personFilter === 'me') return photos.filter((p) => p.uploaded_by === member?.user_id)
    if (personFilter === 'partner') return photos.filter((p) => p.uploaded_by === partner?.user_id)
    return photos
  }, [photos, personFilter, member, partner])

  const sections = useMemo(() => buildSections(personFiltered, filter), [personFiltered, filter])
  const flatOrder = useMemo(() => sections.flatMap((s) => s.items), [sections])

  useEffect(() => {
    setVisibleCount(BATCH_SIZE)
    warmedCount.current = 0
  }, [filter, personFilter])

  const visibleIds = useMemo(() => {
    return new Set(flatOrder.slice(0, visibleCount).map((p) => p.id))
  }, [flatOrder, visibleCount])

  const displaySections = useMemo(
    () =>
      sections
        .map((s) => ({ ...s, items: s.items.filter((p) => visibleIds.has(p.id)) }))
        .filter((s) => s.items.length > 0),
    [sections, visibleIds]
  )

  // Batch-warm signed URLs for the newly visible slice
  useEffect(() => {
    const nextCount = Math.min(visibleCount, flatOrder.length)
    if (nextCount > warmedCount.current) {
      const newItems = flatOrder.slice(warmedCount.current, nextCount)
      const paths = newItems.map((p) => p.path).filter(Boolean)
      if (paths.length) getSignedUrls(paths)
      warmedCount.current = nextCount
    }
  }, [visibleCount, flatOrder])

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + BATCH_SIZE, flatOrder.length))
  }, [flatOrder.length])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '400px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore])

  const hasMore = visibleCount < flatOrder.length

  const viewerIndex = viewerId ? flatOrder.findIndex((p) => p.id === viewerId) : -1
  const viewerOpen = viewerIndex >= 0

  const emptyMessage =
    filter === 'favorites'
      ? 'Tap the heart on a photo to keep it close.'
      : 'Your wall is waiting for its first photo.'

  return (
    <AppShell>
      <div className="space-y-3 mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Photo Wall</p>
        <h1
          className="text-4xl lg:text-5xl text-ink leading-tight"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          Every moment, in one place.
        </h1>
        <p className="text-ink-muted text-base">{photos.length} photos</p>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 min-w-0 overflow-x-auto pb-3 mb-6 -mx-6 px-6 lg:-mx-10 lg:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-accent-soft text-accent border-accent/30'
                : 'bg-surface text-ink-muted border-line hover:bg-surface-2'
            }`}
            style={{ transitionDuration: 'var(--dur-fast)' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {partner && (
        <div className="flex items-center gap-2 mb-6">
          {[
            { id: 'both', label: 'Both' },
            { id: 'me', label: 'Me' },
            { id: 'partner', label: partner.display_name || 'Partner' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPersonFilter(opt.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                personFilter === opt.id
                  ? 'bg-accent-soft text-accent border-accent/30'
                  : 'bg-surface text-ink-muted border-line hover:bg-surface-2'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="mb-3 break-inside-avoid rounded-[16px] bg-surface-2 animate-pulse"
              style={{ height: 120 + (i % 4) * 60 }}
            />
          ))}
        </div>
      ) : displaySections.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="space-y-10">
          {displaySections.map((section) => (
            <div key={section.key}>
              {section.heading && (
                <div className="flex items-baseline gap-2 mb-4">
                  <h2
                    className="text-xl text-ink"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
                  >
                    {section.heading}
                  </h2>
                  <span className="text-xs text-ink-muted">{section.items.length}</span>
                </div>
              )}
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
                {section.items.map((photo) => {
                  const globalIndex = flatOrder.findIndex((p) => p.id === photo.id)
                  return (
                    <PhotoTile
                      key={photo.id}
                      photo={photo}
                      index={globalIndex}
                      onOpen={(p) => setViewerId(p.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  )
                })}
              </div>
            </div>
          ))}

          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center pt-4">
              <Button variant="secondary" size="sm" onClick={loadMore}>
                Show more
              </Button>
            </div>
          )}
        </div>
      )}

      {viewerOpen && (
        <PhotoViewer
          photos={flatOrder}
          initialIndex={viewerIndex}
          onClose={() => setViewerId(null)}
          renderOverlay={(photo) => {
            const memory = photo.memories
            return (
              <div
                className="rounded-[var(--r-sm)] border border-white/15 px-4 py-3 backdrop-blur-md flex items-center justify-between gap-3"
                style={{ background: 'rgba(20,16,17,0.55)' }}
              >
                <div className="min-w-0">
                  {memory ? (
                    <>
                      <p className="text-white text-sm font-medium truncate">{memory.title}</p>
                      <p className="text-white/70 text-xs truncate">
                        {formatLongDate(memory.date)}
                        {memory.place_name ? ` · ${memory.place_name}` : ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-white/70 text-xs">Not linked to a memory</p>
                  )}
                  {(() => {
                    const name = uploaderLabel(photo.uploaded_by, member, partner)
                    return name ? (
                      <p className="text-white/60 text-[11px] mt-0.5">
                        Added by {name === 'you' ? 'you' : name}
                      </p>
                    ) : null
                  })()}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <motion.button
                    onClick={() => toggleFavorite(photo.id)}
                    whileTap={{ scale: 1.4 }}
                    aria-label={photo.is_favorite ? 'Remove favorite' : 'Mark as favorite'}
                    className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
                  >
                    <Heart size={16} className={photo.is_favorite ? 'fill-white text-white' : 'text-white'} />
                  </motion.button>
                  {memory && (
                    <Link
                      to={`/memory/${memory.id}`}
                      className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
                      aria-label="Open memory"
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            )
          }}
        />
      )}
    </AppShell>
  )
}
