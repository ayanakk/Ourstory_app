import { useState, useEffect } from 'react'
import { MapPin, Utensils, Film, ShoppingBag, Compass, Plane, Star } from 'lucide-react'
import Modal from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'

const CATEGORIES = [
  { id: 'place', label: 'Place', Icon: MapPin },
  { id: 'restaurant', label: 'Restaurant', Icon: Utensils },
  { id: 'movie', label: 'Movie', Icon: Film },
  { id: 'buy', label: 'Buy', Icon: ShoppingBag },
  { id: 'experience', label: 'Experience', Icon: Compass },
  { id: 'trip', label: 'Trip', Icon: Plane },
]

const PRIORITIES = [
  { value: 1, label: 'High' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Low' },
]

export function categoryIcon(category) {
  return CATEGORIES.find((c) => c.id === category)?.Icon || Star
}

export default function AddBucketItemModal({ open, date, onClose, onAdd }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('place')
  const [priority, setPriority] = useState(2)
  const [notes, setNotes] = useState('')
  const [place, setPlace] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setTitle('')
      setCategory('place')
      setPriority(2)
      setNotes('')
      setPlace('')
      setError('')
    }
  }, [open])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!title.trim()) {
      setError('Please give this idea a title')
      return
    }
    setLoading(true)
    setError('')
    const { error: saveError } = await onAdd({
      title: title.trim(),
      category,
      priority,
      notes: notes.trim() || null,
      place_name: place.trim() || null,
      target_date: date,
    })
    setLoading(false)
    if (saveError) {
      setError(saveError.message || 'Failed to save')
      return
    }
    toast('Added to your bucket list')
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to Bucket List"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" form="bucket-item-form" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
      <form id="bucket-item-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-[var(--r-xs)] bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
            {error}
          </div>
        )}

        <Input
          id="bucket-title"
          label="Title"
          placeholder="Watch the sunrise, try that ramen place..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted block mb-2">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`flex items-center gap-1.5 p-2.5 rounded-[var(--r-xs)] border text-xs font-medium transition-all ${
                  category === id
                    ? 'border-accent bg-accent-soft text-ink font-semibold'
                    : 'border-line bg-surface hover:bg-surface-2 text-ink-muted'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted block mb-2">
            Priority
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`p-2 rounded-[var(--r-xs)] border text-xs font-medium transition-all ${
                  priority === p.value
                    ? 'border-accent bg-accent-soft text-ink font-semibold'
                    : 'border-line bg-surface hover:bg-surface-2 text-ink-muted'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          id="bucket-place"
          label="Place (optional)"
          placeholder="Where, if anywhere specific..."
          value={place}
          onChange={(e) => setPlace(e.target.value)}
        />

        <Textarea
          id="bucket-notes"
          label="Notes (optional)"
          placeholder="Any details worth remembering..."
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </Modal>
  )
}
