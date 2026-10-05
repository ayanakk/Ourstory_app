import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return null
  try {
    return await navigator.serviceWorker.register('/sw.js', { type: 'module' })
  } catch {
    return null
  }
}

function urlBase64ToUint8Array(base64) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function currentSubscription() {
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

export async function isSubscribed() {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  return !!(await currentSubscription())
}

/** Asks permission, subscribes this device and stores it. Throws an Error with a user-facing message. */
export async function enablePush() {
  if (!pushSupported()) throw new Error("This browser doesn't support notifications")
  if (!VAPID_PUBLIC_KEY) throw new Error('Notifications are not configured yet')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notifications are blocked. Allow them in your browser settings.')

  const reg = await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }))
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, user_agent: navigator.userAgent },
    { onConflict: 'endpoint' },
  )
  if (error) throw new Error("Couldn't save this device")
}

export async function disablePush() {
  const sub = await currentSubscription()
  if (!sub) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

export async function loadPrefs() {
  const { data } = await supabase.from('notification_prefs').select('*').maybeSingle()
  return { partner_memory: true, capsule: true, special_dates: true, daily_nudge: true, ...data }
}

export async function savePrefs(prefs) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const { partner_memory, capsule, special_dates, daily_nudge } = prefs
  const { error } = await supabase
    .from('notification_prefs')
    .upsert({ partner_memory, capsule, special_dates, daily_nudge, tz, updated_at: new Date().toISOString() })
  return !error
}
