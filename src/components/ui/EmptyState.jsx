import Button from './Button'

/**
 * EmptyState
 * message: serif italic primary message
 * subtitle: muted secondary line
 * action: { label, onClick } optional CTA
 */
export default function EmptyState({ message, subtitle, action, className = '' }) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center gap-4 py-6 px-6',
        className,
      ].join(' ')}
    >
      <p
        className="font-display text-xl italic text-ink-muted leading-relaxed max-w-xs"
        style={{ fontStyle: 'italic', fontWeight: 500 }}
      >
        {message}
      </p>
      {subtitle && (
        <p className="text-sm text-ink-muted max-w-xs leading-relaxed">
          {subtitle}
        </p>
      )}
      {action && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-2"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
