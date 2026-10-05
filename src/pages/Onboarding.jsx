import { useState } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useSpace } from '../hooks/useSpace'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import InvitePartner from '../components/InvitePartner'
import AppIntro from '../components/AppIntro'
import { AuthPageWrapper } from './Login'

const CARD_HOVER = {
  rest: { y: 0, boxShadow: 'var(--shadow)' },
  hover: { y: -3, boxShadow: '0 16px 48px rgba(31,27,24,0.14)' },
}

export default function Onboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.from ? location.state.from.pathname + (location.state.from.search || '') : '/'
  const { user, loading: authLoading } = useAuth()
  const { space, loading: spaceLoading, createSpace, joinSpace } = useSpace()

  const [mode, setMode] = useState(() =>
    localStorage.getItem('pending_invite_code') ? 'join' : null
  )

  // Create form
  const [spaceName, setSpaceName]           = useState('')
  const [startDate, setStartDate]           = useState('')
  const [createDisplayName, setCreateDisplayName] = useState('')

  // Join form
  const [inviteCode, setInviteCode] = useState(() =>
    localStorage.getItem('pending_invite_code') || ''
  )
  const [joinDisplayName, setJoinDisplayName] = useState('')

  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [justCreated, setJustCreated] = useState(false)

  if (authLoading || (user && spaceLoading)) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--line)', borderTopColor: 'var(--accent)' }} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (space && !justCreated) return <Navigate to={returnTo} replace />

  const handleCreate = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (!spaceName.trim()) { setErrorMsg('Please enter a name for your space.'); return }
    if (!createDisplayName.trim()) { setErrorMsg('Please enter your display name.'); return }
    setIsSubmitting(true)
    setJustCreated(true) // hold the user here: the space appears before this promise resolves
    try {
      const { error } = await createSpace(spaceName.trim(), startDate || null, createDisplayName.trim())
      if (error) { setJustCreated(false); setErrorMsg(error.message) }
      else localStorage.removeItem('pending_invite_code')
    } catch (err) { setJustCreated(false); setErrorMsg(err.message || 'Failed to create space.') }
    finally { setIsSubmitting(false) }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (!inviteCode.trim()) { setErrorMsg('Please enter an invite code.'); return }
    if (!joinDisplayName.trim()) { setErrorMsg('Please enter your display name.'); return }
    setIsSubmitting(true)
    try {
      const { error } = await joinSpace(inviteCode.trim(), joinDisplayName.trim())
      if (error) setErrorMsg(error.message)
      else { localStorage.removeItem('pending_invite_code'); navigate(returnTo, { replace: true }) }
    } catch (err) { setErrorMsg(err.message || 'Failed to join space.') }
    finally { setIsSubmitting(false) }
  }

  if (justCreated && space) {
    return (
      <AuthPageWrapper>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[480px] rounded-[var(--r-md)] border border-line p-10"
          style={{ background: 'var(--glass)', backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow)' }}
        >
          <div className="text-center mb-6">
            <h1
              className="text-[28px] text-ink leading-tight mb-2"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              Your space is ready.<br />Now invite your person.
            </h1>
            <p className="text-sm text-ink-muted leading-relaxed">
              Share this link, or give them the code to enter when they sign up. Only the two of you can ever be in this space.
            </p>
          </div>
          <InvitePartner inviteCode={space.invite_code} />
          <Button
            variant="primary"
            size="lg"
            className="w-full mt-5"
            onClick={() => navigate(returnTo, { replace: true })}
          >
            Continue to our space
          </Button>
          <p className="text-xs text-ink-muted text-center mt-3">
            You can always find this later in Settings.
          </p>
        </motion.div>
      </AuthPageWrapper>
    )
  }

  return (
    <AuthPageWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[480px]"
      >
        <AppIntro />
        {!mode && (
          <ol className="mb-5 grid grid-cols-3 gap-2 text-center text-xs text-ink-muted">
            {['Create your space', 'Invite your partner', 'Start saving memories'].map((t, i) => (
              <li key={t} className="rounded-[var(--r-sm)] border border-line p-2.5" style={{ background: 'var(--surface-2)' }}>
                <span className="block font-semibold text-accent mb-0.5">{i + 1}</span>{t}
              </li>
            ))}
          </ol>
        )}
        {/* Glass card */}
        <div
          className="rounded-[var(--r-md)] border border-line p-10"
          style={{ background: 'var(--glass)', backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow)' }}
        >
          <div className="text-center mb-8">
            <h1
              className="text-[28px] text-ink leading-tight mb-2"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              Let's set up<br />your space.
            </h1>
            <p className="text-sm text-ink-muted">
              Create a private world for the two of you, or join one.
            </p>
          </div>

          {/* Mode selector cards */}
          {!mode && (
            <div className="grid grid-cols-2 gap-3 mb-2">
              {[
                { id: 'create', label: 'Create our space', sub: 'Start fresh together' },
                { id: 'join',   label: 'I have an invite code', sub: 'Join your partner' },
              ].map(opt => (
                <motion.button
                  key={opt.id}
                  type="button"
                  onClick={() => { setMode(opt.id); setErrorMsg('') }}
                  initial="rest"
                  whileHover="hover"
                  variants={CARD_HOVER}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="text-left p-4 rounded-[var(--r-sm)] border border-line cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <p className="text-sm font-semibold text-ink mb-1">{opt.label}</p>
                  <p className="text-xs text-ink-muted leading-relaxed">{opt.sub}</p>
                </motion.button>
              ))}
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <p className="text-xs text-red-500 font-medium mb-5 px-1 leading-relaxed">
              {errorMsg}
            </p>
          )}

          {/* Revealed forms */}
          <AnimatePresence mode="wait">
            {mode === 'create' && (
              <motion.form
                key="create"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={handleCreate}
                className="space-y-4"
              >
                <Input
                  id="space-name"
                  label="Space Name"
                  type="text"
                  placeholder="e.g. Alex & Jordan"
                  value={spaceName}
                  onChange={e => setSpaceName(e.target.value)}
                  required
                  autoFocus
                />
                <Input
                  id="start-date"
                  label="Together since (optional)"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <Input
                  id="create-display-name"
                  label="Your display name"
                  type="text"
                  placeholder="e.g. Alex"
                  value={createDisplayName}
                  onChange={e => setCreateDisplayName(e.target.value)}
                  required
                />
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="secondary" size="md" onClick={() => { setMode(null); setErrorMsg('') }}>
                    Back
                  </Button>
                  <Button type="submit" variant="primary" size="md" loading={isSubmitting} className="flex-1">
                    Create Space
                  </Button>
                </div>
              </motion.form>
            )}

            {mode === 'join' && (
              <motion.form
                key="join"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={handleJoin}
                className="space-y-4"
              >
                <Input
                  id="invite-code"
                  label="Invite Code"
                  type="text"
                  placeholder="e.g. a1b2c3d4"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  required
                  autoFocus
                  className="font-mono uppercase tracking-wider"
                />
                <Input
                  id="join-display-name"
                  label="Your display name"
                  type="text"
                  placeholder="e.g. Jordan"
                  value={joinDisplayName}
                  onChange={e => setJoinDisplayName(e.target.value)}
                  required
                />
                <div className="flex gap-2 pt-1">
                  {!localStorage.getItem('pending_invite_code') && (
                    <Button type="button" variant="secondary" size="md" onClick={() => { setMode(null); setErrorMsg('') }}>
                      Back
                    </Button>
                  )}
                  <Button type="submit" variant="primary" size="md" loading={isSubmitting} className="flex-1">
                    Join Space
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AuthPageWrapper>
  )
}
