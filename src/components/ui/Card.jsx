/**
 * Card
 * glass prop: backdrop-blur + var(--glass) background
 * className: additional classes
 */
export default function Card({ children, glass = false, className = '', ...props }) {
  return (
    <div
      className={[
        'rounded-[var(--r-md)] border border-line',
        glass
          ? 'backdrop-blur-xl'
          : 'bg-surface',
        className,
      ].join(' ')}
      style={{
        boxShadow: 'var(--shadow)',
        ...(glass ? { background: 'var(--glass)' } : {}),
      }}
      {...props}
    >
      {children}
    </div>
  )
}
