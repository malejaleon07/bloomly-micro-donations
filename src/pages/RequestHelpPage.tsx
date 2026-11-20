import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../account/AuthContext'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/DemoBadge'
import { getAddress } from 'viem'
import { MAX_CAMPAIGN_GOAL_USD } from '../config/arc'
import {
  DEMO_VERIFICATION_LABEL,
  recipientAddressError,
} from '../lib/applicantSubmission'
import {
  DEMO_PROOF,
  EVIDENCE_GUIDANCE,
} from '../lib/evidenceGuidance'
import {
  computeAutoCheckFlags,
  expenseTotal,
  requiredFieldsOk,
} from '../lib/requestValidation'
import { saveApplicantCampaign, userHasActiveCampaign } from '../lib/storage'
import {
  CATEGORIES,
  EVIDENCE_TYPE_LABELS,
  type Campaign,
  type Category,
  type EvidenceItem,
  type ExpenseLine,
} from '../types/campaign'

const STEPS = [
  'Share Your Story',
  'Explain Your Expenses',
  'Verification Information',
  'Review & Submit',
] as const

const WALLET_HELP =
  'Enter your Arc Testnet wallet address. This is where test USDC donations will be sent. Test funds have no real monetary value. Never share your recovery phrase.'

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function RequestHelpPage() {
  const navigate = useNavigate()
  const { account } = useAuth()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('Food & Groceries')
  const [amount, setAmount] = useState('100')
  const [story, setStory] = useState('')
  const [howMoneyUsed, setHowMoneyUsed] = useState('')
  const [expenses, setExpenses] = useState<ExpenseLine[]>([
    { id: newId('exp'), label: '', amountUsd: 0 },
  ])
  const [evidence, setEvidence] = useState<EvidenceItem[]>([
    {
      id: newId('ev'),
      type: 'other',
      fictionalDescription: '',
    },
  ])
  const [recipientAddress, setRecipientAddress] = useState(() => {
    try {
      return localStorage.getItem('bloomly:default-recipient') ?? ''
    } catch {
      return ''
    }
  })
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<Campaign | null>(null)
  const [proofCategory, setProofCategory] = useState<Category | null>(null)

  const amountNum = Number.parseFloat(amount)
  const expTotal = expenseTotal(expenses)
  const guidance = EVIDENCE_GUIDANCE[category]
  const walletFormatError = recipientAddress.trim()
    ? recipientAddressError(recipientAddress)
    : null
  const hasActive = useMemo(
    () => userHasActiveCampaign(account?.id),
    [account?.id],
  )

  const flags = useMemo(
    () =>
      computeAutoCheckFlags({
        title,
        story,
        howMoneyUsed,
        goalUsd: Number.isFinite(amountNum) ? amountNum : 0,
        expenses,
        evidence,
      }),
    [title, story, howMoneyUsed, amountNum, expenses, evidence],
  )

  function updateExpense(id: string, patch: Partial<ExpenseLine>) {
    setExpenses((list) =>
      list.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    )
  }

  function validateStep(s: number): boolean {
    setError(null)
    if (s === 0) {
      if (title.trim().length < 4) {
        setError('Add a clear title.')
        return false
      }
      if (!Number.isFinite(amountNum) || amountNum < 1) {
        setError('Amount must be at least $1.')
        return false
      }
      if (amountNum > MAX_CAMPAIGN_GOAL_USD) {
        setError(`Amount cannot exceed $${MAX_CAMPAIGN_GOAL_USD}.`)
        return false
      }
      if (story.trim().length < 40) {
        setError('Please share more about your situation.')
        return false
      }
      if (howMoneyUsed.trim().length < 20) {
        setError('Please explain how the money will be used.')
        return false
      }
    }
    if (s === 1) {
      if (expenses.length === 0 || expenses.some((e) => !e.label.trim() || e.amountUsd <= 0)) {
        setError('Add expense lines with labels and amounts over $0.')
        return false
      }
    }
    if (s === 2) {
      if (
        evidence.length === 0 ||
        evidence.some((e) => e.fictionalDescription.trim().length < 8)
      ) {
        setError(
          'Add a fictional evidence note for this expense category (8+ characters). Real documents are not collected.',
        )
        return false
      }
      const walletError = recipientAddressError(recipientAddress)
      if (walletError) {
        setError(walletError)
        return false
      }
    }
    return true
  }

  function applyDemoProof(nextCategory: Category) {
    const packet = DEMO_PROOF[nextCategory]
    setError(null)
    setCategory(nextCategory)
    setTitle(packet.title)
    setAmount(packet.amount)
    setStory(packet.story)
    setHowMoneyUsed(packet.howMoneyUsed)
    setExpenses(
      packet.expenses.map((expense) => ({
        id: newId('exp'),
        label: expense.label,
        amountUsd: expense.amountUsd,
      })),
    )
    setEvidence(
      packet.evidence.map((item) => ({
        id: newId('ev'),
        type: item.type,
        fileName: item.fileName,
        fictionalDescription: item.text,
      })),
    )
    setProofCategory(nextCategory)
    setStep(2)
  }

  function goToStep(target: number) {
    if (target === step) return
    if (target < step) {
      setError(null)
      setStep(target)
      return
    }
    for (let index = step; index < target; index += 1) {
      if (!validateStep(index)) {
        setStep(index)
        return
      }
    }
    setStep(target)
  }

  function next() {
    if (!validateStep(step)) return
    setStep((x) => Math.min(x + 1, STEPS.length - 1))
  }

  function back() {
    setError(null)
    setStep((x) => Math.max(x - 1, 0))
  }

  function saveDraft() {
    if (hasActive) {
      setError('You already have an open request (demo: one at a time).')
      return
    }
    if (recipientAddressError(recipientAddress)) {
      setError('Enter a valid Arc Testnet wallet address before saving.')
      return
    }
    const id = `user-${Date.now().toString(36)}`
    const campaign = saveApplicantCampaign(buildCampaign(id, 'draft'))
    if (campaign.status !== 'draft') {
      setError('This draft could not be saved.')
      return
    }
    setSubmitted(campaign)
  }

  function buildCampaign(
    id: string,
    status: Campaign['status'],
  ): Campaign {
    const goal = Math.round((Number.isFinite(amountNum) ? amountNum : 0) * 100) / 100
    const now = new Date().toISOString()
    return {
      id,
      title: title.trim(),
      category,
      story: story.trim(),
      howMoneyUsed: howMoneyUsed.trim(),
      goalUsd: goal,
      expenses: expenses.map((e) => ({
        ...e,
        amountUsd: Math.round(e.amountUsd * 100) / 100,
      })),
      evidence,
      simulatedId: { persona: 'pending', stripeIdentity: 'pending' },
      autoCheckFlags: computeAutoCheckFlags({
        title,
        story,
        howMoneyUsed,
        goalUsd: goal,
        expenses,
        evidence,
        excludeId: id,
      }),
      recipientAddress: getAddress(recipientAddress.trim()),
      status,
      isDemo: false,
      ownerDemoId: account?.id,
      createdAt: now,
      submittedAt: status === 'pending_review' ? now : undefined,
    }
  }

  function submitForReview() {
    setError(null)
    if (hasActive) {
      setError('You already have an open request (demo: one at a time).')
      return
    }
    const walletError = recipientAddressError(recipientAddress)
    if (walletError) {
      setError(walletError)
      return
    }
    const check = requiredFieldsOk({
      title,
      story,
      howMoneyUsed,
      goalUsd: amountNum,
      expenses,
      evidence,
    })
    if (!check.ok) {
      setError(check.errors[0] ?? 'Please complete required fields.')
      return
    }
    try {
      localStorage.setItem(
        'bloomly:default-recipient',
        getAddress(recipientAddress.trim()),
      )
    } catch {
      /* ignore */
    }
    const id = `user-${Date.now().toString(36)}`
    const campaign = saveApplicantCampaign(buildCampaign(id, 'pending_review'))
    if (campaign.status !== 'pending_review' || campaign.reviewerDecision) {
      setError('This request could not be submitted for review.')
      return
    }
    setSubmitted(campaign)
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
        <div className="rounded-3xl bg-cream p-8 text-center shadow-[var(--shadow-card)] ring-1 ring-blush/70">
          <StatusBadge status={submitted.status} />
          <h1 className="mt-4 font-display text-3xl font-semibold text-ink">
            {submitted.status === 'draft'
              ? 'Draft saved'
              : 'Submitted for review'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            {submitted.status === 'draft'
              ? 'Your draft is saved in this browser. Submit from Start a request when ready — a demo reviewer must approve before it appears on Make an Impact.'
              : `${DEMO_VERIFICATION_LABEL} A demo reviewer can approve, reject, or request more information before it appears publicly.`}
          </p>
          {submitted.autoCheckFlags.length > 0 && (
            <div className="mt-4 rounded-2xl bg-blush/50 p-3 text-left text-xs text-ink/80">
              <p className="font-semibold">Automated checks (for human review)</p>
              <ul className="mt-1 list-disc pl-4">
                {submitted.autoCheckFlags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={() => navigate('/account/requests')}>
              My Requests
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/reviewer')}
            >
              Open reviewer demo
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-4xl font-semibold text-ink">
          Start a request
        </h1>
        <p className="mt-3 text-ink/70">
          Pick a category, add a sample document, then submit.
        </p>
      </div>

      {!account && (
        <p className="mt-4 rounded-2xl bg-lavender/60 px-4 py-3 text-sm text-ink/75">
          Tip: <Link to="/login" className="font-semibold text-plum">Login / Sign up</Link>{' '}
          so this request appears under My Requests.
        </p>
      )}

      {hasActive && (
        <div className="mt-4 rounded-2xl bg-blush/70 px-4 py-3 text-sm text-ink">
          You already have an open request. Finish or resolve it before starting
          another (demo rule).
        </div>
      )}

      <div className="mt-8">
        <p className="text-sm font-semibold text-ink">Demo categories</p>
        <div
          className="mt-3 flex flex-wrap gap-2"
          role="listbox"
          aria-label="Demo categories"
        >
          {CATEGORIES.map((option) => {
            const active = option === proofCategory
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === proofCategory}
                data-testid={`demo-category-${option}`}
                onClick={() => applyDemoProof(option)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-plum text-cream shadow-[var(--shadow-soft)]'
                    : 'bg-cream text-ink ring-1 ring-blush hover:bg-lavender'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      <ol className="mt-6 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => goToStep(i)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                i === step
                  ? 'bg-plum text-cream'
                  : i < step
                    ? 'bg-sage/70 text-ink'
                    : 'bg-cream text-ink/50 ring-1 ring-blush'
              }`}
            >
              {i + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-3xl bg-cream/95 p-6 shadow-[var(--shadow-card)] ring-1 ring-blush/60">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Share Your Story
            </h2>
            <label className="block text-sm font-semibold text-ink">
              Title
              <input
                data-testid="request-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-4 py-2.5 outline-none focus:ring-2 focus:ring-plum/35"
              />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-4 py-2.5 outline-none focus:ring-2 focus:ring-plum/35"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Amount needed ($1–${MAX_CAMPAIGN_GOAL_USD})
              <input
                data-testid="request-amount"
                type="number"
                min={1}
                max={MAX_CAMPAIGN_GOAL_USD}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-4 py-2.5 outline-none focus:ring-2 focus:ring-plum/35"
              />
            </label>
            {Number.isFinite(amountNum) && amountNum > MAX_CAMPAIGN_GOAL_USD && (
              <p className="rounded-2xl bg-blush px-3 py-2 text-sm font-medium" role="alert">
                Requests over ${MAX_CAMPAIGN_GOAL_USD} are not allowed.
              </p>
            )}
            <label className="block text-sm font-semibold text-ink">
              Your situation
              <textarea
                data-testid="request-story"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                rows={5}
                className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-4 py-2.5 outline-none focus:ring-2 focus:ring-plum/35"
              />
            </label>
            <label className="block text-sm font-semibold text-ink">
              How the money will be used
              <textarea
                data-testid="request-how"
                value={howMoneyUsed}
                onChange={(e) => setHowMoneyUsed(e.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-4 py-2.5 outline-none focus:ring-2 focus:ring-plum/35"
              />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Explain Your Expenses
            </h2>
            <p className="text-sm text-ink/65">
              Line items should add up to your requested amount when possible.
              Discrepancies are flagged for human review — not auto-rejected.
            </p>
            {expenses.map((e, idx) => (
              <div
                key={e.id}
                className="grid gap-2 rounded-2xl bg-lavender/40 p-3 sm:grid-cols-[1fr_8rem_auto]"
              >
                <input
                  data-testid={`expense-label-${idx}`}
                  value={e.label}
                  onChange={(ev) =>
                    updateExpense(e.id, { label: ev.target.value })
                  }
                  placeholder={`Expense ${idx + 1}`}
                  className="rounded-xl border border-blush bg-cream px-3 py-2 text-sm outline-none"
                />
                <input
                  data-testid={`expense-amount-${idx}`}
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={e.amountUsd || ''}
                  onChange={(ev) =>
                    updateExpense(e.id, {
                      amountUsd: Number.parseFloat(ev.target.value) || 0,
                    })
                  }
                  placeholder="Amount"
                  className="rounded-xl border border-blush bg-cream px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  className="text-xs font-semibold text-ink/50"
                  onClick={() =>
                    setExpenses((list) => list.filter((x) => x.id !== e.id))
                  }
                  disabled={expenses.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setExpenses((list) => [
                  ...list,
                  { id: newId('exp'), label: '', amountUsd: 0 },
                ])
              }
            >
              Add line item
            </Button>
            <p className="text-sm font-semibold text-ink">
              Expense total: ${expTotal.toFixed(2)} · Requested: $
              {(Number.isFinite(amountNum) ? amountNum : 0).toFixed(2)}
              {Number.isFinite(amountNum) &&
                Math.abs(expTotal - amountNum) > 0.01 && (
                  <span className="ml-2 font-medium text-plum">
                    (discrepancy flagged for review)
                  </span>
                )}
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-semibold text-ink">
                Verification
              </h2>
              <p
                className="rounded-full bg-lavender px-3 py-1 text-sm font-semibold text-ink"
                data-testid="demo-verification-status"
              >
                {DEMO_VERIFICATION_LABEL}
              </p>
            </div>

            <label
              className="flex cursor-pointer flex-col items-center rounded-3xl border-2 border-dashed border-blush bg-lavender/40 px-4 py-8 text-center"
              data-testid="document-upload"
            >
              <span className="font-display text-xl font-semibold text-ink">
                Upload documents
              </span>
              <span className="mt-1 text-sm text-ink/60">
                PDF or image · demo labels only, files are not saved
              </span>
              <span className="mt-4 rounded-full bg-plum px-5 py-2.5 text-sm font-semibold text-cream">
                Choose files
              </span>
              <input
                data-testid="document-input"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,application/pdf,image/*"
                className="sr-only"
                onChange={(event) => {
                  const files = event.target.files
                  if (!files?.length) return
                  const added: EvidenceItem[] = Array.from(files).map((file) => ({
                    id: newId('ev'),
                    type: guidance.examples[0].type,
                    fileName: file.name.replace(/[\\/]/g, '').slice(0, 80),
                    fictionalDescription: 'Demo upload · file not saved',
                  }))
                  setEvidence((list) => {
                    const blank =
                      list.length === 1 &&
                      !list[0].fileName &&
                      list[0].fictionalDescription.trim().length < 8
                    return blank ? added : [...list, ...added]
                  })
                  event.target.value = ''
                }}
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">
                Documents · {category}
              </h3>
              <button
                type="button"
                className="text-sm font-semibold text-plum"
                data-testid="use-fictional-example"
                onClick={() => {
                  const sample = DEMO_PROOF[category].evidence[0]
                  setEvidence((list) => [
                    ...list.filter(
                      (item) =>
                        item.fileName || item.fictionalDescription.trim().length >= 8,
                    ),
                    {
                      id: newId('ev'),
                      type: sample.type,
                      fileName: sample.fileName,
                      fictionalDescription: sample.text,
                    },
                  ])
                }}
              >
                Add sample document
              </button>
            </div>

            <ul className="space-y-2" data-testid="proof-preview">
              {evidence.filter((item) => item.fileName || item.fictionalDescription.trim()).length ===
              0 ? (
                <li className="rounded-2xl bg-cream px-3 py-3 text-sm text-ink/55 ring-1 ring-blush">
                  No documents yet.
                </li>
              ) : (
                evidence.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl bg-cream px-3 py-3 ring-1 ring-blush/80"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blush text-xs font-semibold text-ink">
                      PDF
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {item.fileName || EVIDENCE_TYPE_LABELS[item.type]}
                      </span>
                      <span className="block truncate text-xs text-ink/55">
                        {EVIDENCE_TYPE_LABELS[item.type]} · {item.fictionalDescription}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-ink/50"
                      onClick={() =>
                        setEvidence((list) =>
                          list.length <= 1
                            ? [
                                {
                                  id: newId('ev'),
                                  type: guidance.examples[0].type,
                                  fictionalDescription: '',
                                },
                              ]
                            : list.filter((entry) => entry.id !== item.id),
                        )
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))
              )}
            </ul>

            <label className="block text-sm font-semibold text-ink">
              Where should your donations go?
              <input
                data-testid="request-recipient"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x…"
                spellCheck={false}
                autoComplete="off"
                className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-plum/35"
              />
              <span
                className="mt-1 block text-xs font-normal leading-relaxed text-ink/55"
                data-testid="wallet-help"
              >
                {WALLET_HELP}
              </span>
            </label>
            {walletFormatError && (
              <p className="rounded-2xl bg-blush px-3 py-2 text-sm font-medium" role="alert">
                {walletFormatError}
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Review & Submit
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-ink/55">Title</dt>
                <dd className="font-semibold">{title || '—'}</dd>
              </div>
              <div>
                <dt className="text-ink/55">Category · Amount</dt>
                <dd className="font-semibold">
                  {category} · $
                  {(Number.isFinite(amountNum) ? amountNum : 0).toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-ink/55">Expenses total</dt>
                <dd className="font-semibold">${expTotal.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-ink/55">Identity verification</dt>
                <dd className="font-semibold">{DEMO_VERIFICATION_LABEL}</dd>
              </div>
              <div>
                <dt className="text-ink/55">Where donations go</dt>
                <dd className="font-semibold break-all font-mono text-xs">
                  {recipientAddress.trim() || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-ink/55">Evidence types</dt>
                <dd className="font-semibold">
                  {evidence.map((e) => EVIDENCE_TYPE_LABELS[e.type]).join(', ')}
                </dd>
              </div>
            </dl>
            {flags.length > 0 && (
              <div className="rounded-2xl bg-blush/50 p-3 text-sm">
                <p className="font-semibold text-ink">
                  Automated checks (human review only — not auto decisions)
                </p>
                <ul className="mt-1 list-disc pl-5 text-ink/75">
                  {flags.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-ink/55">
              Submitting sets status to <strong>Pending Review</strong>. Only a
              demo reviewer can Approve for public Explore. Not secure for real
              money.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-2xl bg-blush px-3 py-2 text-sm font-medium" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={back}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              data-testid="request-continue"
              onClick={next}
              disabled={hasActive}
            >
              Continue
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={saveDraft}
                disabled={hasActive}
              >
                Save draft
              </Button>
              <Button
                type="button"
                data-testid="request-submit"
                onClick={submitForReview}
                disabled={hasActive}
              >
                Submit for review
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
