import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Input } from '../ui/Input'

// OpenStreetMap Nominatim search (https://nominatim.org/release-docs/latest/api/Search/)
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const DEBOUNCE_MS = 500
const MIN_CHARS = 3

/**
 * Short label for a result: "Name, City, Country"
 */
function formatPlace(r) {
  const a = r.address || {}
  const name = r.name || a.road || ''
  const city = a.city || a.town || a.village || a.suburb || a.state || ''
  const parts = [name, city, a.country].filter(Boolean)
  return [...new Set(parts)].join(', ') || r.display_name
}

/**
 * PlaceSearch
 * Text input with OpenStreetMap-powered suggestions. Free text is still allowed.
 */
export default function PlaceSearch({ id, label, placeholder, value, onChange }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const skipNext = useRef(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    // Selecting a suggestion sets value; don't search again for it
    if (skipNext.current) {
      skipNext.current = false
      return
    }
    const q = value.trim()
    if (q.length < MIN_CHARS) {
      setResults([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ q, format: 'jsonv2', addressdetails: '1', limit: '5' })
        const res = await fetch(`${NOMINATIM_URL}?${params}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) throw new Error(`Search failed (${res.status})`)
        setResults(await res.json())
        setOpen(true)
      } catch (err) {
        if (err.name !== 'AbortError') setResults([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [value])

  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const select = (r) => {
    skipNext.current = true
    onChange(formatPlace(r))
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <Input
        id={id}
        label={label}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
      />
      {loading && (
        <Loader2 size={14} className="absolute right-4 bottom-4 animate-spin text-ink-muted" />
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-[var(--r-sm)] border border-line bg-surface shadow-[var(--shadow)]">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => select(r)}
                className="w-full flex items-start gap-2 px-4 py-2.5 text-left text-sm text-ink hover:bg-accent-soft"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-accent" />
                <span>
                  <span className="block">{formatPlace(r)}</span>
                  <span className="block text-xs text-ink-muted line-clamp-1">{r.display_name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
