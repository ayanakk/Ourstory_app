/**
 * Built-in couple special days (same every year) and expansion of user-added
 * yearly dates (birthdays etc.) into concrete YYYY-MM-DD dates for a year.
 * Rules are either a fixed { month, day } or { month, nth, weekday } (0 = Sunday).
 */
import { formatYMD } from './milestones'

export const SPECIAL_DAYS = [
  { id: 'newyear', month: 1, day: 1, emoji: '🎆', title: "New Year's Day", description: "Start the year together - share goals and a New Year's kiss." },
  { id: 'cuddle', month: 1, day: 6, emoji: '🛋️', title: 'National Cuddle Up Day', description: 'Cozy day in with your partner (US).' },
  { id: 'korea-diary', month: 1, day: 14, emoji: '📔', title: 'Diary Day (Korea 14th-day series)', description: 'Couples traditionally exchange diaries/planners for the new year.' },
  { id: 'hug-jan', month: 1, day: 21, emoji: '🤗', title: 'National Hug Day', description: 'Hug day - a long one.' },
  { id: 'dwynwen', month: 1, day: 25, emoji: '🕯️', title: "St Dwynwen's Day (Welsh Valentine's)", description: 'Welsh day of love and lovers.' },
  { id: 'rose', month: 2, day: 7, emoji: '🌹', title: 'Rose Day', description: "Valentine's Week day 1 (India/South Asia). Give a rose." },
  { id: 'propose', month: 2, day: 8, emoji: '💍', title: 'Propose Day', description: "Valentine's Week day 2. Express your feelings / propose." },
  { id: 'choc', month: 2, day: 9, emoji: '🍫', title: 'Chocolate Day', description: "Valentine's Week day 3. Gift chocolates." },
  { id: 'teddy', month: 2, day: 10, emoji: '🧸', title: 'Teddy Day', description: "Valentine's Week day 4. Gift a teddy." },
  { id: 'promise', month: 2, day: 11, emoji: '🤞', title: 'Promise Day', description: "Valentine's Week day 5. Make or renew a promise." },
  { id: 'hug', month: 2, day: 12, emoji: '🤗', title: 'Hug Day', description: "Valentine's Week day 6." },
  { id: 'kiss', month: 2, day: 13, emoji: '💋', title: 'Kiss Day', description: "Valentine's Week day 7." },
  { id: 'valentine', month: 2, day: 14, emoji: '❤️', title: "Valentine's Day", description: 'The big one. Book dinner / plan ahead.' },
  { id: 'womens', month: 3, day: 8, emoji: '🌸', title: "International Women's Day", description: 'A message or small gesture for your partner.' },
  { id: 'white', month: 3, day: 14, emoji: '🤍', title: 'White Day (Japan/Korea)', description: "One month after Valentine's - the return-gift day." },
  { id: 'proposal-day', month: 3, day: 20, emoji: '💎', title: 'National Proposal Day', description: 'Popular day for proposals (US).' },
  { id: 'santjordi', month: 4, day: 23, emoji: '🌹', title: 'Sant Jordi (Catalonia)', description: 'Couples exchange a rose and a book.' },
  { id: 'kr-rose', month: 5, day: 14, emoji: '🌹', title: 'Rose Day (Korea)', description: 'Couples exchange roses (Korea 14th-day series).' },
  { id: 'cn520', month: 5, day: 20, emoji: '💗', title: '520 - Chinese Internet Valentine\'s Day', description: "5/20 sounds like 'I love you' in Mandarin. Say it." },
  { id: 'namorados', month: 6, day: 12, emoji: '📍', title: 'Dia dos Namorados (Brazil) / Loving Day', description: "Brazilian Lovers' Day; also Loving Day (celebrating love across all backgrounds)." },
  { id: 'kr-kiss', month: 6, day: 14, emoji: '💋', title: 'Kiss Day (Korea)', description: 'Korea 14th-day series.' },
  { id: 'kissing', month: 7, day: 6, emoji: '😘', title: 'International Kissing Day', description: 'World Kiss Day.' },
  { id: 'tanabata', month: 7, day: 7, emoji: '🎋', title: 'Tanabata (star lovers festival)', description: 'Japanese festival of the star-crossed lovers Orihime and Hikoboshi.' },
  { id: 'kr-silver', month: 7, day: 14, emoji: '💍', title: 'Silver Day (Korea)', description: 'Couples exchange silver rings/jewellery (Korea 14th-day series).' },
  { id: 'girlfriend', month: 8, day: 1, emoji: '👩', title: 'National Girlfriend Day', description: 'Informal day to celebrate your girlfriend (US).' },
  { id: 'friendship', month: 8, nth: 1, weekday: 0, emoji: '🫶', title: 'Friendship Day (1st Sunday of Aug)', description: 'Celebrate your partner as your best friend.' },
  { id: 'kr-green', month: 8, day: 14, emoji: '🌳', title: 'Green Day (Korea)', description: 'Couples walk in a forest/park (Korea 14th-day series).' },
  { id: 'kr-photo', month: 9, day: 14, emoji: '📸', title: 'Photo Day (Korea)', description: 'Couples take photos together (Korea 14th-day series).' },
  { id: 'boyfriend', month: 10, day: 3, emoji: '👨', title: 'National Boyfriend Day', description: 'Informal day to celebrate your boyfriend (US).' },
  { id: 'kr-wine', month: 10, day: 14, emoji: '🍷', title: 'Wine Day (Korea)', description: 'Share a glass of wine (Korea 14th-day series).' },
  { id: 'sweetest', month: 10, nth: 3, weekday: 6, emoji: '🍬', title: 'Sweetest Day (3rd Saturday of Oct, US)', description: 'Do something sweet for your partner.' },
  { id: 'pepero', month: 11, day: 11, emoji: '🍫', title: 'Pepero Day (Korea)', description: 'Couples exchange Pepero sticks/snacks.' },
  { id: 'kr-movie', month: 11, day: 14, emoji: '🎬', title: 'Movie Day (Korea)', description: 'Go see a movie together (Korea 14th-day series).' },
  { id: 'mensday', month: 11, day: 19, emoji: '🌟', title: "International Men's Day", description: 'A message or gesture for your partner.' },
  { id: 'kr-hug', month: 12, day: 14, emoji: '🤗', title: 'Hug Day (Korea)', description: 'Korea 14th-day series. Last of the year.' },
  { id: 'xmaseve', month: 12, day: 24, emoji: '🎄', title: "Christmas Eve - Couples' Date Night", description: "Big couples' date night in Japan/Korea and a good excuse anywhere." },
  { id: 'xmas', month: 12, day: 25, emoji: '🎁', title: 'Christmas', description: 'Celebrate together.' },
  { id: 'nye', month: 12, day: 31, emoji: '🥂', title: "New Year's Eve Kiss", description: 'Midnight kiss and year-end reflection together.' },
]

function nthWeekday(year, month, nth, weekday) {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  return 1 + ((weekday - firstDow + 7) % 7) + (nth - 1) * 7
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Built-in special days for one year: [{ id, date, emoji, title, description, builtIn }] */
export function getSpecialDays(year) {
  return SPECIAL_DAYS.map((d) => ({
    id: d.id,
    date: formatYMD(year, d.month, d.nth ? nthWeekday(year, d.month, d.nth, d.weekday) : d.day),
    emoji: d.emoji,
    title: d.title,
    description: d.description,
    builtIn: true,
  }))
}

/** User-added yearly rows ({ id, title, emoji, month, day, year_started, note }) for one year. */
export function expandYearlyDates(rows, year) {
  return rows.map((r) => {
    // Feb 29 falls back to the last day of February in non-leap years
    const day = Math.min(r.day, daysInMonth(year, r.month))
    const years = r.year_started ? year - r.year_started : null
    return {
      id: r.id,
      date: formatYMD(year, r.month, day),
      emoji: r.emoji || '🎉',
      title: r.title,
      description: [years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}` : null, r.note].filter(Boolean).join(' · '),
      builtIn: false,
    }
  })
}
