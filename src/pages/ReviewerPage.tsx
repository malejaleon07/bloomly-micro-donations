import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/DemoBadge'
import { formatUsd } from '../lib/format'
import { DEMO_VERIFICATION_LABEL } from '../lib/applicantSubmission'
import {
  applyReviewerDecision,
  getCampaigns,
  getReviewQueue,
} from '../lib/storage'
import { EVIDENCE_TYPE_LABELS } from '../types/campaign'

export function ReviewerPage() {
  const [tick, setTick] = useState(0)
  const queue = useMemo(() => {
    void tick
    return getReviewQueue()
  }, [tick])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [moreInfo, setMoreInfo] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const selected =
    (selectedId ? getCampaigns().find((c) => c.id === selectedId) : null) ??
    queue[0] ??
    null

  function commit(
    action: 'approved' | 'rejected' | 'needs_more_info',
    notes: { reason?: string; moreInfo?: string },
    success: string,
  ) {
    if (!selected) return
    const next = applyReviewerDecision(selected.id, action, notes)
    if (!next) {
      setMessage('That decision could not be saved.')
      return
    }
    setTick((t) => t + 1)
    setSelectedId(next.id)
    setMessage(success)
    if (action !== 'needs_more_info') setReason('')
    if (action === 'needs_more_info') setMoreInfo('')
  }

  function approve() {
    commit(
      'approved',
      { reason },
      'Approved — now visible on Make an Impact (demo).',
    )
  }

  function reject() {
    if (!reason.trim()) {
      setMessage('Add a rejection reason.')
      return
    }
    commit(
      'rejected',
      { reason },
      'Rejected (simulation). Not shown publicly.',
    )
  }

  function requestMore() {
    if (!moreInfo.trim()) {
      setMessage('Describe what more information is needed.')
      return
    }
    commit(
      'needs_more_info',
      { reason, moreInfo },
      'Marked Needs More Information (simulation).',
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-blush/50 px-4 py-3 text-sm text-ink">
        <strong>Simulated admin / reviewer demo</strong> — not secure for real
        money. No real ID documents are stored. Decisions are local to this
        browser only.
      </div>

      <h1 className="mt-6 font-display text-4xl font-semibold text-ink">
        Reviewer dashboard
      </h1>
      <p className="mt-2 text-ink/65">
        View pending requests and their documents. Approve, reject, or request more information.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside className="rounded-3xl bg-cream p-4 shadow-[var(--shadow-soft)] ring-1 ring-blush/60">
          <h2 className="font-display text-lg font-semibold text-ink">
            Queue ({queue.length})
          </h2>
          {queue.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60">
              No pending requests. Submit one via{' '}
              <Link to="/request" className="font-semibold text-plum">
                Start a request
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {queue.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(c.id)
                      setMessage(null)
                    }}
                    className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition ${
                      selected?.id === c.id
                        ? 'bg-plum text-cream'
                        : 'bg-lavender/50 text-ink hover:bg-lavender'
                    }`}
                  >
                    <span className="font-semibold">{c.title}</span>
                    <span className="mt-0.5 block text-xs opacity-80">
                      {formatUsd(c.goalUsd)} · {c.status.replace(/_/g, ' ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="rounded-3xl bg-cream/95 p-6 shadow-[var(--shadow-card)] ring-1 ring-blush/60">
          {!selected ? (
            <p className="text-ink/65">Select a request to review.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selected.status} />
                <span className="text-xs text-ink/50">{selected.id}</span>
              </div>
              <h2 className="mt-3 font-display text-2xl font-semibold text-ink">
                {selected.title}
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                {selected.category} · Goal {formatUsd(selected.goalUsd)}
              </p>

              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-ink">Story / situation</h3>
                  <p className="mt-1 whitespace-pre-wrap text-ink/75">
                    {selected.story}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">How money will be used</h3>
                  <p className="mt-1 text-ink/75">{selected.howMoneyUsed}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">Expenses</h3>
                  <ul className="mt-1 space-y-1">
                    {selected.expenses.map((e) => (
                      <li key={e.id} className="flex justify-between gap-2">
                        <span>{e.label}</span>
                        <span className="font-semibold">
                          {formatUsd(e.amountUsd)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div data-testid="reviewer-verification">
                  <h3 className="font-semibold text-ink">Verification</h3>
                  <p className="mt-1 font-semibold text-ink">
                    {selected.status === 'pending_review' ||
                    selected.status === 'needs_more_info'
                      ? DEMO_VERIFICATION_LABEL
                      : `Decision: ${selected.status.replace(/_/g, ' ')}`}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">Documents</h3>
                  <ul className="mt-2 space-y-2">
                    {selected.evidence.map((ev) => (
                      <li
                        key={ev.id}
                        className="flex items-center gap-3 rounded-2xl bg-lavender/40 px-3 py-2"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blush text-xs font-semibold">
                          PDF
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">
                            {ev.fileName || EVIDENCE_TYPE_LABELS[ev.type]}
                          </span>
                          <span className="block text-xs text-ink/60">
                            {EVIDENCE_TYPE_LABELS[ev.type]}
                            {ev.fictionalDescription
                              ? ` · ${ev.fictionalDescription}`
                              : ''}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {selected.autoCheckFlags.length > 0 && (
                  <div className="rounded-2xl bg-blush/40 px-3 py-2">
                    <h3 className="font-semibold text-ink">
                      Automated validation flags
                    </h3>
                    <ul className="mt-1 list-disc pl-5 text-ink/75">
                      {selected.autoCheckFlags.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-ink/55">
                      Flags inform humans only — never auto approve/reject.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3 border-t border-blush/60 pt-5">
                <label className="block text-sm font-semibold text-ink">
                  Decision reason (required for reject)
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-3 py-2 outline-none focus:ring-2 focus:ring-plum/30"
                    placeholder="Short note for the recipient"
                  />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Request more information
                  <textarea
                    value={moreInfo}
                    onChange={(e) => setMoreInfo(e.target.value)}
                    rows={2}
                    className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-3 py-2 outline-none focus:ring-2 focus:ring-plum/30"
                    placeholder="What should the recipient clarify?"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="sage" onClick={approve}>
                    Approve
                  </Button>
                  <Button type="button" variant="secondary" onClick={requestMore}>
                    Request more info
                  </Button>
                  <Button type="button" variant="ghost" onClick={reject}>
                    Reject
                  </Button>
                </div>
                {message && (
                  <p className="rounded-2xl bg-lavender/60 px-3 py-2 text-sm" role="status">
                    {message}
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
