import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Calendar, MapPin, Smile, ArrowRight, ArrowLeft, Heart, Check } from 'lucide-react'
import Modal from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import { useMemories } from '../../hooks/useMemories'
import { getTodayYMD } from '../../lib/milestones'

export const MOODS = [
  { id: 'romantic', emoji: '✨', label: 'Romantic' },
  { id: 'celebratory', emoji: '🥂', label: 'Celebration' },
  { id: 'peaceful', emoji: '🌿', label: 'Peaceful' },
  { id: 'adventurous', emoji: '🚀', label: 'Adventure' },
  { id: 'happy', emoji: '☀️', label: 'Joyful' },
  { id: 'grateful', emoji: '🤍', label: 'Grateful' },
]

export default function CreateMemoryWizard({ open, onClose, initialDate, onSuccess }) {
  const { createMemory } = useMemories()
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

  // Sync initialDate prop when modal opens or initialDate changes
  useEffect(() => {
    if (open) {
      setDate(initialDate || getTodayYMD())
      setStep(1)
      setError('')
    }
  }, [open, initialDate])

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

    const { error: saveError } = await createMemory({
      date,
      title: title.trim(),
      place_name: place.trim() || null,
      mood,
      body: body.trim() || null,
      caption: caption.trim() || null,
      is_favorite: isFavorite,
    })

    setLoading(false)

    if (saveError) {
      setError(saveError.message || 'Failed to save memory')
      return
    }

    toast('Memory etched in time ✨')
    // Reset fields
    setTitle('')
    setPlace('')
    setBody('')
    setCaption('')
    setIsFavorite(false)
    setStep(1)

    onSuccess?.()
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === 1 ? 'New Memory' : 'The Story'}
    >
      <div className="space-y-5">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`h-1 flex-1 rounded-full transition-colors ${
              step >= 1 ? 'bg-accent' : 'bg-surface-2'
            }`}
          />
          <div
            className={`h-1 flex-1 rounded-full transition-colors ${
              step >= 2 ? 'bg-accent' : 'bg-surface-2'
            }`}
          />
        </div>

        {error && (
          <div className="p-3 rounded-[var(--r-xs)] bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
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
              <Input
                id="memory-place"
                label="Place (optional)"
                placeholder="Montmartre, our balcony, cafe corner..."
                value={place}
                onChange={(e) => setPlace(e.target.value)}
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

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit">
                  Continue
                  <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.form
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

              <div className="flex items-center justify-between pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  <ArrowLeft size={14} className="mr-1.5" />
                  Back
                </Button>
                <Button variant="primary" size="md" type="submit" disabled={loading}>
                  {loading ? 'Preserving...' : 'Save Memory'}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
