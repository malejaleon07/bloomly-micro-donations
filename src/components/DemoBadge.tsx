import type { CampaignStatus } from '../types/campaign'

export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-sage/80 px-2.5 py-0.5 text-xs font-semibold text-ink ${className}`}
    >
      Demo sample
    </span>
  )
}

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const map: Record<CampaignStatus, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-cream text-ink ring-1 ring-blush' },
    pending_review: { label: 'Pending review', cls: 'bg-lavender text-ink' },
    needs_more_info: {
      label: 'Needs more information',
      cls: 'bg-blush text-ink',
    },
    approved: { label: 'Approved', cls: 'bg-sage/80 text-ink' },
    rejected: { label: 'Rejected', cls: 'bg-ink/10 text-ink' },
    funded: { label: 'Funded', cls: 'bg-plum text-cream' },
  }
  const item = map[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.cls}`}
    >
      {item.label}
    </span>
  )
}
