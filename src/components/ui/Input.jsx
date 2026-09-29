import { forwardRef } from 'react'

/**
 * Input
 * label: floating label text
 * error: inline error message
 */
export const Input = forwardRef(function Input(
  { label, error, id, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-widest text-ink-muted"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={[
          'w-full px-4 py-3 rounded-[var(--r-sm)] border text-ink text-sm font-sans',
          'bg-surface-2 border-line placeholder:text-ink-muted',
          'transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : '',
          className,
        ].join(' ')}
        style={{ transitionDuration: 'var(--dur-fast)' }}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>
      )}
    </div>
  )
})

/**
 * Textarea
 */
export const Textarea = forwardRef(function Textarea(
  { label, error, id, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-widest text-ink-muted"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={[
          'w-full px-4 py-3 rounded-[var(--r-sm)] border text-ink text-sm font-sans',
          'bg-surface-2 border-line placeholder:text-ink-muted resize-none',
          'transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : '',
          className,
        ].join(' ')}
        style={{ transitionDuration: 'var(--dur-fast)' }}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>
      )}
    </div>
  )
})

export default Input
