// Called by the memories insert trigger: notifies the author's partner.
// Body: { type: 'memory', memory_id }. Auth: x-webhook-secret header.
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


Deno.serve(async (req) => {
  if (!authorized(req)) return reply(401, { error: 'unauthorized' })
  const { type, memory_id } = await req.json()
  if (type !== 'memory' || !memory_id) return reply(400, { error: 'bad request' })

  const { data: memory } = await admin
    .from('memories').select('id, space_id, author_id, title').eq('id', memory_id).single()
  if (!memory) return reply(404, { error: 'not found' })

  const { data: members } = await admin
    .from('members').select('user_id, display_name').eq('space_id', memory.space_id)
  const author = members?.find((m) => m.user_id === memory.author_id)
  const partner = members?.find((m) => m.user_id !== memory.author_id)
  if (!partner) return reply(200, { sent: 0 })

  const { data: prefs } = await admin
    .from('notification_prefs').select('partner_memory').eq('user_id', partner.user_id).maybeSingle()
  if (prefs && !prefs.partner_memory) return reply(200, { sent: 0 })

  const sent = await sendToUser(partner.user_id, {
    title: 'A new memory',
    body: `${author?.display_name || 'Your partner'} added ${memory.title ? `"${memory.title}"` : 'a memory'}.`,
    url: `/memory/${memory.id}`,
    tag: `memory-${memory.id}`,
  })
  return reply(200, { sent })
})
