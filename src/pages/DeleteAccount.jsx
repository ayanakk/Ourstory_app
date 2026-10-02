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

export default function DeleteAccount() {
  const navigate = useNavigate()
  const { checkDeleteAccount, deleteAccount } = useSpace()

  const [check, setCheck] = useState(null) // { allowed, reason, partner_name }
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    checkDeleteAccount().then(({ data, error }) => {
      if (!active) return
      setCheck(error ? { allowed: false, reason: 'ERROR' } : data)
    })
    return () => { active = false }
  }, [checkDeleteAccount])

  const canSubmit = password.length > 0 && confirmText === 'DELETE' && !deleting

  const handleDelete = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setDeleting(true)
    const { error, code } = await deleteAccount(password)
    if (error) {
      setDeleting(false)
      if (code === 'WRONG_PASSWORD') toast('Wrong password')
      else if (code === 'SPACE_CONNECTED') setCheck({ allowed: false, reason: 'SPACE_CONNECTED' })
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
        ) : check.reason === 'SPACE_CONNECTED' ? (
          <Card className="p-6 space-y-2">
            <p className="text-sm text-ink leading-relaxed">
              Your story is shared with {check.partner_name || 'your partner'}. Deleting an account in a
              shared story needs their approval. This option is coming soon.
            </p>
          </Card>
        ) : !check.allowed ? (
          <Card className="p-6">
            <p className="text-sm text-ink-muted">Could not check your account right now. Please try again later.</p>
          </Card>
        ) : (
          <form onSubmit={handleDelete} className="space-y-6">
            <Card className="p-6 space-y-3">
              <p className="text-sm font-medium text-ink">This will permanently remove:</p>
              <ul className="space-y-1.5 text-sm text-ink-muted list-disc pl-5">
                {REMOVED.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </Card>

            <div className="space-y-4">
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
