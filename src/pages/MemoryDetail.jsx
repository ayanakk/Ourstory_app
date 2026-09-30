import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Heart, Trash2 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { toast } from '../components/ui/Toast'
import SignedImage from '../components/story/SignedImage'
import PhotoViewer from '../components/memory/PhotoViewer'
import { useMemories } from '../hooks/useMemories'
import { useAuth } from '../hooks/useAuth'
import { useSpace } from '../hooks/useSpace'
import { parseYMD } from '../lib/milestones'
import { uploaderLabel } from '../lib/people'
import { MOODS } from '../components/memory/CreateMemoryWizard'

const MOOD_MAP = Object.fromEntries(MOODS.map((m) => [m.id, m]))

function formatLongDate(dateStr) {
  const p = parseYMD(dateStr)
  if (!p) return ''
  const d = new Date(p.year, p.month - 1, p.day)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function MemoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { member, partner } = useSpace()
  const { getMemoryById, toggleFavorite, deleteMemory } = useMemories()

  const [memory, setMemory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewerIndex, setViewerIndex] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getMemoryById(id)
    if (!error) setMemory(data)
    setLoading(false)
  }, [id, getMemoryById])

  useEffect(() => {
    load()
  }, [load])

  const handleToggleFavorite = async () => {
    if (!memory) return
    const next = !memory.is_favorite
    setMemory((m) => ({ ...m, is_favorite: next }))
    const { error } = await toggleFavorite(memory.id, next)
    if (error) {
      setMemory((m) => ({ ...m, is_favorite: !next }))
      toast('Could not update favorite')
    }
  }

  const handleDelete = async () => {
    if (!memory) return
    setDeleting(true)
    const { error } = await deleteMemory(memory)
    setDeleting(false)
    if (error) {
      toast('Could not delete memory')
      return
    }
    toast('Memory deleted')
    navigate('/story')
  }

  if (loading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-6">
          <div className="w-full aspect-[16/9] rounded-[var(--r-md)] bg-surface-2" />
          <div className="h-6 w-1/2 bg-surface-2 rounded-full" />
          <div className="h-4 w-1/3 bg-surface-2 rounded-full" />
        </div>
      </AppShell>
    )
  }

  if (!memory) {
    return (
      <AppShell>
        <div className="py-20 text-center space-y-4">
          <p className="text-xl italic text-ink-muted" style={{ fontFamily: 'var(--font-display)' }}>
            This memory could not be found.
          </p>
          <Button variant="secondary" size="sm" onClick={() => navigate('/story')}>
            <ArrowLeft size={14} className="mr-1.5" /> Back to Our Story
          </Button>
        </div>
      </AppShell>
    )
  }

  const coverPhoto = memory.photos?.find((p) => p.id === memory.cover_photo_id) || memory.photos?.[0] || null
  const cover = coverPhoto?.path || null
  const otherPhotos = (memory.photos || []).filter((p) => p.path !== cover)
  const rawAllPhotos = coverPhoto ? [coverPhoto, ...otherPhotos] : otherPhotos
  const allPhotos = rawAllPhotos.map((p) => ({ ...p, uploaderName: uploaderLabel(p.uploaded_by, member, partner) }))
  const mood = memory.mood ? MOOD_MAP[memory.mood] : null
  const isAuthor = user?.id === memory.author_id

  return (
    <AppShell>
      <div className="space-y-8">
        <button
          onClick={() => navigate('/story')}
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} /> Back to Our Story
        </button>

        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-[var(--r-md)] overflow-hidden bg-surface-2">
          {cover && (
            <button
              className="absolute inset-0 w-full h-full"
              onClick={() => setViewerIndex(0)}
              aria-label="View photo"
            >
              <SignedImage path={cover} alt={memory.title} className="absolute inset-0 w-full h-full object-cover" />
            </button>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent pointer-events-none" />

          <button
            onClick={handleToggleFavorite}
            aria-label={memory.is_favorite ? 'Remove favorite' : 'Mark as favorite'}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-black/30 backdrop-blur-md text-white transition-transform active:scale-90"
          >
            <motion.span whileTap={{ scale: 1.3 }} className="block">
              <Heart size={18} className={memory.is_favorite ? 'fill-white text-white' : 'text-white'} />
            </motion.span>
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 space-y-2 pointer-events-none">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-white/85">
              <span>{formatLongDate(memory.date)}</span>
              {memory.place_name && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} /> {memory.place_name}
                </span>
              )}
              {mood && (
                <span className="inline-flex items-center gap-1">
                  <span>{mood.emoji}</span>
                  {mood.label}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              {memory.title}
            </h1>
          </div>
        </div>

        {memory.body && (
          <p className="text-ink text-base leading-relaxed max-w-2xl whitespace-pre-wrap">{memory.body}</p>
        )}
        {memory.caption && (
          <p className="italic text-lg text-ink-muted" style={{ fontFamily: 'var(--font-display)' }}>
            "{memory.caption}"
          </p>
        )}

        {otherPhotos.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-3">Photos</p>
            <div className="columns-2 sm:columns-3 gap-3 [&>*]:mb-3">
              {otherPhotos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setViewerIndex(allPhotos.findIndex((p) => p.id === photo.id))}
                  className="block w-full rounded-[var(--r-sm)] overflow-hidden bg-surface-2 break-inside-avoid"
                >
                  <SignedImage path={photo.path} alt="" className="w-full h-auto object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {isAuthor && (
          <div className="pt-4 border-t border-line">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 size={14} className="mr-1.5" /> Delete this memory
            </Button>
          </div>
        )}
      </div>

      {viewerIndex !== null && (
        <PhotoViewer photos={allPhotos} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}

      <Modal
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        title="Delete this memory?"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="!bg-red-500 !border-red-500"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        }
      >
        <p className="text-ink-muted text-sm leading-relaxed">
          This will permanently remove "{memory.title}" and all its photos. This cannot be undone.
        </p>
      </Modal>
    </AppShell>
  )
}
