import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'sage'

const variants: Record<Variant, string> = {
  primary:
    'bg-plum text-cream hover:bg-ink shadow-[var(--shadow-soft)] disabled:opacity-50',
  secondary:
    'bg-lavender text-ink hover:bg-blush shadow-[var(--shadow-soft)] disabled:opacity-50',
  ghost:
    'bg-transparent text-ink hover:bg-lavender/60 border border-blush/80 disabled:opacity-50',
  sage: 'bg-sage text-ink hover:brightness-95 shadow-[var(--shadow-soft)] disabled:opacity-50',
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum'

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function ButtonLink({
  to,
  variant = 'primary',
  className = '',
  children,
}: {
  to: string
  variant?: Variant
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} no-underline ${className}`}>
      {children}
    </Link>
  )
}
