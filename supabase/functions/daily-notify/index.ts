// Runs hourly from pg_cron. For each user whose local time is 9am, sends (per their prefs):
// capsules opening today, special dates / relationship milestones today, and a daily check-in nudge.
// Capsule content is never included, only that one opened.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

export const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

export const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export function authorized(req: Request): boolean {
  const secret = Deno.env.get('PUSH_WEBHOOK_SECRET')
  return !!secret && req.headers.get('x-webhook-secret') === secret
}

export type Payload = { title: string; body: string; url: string; tag?: string }

/** Sends to every subscription of a user and prunes expired ones. Returns the number delivered. */
export async function sendToUser(userId: string, payload: Payload): Promise<number> {
  const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', userId)
  let sent = 0
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      )
      sent++
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) await admin.from('push_subscriptions').delete().eq('id', s.id)
    }
  }
  return sent
}


const SEND_HOUR = 9
const DAY_THRESHOLDS = [7, 30, 50, 100, 200, 365, 500, 1000, 1500, 2000]

function localParts(tz: string, now: Date) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  })
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]))
  return { y: +p.year, m: +p.month, d: +p.day, hour: +p.hour, ymd: `${p.year}-${p.month}-${p.day}` }
}

/** Milestone label if `start` (YYYY-MM-DD) hits a milestone on the given local date. */
function milestoneToday(start: string, t: { y: number; m: number; d: number }): string | null {
  const [sy, sm, sd] = start.split('-').map(Number)
  const days = Math.round((Date.UTC(t.y, t.m - 1, t.d) - Date.UTC(sy, sm - 1, sd)) / 86400000)
  if (days <= 0) return null
  if (DAY_THRESHOLDS.includes(days)) return `${days} days together`
  const months = (t.y - sy) * 12 + (t.m - sm)
  const dim = new Date(Date.UTC(t.y, t.m, 0)).getUTCDate()
  if (months > 0 && t.d === Math.min(sd, dim)) {
    return months % 12 === 0
      ? `${months / 12} ${months === 12 ? 'year' : 'years'} together`
      : `${months} ${months === 1 ? 'month' : 'months'} together`
  }
  return null
}

Deno.serve(async (req) => {
  if (!authorized(req)) return reply(401, { error: 'unauthorized' })
  const now = new Date()

  const { data: users } = await admin.from('push_subscriptions').select('user_id')
  const ids = [...new Set((users ?? []).map((u) => u.user_id))]
  let sent = 0

  for (const uid of ids) {
    const { data: prefs } = await admin.from('notification_prefs').select('*').eq('user_id', uid).maybeSingle()
    const tz = prefs?.tz || 'UTC'
    let t
    try { t = localParts(tz, now) } catch { t = localParts('UTC', now) }
    if (t.hour !== SEND_HOUR) continue

    const { data: member } = await admin.from('members').select('space_id').eq('user_id', uid).maybeSingle()
    if (!member) continue
    const { data: space } = await admin.from('spaces').select('start_date, status').eq('id', member.space_id).single()
    if (!space || space.status !== 'active') continue

    const lines: { title: string; body: string; url: string; tag: string }[] = []

    if (prefs?.capsule ?? true) {
      const from = new Date(now.getTime() - 24 * 3600_000).toISOString() // opened since yesterday's run
      const { data: caps } = await admin.from('capsules').select('id')
        .eq('space_id', member.space_id).gte('opens_at', from).lte('opens_at', now.toISOString())
        .or(`to_user.is.null,to_user.eq.${uid}`)
      if (caps?.length) lines.push({ title: 'A capsule just opened', body: 'Something from the past is ready to read.', url: '/capsules', tag: 'capsule' })
    }

    if (prefs?.special_dates ?? true) {
      const { data: dates } = await admin.from('special_dates').select('title, emoji')
        .eq('space_id', member.space_id).eq('month', t.m).eq('day', t.d)
      for (const d of dates ?? []) lines.push({ title: `${d.emoji || '💛'} ${d.title}`, body: 'Today is a special day.', url: '/', tag: `date-${d.title}` })
      const ms = space.start_date ? milestoneToday(space.start_date, t) : null
      if (ms) lines.push({ title: `🎉 ${ms}`, body: 'Celebrate today together.', url: '/numbers', tag: 'milestone' })
    }

    if ((prefs?.daily_nudge ?? true) && lines.length === 0) {
      const { data: ci } = await admin.from('checkins').select('day').eq('user_id', uid).eq('day', t.ymd).maybeSingle()
      if (!ci) lines.push({ title: 'Our Story', body: 'How was today? Add a moment to your story.', url: '/', tag: 'nudge' })
    }

    for (const l of lines) sent += await sendToUser(uid, l)
  }
  return reply(200, { sent })
})
