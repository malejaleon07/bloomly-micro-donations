import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../account/AuthContext'

const tabs = [
  { to: '/account', end: true, label: 'Daily Blooms' },
  { to: '/account/donations', label: 'My Donations' },
  { to: '/account/requests', label: 'My Requests' },
  { to: '/account/settings', label: 'Settings' },
]

export function AccountLayout() {
  const { account } = useAuth()
  if (!account) return <Navigate to="/login" replace />

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-sage/70 px-2.5 py-0.5 text-xs font-semibold text-ink">
          Demo account
        </span>
        <span className="text-sm text-ink/55">{account.email}</span>
      </div>
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Hi, {account.displayName}
      </h1>
      <p className="mt-1 text-ink/65">Grow yourself. Help others grow.</p>

      <nav className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold no-underline transition ${
                isActive
                  ? 'bg-plum text-cream shadow-[var(--shadow-soft)]'
                  : 'bg-cream text-ink ring-1 ring-blush hover:bg-lavender'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  )
}
