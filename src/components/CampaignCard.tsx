import type { Campaign } from '../types/campaign'
import { formatUsd } from '../lib/format'
import {
  getConfirmedRaisedUsd,
  getDemoSampleRaisedUsd,
} from '../lib/storage'
import { ButtonLink } from './Button'
import { DemoBadge, StatusBadge } from './DemoBadge'
import { ProgressBar } from './ProgressBar'

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const confirmed = getConfirmedRaisedUsd(campaign)
  const demoSample = getDemoSampleRaisedUsd(campaign)
  const preview =
    campaign.story.length > 140
      ? `${campaign.story.slice(0, 140).trim()}…`
      : campaign.story

  return (
    <article className="flex h-full flex-col rounded-3xl bg-cream/90 p-5 shadow-[var(--shadow-card)] ring-1 ring-blush/60 transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(157,81,133,0.16)]">
      <div className="mb-4 flex h-36 items-end rounded-2xl bg-gradient-to-br from-lavender via-blush to-sage/70 p-4">
        <span className="rounded-full bg-cream/90 px-3 py-1 text-xs font-semibold text-ink">
          {campaign.category}
        </span>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        {campaign.isDemo && <DemoBadge />}
        <StatusBadge status={campaign.status} />
      </div>

      <h3 className="font-display text-xl font-semibold text-ink leading-snug">
        {campaign.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70">{preview}</p>

      <div className="mt-4">
        <ProgressBar
          confirmedRaised={confirmed}
          demoSampleRaised={demoSample}
          goal={campaign.goalUsd}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink to={`/campaign/${campaign.id}`} variant="secondary" className="flex-1">
          Read Story
        </ButtonLink>
        <ButtonLink to={`/campaign/${campaign.id}#donate`} variant="primary" className="flex-1">
          Donate
        </ButtonLink>
      </div>

      <p className="mt-3 text-xs text-ink/50">
        Goal {formatUsd(campaign.goalUsd)} · community request
      </p>
    </article>
  )
}
