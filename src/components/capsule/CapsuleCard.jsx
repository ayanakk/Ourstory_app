import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Trash2, Mail } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import SignedImage from '../story/SignedImage'
import PhotoViewer from '../memory/PhotoViewer'
import Envelope from './Envelope'
import { useAuth } from '../../hooks/useAuth'
import { useSpace } from '../../hooks/useSpace'
import { getSignedUrl } from '../../lib/photos'
import { parseYMD, getTodayYMD, daysBetween } from '../../lib/milestones'

const SEEN_KEY = 'capsules-seen'

function readSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function markSeen(id) {
  try {
    const seen = readSeen()
    seen.add(id)
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]))
  } catch {
    // storage unavailable: the animation just replays next visit
  }
}

function formatDate(ymd) {
  const p = parseYMD(ymd)
  if (!p) return ''
  return new Date(p.year, p.month - 1, p.day).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function CapsuleVideo({ path }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let active = true
    getSignedUrl(path).then((u) => active && setUrl(u))
    return () => { active = false }
  }, [path])
  if (!url) return <div className="w-full aspect-video rounded-[var(--r-sm)] bg-surface-2 animate-pulse" />
  return <video src={url} controls playsInline className="w-full rounded-[var(--r-sm)] bg-black" />
}

export default function CapsuleCard({ capsule, onDelete }) {
  const { user } = useAuth()
  const { partner } = useSpace()
  const [revealed, setRevealed] = useState(() => !capsule.is_open || readSeen().has(capsule.id))
  const [opening, setOpening] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(null)

  const mine = capsule.author_id === user?.id
  const partnerName = partner?.display_name || 'your partner'
  const from = mine ? 'You' : partnerName
  const to = !capsule.to_user ? 'both of you' : capsule.to_user === user?.id ? 'you' : partnerName
  const openYMD = capsule.opens_at?.split('T')[0]
  const daysAway = daysBetween(getTodayYMD(), openYMD)
  const kindLabel = capsule.kind === 'letter' ? 'Letter' : 'Time capsule'
  const photos = (capsule.photo_paths || []).map((path) => ({ id: path, path }))

  const open = () => {
    if (opening) return
    setOpening(true)
    markSeen(capsule.id)
    setTimeout(() => setRevealed(true), 900)
  }

  const handleDelete = async () => {
    if (window.confirm('Delete this sealed capsule? This cannot be undone.')) await onDelete(capsule)
  }

  const header = (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{kindLabel}</p>
      <h3 className="text-xl text-ink" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        {capsule.title || 'Untitled'}
      </h3>
      <p className="text-xs text-ink-muted">From {from} · for {to}</p>
    </div>
  )

  // Sealed: nobody sees content until the date
  if (!capsule.is_open) {
    return (
      <Card className="p-5 flex flex-col sm:flex-row gap-5 items-center">
        <Envelope className="max-w-[160px] flex-shrink-0" />
        <div className="flex-1 space-y-3 w-full">
          {header}
          <p className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
            <Lock size={13} />
            Opens {formatDate(openYMD)}
            {daysAway > 0 && ` · in ${daysAway} ${daysAway === 1 ? 'day' : 'days'}`}
          </p>
          {mine && (
            <div>
              <Button variant="ghost" size="sm" onClick={handleDelete}>
                <Trash2 size={14} className="mr-1.5" /> Delete
              </Button>
            </div>
          )}
        </div>
      </Card>
    )
  }

  // Opened but not yet unsealed on this device
  if (!revealed) {
    return (
      <Card className="p-5 flex flex-col items-center gap-4 text-center">
        <Envelope open={opening} className="max-w-[200px]" />
        {header}
        <Button onClick={open} loading={opening} size="sm">
          <Mail size={14} className="mr-1.5" /> Tap to open
        </Button>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 space-y-4">
        {header}
        <p className="text-xs text-ink-muted">Opened {formatDate(openYMD)}</p>
        {capsule.body && (
          <p className="text-ink whitespace-pre-wrap leading-relaxed">{capsule.body}</p>
        )}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setViewerIndex(i)}
                className="aspect-square rounded-[var(--r-xs)] overflow-hidden"
              >
                <SignedImage path={p.path} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {capsule.video_path && <CapsuleVideo path={capsule.video_path} />}
      </Card>
      {viewerIndex !== null && (
        <PhotoViewer photos={photos} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </motion.div>
  )
}
