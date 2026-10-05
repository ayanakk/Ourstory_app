import { useState, useEffect, useRef } from 'react'
import { ImagePlus, Star, X } from 'lucide-react'
import Modal from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import SignedImage from '../story/SignedImage'
import PlaceSearch from './PlaceSearch'
import { MOODS } from './CreateMemoryWizard'
import { supabase } from '../../lib/supabase'
import { compressImage, uploadPhoto, deletePhotoFiles } from '../../lib/photos'
import { useSpace } from '../../hooks/useSpace'
import { useAuth } from '../../hooks/useAuth'

const MAX_PHOTOS = 20
const MAX_PHOTO_MB = 15

/**
 * Edits a memory's details and photos. `onSave(fields)` updates the memory row;
 * `onPhotosChanged()` runs afterwards if anything about the photos changed.
 */
export default function EditMemoryModal({ open, memory, onClose, onSave, onPhotosChanged }) {
  const { space } = useSpace()
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const [existing, setExisting] = useState([]) // saved photo rows still on the memory
  const [removedIds, setRemovedIds] = useState([])
  const [added, setAdded] = useState([]) // { id, file, previewUrl }
  const [coverId, setCoverId] = useState(null)
  const [form, setForm] = useState({ date: '', title: '', place: '', mood: '', body: '', caption: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && memory) {
      setForm({
        date: memory.date || '',
        title: memory.title || '',
        place: memory.place_name || '',
        mood: memory.mood || '',
        body: memory.body || '',
        caption: memory.caption || '',
      })
      setError('')
      setExisting(memory.photos || [])
      setRemovedIds([])
      setAdded([])
      setCoverId(memory.cover_photo_id || memory.photos?.[0]?.id || null)
    }
  }, [open, memory])

  const visibleExisting = existing.filter((p) => !removedIds.includes(p.id))
  const photoCount = visibleExisting.length + added.length

  const addFiles = (fileList) => {
    const accepted = []
    for (const file of Array.from(fileList || [])) {
      if (photoCount + accepted.length >= MAX_PHOTOS) {
        toast(`You can have up to ${MAX_PHOTOS} photos`)
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
      setAdded((prev) => [...prev, ...accepted])
      if (!coverId) setCoverId(accepted[0].id)
    }
  }

  const removeExisting = (id) => {
    setRemovedIds((prev) => [...prev, id])
    if (coverId === id) {
      const next = visibleExisting.find((p) => p.id !== id)?.id || added[0]?.id || null
      setCoverId(next)
    }
  }

  const removeAdded = (id) => {
    setAdded((prev) => {
      const gone = prev.find((p) => p.id === id)
      if (gone) URL.revokeObjectURL(gone.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
    if (coverId === id) {
      setCoverId(visibleExisting[0]?.id || added.find((p) => p.id !== id)?.id || null)
    }
  }

  /** Applies removals, uploads and the cover choice. Returns true if every step worked. */
  const savePhotos = async () => {
    let ok = true

    if (removedIds.length) {
      const paths = existing.filter((p) => removedIds.includes(p.id)).map((p) => p.path)
      const { error: delErr } = await supabase.from('photos').delete().in('id', removedIds)
      if (delErr) ok = false
      else await deletePhotoFiles(paths)
    }

    let finalCover = coverId
    for (const item of added) {
      try {
        const compressed = await compressImage(item.file)
        const { path, error: upErr } = await uploadPhoto(space.id, memory.id, compressed)
        if (upErr || !path) throw upErr || new Error('Upload failed')
        const { data: row, error: insErr } = await supabase
          .from('photos')
          .insert({ space_id: space.id, memory_id: memory.id, path, uploaded_by: user.id })
          .select()
          .single()
        if (insErr) throw insErr
        if (item.id === coverId) finalCover = row.id
      } catch (err) {
        console.error('Photo upload failed:', err)
        ok = false
        if (item.id === coverId) finalCover = null
      }
    }

    if ((finalCover || null) !== (memory.cover_photo_id || null)) {
      const { error: coverErr } = await supabase.from('memories').update({ cover_photo_id: finalCover }).eq('id', memory.id)
      if (coverErr) ok = false
    }
    return ok
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) {
      setError('A memory needs a date and a title')
      return
    }
    setLoading(true)
    setError('')
    const { error: saveError } = await onSave({
      date: form.date,
      title: form.title.trim(),
      place_name: form.place.trim() || null,
      mood: form.mood || null,
      body: form.body.trim() || null,
      caption: form.caption.trim() || null,
    })
    if (saveError) {
      setLoading(false)
      setError(saveError.message || 'Failed to save')
      return
    }
    const photosChanged = removedIds.length > 0 || added.length > 0 || (coverId || null) !== (memory.cover_photo_id || memory.photos?.[0]?.id || null)
    if (photosChanged) {
      const ok = await savePhotos()
      if (!ok) toast('Some photo changes could not be saved')
      added.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      await onPhotosChanged?.()
    }
    setLoading(false)
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose?.()}
      title="Edit memory"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" form="edit-memory-form" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
      <form id="edit-memory-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-[var(--r-xs)] bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
            {error}
          </div>
        )}
        <Input id="edit-memory-date" label="Date" type="date" value={form.date} onChange={set('date')} required />
        <Input id="edit-memory-title" label="Title" value={form.title} onChange={set('title')} required />
        <PlaceSearch
          id="edit-memory-place"
          label="Place (optional)"
          placeholder="Montmartre, our balcony, cafe corner..."
          value={form.place}
          onChange={(place) => setForm((f) => ({ ...f, place }))}
        />
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted block mb-2">Mood</label>
          <div className="grid grid-cols-3 gap-2">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, mood: f.mood === m.id ? '' : m.id }))}
                className={`flex items-center gap-2 p-2.5 rounded-[var(--r-xs)] border text-xs font-medium transition-all ${
                  form.mood === m.id
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
        <Textarea id="edit-memory-body" label="The story (optional)" rows={5} value={form.body} onChange={set('body')} />
        <Input id="edit-memory-caption" label="Caption (optional)" value={form.caption} onChange={set('caption')} />

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted block mb-2">
            Photos ({photoCount})
          </label>
          <div className="flex flex-wrap gap-2">
            {visibleExisting.map((p) => (
              <div key={p.id} className="relative w-[88px] h-[88px] flex-shrink-0 rounded-[var(--r-xs)] overflow-hidden">
                <button type="button" onClick={() => setCoverId(p.id)} aria-label="Make cover photo" className="block w-full h-full">
                  <SignedImage path={p.path} alt="" className="w-full h-full object-cover" />
                </button>
                {p.id === coverId && (
                  <span className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-accent text-accent-ink">
                    <Star size={9} className="fill-current" /> Cover
                  </span>
                )}
                {p.uploaded_by === user?.id && (
                  <button
                    type="button"
                    onClick={() => removeExisting(p.id)}
                    aria-label="Remove photo"
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            {added.map((p) => (
              <div key={p.id} className="relative w-[88px] h-[88px] flex-shrink-0 rounded-[var(--r-xs)] overflow-hidden">
                <img src={p.previewUrl} alt="" onClick={() => setCoverId(p.id)} className="w-full h-full object-cover cursor-pointer" />
                {p.id === coverId && (
                  <span className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-accent text-accent-ink">
                    <Star size={9} className="fill-current" /> Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeAdded(p.id)}
                  aria-label="Remove photo"
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-[88px] h-[88px] flex-shrink-0 rounded-[var(--r-xs)] border-2 border-dashed border-line hover:bg-surface-2 flex flex-col items-center justify-center gap-1 text-ink-muted"
            >
              <ImagePlus size={18} />
              <span className="text-[10px] font-medium text-accent">Add</span>
            </button>
          </div>
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
          <p className="text-[11px] text-ink-muted mt-2">Tap a photo to make it the cover. You can only remove photos you added.</p>
        </div>
      </form>
    </Modal>
  )
}
