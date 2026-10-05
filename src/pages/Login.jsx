import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useSpace } from '../hooks/useSpace'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Login() {
  const { user, loading: authLoading, signIn, signUp } = useAuth()
  const { space, loading: spaceLoading } = useSpace()
  const location = useLocation()
  const returnTo = location.state?.from ? location.state.from.pathname + (location.state.from.search || '') : '/'

  const [tab, setTab] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (authLoading || (user && spaceLoading)) {
    return (
      <FullscreenLoader />
    )
  }

  if (user) {
    if (space) return <Navigate to={returnTo} replace />
    const pendingCode = localStorage.getItem('pending_invite_code')
    if (pendingCode) return <Navigate to={`/join/${pendingCode}`} replace />
    return <Navigate to="/onboarding" replace />
  }

  const invited = !!localStorage.getItem('pending_invite_code')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setInfoMsg('')

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      if (tab === 'signup') {
        const { data, error } = await signUp(email.trim(), password)
        if (error) setErrorMsg(error.message)
        else if (!data?.session)
          setInfoMsg('Account created! Check your email to confirm, then sign in.')
      } else {
        const { error } = await signIn(email.trim(), password)
        if (error) setErrorMsg(error.message)
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageWrapper>
      {invited && (
        <p
          className="w-full max-w-[440px] mb-4 px-4 py-3 rounded-[var(--r-sm)] border border-line text-sm text-center text-ink"
          style={{ background: 'var(--accent-soft)' }}
        >
          💌 You've been invited to a shared space. Sign up or sign in to join.
        </p>
      )}
      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px] rounded-[var(--r-md)] border border-line p-10"
        style={{ background: 'var(--glass)', backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow)' }}
      >
        {/* Heading */}
        <div className="mb-8 text-center">
          <h1
            className="text-[28px] text-ink leading-tight mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Welcome to your<br />little world.
          </h1>
          <p className="text-sm text-ink-muted">
            {tab === 'signin' ? 'Sign in to continue your story.' : 'Create a free account to start your private space.'}
          </p>
        </div>

        {/* Pill tab switcher */}
        <div
          className="flex relative rounded-full p-1 mb-7 border border-line"
          style={{ background: 'var(--surface-2)' }}
        >
          {['signin', 'signup'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setErrorMsg(''); setInfoMsg('') }}
              className="relative flex-1 py-2 text-sm font-medium rounded-full z-10 transition-colors"
              style={{
                color: tab === t ? 'var(--accent)' : 'var(--ink-muted)',
                transitionDuration: 'var(--dur-fast)',
              }}
            >
              {tab === t && (
                <motion.span
                  layoutId="login-tab-pill"
                  className="absolute inset-0 rounded-full border border-line"
                  style={{ background: 'var(--surface)' }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <span className="relative z-10">
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </span>
            </button>
          ))}
        </div>

        {/* Error / info messages */}
        {errorMsg && (
          <p className="text-xs text-red-500 font-medium mb-5 px-1 leading-relaxed">
            {errorMsg}
          </p>
        )}
        {infoMsg && (
          <p className="text-xs font-medium mb-5 px-1 leading-relaxed" style={{ color: 'var(--accent)' }}>
            {infoMsg}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="login-email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            id="login-password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
          />
          <div className="pt-1">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full"
            >
              {tab === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </div>
        </form>
      </motion.div>
    </AuthPageWrapper>
  )
}

/* ── Shared sub-components ─────────────────────────────────── */

export function AuthPageWrapper({ children }) {
  return (
    <div
      className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Radial glow orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 20% 10%, var(--accent-soft) 0%, transparent 70%),
            radial-gradient(ellipse 55% 50% at 80% 90%, var(--accent-soft) 0%, transparent 70%)
          `,
          opacity: 0.6,
        }}
      />
      <div className="relative z-10 w-full flex flex-col items-center py-4">
        {children}
      </div>
    </div>
  )
}

function FullscreenLoader() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--line)', borderTopColor: 'var(--accent)' }}
      />
    </div>
  )
}
