export const CATEGORIES = [
  'Food & Groceries',
  'Housing & Rent',
  'Baby Essentials',
  'Utilities',
  'Transportation',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

/** Public Explore only shows `approved` (and `funded` after goal met). */
export type CampaignStatus =
  | 'draft'
  | 'pending_review'
  | 'needs_more_info'
  | 'approved'
  | 'rejected'
  | 'funded'

export const EVIDENCE_TYPES = [
  'rent_bill',
  'utilities',
  'baby_estimate',
  'groceries_budget',
  'childcare_invoice',
  'transport_estimate',
  'other',
] as const

export type EvidenceType = (typeof EVIDENCE_TYPES)[number]

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  rent_bill: 'Rent bill',
  utilities: 'Utilities bill',
  baby_estimate: 'Baby essentials estimate',
  groceries_budget: 'Groceries budget',
  childcare_invoice: 'Childcare invoice',
  transport_estimate: 'Transport estimate',
  other: 'Other',
}

/** Simulated third-party ID check statuses (Persona / Stripe Identity style). */
export type SimulatedIdStatus =
  | 'not_started'
  | 'pending'
  | 'passed'
  | 'failed'
  | 'needs_retry'

/**
 * Written only by the reviewer dashboard.
 * Applicant submissions cannot set this, so form edits cannot self-approve.
 */
export type ReviewerDecision = 'approved' | 'rejected' | 'needs_more_info'

export interface ExpenseLine {
  id: string
  label: string
  amountUsd: number
}

export interface EvidenceItem {
  id: string
  type: EvidenceType
  /** Short label only. Real file contents are never stored. */
  fictionalDescription: string
  /** Display name for the demo document card. */
  fileName?: string
}

export interface Campaign {
  id: string
  title: string
  category: Category
  /** Situation / story */
  story: string
  /** How the money will be used */
  howMoneyUsed: string
  goalUsd: number
  expenses: ExpenseLine[]
  evidence: EvidenceItem[]
  simulatedId: {
    persona: SimulatedIdStatus
    stripeIdentity: SimulatedIdStatus
  }
  /** Validation flags for human review — never auto approve/reject. */
  autoCheckFlags: string[]
  recipientAddress: `0x${string}`
  imageDataUrl?: string
  status: CampaignStatus
  isDemo: boolean
  demoRaisedUsd?: number
  ownerDemoId?: string
  createdAt: string
  submittedAt?: string
  approvedAt?: string
  rejectedAt?: string
  /** Reviewer-only — never shown on public campaign pages. */
  reviewerNotes?: string
  decisionReason?: string
  moreInfoRequest?: string
  /** Present only after a demo reviewer records a decision. */
  reviewerDecision?: ReviewerDecision
}

export interface DonationRecord {
  id: string
  campaignId: string
  txHash: `0x${string}`
  amountUsd: number
  from: `0x${string}`
  to: `0x${string}`
  confirmedAt: string
  blockNumber: string
}

export function isPublicCampaignStatus(status: CampaignStatus): boolean {
  return status === 'approved' || status === 'funded'
}

export function canAcceptDonations(status: CampaignStatus): boolean {
  return status === 'approved'
}
