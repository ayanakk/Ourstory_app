import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import Card from './ui/Card'
import { toast } from './ui/Toast'
import {
  pushSupported, isStandalone, isIOS, isSubscribed, enablePush, disablePush, loadPrefs, savePrefs,
} from '../lib/push'

const TYPES = [
  ['partner_memory', 'Partner adds a memory'],
  ['capsule', 'A capsule opens'],
  ['special_dates', 'Special dates & milestones'],
  ['daily_nudge', 'Daily check-in nudge (9am)'],
]

export default function NotificationSettings() {
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [prefs, setPrefs] = useState(null)

  useEffect(() => {
    isSubscribed().then(setOn)
    loadPrefs().then(setPrefs)
  }, [])

  const needsInstall = isIOS() && !isStandalone()
  const supported = pushSupported()

  const toggle = async () => {
    setBusy(true)
    try {
      if (on) {
        await disablePush()
        setOn(false)
      } else {
        await enablePush()
        await savePrefs(prefs)
        setOn(true)
        toast('Notifications on for this device')
      }
    } catch (e) {
      toast(e.message || "Couldn't change notifications")
    }
    setBusy(false)
  }

  const setPref = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    if (!(await savePrefs(next))) {
      setPrefs(prefs)
      toast("Couldn't save that")
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="text-lg text-ink" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
          Notifications
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">Get nudges on this device, even when the app is closed.</p>
      </div>

      {needsInstall ? (
        <p className="text-sm text-ink-muted">
          On iPhone, tap Share, then "Add to Home Screen", and open Our Story from there to turn notifications on.
        </p>
      ) : !supported ? (
        <p className="text-sm text-ink-muted">This browser doesn't support notifications.</p>
      ) : (
        <>
          <button
            onClick={toggle}
            disabled={busy || !prefs}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--r-xs)] text-sm font-medium border border-line bg-surface-2 text-ink hover:bg-accent hover:text-accent-ink hover:border-accent transition-all active:scale-95 disabled:opacity-50"
            style={{ transitionDuration: 'var(--dur-fast)' }}
          >
            <Bell size={14} />
            {on ? 'Turn off on this device' : 'Turn on notifications'}
          </button>
          {on && prefs && (
            <div className="space-y-2">
              {TYPES.map(([key, label]) => (
                <label key={key} className="flex items-center justify-between text-sm text-ink">
                  {label}
                  <input type="checkbox" checked={!!prefs[key]} onChange={() => setPref(key)} className="accent-[var(--accent)] w-4 h-4" />
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  )
}
