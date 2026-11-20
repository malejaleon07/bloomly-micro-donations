import { useEffect, useMemo, useState } from 'react'
import { explorerTxUrl, ARC_TESTNET, FAUCET_URL } from '../config/arc'
import { formatUsd, truncateAddress, truncateHash } from '../lib/format'
import {
  getConfirmedRaisedUsd,
  getCampaign,
  recordVerifiedDonation,
  upsertCampaign,
} from '../lib/storage'
import {
  getUsdcBalance,
  humanizeWalletError,
  isConfiguredRecipient,
  sendUsdcTransfer,
  verifyUsdcTransferReceipt,
} from '../lib/usdc'
import { useAuth } from '../account/AuthContext'
import { useWallet } from '../wallet/WalletContext'
import { Button } from './Button'
import { ConnectWalletButton } from './ConnectWalletButton'
import type { Hash } from 'viem'
import { campaignCanAcceptDonations } from '../lib/applicantSubmission'
import { canAcceptDonations } from '../types/campaign'

const PRESETS = [0.05, 0.1, 0.25, 1, 5, 10, 25] as const

type Phase = 'idle' | 'sending' | 'confirming' | 'success' | 'error'

type ChecklistItem = { ok: boolean; label: string }

export function DonationPanel({
  campaignId,
  remainingUsd,
  campaignTitle,
  initialAmount,
  recipientAddress,
}: {
  campaignId: string
  remainingUsd: number
  campaignTitle: string
  initialAmount?: number
  recipientAddress?: `0x${string}`
}) {
  const wallet = useWallet()
  const { account } = useAuth()
  const signedIn = Boolean(account)
  const initial =
    initialAmount && initialAmount > 0
      ? Math.round(initialAmount * 100) / 100
      : 1
  const matchesPreset = (PRESETS as readonly number[]).includes(initial)

  const [preset, setPreset] = useState<number | 'custom'>(
    matchesPreset ? initial : 'custom',
  )
  const [custom, setCustom] = useState(initial.toFixed(2))
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<Hash | null>(null)
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!initialAmount || initialAmount <= 0) return
    const amt = Math.round(initialAmount * 100) / 100
    if ((PRESETS as readonly number[]).includes(amt)) setPreset(amt)
    else {
      setPreset('custom')
      setCustom(amt.toFixed(2))
    }
  }, [initialAmount])

  const amount = useMemo(() => {
    if (preset === 'custom') {
      const n = Number.parseFloat(custom)
      return Number.isFinite(n) ? n : 0
    }
    return preset
  }, [preset, custom])

  const campaign = useMemo(() => {
    void tick
    return getCampaign(campaignId)
  }, [campaignId, tick])

  const recipientOk = isConfiguredRecipient(recipientAddress)
  const reviewerOk = Boolean(
    campaign && (campaign.isDemo || campaign.reviewerDecision === 'approved'),
  )
  const statusOk = Boolean(
    campaign && canAcceptDonations(campaign.status) && reviewerOk,
  )
  const amountOk = amount > 0
  const remainingOk = remainingUsd > 0
  const withinRemaining = amountOk && amount <= remainingUsd + 1e-9
  const walletConnected = Boolean(wallet.address)
  const onArc = wallet.isArc

  /** Amount / campaign gates (not wallet — wallet gets its own CTA). */
  const campaignReady =
    statusOk && recipientOk && remainingOk && amountOk && withinRemaining

  const readyToSend =
    campaignReady && wallet.hasProvider && walletConnected && onArc

  const checklist: ChecklistItem[] = [
    {
      ok: statusOk,
      label: statusOk
        ? 'Campaign is Approved'
        : 'Campaign must be Approved (not draft / review / funded)',
    },
    {
      ok: recipientOk,
      label: recipientOk
        ? `Recipient set (${truncateAddress(recipientAddress!)})`
        : 'Recipient missing — Settings → paste your 0x address → Apply to demo sample campaigns',
    },
    {
      ok: remainingOk,
      label: remainingOk
        ? `Room left vs goal (${formatUsd(remainingUsd)})`
        : 'Goal already reached (confirmed raised)',
    },
    {
      ok: amountOk && withinRemaining,
      label:
        !amountOk
          ? 'Choose an amount greater than $0'
          : withinRemaining
            ? `Amount ${formatUsd(amount)} is within remaining`
            : `Amount exceeds remaining ${formatUsd(remainingUsd)} — pick a smaller preset`,
    },
    {
      ok: wallet.hasProvider,
      label: wallet.hasProvider
        ? 'Wallet extension detected'
        : 'Install MetaMask (browser extension), then refresh',
    },
    {
      ok: walletConnected,
      label: !walletConnected
        ? 'Connect Wallet (button below or in the nav)'
        : signedIn
          ? `Wallet connected to your account (${truncateAddress(wallet.address!)})`
          : 'Wallet connected',
    },
    {
      ok: onArc,
      label: !onArc
        ? signedIn
          ? 'Switch to Arc Testnet (chain 5042002)'
          : 'Switch network in your wallet, then try again'
        : signedIn
          ? `On ${ARC_TESTNET.name}`
          : 'Network ready',
    },
  ]

  async function onDonate() {
    setError(null)
    setTxHash(null)
    setConfirmedAmount(null)

    if (!statusOk) {
      setError('Donations are only allowed for Approved campaigns.')
      setPhase('error')
      return
    }
    if (!recipientOk || !recipientAddress) {
      setError(
        'No recipient wallet is configured. Login → Daily Blooms → Settings → paste your MetaMask address → Apply to demo sample campaigns.',
      )
      setPhase('error')
      return
    }
    if (!wallet.hasProvider) {
      setError('Install MetaMask (or another EVM wallet) to donate.')
      setPhase('error')
      return
    }
    if (!wallet.address) {
      setError('Connect your wallet first.')
      setPhase('error')
      return
    }
    if (!amountOk || !withinRemaining || !remainingOk) {
      setError('Choose a valid amount within the remaining goal.')
      setPhase('error')
      return
    }

    const live = getCampaign(campaignId)
    if (!live || !campaignCanAcceptDonations(live)) {
      setError(
        'Test donations stay closed until a demo reviewer approves the request and a valid Arc Testnet address is saved.',
      )
      setPhase('error')
      return
    }

    const liveChain = await wallet.switchToArc()
    if (liveChain !== ARC_TESTNET.id) {
      setError(
        `MetaMask needs to be on Arc Testnet (${ARC_TESTNET.id}) before this donation can send.${
          liveChain != null ? ` It is on chain ${liveChain}.` : ''
        } Approve the network switch, then try again.`,
      )
      setPhase('error')
      return
    }

    const provider = wallet.getProvider()
    if (!provider) {
      setError('Click Connect Wallet and approve MetaMask, then try the donation again.')
      setPhase('error')
      return
    }

    try {
      setPhase('sending')
      const balance = await getUsdcBalance(wallet.address)
      if (balance < amount) {
        setError(
          `Insufficient Arc Testnet USDC. Balance ≈ ${formatUsd(balance)}. Get free test USDC from the Circle faucet.`,
        )
        setPhase('error')
        return
      }

      const hash = await sendUsdcTransfer({
        provider,
        from: wallet.address,
        to: recipientAddress,
        amountUsd: amount,
      })
      setTxHash(hash)
      setPhase('confirming')

      const verified = await verifyUsdcTransferReceipt({
        hash,
        expectedFrom: wallet.address,
        expectedTo: recipientAddress,
        expectedAmountUsd: amount,
      })

      if (!verified.ok) {
        setError(verified.reason)
        setPhase('error')
        await wallet.refreshBalances()
        return
      }

      const recorded = recordVerifiedDonation({
        id: `don-${Date.now().toString(36)}`,
        campaignId,
        txHash: hash,
        amountUsd: verified.amountUsd,
        from: verified.from,
        to: verified.to,
        confirmedAt: new Date().toISOString(),
        blockNumber: verified.blockNumber.toString(),
      })

      if (!recorded) {
        setError(
          'This transaction was already recorded (duplicate hash). Progress was not double-counted.',
        )
        setPhase('error')
        return
      }

      const updated = getCampaign(campaignId)
      if (updated) upsertCampaign(updated)

      setConfirmedAmount(verified.amountUsd)
      setPhase('success')
      setTick((t) => t + 1)
      await wallet.refreshBalances()
    } catch (err) {
      setError(humanizeWalletError(err))
      setPhase('error')
      await wallet.refreshBalances()
    }
  }

  const busy = phase === 'sending' || phase === 'confirming'
  const confirmedRaised = campaign ? getConfirmedRaisedUsd(campaign) : 0

  /** Primary CTA: never a silent dead “Donate” when wallet/network is the only gap. */
  let ctaLabel = `Donate ${formatUsd(amount)} USDC`
  let ctaDisabled = busy || !campaignReady
  let ctaAction: () => void = () => void onDonate()

  if (busy) {
    ctaLabel =
      phase === 'sending' ? 'Confirm in wallet…' : 'Waiting for confirmation…'
    ctaDisabled = true
  } else if (!remainingOk) {
    ctaLabel = 'Goal reached'
    ctaDisabled = true
  } else if (!campaignReady) {
    ctaLabel = !recipientOk
      ? 'Recipient required — see checklist'
      : !statusOk
        ? 'Not open for donations'
        : 'Fix amount — see checklist'
    ctaDisabled = true
  } else if (!wallet.hasProvider) {
    ctaLabel = 'Install MetaMask to donate'
    ctaDisabled = true
  } else if (!walletConnected) {
    ctaLabel = 'Connect Wallet to donate'
    ctaDisabled = wallet.connecting
    ctaAction = () => void wallet.connect()
  } else if (!onArc) {
    ctaLabel = 'Switch to Arc Testnet'
    ctaDisabled = false
    ctaAction = () => void onDonate()
  } else if (readyToSend) {
    ctaLabel = `Donate ${formatUsd(amount)} USDC`
    ctaDisabled = false
    ctaAction = () => void onDonate()
  }

  return (
    <section
      id="donate"
      className="scroll-mt-24 rounded-3xl bg-cream p-6 shadow-[var(--shadow-card)] ring-1 ring-blush/70"
    >
      <h2 className="font-display text-2xl font-semibold text-ink">Donate</h2>
      <p className="mt-1 text-sm text-ink/65">
        Support <span className="font-semibold text-ink">{campaignTitle}</span> with
        Arc Testnet USDC. Amounts shown in dollars.
      </p>

      <div className="mt-4">
        <ConnectWalletButton compact />
        {wallet.error && phase !== 'error' && (
          <p className="mt-2 text-xs font-medium text-plum" role="alert">
            {wallet.error}
          </p>
        )}
      </div>

      {signedIn && wallet.address && (
        <p className="mt-2 text-xs text-ink/55">
          Wallet connected to {account!.displayName.split(' ')[0]}
          {' · '}
          {truncateAddress(wallet.address)}
          {wallet.isArc ? ` · ${ARC_TESTNET.name}` : ''}
          {wallet.usdcBalance != null
            ? ` · Balance ≈ ${formatUsd(wallet.usdcBalance)}`
            : ''}
        </p>
      )}

      <ul
        className="mt-4 space-y-1.5 rounded-2xl bg-lavender/40 px-3 py-3 text-xs text-ink"
        aria-label="Donation readiness checklist"
      >
        <li className="font-semibold text-ink/80">Before Donate works:</li>
        {checklist.map((item) => (
          <li key={item.label} className="flex gap-2">
            <span aria-hidden="true">{item.ok ? '✓' : '○'}</span>
            <span className={item.ok ? 'text-ink/70' : 'font-medium text-ink'}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm font-medium text-ink">
        Remaining vs goal:{' '}
        <span className="text-plum">{formatUsd(remainingUsd)}</span>
        <span className="text-ink/50">
          {' '}
          · confirmed raised {formatUsd(confirmedRaised)}
        </span>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            disabled={busy}
            className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
              preset === p
                ? 'bg-plum text-cream'
                : 'bg-lavender text-ink hover:bg-blush'
            }`}
          >
            {formatUsd(p)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPreset('custom')}
          disabled={busy}
          className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
            preset === 'custom'
              ? 'bg-plum text-cream'
              : 'bg-lavender text-ink hover:bg-blush'
          }`}
        >
          Custom
        </button>
      </div>

      {preset === 'custom' && (
        <label className="mt-4 block text-sm font-medium text-ink">
          Custom amount (USD)
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={custom}
            disabled={busy}
            onChange={(e) => setCustom(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-4 py-2.5 text-ink outline-none focus:ring-2 focus:ring-plum/40"
          />
        </label>
      )}

      {!withinRemaining && amountOk && (
        <p className="mt-3 text-sm font-medium text-plum" role="alert">
          That amount is more than the remaining {formatUsd(remainingUsd)}.
        </p>
      )}

      <Button
        type="button"
        variant="primary"
        className="mt-5 w-full py-3"
        disabled={ctaDisabled}
        onClick={ctaAction}
      >
        {ctaLabel}
      </Button>

      <p className="mt-2 text-xs text-ink/50">
        Need test USDC?{' '}
        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-plum"
        >
          Circle faucet
        </a>
        . Settings apply is only needed so <em>you</em> receive the test USDC —
        demo campaigns already have a recipient address so Donate can unlock.
      </p>

      {phase === 'success' && txHash && (
        <div
          className="mt-4 rounded-2xl bg-sage/50 px-4 py-3 text-sm text-ink"
          role="status"
        >
          <p className="font-semibold text-ink">Donation confirmed on Arc Testnet</p>
          <p className="mt-1">
            Amount verified: {formatUsd(confirmedAmount ?? amount)}
          </p>
          <p className="mt-1 break-all text-xs">Tx {truncateHash(txHash)}</p>
          <a
            href={explorerTxUrl(txHash)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block font-semibold text-plum"
          >
            View on Arc explorer →
          </a>
        </div>
      )}

      {phase === 'error' && error && (
        <p
          className="mt-4 rounded-2xl bg-blush/70 px-3 py-2 text-sm font-medium text-ink"
          role="alert"
        >
          {error}
          {txHash && (
            <>
              {' '}
              <a
                href={explorerTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                View tx
              </a>
            </>
          )}
        </p>
      )}
    </section>
  )
}
