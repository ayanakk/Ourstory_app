import { useState, useRef } from 'react'
import { ImagePlus, Video, X } from 'lucide-react'
import Modal from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import { useSpace } from '../../hooks/useSpace'
import { useAuth } from '../../hooks/useAuth'
import { getTodayYMD, parseYMD, formatYMD } from '../../lib/milestones'

const MAX_PHOTOS = 10
const MAX_PHOTO_MB = 15
const MAX_VIDEO_MB = 50

function tomorrowYMD() {
  const p = parseYMD(getTodayYMD())
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + 1))
  return formatYMD(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
}

const chip = (active) =>
  `px-3 py-2 rounded-[var(--r-xs)] border text-xs font-medium transition-all ${
    active
      ? 'border-accent bg-accent-soft text-ink font-semibold'
      : 'border-line bg-surface hover:bg-surface-2 text-ink-muted'
  }`

export default function CreateCapsuleModal({ open, onClose, onCreate }) {
  const { partner } = useSpace()
  const { user } = useAuth()
  const photoInput = useRef(null)
  const videoInput = useRef(null)
  const [kind, setKind] = useState('capsule')
  const [toUser, setToUser] = useState('') // letters: recipient user id
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [date, setDate] = useState('')
  const [photos, setPhotos] = useState([])
  const [video, setVideo] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setKind('capsule'); setToUser(''); setTitle(''); setBody(''); setDate('')
    photos.forEach((p) => URL.revokeObjectURL(p.url))
    setPhotos([]); setVideo(null); setError('')
  }

  const close = () => {
    if (saving) return
    reset()
    onClose()
  }

  const addPhotos = (fileList) => {
    const accepted = []
    for (const file of Array.from(fileList || [])) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        toast(`${file.name} is over ${MAX_PHOTO_MB} MB`)
        continue
      }
      if (photos.length + accepted.length >= MAX_PHOTOS) {
        toast(`You can add up to ${MAX_PHOTOS} photos`)
        break
      }
      accepted.push({ file, url: URL.createObjectURL(file) })
    }
    setPhotos((prev) => [...prev, ...accepted])
  }

  const addVideo = (file) => {
    if (!file) return
    if (!file.type.startsWith('video/')) return toast('Please choose a video file')
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) return toast(`Videos can be up to ${MAX_VIDEO_MB} MB`)
    setVideo(file)
  }

  const submit = async () => {
    if (!title.trim()) return setError('Give it a title')
    if (!date || date < tomorrowYMD()) return setError('Pick an opening date from tomorrow onwards')
    if (!body.trim() && !photos.length && !video) return setError('Add a message, a photo or a video')
    if (kind === 'letter' && !toUser) return setError('Choose who the letter is for')
    setError('')
    setSaving(true)
    const { error: err } = await onCreate({
      kind,
      toUser: kind === 'letter' ? toUser : null,
      title: title.trim(),
      body: body.trim(),
      // UTC midnight keeps the opening day identical to the calendar on Home
      opensAt: `${date}T00:00:00Z`,
      photos: photos.map((p) => p.file),
      video,
    })
    setSaving(false)
    if (err) return setError(err.message || 'Could not seal the capsule. Please try again.')
    toast('Sealed. It will open on the day.')
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={<span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Seal a capsule</span>}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Seal it</Button>
        </div>
      }
      bodyClassName="space-y-5"
    >
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2">
        <button type="button" className={chip(kind === 'capsule')} onClick={() => setKind('capsule')}>
          💌 Time capsule (both)
        </button>
        <button type="button" className={chip(kind === 'letter')} onClick={() => setKind('letter')}>
          ✉️ Letter
        </button>
      </div>

      {kind === 'letter' && (
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2">
          <button type="button" className={chip(toUser === user?.id)} onClick={() => setToUser(user.id)}>
            To future me
          </button>
          <button
            type="button"
            disabled={!partner}
            className={`${chip(!!partner && toUser === partner.user_id)} disabled:opacity-50`}
            onClick={() => setToUser(partner.user_id)}
          >
            To {partner?.display_name || 'my partner'}
          </button>
        </div>
      )}

      <Input id="capsule-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Open on our anniversary" />
      <Textarea id="capsule-body" label="Your message" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
      <Input
        id="capsule-date"
        type="date"
        label="Opens on"
        min={tomorrowYMD()}
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted block">Photos & video (optional)</label>
        <div className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <div key={p.url} className="relative w-[72px] h-[72px] rounded-[var(--r-xs)] overflow-hidden">
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => {
                  URL.revokeObjectURL(p.url)
                  setPhotos((prev) => prev.filter((_, j) => j !== i))
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => photoInput.current?.click()}>
            <ImagePlus size={14} className="mr-1.5" /> Photos
          </Button>
          <Button variant="secondary" size="sm" onClick={() => videoInput.current?.click()}>
            <Video size={14} className="mr-1.5" /> Video
          </Button>
        </div>
        {video && (
          <p className="text-xs text-ink-muted flex items-center gap-2">
            {video.name} ({(video.size / 1024 / 1024).toFixed(1)} MB)
            <button type="button" onClick={() => setVideo(null)} aria-label="Remove video"><X size={12} /></button>
          </p>
        )}
        <input ref={photoInput} type="file" accept="image/*" multiple hidden
          onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
        <input ref={videoInput} type="file" accept="video/*" hidden
          onChange={(e) => { addVideo(e.target.files?.[0]); e.target.value = '' }} />
      </div>

      {error && <p className="text-sm text-red-500 font-medium" role="alert">{error}</p>}
    </Modal>
  )
}
