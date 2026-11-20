import type { DemoAccount } from '../types/account'

const SESSION_KEY = 'bloomly:demo-session:v1'

/**
 * Demo accounts only — no passwords stored.
 * Login / sign-up create a local session labeled as a hackathon demo.
 */
export function getSession(): DemoAccount | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoAccount
    if (!parsed?.id || !parsed.isDemo) return null
    return parsed
  } catch {
    return null
  }
}

export function startDemoSession(input: {
  displayName: string
  email: string
}): DemoAccount {
  const existing = getSession()
  const account: DemoAccount = {
    id: existing?.id ?? `demo-${Date.now().toString(36)}`,
    displayName: input.displayName.trim() || 'Bloomly Friend',
    email: input.email.trim() || 'demo@bloomly.local',
    isDemo: true,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(account))
  return account
}

export function endSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function isLoggedIn(): boolean {
  return getSession() !== null
}
