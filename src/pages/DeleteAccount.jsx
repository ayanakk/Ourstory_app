import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { toast } from '../components/ui/Toast'
import { useSpace } from '../hooks/useSpace'
import { supabase } from '../lib/supabase'

const REMOVED = [
  'All memories and their photos',
  'Private notes',
  'Time capsules and letters',
  'Your wishlist and check-ins',
  'The invite link, which stops working immediately',
]

const MODES = [
  {
    value: 'transfer',
    title: (p) => `Give all memories to ${p}`,
    body: (p) => `Everything stays in the space and becomes ${p}'s to keep.`,
  },
  {
    value: 'wipe',
    title: () => 'Delete all memories for both of us',
    body: (p) => `All memories, photos and more are erased for you and ${p}. ${p} keeps their account with an empty space. This can't be undone.`,
  },
]

export default function DeleteAccount() {
  const navigate = useNavigate()
  const { checkDeleteAccount, deleteAccount } = useSpace()

  const [check, setCheck] = useState(null) // { allowed, reason, partner_name }
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [pass, setPass] = useState('')
  const [mode, setMode] = useState('transfer') // 'transfer' | 'wipe'

  useEffect(() => {
    let active = true
    checkDeleteAccount().then(({ data, error }) => {
      if (!active) return
      setCheck(error ? { allowed: false, reason: 'ERROR' } : data)
    })
    return () => { active = false }
  }, [checkDeleteAccount])

  const connected = check?.reason === 'SPACE_CONNECTED'
  const partnerName = check?.partner_name || 'your partner'
  const canSubmit =
    password.length > 0 && confirmText === 'DELETE' && !deleting && (!connected || /^\d{6}$/.test(pass.trim()))

  const handleDelete = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setDeleting(true)
    const { error, code } = await deleteAccount(password, connected ? { pass: pass.trim(), mode } : {})
    if (error) {
      setDeleting(false)
      if (code === 'WRONG_PASSWORD') toast('Wrong password')
      else if (code === 'INVALID_PASS') toast('That pass is wrong or has expired. Ask for a new one.')
      else if (code === 'NOT_CONNECTED') {
        toast('Your partner is no longer in the space. Please try again.')
        checkDeleteAccount().then(({ data }) => data && setCheck(data))
      }
      else toast('Could not delete your account. Please try again.')
      return
    }
    // Leave this protected route before the session is cleared
    navigate('/account-deleted', { replace: true })
    await supabase.auth.signOut({ scope: 'local' })
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-lg">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} /> Back to Settings
        </Link>

        <div className="space-y-2">
          <h1 className="text-4xl text-ink" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
            Delete account
          </h1>
          <p className="text-ink-muted text-base">This is permanent and can't be undone.</p>
        </div>

        {!check ? (
          <div className="h-40 rounded-[var(--r-md)] bg-surface-2 animate-pulse" />
        ) : !check.allowed && !connected ? (
          <Card className="p-6">
            <p className="text-sm text-ink-muted">Could not check your account right now. Please try again later.</p>
          </Card>
        ) : (
          <form onSubmit={handleDelete} className="space-y-6">
            {connected ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-ink">What happens to your memories?</p>
                {MODES.map((m) => (
                  <label
                    key={m.value}
                    className={`block cursor-pointer rounded-[var(--r-md)] border p-4 space-y-1 transition-colors ${
                      mode === m.value ? 'border-accent bg-surface-2' : 'border-line'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      <input
                        type="radio"
                        name="delete-mode"
                        value={m.value}
                        checked={mode === m.value}
                        onChange={() => setMode(m.value)}
                        disabled={deleting}
                      />
                      {m.title(partnerName)}
                    </span>
                    <span className="block text-xs text-ink-muted leading-relaxed pl-6">{m.body(partnerName)}</span>
                  </label>
                ))}
                <p className="text-xs text-ink-muted">
                  Your account, private notes and sign-in are always deleted. The invite link is replaced.
                </p>
              </div>
            ) : (
              <Card className="p-6 space-y-3">
                <p className="text-sm font-medium text-ink">This will permanently remove:</p>
                <ul className="space-y-1.5 text-sm text-ink-muted list-disc pl-5">
                  {REMOVED.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </Card>
            )}

            <div className="space-y-4">
              {connected && (
                <Input
                  id="delete-pass"
                  label={`Pass from ${partnerName}`}
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="off"
                  placeholder="6-digit pass"
                  value={pass}
                  onChange={(e) => setPass(e.target.value.replace(/\D/g, ''))}
                  disabled={deleting}
                />
              )}
              <Input
                id="delete-password"
                label="Your password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={deleting}
              />
              <Input
                id="delete-confirm"
                label="Type DELETE to confirm"
                autoComplete="off"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={deleting}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={deleting}
              disabled={!canSubmit}
              className="w-full !bg-red-500 !border-red-500"
            >
              <Trash2 size={15} className="mr-2" />
              {deleting ? 'Deleting your story…' : 'Delete forever'}
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  )
}
