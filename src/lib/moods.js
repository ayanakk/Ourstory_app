export const MOODS = [
  { id: 'romantic', emoji: '✨', label: 'Romantic' },
  { id: 'celebratory', emoji: '🥂', label: 'Celebration' },
  { id: 'peaceful', emoji: '🌿', label: 'Peaceful' },
  { id: 'adventurous', emoji: '🚀', label: 'Adventure' },
  { id: 'happy', emoji: '☀️', label: 'Joyful' },
  { id: 'grateful', emoji: '🤍', label: 'Grateful' },
  { id: 'nostalgic', emoji: '🥹', label: 'Nostalgic' },
  { id: 'funny', emoji: '😂', label: 'Funny' },
  { id: 'cozy', emoji: '☕', label: 'Cozy' },
  { id: 'excited', emoji: '🎉', label: 'Excited' },
  { id: 'emotional', emoji: '😭', label: 'Emotional' },
  { id: 'silly', emoji: '🤪', label: 'Silly' },
  { id: 'tired', emoji: '😴', label: 'Tired' },
  { id: 'proud', emoji: '🏆', label: 'Proud' },
  { id: 'cheeky', emoji: '😏', label: 'Cheeky' },
  { id: 'curious', emoji: '🧭', label: 'Curious' },
]

const MOOD_MAP = Object.fromEntries(MOODS.map((m) => [m.id, m]))
const CUSTOM_PREFIX = 'custom:'
export const MAX_CUSTOM_LABEL = 20

export function isCustomMood(value) {
  return typeof value === 'string' && value.startsWith(CUSTOM_PREFIX)
}

export function makeCustomMood(emoji, label) {
  const e = emoji.trim() || '✨'
  const l = label.trim().slice(0, MAX_CUSTOM_LABEL)
  return l ? `${CUSTOM_PREFIX}${e} ${l}` : ''
}

export function parseCustomMood(value) {
  const rest = value.slice(CUSTOM_PREFIX.length)
  const i = rest.indexOf(' ')
  return i === -1
    ? { emoji: '✨', label: rest }
    : { emoji: rest.slice(0, i), label: rest.slice(i + 1) }
}

/** Resolve a stored mood value to { id, emoji, label }, or null. */
export function getMood(value) {
  if (!value) return null
  if (MOOD_MAP[value]) return MOOD_MAP[value]
  if (isCustomMood(value)) return { id: value, ...parseCustomMood(value) }
  return { id: value, emoji: '✨', label: value }
}
