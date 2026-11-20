import { formatUsd, truncateHash } from '../../lib/format'
import {
  getCampaign,
  getConfirmedDonationsForAccount,
  getConfirmedDonationsTotalUsd,
} from '../../lib/storage'
import { explorerTxUrl } from '../../config/arc'
import { ButtonLink } from '../../components/Button'

export function MyDonationsPage() {
  const donations = getConfirmedDonationsForAccount()
  const total = getConfirmedDonationsTotalUsd()

  return (
    <div className="rounded-3xl bg-cream/95 p-6 shadow-[var(--shadow-card)] ring-1 ring-blush/60">
      <h2 className="font-display text-2xl font-semibold text-ink">
        My Donations
      </h2>
      <p className="mt-2 text-sm text-ink/65">
        Only <strong>confirmed</strong> on-chain payments appear here. Demo
        campaign progress and checkout previews are never counted.
      </p>

      <p className="mt-5 text-sm font-semibold text-ink">
        Confirmed total:{' '}
        <span className="text-plum">{formatUsd(total)}</span>
      </p>

      {donations.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-lavender/50 p-5 text-sm text-ink/70">
          <p>No confirmed donations yet.</p>
          <p className="mt-2">
            When Arc Testnet USDC transfers are connected, successful receipts
            will show here with explorer links.
          </p>
          <ButtonLink to="/explore" variant="secondary" className="mt-4">
            Make an Impact
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {donations.map((d) => {
            const campaign = getCampaign(d.campaignId)
            return (
              <li
                key={d.txHash}
                className="rounded-2xl bg-lavender/40 px-4 py-3 text-sm"
              >
                <p className="font-semibold text-ink">
                  {formatUsd(d.amountUsd)}
                  {campaign ? ` → ${campaign.title}` : ''}
                </p>
                <a
                  href={explorerTxUrl(d.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-plum"
                >
                  {truncateHash(d.txHash)}
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
