import { useAuth } from '../account/AuthContext'
import { ARC_TESTNET } from '../config/arc'
import { truncateAddress } from '../lib/format'
import { useWallet } from '../wallet/WalletContext'
import { Button } from './Button'

/** Address and network stay hidden until a Bloomly account is logged in. */
export function ConnectWalletButton({
  compact = false,
}: {
  compact?: boolean
}) {
  const { account } = useAuth()
  const { address, connecting, error, hasProvider, isArc, connect } = useWallet()
  const signedIn = Boolean(account)

  if (signedIn && address) {
    const name = account!.displayName.split(' ')[0]
    return (
      <span
        className="inline-flex items-center rounded-full bg-lavender px-3 py-1.5 text-xs font-semibold text-ink"
        title={`Wallet connected to ${name}`}
      >
        {truncateAddress(address, 4)}
        {isArc ? ` · ${ARC_TESTNET.name}` : ''}
        <span className="sr-only">Wallet connected to {name}</span>
      </span>
    )
  }

  return (
    <div>
      <Button
        type="button"
        variant={compact ? 'secondary' : 'primary'}
        disabled={connecting}
        onClick={() => void connect()}
      >
        {connecting ? 'Connecting…' : 'Connect Wallet'}
      </Button>
      {!hasProvider && !compact && (
        <p className="mt-2 text-xs text-ink/60">Uses MetaMask.</p>
      )}
      {error && !compact && (
        <p className="mt-2 text-xs font-medium text-plum" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
