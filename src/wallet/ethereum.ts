import { ARC_TESTNET } from '../config/arc'

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
  isMetaMask?: boolean
  isPhantom?: boolean
  isBraveWallet?: boolean
  providers?: Eip1193Provider[]
}

type AnnouncedProvider = {
  info: { uuid: string; name: string; rdns: string }
  provider: Eip1193Provider
}

const announced: AnnouncedProvider[] = []
let listening = false
let requested = false

const ARC_CHAIN_HEX = `0x${ARC_TESTNET.id.toString(16)}`

function ensureListening() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('eip6963:announceProvider', (event: Event) => {
    const detail = (event as CustomEvent<AnnouncedProvider>).detail
    if (!detail?.provider || !detail.info?.uuid) return
    if (announced.some((item) => item.info.uuid === detail.info.uuid)) return
    announced.push(detail)
  })
}

function isMetaMaskProvider(provider: Eip1193Provider): boolean {
  return Boolean(provider.isMetaMask) && !provider.isPhantom && !provider.isBraveWallet
}

function pickMetaMask(): Eip1193Provider | null {
  const announcedMetaMask = announced.find(
    (item) => item.info.rdns === 'io.metamask' || item.info.name === 'MetaMask',
  )
  if (announcedMetaMask) return announcedMetaMask.provider

  const ethereum = window.ethereum as Eip1193Provider | undefined
  if (!ethereum) return null
  const fromList = ethereum.providers?.find(isMetaMaskProvider)
  if (fromList) return fromList
  if (isMetaMaskProvider(ethereum)) return ethereum
  // Phantom also injects window.ethereum and rejects Arc transfers. Never use it.
  return null
}

function askWalletsOnce() {
  if (requested || typeof window === 'undefined') return
  requested = true
  window.dispatchEvent(new Event('eip6963:requestProvider'))
}

/** MetaMask only. Phantom is ignored so it cannot intercept the transfer. */
export function getMetaMaskProvider(): Eip1193Provider | null {
  if (typeof window === 'undefined') return null
  ensureListening()
  askWalletsOnce()
  return pickMetaMask()
}

/** Wait briefly for MetaMask's EIP-6963 announcement before giving up. */
export function requestMetaMask(): Promise<Eip1193Provider | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  ensureListening()
  const existing = pickMetaMask()
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve) => {
    let done = false
    const finish = (provider: Eip1193Provider | null) => {
      if (done) return
      done = true
      window.clearTimeout(timer)
      window.removeEventListener('eip6963:announceProvider', onAnnounce)
      resolve(provider)
    }
    const onAnnounce = () => {
      const provider = pickMetaMask()
      if (provider) finish(provider)
    }
    const timer = window.setTimeout(() => finish(pickMetaMask()), 1000)
    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))
  })
}

/** Hex strings stay hex. Decimal strings and numbers stay decimal. */
export function parseChainId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'bigint') return Number(value)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = trimmed.startsWith('0x') || trimmed.startsWith('0X')
    ? Number.parseInt(trimmed, 16)
    : Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export function walletErrorMessage(err: unknown, fallback: string): string {
  const code = walletErrorCode(err)
  let message = ''
  if (err instanceof Error && err.message) message = err.message
  else if (typeof err === 'object' && err && 'message' in err) {
    const raw = (err as { message?: unknown }).message
    if (typeof raw === 'string') message = raw
  }
  const lower = message.toLowerCase()
  if (code === 4001 || lower.includes('user rejected') || lower.includes('user denied')) {
    return 'You closed the MetaMask popup. Click Connect Wallet and approve it.'
  }
  if (code === 4100 || lower.includes('not been authorized')) {
    return 'MetaMask has not approved Bloomly yet. Click Connect Wallet and approve the popup, then try again.'
  }
  if (message.trim()) return message
  return fallback
}

function walletErrorCode(err: unknown): number | undefined {
  if (typeof err === 'object' && err && 'code' in err) {
    const code = (err as { code?: unknown }).code
    if (typeof code === 'number') return code
  }
  return undefined
}

/** Switch MetaMask to Arc Testnet, adding the network when it is missing. */
export async function ensureArcChain(provider: Eip1193Provider): Promise<number> {
  // The raw MetaMask provider can read the chain without permission, then reject
  // the transfer. Ask for account access on this same provider first.
  await provider.request({ method: 'eth_requestAccounts' })

  const switchChain = () =>
    provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARC_CHAIN_HEX }],
    })

  try {
    await switchChain()
  } catch (err) {
    if (walletErrorCode(err) !== 4902) throw err
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: ARC_CHAIN_HEX,
          chainName: ARC_TESTNET.name,
          nativeCurrency: {
            name: 'USDC',
            symbol: 'USDC',
            decimals: 18,
          },
          rpcUrls: [...ARC_TESTNET.rpcUrls.default.http],
          blockExplorerUrls: [ARC_TESTNET.blockExplorers.default.url],
        },
      ],
    })
    await switchChain()
  }

  const chainId = parseChainId(await provider.request({ method: 'eth_chainId' }))
  if (chainId == null) {
    throw new Error('MetaMask did not return a chain id.')
  }
  return chainId
}
