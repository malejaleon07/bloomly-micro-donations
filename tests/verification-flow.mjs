import assert from 'node:assert/strict'
import { createServer } from 'vite'

const memory = new Map()
globalThis.localStorage = {
  getItem(key) {
    return memory.has(key) ? memory.get(key) : null
  },
  setItem(key, value) {
    memory.set(String(key), String(value))
  },
  removeItem(key) {
    memory.delete(key)
  },
  clear() {
    memory.clear()
  },
  key(index) {
    return [...memory.keys()][index] ?? null
  },
  get length() {
    return memory.size
  },
}

const VALID = '0x1111111111111111111111111111111111111111'
const ZERO = '0x0000000000000000000000000000000000000000'

function campaign(overrides = {}) {
  return {
    id: `user-${Math.random().toString(36).slice(2, 10)}`,
    title: 'Fictional grocery bridge',
    category: 'Food & Groceries',
    story:
      'A fictional story about a student who needs groceries for two weeks while a paycheck is late.',
    howMoneyUsed: 'The sample funds would cover rice, eggs, and produce.',
    goalUsd: 40,
    expenses: [{ id: 'e1', label: 'Groceries', amountUsd: 40 }],
    evidence: [
      {
        id: 'ev1',
        type: 'groceries_budget',
        fictionalDescription:
          'Fictional two-week grocery budget for rice and eggs.',
      },
    ],
    simulatedId: { persona: 'passed', stripeIdentity: 'passed' },
    autoCheckFlags: [],
    recipientAddress: VALID,
    status: 'approved',
    isDemo: true,
    reviewerDecision: 'approved',
    approvedAt: new Date().toISOString(),
    decisionReason: 'I approved myself from the form',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

const submission = await server.ssrLoadModule('/src/lib/applicantSubmission.ts')
const storage = await server.ssrLoadModule('/src/lib/storage.ts')
const guidanceMod = await server.ssrLoadModule('/src/lib/evidenceGuidance.ts')
const types = await server.ssrLoadModule('/src/types/campaign.ts')

const passed = []
const failed = []

function test(name, fn) {
  try {
    fn()
    passed.push(name)
    console.log(`PASS  ${name}`)
  } catch (error) {
    failed.push(name)
    console.error(`FAIL  ${name}`)
    console.error(error)
  }
}

test('applicant form cannot self-approve or set a passed identity check', () => {
  const tampered = campaign({
    id: 'user-tampered',
    title: 'Self approved request',
  })
  const safe = submission.sanitizeApplicantCampaign(tampered)
  assert.equal(safe.status, 'pending_review')
  assert.equal(safe.isDemo, false)
  assert.equal(safe.reviewerDecision, undefined)
  assert.equal(safe.approvedAt, undefined)
  assert.equal(safe.decisionReason, undefined)
  assert.equal(safe.simulatedId.persona, 'pending')
  assert.equal(safe.simulatedId.stripeIdentity, 'pending')
  assert.equal(submission.isListedCampaign(safe), false)
  assert.equal(submission.campaignCanAcceptDonations(safe), false)
})

test('draft saves stay drafts and stay off the public list', () => {
  const saved = storage.saveApplicantCampaign(
    campaign({ id: 'user-draft', title: 'Draft only', status: 'draft' }),
  )
  assert.equal(saved.status, 'draft')
  assert.equal(saved.reviewerDecision, undefined)
  assert.equal(
    storage.getPublicCampaigns().some((item) => item.id === 'user-draft'),
    false,
  )
})

test('only approved demo campaigns are public before a reviewer decision', () => {
  const publicOnes = storage.getPublicCampaigns()
  assert.ok(publicOnes.length >= 6)
  assert.ok(publicOnes.every((item) => item.isDemo))
  assert.ok(
    publicOnes.every(
      (item) => item.status === 'approved' || item.status === 'funded',
    ),
  )
  assert.equal(
    publicOnes.some((item) => item.title === 'Self approved request'),
    false,
  )
})

test('submitted request stays private until the reviewer approves it', () => {
  const pending = storage.saveApplicantCampaign(
    campaign({
      id: 'user-pending',
      title: 'Waiting on demo review',
      status: 'pending_review',
    }),
  )
  assert.equal(pending.status, 'pending_review')
  assert.equal(pending.simulatedId.persona, 'pending')
  assert.equal(
    storage.getReviewQueue().some((item) => item.id === 'user-pending'),
    true,
  )
  assert.equal(
    storage.getPublicCampaigns().some((item) => item.id === 'user-pending'),
    false,
  )
  assert.equal(submission.campaignCanAcceptDonations(pending), false)

  const approved = storage.applyReviewerDecision('user-pending', 'approved', {
    reason: 'Demo reviewer approved',
  })
  assert.ok(approved)
  assert.equal(approved.status, 'approved')
  assert.equal(approved.reviewerDecision, 'approved')
  assert.equal(approved.simulatedId.persona, 'pending')
  assert.equal(approved.simulatedId.stripeIdentity, 'pending')
  assert.equal(
    storage.getPublicCampaigns().some((item) => item.id === 'user-pending'),
    true,
  )
  assert.equal(submission.campaignCanAcceptDonations(approved), true)
})

test('rejected and needs-more-info decisions stay off the public list', () => {
  storage.saveApplicantCampaign(
    campaign({ id: 'user-reject', title: 'Will be rejected' }),
  )
  storage.saveApplicantCampaign(
    campaign({ id: 'user-more', title: 'Needs another note' }),
  )

  const rejected = storage.applyReviewerDecision('user-reject', 'rejected', {
    reason: 'Fictional budget did not match',
  })
  const more = storage.applyReviewerDecision('user-more', 'needs_more_info', {
    moreInfo: 'Add a fictional grocery quantity.',
  })
  assert.equal(rejected.status, 'rejected')
  assert.equal(more.status, 'needs_more_info')
  const titles = storage.getPublicCampaigns().map((item) => item.id)
  assert.equal(titles.includes('user-reject'), false)
  assert.equal(titles.includes('user-more'), false)
  assert.equal(
    storage.getReviewQueue().some((item) => item.id === 'user-more'),
    true,
  )
  assert.equal(storage.applyReviewerDecision('user-reject', 'rejected', {}), null)
})

test('applicant save cannot overwrite a reviewer decision or a demo campaign', () => {
  const overwritten = storage.saveApplicantCampaign(
    campaign({
      id: 'user-pending',
      title: 'Renamed to sneak back in',
      status: 'approved',
      reviewerDecision: 'approved',
    }),
  )
  assert.equal(overwritten.title, 'Waiting on demo review')
  assert.equal(overwritten.status, 'approved')

  const demo = storage.getPublicCampaigns().find((item) => item.isDemo)
  assert.ok(demo)
  const attacked = storage.saveApplicantCampaign(
    campaign({
      id: demo.id,
      title: 'Hijacked demo',
      status: 'rejected',
      isDemo: false,
    }),
  )
  assert.equal(attacked.id, demo.id)
  assert.equal(attacked.title, demo.title)
  assert.equal(attacked.isDemo, true)
  assert.equal(storage.applyReviewerDecision(demo.id, 'rejected', {
    reason: 'should not apply to seeds',
  }), null)
})

test('wallet format is required before a campaign can accept test donations', () => {
  assert.match(
    submission.recipientAddressError(''),
    /valid Arc Testnet wallet address/,
  )
  assert.match(submission.recipientAddressError('0x123'), /40 hexadecimal/)
  assert.match(submission.recipientAddressError('not-a-wallet'), /40 hexadecimal/)
  assert.match(submission.recipientAddressError(ZERO), /40 hexadecimal/)
  assert.equal(submission.recipientAddressError(VALID), null)
  assert.match(
    submission.recipientAddressError(
      '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
    ),
    /40 hexadecimal/,
  )

  const approved = storage.getCampaign('user-pending')
  assert.equal(
    submission.campaignCanAcceptDonations({
      ...approved,
      recipientAddress: '0x123',
    }),
    false,
  )
  assert.equal(
    submission.campaignCanAcceptDonations({
      ...approved,
      recipientAddress: ZERO,
    }),
    false,
  )
  assert.equal(
    submission.campaignCanAcceptDonations({
      ...approved,
      status: 'pending_review',
      reviewerDecision: undefined,
      recipientAddress: VALID,
    }),
    false,
  )

  const demo = storage.getPublicCampaigns().find((item) => item.isDemo)
  assert.equal(submission.campaignCanAcceptDonations(demo), true)
})

test('supporting evidence examples follow the expense category and stay fictional', () => {
  for (const category of types.CATEGORIES) {
    const guide = guidanceMod.EVIDENCE_GUIDANCE[category]
    const proof = guidanceMod.DEMO_PROOF[category]
    assert.ok(guide.summary.length > 40, category)
    assert.ok(guide.examples.length >= 1, category)
    assert.ok(proof.story.length >= 40, category)
    assert.ok(proof.howMoneyUsed.length >= 20, category)
    const expenseSum = proof.expenses.reduce((sum, item) => sum + item.amountUsd, 0)
    assert.equal(expenseSum, Number(proof.amount), category)
    assert.ok(proof.evidence.length >= 1, category)
    for (const example of [...guide.examples, ...proof.evidence]) {
      assert.match(example.text, /Fictional|Sample|Made-up/)
      assert.equal(/passport|social security|\bssn\b/i.test(example.text), false)
    }
    for (const example of proof.evidence) {
      assert.match(example.fileName ?? '', /\.pdf$/)
      assert.ok(example.text.length < 80, category)
    }
  }
  assert.equal(
    guidanceMod.EVIDENCE_GUIDANCE['Food & Groceries'].examples[0].type,
    'groceries_budget',
  )
  assert.equal(
    guidanceMod.EVIDENCE_GUIDANCE['Housing & Rent'].examples[0].type,
    'rent_bill',
  )
  assert.equal(
    guidanceMod.EVIDENCE_GUIDANCE['Baby Essentials'].examples[0].type,
    'baby_estimate',
  )
  assert.equal(
    guidanceMod.EVIDENCE_GUIDANCE.Utilities.examples[0].type,
    'utilities',
  )
  assert.equal(
    guidanceMod.EVIDENCE_GUIDANCE.Transportation.examples[0].type,
    'transport_estimate',
  )
})

await server.close()

console.log(`\n${passed.length} passed, ${failed.length} failed`)
if (failed.length > 0) process.exit(1)
