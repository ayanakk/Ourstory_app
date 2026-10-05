import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, Share2, LogOut, Pencil, Trash2, HeartCrack } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useSpace } from '../hooks/useSpace'
import { useTheme } from '../hooks/useTheme'
import { getTodayYMD } from '../lib/milestones'
import { toast } from '../components/ui/Toast'
import InvitePartner from '../components/InvitePartner'

export default function Settings() {
  const { signOut } = useAuth()
  const { space, member, partner, updateSpace, updateDisplayName } = useSpace()
  const { theme, toggleTheme } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ spaceName: '', startDate: '', displayName: '' })

  const startEditing = () => {
    setForm({
      spaceName: space?.name || '',
      startDate: space?.start_date || '',
      displayName: member?.display_name || '',
    })
    setEditing(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const spaceName = form.spaceName.trim()
    const displayName = form.displayName.trim()
    if (!spaceName || !displayName) {
      toast('Space name and your name can\'t be empty')
      return
    }
    setSaving(true)
    const changedSpace = spaceName !== (space?.name || '') || form.startDate !== (space?.start_date || '')
    const changedName = displayName !== (member?.display_name || '')
    const results = await Promise.all([
      changedSpace ? updateSpace({ name: spaceName, startDate: form.startDate }) : null,
      changedName ? updateDisplayName(displayName) : null,
    ])
    setSaving(false)
    if (results.some((r) => r?.error)) {
      toast('Could not save changes')
      return
    }
    toast('Saved')
    setEditing(false)
  }

  const inviteCode = space?.invite_code || ''

  const handleShareApp = async () => {
    const message = `I've been using OurStory — a private space for couples to keep their memories, plans and special moments together. Check it out! 💕`
    const url = window.location.origin
    if (navigator.share) {
      try {
        await navigator.share({ title: 'OurStory', text: message, url })
      } catch (err) {
        if (err?.name !== 'AbortError') toast('Could not share the app')
      }
      return
    }
    try {
      await navigator.clipboard.writeText(`${message} ${url}`)
      toast('Link copied!')
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
          <div className="flex items-center justify-between">
            <h2
              className="text-lg text-ink"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              Our Space
            </h2>
            {!editing && (
              <Button variant="ghost" size="sm" onClick={startEditing}>
                <Pencil size={13} className="mr-1.5" /> Edit
              </Button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                id="settings-space-name"
                label="Space name"
                value={form.spaceName}
                onChange={(e) => setForm((f) => ({ ...f, spaceName: e.target.value }))}
                required
              />
              <Input
                id="settings-start-date"
                label="Together since"
                type="date"
                value={form.startDate}
                max={getTodayYMD()}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
              <Input
                id="settings-display-name"
                label="Your name"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                required
              />
              <div className="flex items-center justify-end gap-3 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={saving}>
                  Save
                </Button>
              </div>
            </form>
          ) : (
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
          )}
        </Card>

        {/* Invite link */}
        {inviteCode && (
          <Card className="p-6 space-y-4">
            <div>
              <h2
                className="text-lg text-ink"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
              >
                Invite Your Partner
              </h2>
              <p className="text-xs text-ink-muted mt-1">
                Share the link, or give them this code to enter when they sign up.
              </p>
            </div>
            <InvitePartner inviteCode={inviteCode} />
          </Card>
        )}

        {/* Share the app */}
        <Card className="p-6 space-y-4">
          <div>
            <h2
              className="text-lg text-ink"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              Share OurStory
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Know another couple who'd love a private space of their own? Tell them about it.
            </p>
          </div>
          <button
            onClick={handleShareApp}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--r-xs)] text-sm font-medium border border-line bg-surface-2 text-ink hover:bg-accent hover:text-accent-ink hover:border-accent transition-all active:scale-95"
            style={{ transitionDuration: 'var(--dur-fast)' }}
          >
            <Share2 size={14} />
            Share the app
          </button>
        </Card>

        {/* Danger zone */}
        <Card className="p-6 space-y-4">
          <h2
            className="text-lg text-ink"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Danger zone
          </h2>
          <div className="flex items-center justify-between gap-4 opacity-60" aria-disabled="true">
            <div>
              <p className="text-sm font-medium text-ink flex items-center gap-1.5">
                <HeartCrack size={14} /> We've broken up
              </p>
              <p className="text-xs text-ink-muted mt-0.5">Coming soon</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Delete account</p>
              <p className="text-xs text-ink-muted mt-0.5">
                Permanently erase your account and everything in your space.
              </p>
            </div>
            <Link
              to="/delete-account"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-line text-sm font-medium text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex-shrink-0"
            >
              <Trash2 size={14} /> Delete
            </Link>
          </div>
        </Card>

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
