import { MAX_CAMPAIGN_GOAL_USD } from '../config/arc'
import type { Campaign, ExpenseLine, EvidenceItem } from '../types/campaign'
import { getCampaigns } from './storage'

export function expenseTotal(expenses: ExpenseLine[]): number {
  return Math.round(
    expenses.reduce((sum, e) => sum + (Number(e.amountUsd) || 0), 0) * 100,
  ) / 100
}

/**
 * Automated validation flags for human review only.
 * Never used to auto-approve or auto-reject hardship/fraud.
 */
export function computeAutoCheckFlags(input: {
  title: string
  story: string
  howMoneyUsed: string
  goalUsd: number
  expenses: ExpenseLine[]
  evidence: EvidenceItem[]
  excludeId?: string
}): string[] {
  const flags: string[] = []
  const { title, story, howMoneyUsed, goalUsd, expenses, evidence, excludeId } =
    input

  if (title.trim().length < 4) flags.push('Missing or too-short title')
  if (story.trim().length < 40) flags.push('Situation story incomplete')
  if (howMoneyUsed.trim().length < 20) flags.push('How-money-used explanation incomplete')
  if (!Number.isFinite(goalUsd) || goalUsd < 1) flags.push('Invalid requested amount')
  if (goalUsd > MAX_CAMPAIGN_GOAL_USD) {
    flags.push(`Requested amount exceeds $${MAX_CAMPAIGN_GOAL_USD} max`)
  }
  if (expenses.length === 0) flags.push('No expense line items')
  const total = expenseTotal(expenses)
  if (expenses.length > 0 && Math.abs(total - goalUsd) > 0.01) {
    flags.push(
      `Expense total (${total.toFixed(2)}) differs from requested amount (${goalUsd.toFixed(2)})`,
    )
  }
  if (evidence.length === 0) {
    flags.push('Missing supporting evidence type descriptions')
  } else if (evidence.some((e) => e.fictionalDescription.trim().length < 8)) {
    flags.push('One or more evidence descriptions are incomplete')
  }

  // Possible duplicates — flag for human review only
  const others = getCampaigns().filter(
    (c) =>
      c.id !== excludeId &&
      !c.isDemo &&
      (c.status === 'pending_review' ||
        c.status === 'approved' ||
        c.status === 'needs_more_info' ||
        c.status === 'funded'),
  )
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  const titleNorm = norm(title)
  const dup = others.find((c) => {
    const sameTitle = norm(c.title) === titleNorm
    const similarGoal = Math.abs(c.goalUsd - goalUsd) < 1
    return sameTitle || (similarGoal && norm(c.story).slice(0, 60) === norm(story).slice(0, 60))
  })
  if (dup) {
    flags.push(`Possible duplicate of existing request “${dup.title}” (${dup.id})`)
  }

  return flags
}

export function requiredFieldsOk(input: {
  title: string
  story: string
  howMoneyUsed: string
  goalUsd: number
  expenses: ExpenseLine[]
  evidence: EvidenceItem[]
}): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  if (input.title.trim().length < 4) errors.push('Add a clear title (4+ characters).')
  if (input.story.trim().length < 40) errors.push('Share more about your situation (40+ characters).')
  if (input.howMoneyUsed.trim().length < 20) {
    errors.push('Explain how the money will be used (20+ characters).')
  }
  if (!Number.isFinite(input.goalUsd) || input.goalUsd < 1) {
    errors.push('Amount must be at least $1.')
  }
  if (input.goalUsd > MAX_CAMPAIGN_GOAL_USD) {
    errors.push(`Amount cannot exceed $${MAX_CAMPAIGN_GOAL_USD}.`)
  }
  if (input.expenses.length === 0) errors.push('Add at least one expense line.')
  if (input.expenses.some((e) => !e.label.trim() || e.amountUsd <= 0)) {
    errors.push('Each expense needs a label and amount over $0.')
  }
  if (input.evidence.length === 0) {
    errors.push('Add at least one supporting evidence type (fictional description).')
  }
  if (input.evidence.some((e) => e.fictionalDescription.trim().length < 8)) {
    errors.push('Each evidence item needs a short fictional description (8+ characters).')
  }
  return { ok: errors.length === 0, errors }
}

export function migrateLegacyStatus(
  status: string,
): Campaign['status'] {
  if (status === 'active' || status === 'closed') return 'approved'
  const allowed: Campaign['status'][] = [
    'draft',
    'pending_review',
    'needs_more_info',
    'approved',
    'rejected',
    'funded',
  ]
  return (allowed as string[]).includes(status)
    ? (status as Campaign['status'])
    : 'pending_review'
}
