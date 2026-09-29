import { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useSpace } from '../hooks/useSpace'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AuthPageWrapper } from './Login'

export default function Join() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { space, loading: spaceLoading, joinSpace } = useSpace()

  const [displayName, setDisplayName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (code && !user && !authLoading) {
      localStorage.setItem('pending_invite_code', code)
    }
  }, [code, user, authLoading])

  if (authLoading || (user && spaceLoading)) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--line)', borderTopColor: 'var(--accent)' }} />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (space) {
    return (
      <AuthPageWrapper>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px] rounded-[var(--r-md)] border border-line p-10 text-center"
          style={{ background: 'var(--glass)', backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow)' }}
        >
          <h2
            className="text-2xl text-ink mb-3"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Already in a space.
          </h2>
          <p className="text-sm text-ink-muted mb-6 leading-relaxed">
            You are already a member of{' '}
            <span className="font-semibold text-ink">{space.name || 'your space'}</span>.
            Each account can only belong to one shared space.
          </p>
          <Button variant="primary" size="md" className="w-full" onClick={() => navigate('/', { replace: true })}>
            Go to Your Space
          </Button>
        </motion.div>
      </AuthPageWrapper>
    )
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (!displayName.trim()) { setErrorMsg('Please enter your display name.'); return }
    setIsSubmitting(true)
    try {
      const { error } = await joinSpace(code, displayName.trim())
      if (error) setErrorMsg(error.message)
      else { localStorage.removeItem('pending_invite_code'); navigate('/', { replace: true }) }
    } catch (err) { setErrorMsg(err.message || 'Failed to join space.') }
    finally { setIsSubmitting(false) }
  }

  return (
    <AuthPageWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px] rounded-[var(--r-md)] border border-line p-10"
        style={{ background: 'var(--glass)', backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow)' }}
      >
        <div className="text-center mb-8">
          <h1
            className="text-[28px] text-ink leading-tight mb-2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            You&apos;re invited.
          </h1>
          <p className="text-sm text-ink-muted">
            Code:{' '}
            <span
              className="font-mono tracking-wider font-medium"
              style={{ color: 'var(--accent)' }}
            >
              {code}
            </span>
          </p>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-500 font-medium mb-5 px-1 leading-relaxed">
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <Input
            id="join-display-name"
            label="Your display name"
            type="text"
            placeholder="e.g. Jordan"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
            autoFocus
          />
          <div className="pt-1">
            <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="w-full">
              Join the Space
            </Button>
          </div>
        </form>
      </motion.div>
    </AuthPageWrapper>
  )
}
