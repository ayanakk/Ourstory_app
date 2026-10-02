import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthPageWrapper } from './Login'

export default function AccountDeleted() {
  return (
    <AuthPageWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px] rounded-[var(--r-md)] border border-line p-10 text-center"
        style={{ background: 'var(--glass)', backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow)' }}
      >
        <h1
          className="text-2xl text-ink mb-3"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          Your account has been deleted.
        </h1>
        <p className="text-sm text-ink-muted mb-6 leading-relaxed">
          Everything in your space has been removed. You're welcome to start a new story any time.
        </p>
        <Link to="/login" className="text-sm font-medium text-accent hover:opacity-80">
          Back to sign in
        </Link>
      </motion.div>
    </AuthPageWrapper>
  )
}
