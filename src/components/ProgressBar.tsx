import { formatUsd, progressPercent } from '../lib/format'

export function ProgressBar({
  confirmedRaised,
  goal,
  demoSampleRaised = 0,
  showLabels = true,
}: {
  /** On-chain verified donations only. */
  confirmedRaised: number
  goal: number
  /** Seeded sample figure — labeled, never presented as confirmed. */
  demoSampleRaised?: number
  showLabels?: boolean
}) {
  const pct = progressPercent(confirmedRaised, goal)
  const hasDemo = demoSampleRaised > 0

  return (
    <div className="w-full">
      {showLabels && (
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold text-ink">
            {formatUsd(confirmedRaised)} confirmed
          </span>
          <span className="text-ink/60">of {formatUsd(goal)}</span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-lavender">
        <div
          className="progress-fill h-full rounded-full bg-gradient-to-r from-plum to-[#b56a9c]"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabels && (
        <p className="mt-1 text-xs font-medium text-plum">
          {pct}% confirmed funded
        </p>
      )}
      {hasDemo && (
        <p className="mt-1.5 text-xs text-ink/55">
          Demo sample progress (not on-chain): {formatUsd(demoSampleRaised)} —
          sample data only
        </p>
      )}
    </div>
  )
}
