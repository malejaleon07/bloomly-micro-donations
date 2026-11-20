import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { KindnessGarden } from '../../components/KindnessGarden'
import { Button, ButtonLink } from '../../components/Button'
import {
  deleteChallenge,
  gardenStage,
  getBloomsState,
  suggestedDonateTotal,
  toggleChallengeComplete,
  upsertChallenge,
} from '../../lib/blooms'
import { formatUsd, progressPercent } from '../../lib/format'
import {
  getConfirmedDonationsTotalUsd,
  getPublicCampaigns,
} from '../../lib/storage'
import type { BloomsState, ChallengeDef } from '../../types/account'

export function DailyBloomsPage() {
  const [state, setState] = useState<BloomsState>(() => getBloomsState())
  const [affirmation, setAffirmation] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [editing, setEditing] = useState<ChallengeDef | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formAmount, setFormAmount] = useState('0.10')
  const [formRepeat, setFormRepeat] = useState(true)
  const [donateAmount, setDonateAmount] = useState('')
  const [campaignId, setCampaignId] = useState('')

  const activeCampaigns = useMemo(() => getPublicCampaigns(), [])

  const completed = state.todayCompletedIds.length
  const total = Math.max(state.challenges.length, 1)
  const pct = progressPercent(completed, total)
  const stage = gardenStage(completed)
  const suggested = suggestedDonateTotal(state)
  const confirmedTotal = getConfirmedDonationsTotalUsd()

  function onToggle(id: string) {
    const result = toggleChallengeComplete(state, id)
    setState(result.state)
    if (result.justCompleted && result.affirmation) {
      setAffirmation(result.affirmation)
      setCelebrate(true)
      window.setTimeout(() => setCelebrate(false), 900)
    }
  }

  function openCreate() {
    setEditing(null)
    setFormTitle('')
    setFormAmount('0.10')
    setFormRepeat(true)
    setShowForm(true)
  }

  function openEdit(c: ChallengeDef) {
    setEditing(c)
    setFormTitle(c.title)
    setFormAmount(String(c.amountUsd))
    setFormRepeat(c.repeatDaily)
    setShowForm(true)
  }

  function onSaveChallenge(e: FormEvent) {
    e.preventDefault()
    const amount = Number.parseFloat(formAmount)
    if (!formTitle.trim() || !Number.isFinite(amount) || amount < 0) return
    const challenge: ChallengeDef = {
      id: editing?.id ?? `custom-${Date.now().toString(36)}`,
      title: formTitle.trim(),
      amountUsd: Math.round(amount * 100) / 100,
      repeatDaily: formRepeat,
      isDefault: editing?.isDefault ?? false,
    }
    setState(upsertChallenge(state, challenge))
    setShowForm(false)
  }

  function onDelete(id: string) {
    setState(deleteChallenge(state, id))
  }

  const historyNewest = [...state.history].slice(0, 7)

  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl bg-cream/95 p-6 shadow-[var(--shadow-card)] ring-1 ring-blush/60">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-plum">
            Daily Blooms
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
            Grow yourself. Help others grow.
          </h2>
          <p className="mt-2 text-sm text-ink/65">
            Self-reported check-ins — Bloomly doesn’t verify your activities.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-lavender/70 p-3">
              <p className="text-xs text-ink/55">Today</p>
              <p className="font-display text-xl font-semibold text-ink">
                {completed}/{state.challenges.length}
              </p>
            </div>
            <div className="rounded-2xl bg-blush/60 p-3">
              <p className="text-xs text-ink/55">Streak</p>
              <p className="font-display text-xl font-semibold text-ink">
                {state.streak}d
              </p>
            </div>
            <div className="rounded-2xl bg-sage/50 p-3">
              <p className="text-xs text-ink/55">Confirmed given</p>
              <p className="font-display text-xl font-semibold text-ink">
                {formatUsd(confirmedTotal)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink/50">
            Confirmed given only counts real verified payments (none until Arc
            donations are wired). Demo campaign progress is not included.
          </p>

          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="font-semibold text-ink">Daily progress</span>
              <span className="text-ink/55">{pct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-lavender">
              <div
                className={`progress-fill h-full rounded-full bg-gradient-to-r from-plum to-[#b56a9c] ${
                  celebrate ? 'celebrate-bar' : ''
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {affirmation && (
            <p
              className="mt-4 rounded-2xl bg-sage/40 px-4 py-3 text-sm font-medium text-ink animate-fade-up"
              role="status"
            >
              {affirmation}
            </p>
          )}

          {state.badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {state.badges.map((b) => (
                <span
                  key={b}
                  className="rounded-full bg-lavender px-2.5 py-0.5 text-xs font-semibold text-ink"
                >
                  {b === 'streak-3'
                    ? '3-day streak'
                    : b === 'streak-7'
                      ? '7-day streak'
                      : 'Full bloom day'}
                </span>
              ))}
            </div>
          )}
        </div>

        <KindnessGarden stage={stage} completedCount={completed} />
      </section>

      <section className="rounded-3xl bg-cream/95 p-6 shadow-[var(--shadow-card)] ring-1 ring-blush/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-ink">
            Today’s challenges
          </h3>
          <Button type="button" variant="secondary" onClick={openCreate}>
            Add custom
          </Button>
        </div>

        <ul className="mt-4 space-y-3">
          {state.challenges.map((c) => {
            const done = state.todayCompletedIds.includes(c.id)
            return (
              <li
                key={c.id}
                className={`flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 ring-1 transition ${
                  done
                    ? 'bg-sage/35 ring-sage'
                    : 'bg-lavender/40 ring-blush/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggle(c.id)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    done
                      ? 'border-plum bg-plum text-cream'
                      : 'border-plum/40 bg-cream'
                  }`}
                  aria-pressed={done}
                  aria-label={done ? `Mark ${c.title} incomplete` : `Mark ${c.title} complete`}
                >
                  {done ? '✓' : ''}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{c.title}</p>
                  <p className="text-xs text-ink/55">
                    Suggested {formatUsd(c.amountUsd)}
                    {c.repeatDaily ? ' · repeats daily' : ''}
                    {c.isDefault ? ' · default' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs font-semibold text-plum"
                    onClick={() => openEdit(c)}
                  >
                    Edit
                  </button>
                  {!c.isDefault && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-ink/50"
                      onClick={() => onDelete(c.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {showForm && (
          <form
            onSubmit={onSaveChallenge}
            className="mt-5 space-y-3 rounded-2xl bg-lavender/50 p-4"
          >
            <h4 className="font-semibold text-ink">
              {editing ? 'Edit challenge' : 'New custom challenge'}
            </h4>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-2xl border border-blush bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-plum/30"
              required
            />
            <input
              type="number"
              min={0}
              step={0.01}
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="Suggested $"
              className="w-full rounded-2xl border border-blush bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-plum/30"
              required
            />
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={formRepeat}
                onChange={(e) => setFormRepeat(e.target.checked)}
              />
              Repeat daily
            </label>
            <div className="flex gap-2">
              <Button type="submit" variant="primary">
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-3xl bg-cream/95 p-6 shadow-[var(--shadow-card)] ring-1 ring-blush/60">
        <h3 className="font-display text-xl font-semibold text-ink">
          Optional: turn today’s care into a gift
        </h3>
        <p className="mt-2 text-sm text-ink/65">
          Suggested from completed challenges:{' '}
          <strong>{formatUsd(suggested)}</strong>. You choose the amount and
          campaign — nothing is charged automatically.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-ink">
            Amount (USD)
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={donateAmount || (suggested > 0 ? String(suggested) : '')}
              onChange={(e) => setDonateAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-3 py-2 outline-none focus:ring-2 focus:ring-plum/30"
            />
          </label>
          <label className="text-sm font-semibold text-ink">
            Campaign
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-blush bg-cream px-3 py-2 outline-none focus:ring-2 focus:ring-plum/30"
            >
              <option value="">Choose a request…</option>
              {activeCampaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        {campaignId ? (
          <ButtonLink
            to={`/campaign/${campaignId}?amount=${encodeURIComponent(
              donateAmount || String(suggested || 1),
            )}#donate`}
            variant="primary"
            className="mt-4"
          >
            Continue to donate
          </ButtonLink>
        ) : (
          <Button type="button" className="mt-4" disabled>
            Continue to donate
          </Button>
        )}
        <p className="mt-3 text-xs text-ink/50">
          Checkout is a preview until Arc payments are connected — no fake
          success, and totals stay at confirmed only.
        </p>
      </section>

      <section className="rounded-3xl bg-lavender/40 p-6 ring-1 ring-blush/50">
        <h3 className="font-display text-xl font-semibold text-ink">
          Recent history
        </h3>
        {historyNewest.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">
            Complete a challenge to start your history. Past days are kept when
            the local calendar day rolls over.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {historyNewest.map((h) => (
              <li
                key={h.date}
                className="flex justify-between rounded-2xl bg-cream/80 px-4 py-2 text-sm"
              >
                <span className="font-medium text-ink">{h.date}</span>
                <span className="text-ink/60">
                  {h.completedIds.length} complete
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm">
          <Link to="/explore" className="font-semibold text-plum no-underline">
            Make an Impact →
          </Link>
        </p>
      </section>
    </div>
  )
}
