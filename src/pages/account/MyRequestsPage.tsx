import { Link } from 'react-router-dom'
import { useAuth } from '../../account/AuthContext'
import { StatusBadge } from '../../components/DemoBadge'
import { ButtonLink } from '../../components/Button'
import { ProgressBar } from '../../components/ProgressBar'
import { formatUsd } from '../../lib/format'
import {
  getCampaignsForOwner,
  getConfirmedRaisedUsd,
  getDemoSampleRaisedUsd,
} from '../../lib/storage'

function verificationCopy(status: string, moreInfo?: string): string {
  switch (status) {
    case 'draft':
      return 'Draft — not submitted. Finish and submit for demo review.'
    case 'pending_review':
      return 'Demo verification — Pending review. A demo reviewer must approve this request before it appears on Make an Impact.'
    case 'needs_more_info':
      return `Needs more information (simulation).${moreInfo ? ` Reviewer asked: ${moreInfo}` : ''}`
    case 'approved':
      return 'Approved after demo review. “Demo review completed.” on the public page is not a real verification badge.'
    case 'rejected':
      return 'Rejected in the demo reviewer. Not shown publicly.'
    case 'funded':
      return 'Funded — goal reached in this demo.'
    default:
      return status
  }
}

export function MyRequestsPage() {
  const { account } = useAuth()
  const requests = account ? getCampaignsForOwner(account.id) : []

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-cream/95 p-6 shadow-[var(--shadow-card)] ring-1 ring-blush/60">
        <h2 className="font-display text-2xl font-semibold text-ink">
          My Requests
        </h2>
        <p className="mt-2 text-sm text-ink/65">
          Track requests you started. Review and approval are a{' '}
          <strong>simulation</strong> — not real identity verification.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink to="/request" variant="primary">
            Start a request
          </ButtonLink>
          <ButtonLink to="/reviewer" variant="secondary">
            Open reviewer demo
          </ButtonLink>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-3xl bg-lavender/40 p-6 text-sm text-ink/70">
          You haven’t started a request yet from this demo account.
        </div>
      ) : (
        <ul className="space-y-4">
          {requests.map((c) => {
            const confirmed = getConfirmedRaisedUsd(c)
            const demoSample = getDemoSampleRaisedUsd(c)
            return (
              <li
                key={c.id}
                className="rounded-3xl bg-cream p-5 shadow-[var(--shadow-soft)] ring-1 ring-blush/60"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={c.status} />
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold text-ink">
                  <Link
                    to={`/campaign/${c.id}?preview=1`}
                    className="text-ink no-underline hover:text-plum"
                  >
                    {c.title}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-ink/60">{c.category}</p>

                <div className="mt-4 rounded-2xl bg-lavender/40 p-3 text-sm text-ink/75">
                  <p className="font-semibold text-ink">
                    Verification of a request
                  </p>
                  <p className="mt-1">
                    {verificationCopy(c.status, c.moreInfoRequest)}
                  </p>
                  {c.decisionReason && (
                    <p className="mt-2 text-xs text-ink/55">
                      Decision note: {c.decisionReason}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <ProgressBar
                    confirmedRaised={confirmed}
                    demoSampleRaised={demoSample}
                    goal={c.goalUsd}
                  />
                  <p className="mt-2 text-xs text-ink/50">
                    Goal {formatUsd(c.goalUsd)}
                    {c.recipientAddress
                      ? ` · recipient ${c.recipientAddress.slice(0, 8)}…`
                      : ' · no recipient configured'}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
