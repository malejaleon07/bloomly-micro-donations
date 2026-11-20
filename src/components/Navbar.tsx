import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../account/AuthContext'
import { Logo } from './Logo'
import { Button, ButtonLink } from './Button'
import { ConnectWalletButton } from './ConnectWalletButton'

const links = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Make an Impact' },
  { to: '/request', label: 'Start a request' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { account, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-blush/50 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 xl:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-semibold no-underline transition ${
                  isActive
                    ? 'bg-lavender text-ink'
                    : 'text-ink/70 hover:bg-lavender/50 hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {account && (
            <NavLink
              to="/account"
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-semibold no-underline transition ${
                  isActive
                    ? 'bg-lavender text-ink'
                    : 'text-ink/70 hover:bg-lavender/50 hover:text-ink'
                }`
              }
            >
              Daily Blooms
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ConnectWalletButton compact />
          {account ? (
            <>
              <ButtonLink
                to="/account"
                variant="secondary"
                className="text-xs sm:text-sm"
              >
                Hi, {account.displayName.split(' ')[0]}
              </ButtonLink>
              <Button type="button" variant="ghost" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <ButtonLink to="/login" variant="secondary">
              Login / Sign up
            </ButtonLink>
          )}
          <ButtonLink to="/explore" variant="primary">
            Make an Impact
          </ButtonLink>
        </div>

        <button
          type="button"
          className="rounded-full p-2 text-ink lg:hidden hover:bg-lavender"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-blush/40 px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-2xl px-3 py-2.5 text-sm font-semibold no-underline ${
                    isActive ? 'bg-lavender text-ink' : 'text-ink/80'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {account && (
              <NavLink
                to="/account"
                onClick={() => setOpen(false)}
                className="rounded-2xl px-3 py-2.5 text-sm font-semibold no-underline text-ink/80"
              >
                Daily Blooms
              </NavLink>
            )}
            <div className="mt-2 px-1">
              <ConnectWalletButton />
            </div>
            {account ? (
              <Button
                type="button"
                variant="ghost"
                className="mt-1 w-full"
                onClick={() => {
                  logout()
                  setOpen(false)
                }}
              >
                Log out
              </Button>
            ) : (
              <ButtonLink to="/login" variant="secondary" className="mt-1 w-full">
                Login / Sign up
              </ButtonLink>
            )}
            <ButtonLink to="/explore" className="mt-2 w-full" variant="primary">
              Make an Impact
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  )
}
