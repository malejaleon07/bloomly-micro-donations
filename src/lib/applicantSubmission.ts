import type {
  Campaign,
  CampaignStatus,
  ReviewerDecision,
} from '../types/campaign'
import { canAcceptDonations, isPublicCampaignStatus } from '../types/campaign'
import { isConfiguredRecipient } from './usdc'

/** Shown to applicants. This prototype never claims a real identity check. */
export const DEMO_VERIFICATION_LABEL = 'Demo verification — Pending review.'

const PENDING_SIMULATED_ID: Campaign['simulatedId'] = {
  persona: 'pending',
  stripeIdentity: 'pending',
}

/**
 * Applicant form data cannot choose a verification result or publish a campaign.
 * Reviewer-only fields are stripped. Status is draft or pending review.
 */
export function sanitizeApplicantCampaign(campaign: Campaign): Campaign {
  const status: CampaignStatus =
    campaign.status === 'draft' ? 'draft' : 'pending_review'

  return {
    ...campaign,
    status,
    isDemo: false,
    simulatedId: { ...PENDING_SIMULATED_ID },
    reviewerDecision: undefined,
    approvedAt: undefined,
    rejectedAt: undefined,
    decisionReason: undefined,
    reviewerNotes: undefined,
    moreInfoRequest: undefined,
    demoRaisedUsd: undefined,
  }
}

export function isListedCampaign(campaign: {
  status: CampaignStatus
  isDemo: boolean
  reviewerDecision?: ReviewerDecision
}): boolean {
  if (!isPublicCampaignStatus(campaign.status)) return false
  if (campaign.isDemo) return true
  return campaign.reviewerDecision === 'approved'
}

/** Approved by a demo reviewer, with a real configured wallet. */
export function campaignCanAcceptDonations(campaign: {
  status: CampaignStatus
  isDemo: boolean
  reviewerDecision?: ReviewerDecision
  recipientAddress?: string | null
}): boolean {
  if (!canAcceptDonations(campaign.status)) return false
  if (!campaign.isDemo && campaign.reviewerDecision !== 'approved') return false
  return isConfiguredRecipient(campaign.recipientAddress)
}

export function recipientAddressError(address: string): string | null {
  const value = address.trim()
  if (!value) {
    return 'Enter a valid Arc Testnet wallet address before this request can accept test donations.'
  }
  if (!isConfiguredRecipient(value)) {
    return 'Enter a valid Arc Testnet wallet address (0x followed by 40 hexadecimal characters).'
  }
  return null
}
