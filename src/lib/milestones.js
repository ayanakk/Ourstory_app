/**
 * Milestone calculations and 'On this day' comparisons.
 * Uses UTC-safe date math and strictly treats dates as YYYY-MM-DD strings
 * to avoid any timezone shift or off-by-one errors.
 */

export function parseYMD(dateInput) {
  if (!dateInput) return null
  if (typeof dateInput === 'string') {
    const clean = dateInput.split('T')[0].trim()
    const parts = clean.split('-')
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      const d = parseInt(parts[2], 10)
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return { year: y, month: m, day: d, dateString: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
      }
    }
  } else if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const y = dateInput.getFullYear()
    const m = dateInput.getMonth() + 1
    const d = dateInput.getDate()
    return { year: y, month: m, day: d, dateString: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
  }
  return null
}

export function formatYMD(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function getTodayYMD() {
  const now = new Date()
  return formatYMD(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * Returns number of days since startDate (0 if today or future, null if no valid startDate)
 */
export function daysTogether(startDate, asOfDate = null) {
  const start = parseYMD(startDate)
  if (!start) return 0
  const target = asOfDate ? parseYMD(asOfDate) : parseYMD(new Date())
  if (!target) return 0

  const startUtc = Date.UTC(start.year, start.month - 1, start.day)
  const targetUtc = Date.UTC(target.year, target.month - 1, target.day)

  const diffMs = targetUtc - startUtc
  return Math.max(0, Math.floor(diffMs / 86400000))
}

/**
 * Returns milestone dates up to untilDate (or 10 years ahead by default).
 * Includes 7, 30, 50, 100, 200, 365, 500, 1000, 1500, 2000 days,
 * monthly anniversaries, and yearly anniversaries.
 * Returns array of { date: 'YYYY-MM-DD', label: string, type: string }
 */
export function getMilestoneDates(startDate, untilDate = null) {
  const start = parseYMD(startDate)
  if (!start) return []

  const startUtc = Date.UTC(start.year, start.month - 1, start.day)
  
  // Default untilDate: 10 years from start or 5 years from today, whichever is later
  let maxUtc
  if (untilDate) {
    const parsedUntil = parseYMD(untilDate)
    maxUtc = parsedUntil ? Date.UTC(parsedUntil.year, parsedUntil.month - 1, parsedUntil.day) : null
  }
  if (!maxUtc) {
    const now = new Date()
    const tenYearsFromStart = Date.UTC(start.year + 10, start.month - 1, start.day)
    const fiveYearsFromNow = Date.UTC(now.getFullYear() + 5, now.getMonth(), now.getDate())
    maxUtc = Math.max(tenYearsFromStart, fiveYearsFromNow)
  }

  const milestonesMap = new Map() // dateString -> { date, labels: Set, types: Set }

  function addMilestone(ymd, label, type) {
    if (!milestonesMap.has(ymd)) {
      milestonesMap.set(ymd, { date: ymd, labels: new Set(), types: new Set() })
    }
    const entry = milestonesMap.get(ymd)
    entry.labels.add(label)
    entry.types.add(type)
  }

  // 1. Fixed day count milestones
  const dayThresholds = [7, 30, 50, 100, 200, 365, 500, 1000, 1500, 2000]
  for (const count of dayThresholds) {
    const mUtc = startUtc + count * 86400000
    if (mUtc <= maxUtc) {
      const d = new Date(mUtc)
      const ymd = formatYMD(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
      addMilestone(ymd, `${count} days together`, 'day_count')
    }
  }

  // 2. Monthly and yearly anniversaries
  let monthOffset = 1
  while (true) {
    const totalMonths = start.month - 1 + monthOffset
    const targetYear = start.year + Math.floor(totalMonths / 12)
    const targetMonth = (totalMonths % 12) + 1
    const maxDays = daysInMonth(targetYear, targetMonth)
    const targetDay = Math.min(start.day, maxDays)

    const targetUtc = Date.UTC(targetYear, targetMonth - 1, targetDay)
    if (targetUtc > maxUtc) break

    const ymd = formatYMD(targetYear, targetMonth, targetDay)
    if (monthOffset % 12 === 0) {
      const years = monthOffset / 12
      const label = `${years} ${years === 1 ? 'year' : 'years'} together`
      addMilestone(ymd, label, 'anniversary')
    } else {
      const label = `${monthOffset} ${monthOffset === 1 ? 'month' : 'months'} together`
      addMilestone(ymd, label, 'monthly')
    }

    monthOffset++
    if (monthOffset > 1200) break // Safety guard for 100 years
  }

  // Convert to sorted array
  const result = []
  for (const [date, data] of milestonesMap.entries()) {
    result.push({
      date,
      label: Array.from(data.labels).join(' · '),
      types: Array.from(data.types),
    })
  }

  return result.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Returns the full milestone list for a relationship as flat, status-aware
 * entries: the first day, fixed day-count thresholds, and every monthly /
 * yearly anniversary. Each entry is { key, label, date, daysAway, reached }.
 * Also returns nextMilestone (soonest unreached) and latestReached (most
 * recent one already passed).
 */
export function getMilestones(startDate, todayStr = null) {
  const start = parseYMD(startDate)
  if (!start) return { milestones: [], nextMilestone: null, latestReached: null }

  const today = todayStr ? parseYMD(todayStr) : parseYMD(getTodayYMD())
  const todayDateString = today ? today.dateString : getTodayYMD()

  const dated = getMilestoneDates(startDate)

  const entries = [
    { key: 'first_day', label: 'The first day', date: start.dateString },
    ...dated.map((m) => ({
      key: `${m.date}-${m.label.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`,
      label: m.label,
      date: m.date,
    })),
  ]

  const milestones = entries
    .map((m) => ({
      ...m,
      daysAway: daysBetween(todayDateString, m.date),
      reached: m.date <= todayDateString,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const nextMilestone = milestones.find((m) => m.date > todayDateString) || null
  const reachedOnes = milestones.filter((m) => m.reached)
  const latestReached = reachedOnes.length ? reachedOnes[reachedOnes.length - 1] : null

  return { milestones, nextMilestone, latestReached }
}

const MILESTONE_COPY = {
  'The first day': 'Where it all began.',
  '7 days together': 'One week in. Already a story.',
  '30 days together': 'A month of us.',
  '50 days together': '50 days. Still counting, still smiling.',
  '100 days together': '100 days. A hundred small forevers.',
  '200 days together': '200 days deep into something good.',
  '365 days together': '365 days. One full year, made of moments.',
  '500 days together': '500 days. Half a thousand, all worth it.',
  '1000 days together': '1000 days. Thousands of moments. One story.',
  '1500 days together': '1500 days, and still writing.',
  '2000 days together': '2000 days. A story still being written.',
}

/**
 * Short poetic line for a milestone label, e.g. "1000 days together" ->
 * "1000 days. Thousands of moments. One story."
 */
export function milestoneCopy(label) {
  if (!label) return ''
  if (MILESTONE_COPY[label]) return MILESTONE_COPY[label]

  const monthsMatch = label.match(/^(\d+) months? together$/)
  if (monthsMatch) {
    return `${monthsMatch[1]} months of us.`
  }

  const yearsMatch = label.match(/^(\d+) years? together$/)
  if (yearsMatch) {
    const n = yearsMatch[1]
    return `${n} ${n === '1' ? 'year' : 'years'} together, and still going.`
  }

  return 'Another beautiful day in your story.'
}

/**
 * Absolute number of days between two YYYY-MM-DD dates.
 */
export function daysBetween(a, b) {
  const pa = parseYMD(a)
  const pb = parseYMD(b)
  if (!pa || !pb) return 0
  const utcA = Date.UTC(pa.year, pa.month - 1, pa.day)
  const utcB = Date.UTC(pb.year, pb.month - 1, pb.day)
  return Math.round(Math.abs(utcB - utcA) / 86400000)
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Groups memories into a newest-first year -> month -> memories tree,
 * suitable for a chaptered timeline with sticky year/month labels.
 */
export function groupMemoriesByYearMonth(memories) {
  const sorted = [...(memories || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const years = new Map()
  for (const memory of sorted) {
    const parsed = parseYMD(memory.date)
    if (!parsed) continue
    if (!years.has(parsed.year)) years.set(parsed.year, new Map())
    const months = years.get(parsed.year)
    if (!months.has(parsed.month)) months.set(parsed.month, [])
    months.get(parsed.month).push(memory)
  }

  return Array.from(years.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => ({
      year,
      months: Array.from(months.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([month, monthMemories]) => ({
          month,
          monthLabel: MONTH_NAMES[month - 1],
          memories: monthMemories,
        })),
    }))
}

/**
 * Aggregate counts for the "Your story so far" summary: total memories,
 * total photos across all memories, and unique non-empty place names.
 */
export function stats(memories) {
  const list = memories || []
  const places = new Set()
  let photos = 0

  for (const memory of list) {
    if (memory.place_name && memory.place_name.trim()) {
      places.add(memory.place_name.trim())
    }
    photos += memory.photos?.length || 0
  }

  return { memories: list.length, photos, places: places.size }
}

/**
 * Finds memories that occurred on the same month and day in previous years.
 * Returns array of { ...memory, yearsAgo }
 */
export function onThisDay(memories, date) {
  if (!memories || !Array.isArray(memories) || !date) return []
  const target = parseYMD(date)
  if (!target) return []

  const matches = []
  for (const memory of memories) {
    if (!memory.date) continue
    const memDate = parseYMD(memory.date)
    if (!memDate) continue

    if (
      memDate.year < target.year &&
      memDate.month === target.month &&
      memDate.day === target.day
    ) {
      matches.push({
        ...memory,
        yearsAgo: target.year - memDate.year,
      })
    }
  }

  return matches.sort((a, b) => b.date.localeCompare(a.date))
}
