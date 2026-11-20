import { useState } from 'react'
import { getAddress } from 'viem'
import { useAuth } from '../../account/AuthContext'
import { Button } from '../../components/Button'
import { getCampaigns, upsertCampaign } from '../../lib/storage'
import { isConfiguredRecipient } from '../../lib/usdc'

const RECIPIENT_KEY = 'bloomly:default-recipient'

export function SettingsPage() {
  const { account, logout } = useAuth()
  const [recipient, setRecipient] = useState(() => {
    try {
      return localStorage.getItem(RECIPIENT_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [message, setMessage] = useState<string | null>(null)

  function saveDefault() {
    setMessage(null)
    if (!isConfiguredRecipient(recipient.trim())) {
      setMessage('Enter a valid Arc Testnet address (0x…).')
      return
    }
    const addr = getAddress(recipient.trim())
    localStorage.setItem(RECIPIENT_KEY, addr)
    setRecipient(addr)
    setMessage('Saved default recipient for new requests.')
  }

  function applyToDemoCampaigns() {
    setMessage(null)
    if (!isConfiguredRecipient(recipient.trim())) {
      setMessage('Enter a valid address first.')
      return
    }
    const addr = getAddress(recipient.trim())
    localStorage.setItem(RECIPIENT_KEY, addr)
    let n = 0
    for (const c of getCampaigns()) {
      if (!c.isDemo) continue
      upsertCampaign({ ...c, recipientAddress: addr })
      n += 1
    }
    setMessage(
      `Applied ${addr} to ${n} demo sample campaign(s). New donations will go there.`,
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-cream/95 p-6 shadow-[var(--shadow-card)] ring-1 ring-blush/60">
        <h2 className="font-display text-2xl font-semibold text-ink">Settings</h2>
        <p className="mt-2 text-sm text-ink/65">
          Demo account preferences stored in this browser only.
        </p>

        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-ink/55">Display name</dt>
            <dd className="font-semibold text-ink">{account?.displayName}</dd>
          </div>
          <div>
            <dt className="text-ink/55">Email label</dt>
            <dd className="font-semibold text-ink">{account?.email}</dd>
          </div>
          <div>
            <dt className="text-ink/55">Account type</dt>
            <dd className="font-semibold text-ink">Demo (no password stored)</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-3xl bg-cream/95 p-6 shadow-[var(--shadow-card)] ring-1 ring-blush/60">
        <h3 className="font-display text-xl font-semibold text-ink">
          Demo USDC recipient
        </h3>
        <p className="mt-2 text-sm text-ink/65">
          Paste an Arc Testnet wallet you control. Bloomly never invents
          recipients at donate time — campaigns must have a configured address.
        </p>
        <label className="mt-4 block text-sm font-semibold text-ink">
          Address
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x…"
            className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-plum/30"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={saveDefault}>
            Save as default
          </Button>
          <Button type="button" variant="primary" onClick={applyToDemoCampaigns}>
            Apply to demo sample campaigns
          </Button>
        </div>
        {message && (
          <p className="mt-3 rounded-2xl bg-lavender/50 px-3 py-2 text-sm" role="status">
            {message}
          </p>
        )}
      </div>

      <Button type="button" variant="ghost" onClick={logout}>
        Log out of demo account
      </Button>
    </div>
  )
}
