import { forwardRef } from 'react'

/**
 * Button
 * variants: 'primary' | 'secondary' | 'ghost'
 * sizes:    'sm' | 'md' | 'lg'
 */
const sizeClasses = {
  sm:  'px-4 py-2 text-sm',
  md:  'px-5 py-2.5 text-sm',
  lg:  'px-7 py-3.5 text-base',
}

const variantClasses = {
  primary:   'bg-accent text-accent-ink border-transparent hover:opacity-90',
  secondary: 'bg-surface text-ink border border-line hover:bg-surface-2',
  ghost:     'bg-transparent text-ink-muted border-transparent hover:text-ink hover:bg-surface-2',
}

const Spinner = () => (
  <svg
    className="animate-spin mr-2 h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
)

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className = '',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-sans font-medium rounded-full',
        'border transition-all select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size] ?? sizeClasses.md,
        variantClasses[variant] ?? variantClasses.primary,
        className,
      ].join(' ')}
      style={{ transitionDuration: 'var(--dur-fast)' }}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
})

export default Button
