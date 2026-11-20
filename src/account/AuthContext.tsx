import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { endSession, getSession, startDemoSession } from '../lib/auth'
import type { DemoAccount } from '../types/account'

interface AuthContextValue {
  account: DemoAccount | null
  loginDemo: (input: { displayName: string; email: string }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<DemoAccount | null>(() => getSession())

  const loginDemo = useCallback(
    (input: { displayName: string; email: string }) => {
      setAccount(startDemoSession(input))
    },
    [],
  )

  const logout = useCallback(() => {
    endSession()
    setAccount(null)
  }, [])

  const value = useMemo(
    () => ({ account, loginDemo, logout }),
    [account, loginDemo, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
