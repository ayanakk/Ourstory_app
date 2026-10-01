import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Calendar, MapPin, Smile, ArrowRight, ArrowLeft, Heart, Check, ImagePlus, X, Star } from 'lucide-react'
import Modal from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import Button from '../ui/Button'
import PlaceSearch from './PlaceSearch'
import { toast } from '../ui/Toast'
import { useMemories } from '../../hooks/useMemories'
import { useSpace } from '../../hooks/useSpace'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { getTodayYMD } from '../../lib/milestones'
import { compressImage, uploadPhoto } from '../../lib/photos'

const MAX_PHOTOS = 20
const MAX_PHOTO_MB = 15

export const MOODS = [
  { id: 'romantic', emoji: '✨', label: 'Romantic' },
  { id: 'celebratory', emoji: '🥂', label: 'Celebration' },
  { id: 'peaceful', emoji: '🌿', label: 'Peaceful' },
  { id: 'adventurous', emoji: '🚀', label: 'Adventure' },
  { id: 'happy', emoji: '☀️', label: 'Joyful' },
  { id: 'grateful', emoji: '🤍', label: 'Grateful' },
]

export default function CreateMemoryWizard({ open, onClose, initialDate, initialTitle, initialPlace, onSuccess }) {
  const { createMemory } = useMemories()
  const { space } = useSpace()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [date, setDate] = useState('')
  const [title, setTitle] = useState('')
  const [place, setPlace] = useState('')
  const [mood, setMood] = useState('romantic')
  const [body, setBody] = useState('')
  const [caption, setCaption] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)

  // Photos: { id, file, previewUrl }
  const [photos, setPhotos] = useState([])
  const [coverId, setCoverId] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null) // { done, total }
  const [pendingMemory, setPendingMemory] = useState(null) // set once the memory row is created, for retry
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // Sync initial props when modal opens
  useEffect(() => {
    if (open) {
      setDate(initialDate || getTodayYMD())
      setTitle(initialTitle || '')
      setPlace(initialPlace || '')
      setStep(1)
      setError('')
    }
  }, [open, initialDate, initialTitle, initialPlace])

  const resetForm = () => {
    setTitle('')
    setPlace('')
    setBody('')
    setCaption('')
    setIsFavorite(false)
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setPhotos([])
    setCoverId(null)
    setPendingMemory(null)
    setUploadProgress(null)
    setStep(1)
  }

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || [])
    const accepted = []
    for (const file of incoming) {
      if (photos.length + accepted.length >= MAX_PHOTOS) {
        toast(`You can add up to ${MAX_PHOTOS} photos`)
        break
      }
      if (!file.type.startsWith('image/')) continue
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        toast(`${file.name} is over ${MAX_PHOTO_MB}MB`)
        continue
      }
      accepted.push({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) })
    }
    if (accepted.length) {
      setPhotos((prev) => {
        const next = [...prev, ...accepted]
        if (!coverId) setCoverId(next[0].id)
        return next
      })
    }
  }

  const removeFile = (id) => {
    setPhotos((prev) => {
      const removed = prev.find((p) => p.id === id)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      const next = prev.filter((p) => p.id !== id)
      if (coverId === id) setCoverId(next[0]?.id || null)
      return next
    })
  }

  const runUploads = async (memory) => {
    const remaining = [...photos]
    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i]
      setUploadProgress({ done: i, total: remaining.length })
      try {
        const compressed = await compressImage(item.file)
        const { path, error: upErr } = await uploadPhoto(space.id, memory.id, compressed)
        if (upErr || !path) throw upErr || new Error('Upload failed')

        const { data: photoRow, error: insErr } = await supabase
          .from('photos')
          .insert({ space_id: space.id, memory_id: memory.id, path, uploaded_by: user.id })
          .select()
          .single()
        if (insErr) throw insErr

        if (item.id === coverId) {
          await supabase.from('memories').update({ cover_photo_id: photoRow.id }).eq('id', memory.id)
        }

        URL.revokeObjectURL(item.previewUrl)
        setPhotos((prev) => prev.filter((p) => p.id !== item.id))
      } catch (err) {
        console.error('Photo upload failed:', err)
        setUploadProgress(null)
        setPendingMemory(memory)
        setError('Some photos failed to upload. You can retry below.')
        return { success: false }
      }
    }
    setUploadProgress(null)
    return { success: true }
  }

  const handleNext = (e) => {
    e?.preventDefault()
    if (!title.trim()) {
      setError('Please give this memory a title')
      return
    }
    if (!date) {
      setError('Please choose a date')
      return
    }
    setError('')
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setLoading(true)
    setError('')

    let memory = pendingMemory
    if (!memory) {
      const { data, error: saveError } = await createMemory({
        date,
        title: title.trim(),
        place_name: place.trim() || null,
        mood,
        body: body.trim() || null,
        caption: caption.trim() || null,
        is_favorite: isFavorite,
      })

      if (saveError) {
        setLoading(false)
        setError(saveError.message || 'Failed to save memory')
        return
      }
      memory = data
    }

    if (photos.length > 0) {
      const result = await runUploads(memory)
      setLoading(false)
      if (!result.success) return // stays open with a Retry uploads button; memory already saved
    } else {
      setLoading(false)
    }

    toast('Memory etched in time ✨')
    resetForm()
    onSuccess?.(memory)
    onClose?.()
  }

  const handleRetryUploads = async () => {
    if (!pendingMemory) return
    setLoading(true)
    setError('')
    const memory = pendingMemory
    const result = await runUploads(memory)
    setLoading(false)
    if (result.success) {
      toast('Memory etched in time ✨')
      resetForm()
      onSuccess?.(memory)
      onClose?.()
    }
  }

  // Block backdrop/Esc/close-button dismissal while an upload is in flight
  const handleClose = () => {
    if (uploadProgress) return
    onClose?.()
  }

  // Auto-scroll to the newest thumbnail when photos are added
  const lastThumbRef = useRef(null)
  const prevPhotoCount = useRef(0)
  useEffect(() => {
    if (photos.length > prevPhotoCount.current) {
      lastThumbRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    prevPhotoCount.current = photos.length
  }, [photos.length])

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidthClass="max-w-lg"
      title={
        <>
          <span>{step === 1 ? 'New Memory' : 'The Story'}</span>
          <div className="flex items-center gap-2 mt-3">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-accent' : 'bg-surface-2'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-accent' : 'bg-surface-2'}`} />
          </div>
        </>
      }
      footer={
        step === 1 ? (
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" form="memory-step1-form">
              Continue
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {uploadProgress && (
              <p className="text-xs text-ink-muted text-center">
                Uploading {uploadProgress.done + 1} of {uploadProgress.total}...
              </p>
            )}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setStep(1)}
                disabled={loading || !!pendingMemory}
              >
                <ArrowLeft size={14} className="mr-1.5" />
                Back
              </Button>
              {pendingMemory ? (
                <Button variant="primary" size="md" type="button" onClick={handleRetryUploads} disabled={loading}>
                  {loading ? 'Retrying...' : 'Retry uploads'}
                </Button>
              ) : (
                <Button variant="primary" size="md" type="submit" form="memory-step2-form" disabled={loading}>
                  {loading ? 'Preserving...' : 'Save Memory'}
                </Button>
              )}
            </div>
          </div>
        )
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 rounded-[var(--r-xs)] bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              id="memory-step1-form"
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleNext}
              className="space-y-4"
            >
              {/* Date Input preset */}
              <Input
                id="memory-date"
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />

              {/* Title */}
              <Input
                id="memory-title"
                label="Title"
                placeholder="A walk in the rain, midnight waffles..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />

              {/* Place */}
              <PlaceSearch
                id="memory-place"
                label="Place (optional)"
                placeholder="Montmartre, our balcony, cafe corner..."
                value={place}
                onChange={setPlace}
              />

              {/* Mood picker */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted block mb-2">
                  Mood
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMood(m.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-[var(--r-xs)] border text-xs font-medium transition-all ${
                        mood === m.id
                          ? 'border-accent bg-accent-soft text-ink font-semibold'
                          : 'border-line bg-surface hover:bg-surface-2 text-ink-muted'
                      }`}
                    >
                      <span className="text-base">{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted block mb-2">
                  Photos (optional)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragActive(true)
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragActive(false)
                    addFiles(e.dataTransfer.files)
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-[var(--r-sm)] border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
                    dragActive ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-2'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files)
                      e.target.value = ''
                    }}
                  />
                  <ImagePlus size={18} className="mx-auto mb-1.5 text-ink-muted" />
                  <p className="text-xs text-ink-muted">
                    <span className="text-accent font-medium">+ Add photos</span> or drag and drop
                  </p>
                </div>

                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {photos.map((p, i) => (
                      <div
                        key={p.id}
                        ref={i === photos.length - 1 ? lastThumbRef : null}
                        className="relative w-[88px] h-[88px] flex-shrink-0 rounded-[var(--r-xs)] overflow-hidden group"
                      >
                        <img
                          src={p.previewUrl}
                          alt=""
                          onClick={() => setCoverId(p.id)}
                          className="w-full h-full object-cover cursor-pointer"
                        />
                        {p.id === coverId && (
                          <span className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-accent text-accent-ink">
                            <Star size={9} className="fill-current" /> Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(p.id)}
                          aria-label="Remove photo"
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.form>
          ) : (
            <motion.form
              id="memory-step2-form"
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <Textarea
                id="memory-body"
                label="Notes & Story"
                placeholder="What did you talk about? What made you laugh or hold each other close?"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />

              <Input
                id="memory-caption"
                label="Short Highlight or Quote"
                placeholder="'I knew then this was forever.'"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />

              {/* Favorite Toggle */}
              <div className="flex items-center justify-between p-3 rounded-[var(--r-xs)] border border-line bg-surface-2">
                <span className="text-xs font-medium text-ink flex items-center gap-1.5">
                  <Heart
                    size={15}
                    className={isFavorite ? 'fill-accent text-accent' : 'text-ink-muted'}
                  />
                  Mark as Favorite
                </span>
                <button
                  type="button"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    isFavorite ? 'bg-accent' : 'bg-surface border border-line'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      isFavorite ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
