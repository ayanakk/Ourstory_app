import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { Input } from '../ui/Input'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import { parseYMD } from '../../lib/milestones'

export default function AddYearlyDateModal({ open, date, onClose, onAdd }) {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🎂')
  const [yearStarted, setYearStarted] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setTitle('')
      setEmoji('🎂')
      setYearStarted('')
      setError('')
    }
  }, [open])

  const parsed = parseYMD(date)

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!title.trim()) {
      setError('Please give this date a title')
      return
    }
    const year = yearStarted ? parseInt(yearStarted, 10) : null
    if (yearStarted && (isNaN(year) || year < 1900 || year > 2100)) {
      setError('Enter a valid 4-digit year, or leave it empty')
      return
    }
    setLoading(true)
    setError('')
    const { error: saveError } = await onAdd({
      title: title.trim(),
      emoji: emoji.trim() || null,
      month: parsed.month,
      day: parsed.day,
      year_started: year,
    })
    setLoading(false)
    if (saveError) {
      setError(saveError.message || 'Failed to save')
      return
    }
    toast('Added - it will show every year')
    onClose?.()
  }

  const label = parsed
    ? new Date(parsed.year, parsed.month - 1, parsed.day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : ''

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a yearly date"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" form="yearly-date-form" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
      <form id="yearly-date-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-[var(--r-xs)] bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
            {error}
          </div>
        )}
        <p className="text-xs text-ink-muted">Repeats every year on {label}.</p>
        <Input
          id="yearly-title"
          label="Title"
          placeholder="Mom's birthday, our first date..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
        <Input
          id="yearly-emoji"
          label="Emoji"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={4}
        />
        <Input
          id="yearly-year"
          label="Starting year (optional)"
          placeholder="e.g. 1998 - shows how many years"
          inputMode="numeric"
          value={yearStarted}
          onChange={(e) => setYearStarted(e.target.value)}
        />
      </form>
    </Modal>
  )
}
