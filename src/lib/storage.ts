import { SEED_CAMPAIGNS } from '../data/seedCampaigns'
import {
  isListedCampaign,
  sanitizeApplicantCampaign,
} from './applicantSubmission'
import { migrateLegacyStatus } from './requestValidation'
import type { Campaign, DonationRecord, ReviewerDecision } from '../types/campaign'

const CAMPAIGNS_KEY = 'bloomly:campaigns:v2'
const DONATIONS_KEY = 'bloomly:donations:v1'
const SEED_FLAG = 'bloomly:seeded:v2'
const LEGACY_CAMPAIGNS_KEY = 'bloomly:campaigns:v1'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function inferReviewerDecision(raw: Campaign): ReviewerDecision | undefined {
  if (raw.reviewerDecision) return raw.reviewerDecision
  if (raw.isDemo) return undefined
  if (
    (raw.status === 'approved' || raw.status === 'funded') &&
    raw.approvedAt
  ) {
    return 'approved'
  }
  if (raw.status === 'rejected' && raw.rejectedAt) return 'rejected'
  if (raw.status === 'needs_more_info' && raw.moreInfoRequest) {
    return 'needs_more_info'
  }
  return undefined
}

function normalizeCampaign(raw: Campaign): Campaign {
  const status = migrateLegacyStatus(raw.status as string)
  const migrated: Campaign = { ...raw, status }
  return {
    ...migrated,
    howMoneyUsed: raw.howMoneyUsed ?? '',
    expenses: raw.expenses ?? [],
    evidence: raw.evidence ?? [],
    simulatedId: raw.isDemo
      ? (raw.simulatedId ?? {
          persona: 'not_started',
          stripeIdentity: 'not_started',
        })
      : { persona: 'pending', stripeIdentity: 'pending' },
    autoCheckFlags: raw.autoCheckFlags ?? [],
    reviewerDecision: inferReviewerDecision(migrated),
  }
}

function applicantMayEdit(existing: Campaign): boolean {
  if (existing.isDemo || existing.reviewerDecision) return false
  return (
    existing.status === 'draft' ||
    existing.status === 'pending_review' ||
    existing.status === 'needs_more_info'
  )
}

export function ensureSeeded(): void {
  if (localStorage.getItem(SEED_FLAG) === '1') {
    const existing = readJson<Campaign[]>(CAMPAIGNS_KEY, [])
    if (existing.length === 0) {
      writeJson(CAMPAIGNS_KEY, SEED_CAMPAIGNS)
    }
    return
  }

  // Migrate user-created campaigns from v1 if present; refresh demo seeds.
  const legacy = readJson<Campaign[]>(LEGACY_CAMPAIGNS_KEY, [])
  const userOnes = legacy
    .filter((c) => !c.isDemo)
    .map((c) => normalizeCampaign(c))
  writeJson(CAMPAIGNS_KEY, [...userOnes, ...SEED_CAMPAIGNS])
  if (!localStorage.getItem(DONATIONS_KEY)) {
    writeJson(DONATIONS_KEY, [] as DonationRecord[])
  }
  localStorage.setItem(SEED_FLAG, '1')
}

export function getCampaigns(): Campaign[] {
  ensureSeeded()
  return readJson<Campaign[]>(CAMPAIGNS_KEY, SEED_CAMPAIGNS).map(normalizeCampaign)
}

export function saveCampaigns(campaigns: Campaign[]): void {
  writeJson(CAMPAIGNS_KEY, campaigns)
}

export function getCampaign(id: string): Campaign | undefined {
  return getCampaigns().find((c) => c.id === id)
}

export function upsertCampaign(campaign: Campaign): void {
  const all = getCampaigns()
  const idx = all.findIndex((c) => c.id === campaign.id)
  if (idx >= 0) all[idx] = campaign
  else all.unshift(campaign)
  saveCampaigns(all)
}

/**
 * Applicant save path. Ignores any verification result or approval flag
 * included in the form payload, and will not overwrite a reviewer decision.
 */
export function saveApplicantCampaign(campaign: Campaign): Campaign {
  const existing = getCampaign(campaign.id)
  if (existing && !applicantMayEdit(existing)) return existing
  const safe = sanitizeApplicantCampaign({
    ...campaign,
    createdAt: existing?.createdAt ?? campaign.createdAt,
    ownerDemoId: existing?.ownerDemoId ?? campaign.ownerDemoId,
  })
  upsertCampaign(safe)
  return safe
}

/**
 * Only the reviewer dashboard should call this.
 * Applicant form saves cannot set these statuses.
 */
export function applyReviewerDecision(
  campaignId: string,
  action: ReviewerDecision,
  notes: { reason?: string; moreInfo?: string } = {},
): Campaign | null {
  const existing = getCampaign(campaignId)
  if (!existing || existing.isDemo) return null
  const now = new Date().toISOString()
  const reason = notes.reason?.trim()
  const moreInfo = notes.moreInfo?.trim()
  const simulatedId: Campaign['simulatedId'] = {
    persona: 'pending',
    stripeIdentity: 'pending',
  }

  let next: Campaign
  if (action === 'approved') {
    next = {
      ...existing,
      status: 'approved',
      reviewerDecision: 'approved',
      approvedAt: now,
      rejectedAt: undefined,
      moreInfoRequest: undefined,
      decisionReason: reason || 'Approved in demo reviewer',
      simulatedId,
    }
  } else if (action === 'rejected') {
    if (!reason) return null
    next = {
      ...existing,
      status: 'rejected',
      reviewerDecision: 'rejected',
      rejectedAt: now,
      decisionReason: reason,
      simulatedId,
    }
  } else {
    if (!moreInfo) return null
    next = {
      ...existing,
      status: 'needs_more_info',
      reviewerDecision: 'needs_more_info',
      moreInfoRequest: moreInfo,
      decisionReason: reason || undefined,
      simulatedId,
    }
  }

  upsertCampaign(next)
  return next
}

export function getPublicCampaigns(): Campaign[] {
  return getCampaigns().filter((c) => isListedCampaign(c))
}

export function getReviewQueue(): Campaign[] {
  return getCampaigns().filter(
    (c) =>
      !c.isDemo &&
      (c.status === 'pending_review' || c.status === 'needs_more_info'),
  )
}

export function getDonations(): DonationRecord[] {
  ensureSeeded()
  return readJson<DonationRecord[]>(DONATIONS_KEY, [])
}

export function getDonationsForCampaign(campaignId: string): DonationRecord[] {
  return getDonations().filter((d) => d.campaignId === campaignId)
}

export function getVerifiedRaisedUsd(campaignId: string): number {
  const seen = new Set<string>()
  let total = 0
  for (const d of getDonationsForCampaign(campaignId)) {
    const key = d.txHash.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    total += d.amountUsd
  }
  return Math.round(total * 100) / 100
}

/** Confirmed on-chain raised only (never demo seed amounts). */
export function getConfirmedRaisedUsd(campaign: Campaign): number {
  return getVerifiedRaisedUsd(campaign.id)
}

/** Demo/sample progress only — must be labeled in UI. */
export function getDemoSampleRaisedUsd(campaign: Campaign): number {
  return campaign.demoRaisedUsd ?? 0
}

/** @deprecated Prefer confirmed + demo helpers with labels. */
export function getDisplayRaised(campaign: Campaign): number {
  const verified = getVerifiedRaisedUsd(campaign.id)
  if (verified > 0) return verified
  return campaign.demoRaisedUsd ?? 0
}

export function hasDonationTx(txHash: string): boolean {
  const key = txHash.toLowerCase()
  return getDonations().some((d) => d.txHash.toLowerCase() === key)
}

/**
 * Persist only after independent receipt verification.
 * Deduplicates by tx hash. Returns false if hash already recorded.
 */
export function recordVerifiedDonation(donation: DonationRecord): boolean {
  if (hasDonationTx(donation.txHash)) return false
  const all = getDonations()
  all.unshift(donation)
  writeJson(DONATIONS_KEY, all)

  const campaign = getCampaign(donation.campaignId)
  if (campaign && (campaign.status === 'approved' || campaign.status === 'funded')) {
    const raised = getVerifiedRaisedUsd(donation.campaignId)
    if (raised >= campaign.goalUsd && campaign.status === 'approved') {
      upsertCampaign({ ...campaign, status: 'funded' })
    }
  }
  return true
}

export function userHasActiveCampaign(
  ownerDemoId?: string,
  excludeId?: string,
): boolean {
  const blocking: Campaign['status'][] = [
    'draft',
    'pending_review',
    'needs_more_info',
    'approved',
  ]
  return getCampaigns().some((c) => {
    if (c.id === excludeId || c.isDemo) return false
    if (!blocking.includes(c.status)) return false
    if (ownerDemoId) return c.ownerDemoId === ownerDemoId
    return !c.ownerDemoId
  })
}

export function getCampaignsForOwner(ownerDemoId: string): Campaign[] {
  return getCampaigns().filter((c) => c.ownerDemoId === ownerDemoId)
}

export function getConfirmedDonationsTotalUsd(fromAddress?: string): number {
  const seen = new Set<string>()
  let total = 0
  for (const d of getDonations()) {
    if (fromAddress && d.from.toLowerCase() !== fromAddress.toLowerCase()) {
      continue
    }
    const key = d.txHash.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    total += d.amountUsd
  }
  return Math.round(total * 100) / 100
}

export function getConfirmedDonationsForAccount(): DonationRecord[] {
  return getDonations()
}
