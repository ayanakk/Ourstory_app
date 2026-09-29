import { useState } from 'react'
import { Moon, Sun, Copy, Check, LogOut } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useSpace } from '../hooks/useSpace'
import { useTheme } from '../hooks/useTheme'
import { toast } from '../components/ui/Toast'

export default function Settings() {
  const { signOut } = useAuth()
  const { space, member, partner } = useSpace()
  const { theme, toggleTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const inviteLink = space?.invite_code
    ? `${window.location.origin}/join/${space.invite_code}`
    : ''

  const handleCopy = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast('Invite link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('Could not copy — please copy manually.')
    }
  }

  const handleSignOut = async () => {
    setLoggingOut(true)
    await signOut()
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-lg">
        {/* Page header */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Settings</p>
          <h1
            className="text-4xl text-ink"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Settings
          </h1>
          <p className="text-ink-muted text-base">Manage your space and preferences.</p>
        </div>

        {/* Appearance */}
        <Card className="p-6 space-y-4">
          <h2
            className="text-lg text-ink"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Theme</p>
              <p className="text-xs text-ink-muted mt-0.5">
                {theme === 'dark' ? 'Cinematic dark mode' : 'Warm light mode'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-line bg-surface-2 text-ink text-sm font-medium transition-all hover:border-accent hover:text-accent active:scale-95"
              style={{ transitionDuration: 'var(--dur-fast)' }}
            >
              {theme === 'dark'
                ? <><Sun size={15} /> Light</>
                : <><Moon size={15} /> Dark</>
              }
            </button>
          </div>
        </Card>

        {/* Space info */}
        <Card className="p-6 space-y-5">
          <h2
            className="text-lg text-ink"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Our Space
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-widest text-ink-muted font-semibold">Space name</p>
              <p className="text-sm font-medium text-ink">{space?.name || '—'}</p>
            </div>
            {space?.start_date && (
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-widest text-ink-muted font-semibold">Together since</p>
                <p className="text-sm font-medium text-ink">{space.start_date}</p>
              </div>
            )}
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-widest text-ink-muted font-semibold">Your name</p>
              <p className="text-sm font-medium text-ink">{member?.display_name || '—'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-widest text-ink-muted font-semibold">Partner</p>
              {partner ? (
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-ink">{partner.display_name}</p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                  <p className="text-sm italic text-ink-muted">Waiting for your person…</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Invite link */}
        {inviteLink && (
          <Card className="p-6 space-y-4">
            <div>
              <h2
                className="text-lg text-ink"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
              >
                Invite Your Partner
              </h2>
              <p className="text-xs text-ink-muted mt-1">
                Share this link so they can join your private space.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={inviteLink}
                onFocus={e => e.target.select()}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-[var(--r-xs)] border border-line bg-surface-2 text-ink-muted text-xs font-mono focus:outline-none"
              />
              <button
                onClick={handleCopy}
                aria-label="Copy invite link"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-[var(--r-xs)] text-sm font-medium border border-line bg-surface-2 text-ink hover:bg-accent hover:text-accent-ink hover:border-accent transition-all active:scale-95 flex-shrink-0"
                style={{ transitionDuration: 'var(--dur-fast)' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </Card>
        )}

        {/* Sign out */}
        <div className="pt-2">
          <Button
            variant="ghost"
            size="md"
            loading={loggingOut}
            onClick={handleSignOut}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 w-full border border-line hover:border-red-200"
          >
            <LogOut size={15} className="mr-2" />
            {loggingOut ? 'Signing out…' : 'Sign Out'}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
