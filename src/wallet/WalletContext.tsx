import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { formatEther, type Address } from 'viem'
import { ARC_TESTNET } from '../config/arc'
import { getUsdcBalance, publicClient } from '../lib/usdc'
import {
  ensureArcChain,
  getMetaMaskProvider,
  parseChainId,
  requestMetaMask,
  walletErrorMessage,
  type Eip1193Provider,
} from './ethereum'

declare global {
  interface Window {
    ethereum?: Eip1193Provider
  }
}

interface WalletState {
  address: Address | null
  chainId: number | null
  usdcBalance: number | null
  nativeBalance: number | null
  connecting: boolean
  error: string | null
  isArc: boolean
  hasProvider: boolean
  connect: () => Promise<void>
  disconnect: () => void
  switchToArc: () => Promise<number | null>
  refreshBalances: () => Promise<void>
  getProvider: () => Eip1193Provider | null
}

const WalletContext = createContext<WalletState | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<Address | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null)
  const [nativeBalance, setNativeBalance] = useState<number | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasProvider, setHasProvider] = useState(false)
  const providerRef = useRef<Eip1193Provider | null>(null)

  const readProvider = useCallback(() => {
    const provider = getMetaMaskProvider()
    providerRef.current = provider
    setHasProvider(Boolean(provider))
    return provider
  }, [])

  const refreshBalances = useCallback(async () => {
    if (!address) {
      setUsdcBalance(null)
      setNativeBalance(null)
      return
    }
    try {
      const [erc20, native] = await Promise.all([
        getUsdcBalance(address),
        publicClient.getBalance({ address }),
      ])
      setUsdcBalance(erc20)
      setNativeBalance(Number(formatEther(native)))
    } catch {
      // Keep last known balances on transient RPC errors.
    }
  }, [address])

  const syncFromProvider = useCallback(async (provider: Eip1193Provider) => {
    const [accounts, chainHex] = await Promise.all([
      provider.request({ method: 'eth_accounts' }) as Promise<string[]>,
      provider.request({ method: 'eth_chainId' }),
    ])
    setAddress((accounts[0] as Address | undefined) ?? null)
    const chainId = parseChainId(chainHex)
    if (chainId != null) setChainId(chainId)
  }, [])

  useEffect(() => {
    let provider = readProvider()
    let disposed = false

    const onAccounts = (accounts: unknown) => {
      const list = accounts as string[]
      setAddress((list[0] as Address | undefined) ?? null)
    }
    const onChain = (chainHex: unknown) => {
      const chainId = parseChainId(chainHex)
      if (chainId != null) setChainId(chainId)
    }
    const bind = (next: Eip1193Provider | null) => {
      next?.on?.('accountsChanged', onAccounts)
      next?.on?.('chainChanged', onChain)
    }
    const unbind = (next: Eip1193Provider | null) => {
      next?.removeListener?.('accountsChanged', onAccounts)
      next?.removeListener?.('chainChanged', onChain)
    }

    if (provider) void syncFromProvider(provider)
    bind(provider)

    const onAnnounce = () => {
      const next = readProvider()
      if (disposed || next === provider) return
      unbind(provider)
      provider = next
      bind(provider)
      if (provider) void syncFromProvider(provider)
    }
    window.addEventListener('eip6963:announceProvider', onAnnounce)
    return () => {
      disposed = true
      unbind(provider)
      window.removeEventListener('eip6963:announceProvider', onAnnounce)
    }
  }, [readProvider, syncFromProvider])

  useEffect(() => {
    void refreshBalances()
  }, [refreshBalances, chainId])

  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      const provider = await requestMetaMask()
      providerRef.current = provider
      setHasProvider(Boolean(provider))
      if (!provider) {
        setError(
          'MetaMask was not found. Pin the MetaMask extension in Chrome, then click Connect Wallet again.',
        )
        return
      }
      const chainId = await ensureArcChain(provider)
      const accounts = (await provider.request({
        method: 'eth_accounts',
      })) as string[]
      setAddress((accounts[0] as Address | undefined) ?? null)
      setChainId(chainId)
      if (chainId !== ARC_TESTNET.id) {
        setError(
          `MetaMask is on chain ${chainId}. Approve the switch to Arc Testnet.`,
        )
      }
    } catch (err) {
      setError(walletErrorMessage(err, 'Wallet connection was cancelled.'))
    } finally {
      setConnecting(false)
    }
  }, [])

  const switchToArc = useCallback(async () => {
    setError(null)
    try {
      const provider = await requestMetaMask()
      providerRef.current = provider
      setHasProvider(Boolean(provider))
      if (!provider) {
        setError(
          'MetaMask was not found. Pin the MetaMask extension in Chrome, then click Connect Wallet again.',
        )
        return null
      }
      const chainId = await ensureArcChain(provider)
      const accounts = (await provider.request({
        method: 'eth_accounts',
      })) as string[]
      setAddress((accounts[0] as Address | undefined) ?? null)
      setChainId(chainId)
      if (chainId !== ARC_TESTNET.id) {
        setError(
          `MetaMask is on chain ${chainId}. Approve the switch to Arc Testnet (${ARC_TESTNET.id}).`,
        )
      }
      return chainId
    } catch (err) {
      setError(walletErrorMessage(err, 'Could not switch MetaMask to Arc Testnet.'))
      return null
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setUsdcBalance(null)
    setNativeBalance(null)
    setError(null)
  }, [])

  const getProvider = useCallback((): Eip1193Provider | null => {
    return providerRef.current ?? getMetaMaskProvider()
  }, [])

  const value = useMemo<WalletState>(
    () => ({
      address,
      chainId,
      usdcBalance,
      nativeBalance,
      connecting,
      error,
      isArc: chainId === ARC_TESTNET.id,
      hasProvider,
      connect,
      disconnect,
      switchToArc,
      refreshBalances,
      getProvider,
    }),
    [
      address,
      chainId,
      usdcBalance,
      nativeBalance,
      connecting,
      error,
      hasProvider,
      connect,
      disconnect,
      switchToArc,
      refreshBalances,
      getProvider,
    ],
  )

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  )
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
