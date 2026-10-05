// Permanently deletes the caller's account.
// Alone in the space: mark space 'deleting' -> storage files -> space row (cascades all data) -> auth user.
// Connected: needs the partner's one-time pass and a mode.
//   transfer: memories are handed to the partner, then the auth user is deleted.
//   wipe: storage files + all shared data are cleared (partner keeps an empty space), then the auth user.
// A failure part-way leaves the account in place so the user can retry.
import { createClient } from 'npm:@supabase/supabase-js@2'

const BUCKET = 'photos'
const BATCH = 100

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

/** Lists every file path under a prefix, descending into sub-folders. */
async function listAllFiles(admin: ReturnType<typeof createClient>, prefix: string): Promise<string[]> {
  const files: string[] = []
  const stack = [prefix]
  while (stack.length) {
    const dir = stack.pop()!
    let offset = 0
    while (true) {
      const { data, error } = await admin.storage.from(BUCKET).list(dir, { limit: 1000, offset })
      if (error) throw error
      if (!data?.length) break
      for (const entry of data) {
        // Folders come back without an id
        if (entry.id) files.push(`${dir}/${entry.name}`)
        else stack.push(`${dir}/${entry.name}`)
      }
      if (data.length < 1000) break
      offset += data.length
    }
  }
  return files
}

async function removeStorage(admin: ReturnType<typeof createClient>, spaceId: string) {
  const files = await listAllFiles(admin, spaceId)
  for (let i = 0; i < files.length; i += BATCH) {
    const { error } = await admin.storage.from(BUCKET).remove(files.slice(i, i + BATCH))
    if (error) throw error
  }
}

/** Account deletion when a partner is in the space: needs their pass. */
async function deleteConnected(admin: ReturnType<typeof createClient>, userId: string, pass: string, mode: string) {
  if (mode !== 'transfer' && mode !== 'wipe') return reply(400, { error: 'INVALID_MODE' })

  const { data: spaceId, error } = await admin.rpc('begin_connected_deletion', {
    p_user: userId, p_code: pass, p_mode: mode,
  })
  if (error) {
    if (error.message?.includes('INVALID_PASS')) return reply(403, { error: 'INVALID_PASS' })
    if (error.message?.includes('NOT_CONNECTED')) return reply(409, { error: 'NOT_CONNECTED' })
    throw error
  }

  if (mode === 'wipe') {
    await removeStorage(admin, spaceId)
    const { error: wipeErr } = await admin.rpc('finish_wipe', { p_user: userId })
    if (wipeErr) throw wipeErr
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(userId)
  if (delErr) throw delErr
  return reply(200, { ok: true })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return reply(405, { error: 'METHOD_NOT_ALLOWED' })

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return reply(401, { error: 'UNAUTHORIZED' })

  const admin = createClient(url, serviceKey)
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  const user = userData?.user
  if (userErr || !user?.email) return reply(401, { error: 'UNAUTHORIZED' })

  let password = ''
  let pass = ''
  let mode = ''
  try {
    const body = await req.json()
    password = body.password ?? ''
    pass = String(body.pass ?? '')
    mode = String(body.mode ?? '')
  } catch {
    // fall through: empty password fails verification below
  }

  // Re-verify the password with a throwaway client so it can't touch the caller's session
  const verifier = createClient(url, anonKey, { auth: { persistSession: false } })
  const { error: pwErr } = await verifier.auth.signInWithPassword({ email: user.email, password })
  if (pwErr) return reply(403, { error: 'WRONG_PASSWORD' })

  try {
    const { data: spaceId, error: beginErr } = await admin.rpc('begin_account_deletion', { p_user: user.id })
    if (beginErr) {
      if (!beginErr.message?.includes('SPACE_CONNECTED')) throw beginErr
      return await deleteConnected(admin, user.id, pass, mode)
    }

    if (spaceId) {
      await removeStorage(admin, spaceId)

      const { error: spaceErr } = await admin.from('spaces').delete().eq('id', spaceId)
      if (spaceErr) throw spaceErr
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
    if (delErr) throw delErr

    return reply(200, { ok: true })
  } catch (err) {
    console.error('delete-account failed:', err)
    return reply(500, { error: 'DELETE_FAILED' })
  }
})
