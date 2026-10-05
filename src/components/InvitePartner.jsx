import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'
import { toast } from './ui/Toast'

export default function InvitePartner({ inviteCode }) {
  const [copied, setCopied] = useState(false)
  const inviteLink = inviteCode ? `${window.location.origin}/join/${inviteCode}` : ''

  const handleCopyCode = async () => {
    if (!inviteCode) return
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      toast('Invite code copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('Could not copy — please copy manually.')
    }
  }

  const handleShareLink = async () => {
    if (!inviteLink) return
    const text = `Hey love! 💕 I've created a private space for just the two of us on OurStory — a place to keep our memories, plans and special moments together. Tap the link to join me:`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join me on OurStory 💕', text, url: inviteLink })
      } catch (err) {
        if (err?.name !== 'AbortError') toast('Could not share the link')
      }
      return
    }
    try {
      await navigator.clipboard.writeText(`${text} ${inviteLink}`)
      toast('Invite message copied!')
    } catch {
      toast('Could not copy — please copy manually.')
    }
  }

  if (!inviteLink) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={inviteCode}
          onFocus={e => e.target.select()}
          aria-label="Invite code"
          className="flex-1 w-full min-w-0 px-3 py-2.5 rounded-[var(--r-xs)] border border-line bg-surface-2 text-ink text-base sm:text-lg tracking-wider font-mono focus:outline-none"
        />
        <button
          onClick={handleCopyCode}
          aria-label="Copy invite code"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-[var(--r-xs)] text-sm font-medium border border-line bg-surface-2 text-ink hover:bg-accent hover:text-accent-ink hover:border-accent transition-all active:scale-95 flex-shrink-0"
          style={{ transitionDuration: 'var(--dur-fast)' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <button
        onClick={handleShareLink}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--r-xs)] text-sm font-medium border border-line bg-surface-2 text-ink hover:bg-accent hover:text-accent-ink hover:border-accent transition-all active:scale-95"
        style={{ transitionDuration: 'var(--dur-fast)' }}
      >
        <Share2 size={14} />
        Share invite link
      </button>
    </div>
  )
}
