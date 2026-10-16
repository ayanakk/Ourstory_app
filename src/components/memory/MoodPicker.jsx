import { useState } from 'react'
import { MOODS, MAX_CUSTOM_LABEL, isCustomMood, makeCustomMood, parseCustomMood } from '../../lib/moods'

const chip = (active) =>
  `flex items-center gap-2 p-2.5 rounded-[var(--r-xs)] border text-xs font-medium transition-all ${
    active
      ? 'border-accent bg-accent-soft text-ink font-semibold'
      : 'border-line bg-surface hover:bg-surface-2 text-ink-muted'
  }`

const field =
  'px-3 py-2 rounded-[var(--r-sm)] border border-line bg-surface-2 text-ink text-sm font-sans ' +
  'placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'

/** Mood chips plus an "Other" custom mood. Clicking the selected chip clears it. */
export default function MoodPicker({ value, onChange }) {
  const custom = isCustomMood(value) ? parseCustomMood(value) : null
  const [otherOpen, setOtherOpen] = useState(!!custom)
  const [emoji, setEmoji] = useState(custom?.emoji ?? '')
  const [label, setLabel] = useState(custom?.label ?? '')

  const update = (e, l) => {
    setEmoji(e)
    setLabel(l)
    onChange(makeCustomMood(e, l))
  }

  const pick = (id) => {
    setOtherOpen(false)
    onChange(value === id ? '' : id)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
        {MOODS.map((m) => (
          <button key={m.id} type="button" onClick={() => pick(m.id)} className={chip(value === m.id)}>
            <span className="text-base">{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            if (otherOpen) {
              setOtherOpen(false)
              if (isCustomMood(value)) onChange('')
            } else {
              setOtherOpen(true)
              onChange(makeCustomMood(emoji, label))
            }
          }}
          className={chip(otherOpen)}
        >
          <span className="text-base">➕</span>
          <span>Other…</span>
        </button>
      </div>
      {otherOpen && (
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => update(e.target.value.slice(0, 4), label)}
            placeholder="😊"
            aria-label="Custom mood emoji"
            className={`${field} w-16 text-center`}
          />
          <input
            value={label}
            onChange={(e) => update(emoji, e.target.value)}
            maxLength={MAX_CUSTOM_LABEL}
            placeholder="Describe the mood"
            aria-label="Custom mood name"
            className={`${field} flex-1`}
          />
        </div>
      )}
    </div>
  )
}
