import { Link, useParams, useSearchParams } from 'react-router-dom'
import { DemoBadge, StatusBadge } from '../components/DemoBadge'
import { DonationPanel } from '../components/DonationPanel'
import { ProgressBar } from '../components/ProgressBar'
import { formatUsd, truncateAddress } from '../lib/format'
import {
  getCampaign,
  getConfirmedRaisedUsd,
  getDemoSampleRaisedUsd,
  getDonationsForCampaign,
} from '../lib/storage'
import { isListedCampaign } from '../lib/applicantSubmission'
import { isConfiguredRecipient } from '../lib/usdc'
import { explorerTxUrl } from '../config/arc'
import { canAcceptDonations } from '../types/campaign'
import { truncateHash } from '../lib/format'

export function CampaignDetailPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const campaign = id ? getCampaign(id) : undefined
  const amountParam = Number.parseFloat(params.get('amount') ?? '')
  const initialAmount =
    Number.isFinite(amountParam) && amountParam > 0 ? amountParam : undefined

  if (!campaign) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-ink">
          Request not found
        </h1>
        <p className="mt-3 text-ink/65">
          This campaign may have been removed or the link is incorrect.
        </p>
        <Link to="/explore" className="mt-6 inline-block font-semibold text-plum">
          Back to Make an Impact
        </Link>
      </div>
    )
  }

  const isPublic = isListedCampaign(campaign)
  const confirmed = getConfirmedRaisedUsd(campaign)
  const demoSample = getDemoSampleRaisedUsd(campaign)
  const remaining = Math.max(
    0,
    Math.round((campaign.goalUsd - confirmed) * 100) / 100,
  )
  const donateOk = canAcceptDonations(campaign.status)
  const donations = getDonationsForCampaign(campaign.id)
  const recipientConfigured = isConfiguredRecipient(campaign.recipientAddress)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to="/explore"
        className="text-sm font-semibold text-plum no-underline hover:underline"
      >
        ← Back to Make an Impact
      </Link>

      {!isPublic && (
        <p className="mt-4 rounded-2xl bg-blush/50 px-4 py-3 text-sm text-ink">
          This request is <strong>not published</strong> on Make an Impact yet
          (status: {campaign.status.replace(/_/g, ' ')}). Donation checkout is
          unavailable until Approved.
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="animate-fade-up">
          <div className="mb-6 flex h-48 items-end rounded-3xl bg-gradient-to-br from-lavender via-blush to-sage/70 p-5 shadow-[var(--shadow-soft)]">
            <span className="rounded-full bg-cream/90 px-3 py-1 text-xs font-semibold">
              {campaign.category}
            </span>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {campaign.isDemo && <DemoBadge />}
            <StatusBadge status={campaign.status} />
            {campaign.status === 'approved' && (
              <span className="rounded-full bg-sage/70 px-2.5 py-0.5 text-xs font-semibold text-ink">
                Demo review completed.
              </span>
            )}
          </div>

          <h1 className="font-display text-4xl font-semibold leading-tight text-ink">
            {campaign.title}
          </h1>

          <div className="mt-6 rounded-3xl bg-cream/90 p-5 shadow-[var(--shadow-soft)] ring-1 ring-blush/50">
            <ProgressBar
              confirmedRaised={confirmed}
              demoSampleRaised={demoSample}
              goal={campaign.goalUsd}
            />
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-ink/55">Goal</dt>
                <dd className="font-semibold text-ink">
                  {formatUsd(campaign.goalUsd)}
                </dd>
              </div>
              <div>
                <dt className="text-ink/55">Confirmed raised</dt>
                <dd className="font-semibold text-ink">
                  {formatUsd(confirmed)}
                </dd>
              </div>
              <div>
                <dt className="text-ink/55">Remaining</dt>
                <dd className="font-semibold text-ink">
                  {formatUsd(remaining)}
                </dd>
              </div>
              <div>
                <dt className="text-ink/55">Status</dt>
                <dd className="font-semibold capitalize text-ink">
                  {campaign.status.replace(/_/g, ' ')}
                </dd>
              </div>
            </dl>
            {recipientConfigured ? (
              <p className="mt-3 text-xs text-ink/50">
                Configured demo recipient:{' '}
                {truncateAddress(campaign.recipientAddress)}
              </p>
            ) : (
              <p className="mt-3 text-xs font-medium text-plum">
                No recipient wallet configured — donations are blocked.
              </p>
            )}
          </div>

          <div className="mt-8">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Story
            </h2>
            {campaign.story.split('\n').map((para, i) =>
              para.trim() ? (
                <p key={i} className="mt-3 text-base leading-relaxed text-ink/80">
                  {para}
                </p>
              ) : null,
            )}
          </div>

          {campaign.howMoneyUsed && (
            <div className="mt-6">
              <h2 className="font-display text-xl font-semibold text-ink">
                How funds help
              </h2>
              <p className="mt-2 text-ink/80">{campaign.howMoneyUsed}</p>
            </div>
          )}

          {donations.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-semibold text-ink">
                Confirmed donations
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {donations.map((d) => (
                  <li
                    key={d.txHash}
                    className="rounded-2xl bg-lavender/40 px-3 py-2"
                  >
                    {formatUsd(d.amountUsd)} ·{' '}
                    <a
                      href={explorerTxUrl(d.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-plum"
                    >
                      {truncateHash(d.txHash)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-8 rounded-2xl bg-lavender/50 px-4 py-3 text-sm text-ink/75">
            Confirmed totals come only from verified Arc Testnet USDC transfers.
            Demo sample progress is labeled separately and is not on-chain.
          </p>
        </article>

        <div className="animate-fade-up-delay lg:sticky lg:top-24 lg:self-start space-y-4">
          {donateOk ? (
            <DonationPanel
              campaignId={campaign.id}
              remainingUsd={remaining}
              campaignTitle={campaign.title}
              initialAmount={initialAmount}
              recipientAddress={campaign.recipientAddress}
            />
          ) : (
            <div className="rounded-3xl bg-cream p-6 shadow-[var(--shadow-card)] ring-1 ring-blush/70">
              <h2 className="font-display text-2xl font-semibold text-ink">
                Donations unavailable
              </h2>
              <p className="mt-2 text-sm text-ink/65">
                Checkout opens only for <strong>Approved</strong> campaigns.
                {campaign.status === 'funded'
                  ? ' This request is already funded.'
                  : ' This request is still in review or unpublished.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
