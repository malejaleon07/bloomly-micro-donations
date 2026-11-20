import { Link } from 'react-router-dom'

const SIZE = {
  sm: { dim: 28, text: 'text-lg' },
  md: { dim: 36, text: 'text-xl' },
  lg: { dim: 56, text: 'text-4xl' },
  xl: { dim: 72, text: 'text-5xl sm:text-6xl' },
} as const

export function Logo({
  size = 'md',
  link = true,
}: {
  size?: keyof typeof SIZE
  link?: boolean
}) {
  const { dim, text } = SIZE[size]

  const inner = (
    <>
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-petal drop-shadow-sm shrink-0"
        aria-hidden
      >
        <path
          d="M32 18c-2.8-6.2-10.4-8.4-14.8-4.8C12.4 17.2 13.6 25.2 20 30c4.2 3.2 8.4 5.2 12 6.4 3.6-1.2 7.8-3.2 12-6.4 6.4-4.8 7.6-12.8 2.8-16.8C42.4 9.6 34.8 11.8 32 18Z"
          fill="#9D5185"
        />
        <path
          d="M32 46c2.8 6.2 10.4 8.4 14.8 4.8 4.8-4 3.6-12-2.8-16.8-4.2-3.2-8.4-5.2-12-6.4-3.6 1.2-7.8 3.2-12 6.4-6.4 4.8-7.6 12.8-2.8 16.8C21.6 54.4 29.2 52.2 32 46Z"
          fill="#C8DABF"
        />
        <path
          d="M18 32c-6.2-2.8-8.4-10.4-4.8-14.8C17.2 12.4 25.2 13.6 30 20c3.2 4.2 5.2 8.4 6.4 12-1.2 3.6-3.2 7.8-6.4 12-4.8 6.4-12.8 7.6-16.8 2.8C9.6 42.4 11.8 34.8 18 32Z"
          fill="#F2D5E6"
        />
        <path
          d="M46 32c6.2 2.8 8.4 10.4 4.8 14.8-4 4.8-12 3.6-16.8-2.8-3.2-4.2-5.2-8.4-6.4-12 1.2-3.6 3.2-7.8 6.4-12 4.8-6.4 12.8-7.6 16.8-2.8C54.4 21.6 52.2 29.2 46 32Z"
          fill="#F6E7F2"
        />
        <circle cx="32" cy="32" r="5.5" fill="#4A3548" />
      </svg>
      <span
        className={`font-display font-semibold text-ink tracking-tight group-hover:text-plum transition-colors ${text}`}
      >
        Bloomly
      </span>
    </>
  )

  if (!link) {
    return <div className="inline-flex items-center gap-3">{inner}</div>
  }

  return (
    <Link to="/" className="inline-flex items-center gap-3 no-underline group">
      {inner}
    </Link>
  )
}
