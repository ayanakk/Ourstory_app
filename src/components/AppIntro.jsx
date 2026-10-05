import { Lock } from 'lucide-react'

export default function AppIntro() {
  return (
    <div className="w-full max-w-[440px] mx-auto mb-5 text-center">
      <p
        className="text-xl text-ink leading-snug mb-1"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
      >
        Our Story
      </p>
      <p className="text-sm text-ink-muted leading-relaxed">
        A private space for just the two of you — keep your memories, plans and special moments in one place.
      </p>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
        <Lock size={12} /> Strictly private — only two people, ever.
      </p>
    </div>
  )
}
