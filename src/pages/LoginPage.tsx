import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../account/AuthContext'
import { Button } from '../components/Button'
import { Logo } from '../components/Logo'

export function LoginPage() {
  const { account, loginDemo } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('Maria')
  const [email, setEmail] = useState('demo@bloomly.local')
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  if (account) return <Navigate to="/account" replace />

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    loginDemo({ displayName, email })
    navigate('/account')
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <Logo size="lg" />
        <h1 className="mt-6 font-display text-3xl font-semibold text-ink">
          {mode === 'login' ? 'Welcome back' : 'Create a demo account'}
        </h1>
        <p className="mt-2 text-sm text-ink/65">
          Demo accounts only — clearly labeled. No passwords are stored.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-3xl bg-cream p-6 shadow-[var(--shadow-card)] ring-1 ring-blush/70"
      >
        <div className="mb-4 rounded-2xl bg-sage/50 px-3 py-2 text-xs font-semibold text-ink">
          Hackathon demo account · not real authentication
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              mode === 'login' ? 'bg-plum text-cream' : 'bg-lavender text-ink'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              mode === 'signup' ? 'bg-plum text-cream' : 'bg-lavender text-ink'
            }`}
          >
            Sign up
          </button>
        </div>

        <label className="block text-sm font-semibold text-ink">
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-4 py-2.5 outline-none focus:ring-2 focus:ring-plum/35"
            required
          />
        </label>

        <label className="mt-4 block text-sm font-semibold text-ink">
          Email (demo label only)
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-4 py-2.5 outline-none focus:ring-2 focus:ring-plum/35"
            required
          />
        </label>

        <p className="mt-4 text-xs leading-relaxed text-ink/55">
          Password fields are intentionally omitted. This demo uses a local
          browser session only — never enter real credentials here.
        </p>

        <Button type="submit" className="mt-5 w-full py-3">
          {mode === 'login' ? 'Enter demo account' : 'Create demo account'}
        </Button>
      </form>
    </div>
  )
}
