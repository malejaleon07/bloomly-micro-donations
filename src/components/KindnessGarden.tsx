import { gardenLabel } from '../lib/blooms'
import type { GardenStage } from '../types/account'

export function KindnessGarden({
  stage,
  completedCount,
}: {
  stage: GardenStage
  completedCount: number
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-lavender/80 via-cream to-sage/40 p-6 shadow-[var(--shadow-soft)] ring-1 ring-blush/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-ink">
            Kindness garden
          </h3>
          <p className="mt-1 text-sm text-ink/65">
            Grows with today’s check-ins — giving is optional.
          </p>
        </div>
        <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-plum ring-1 ring-blush">
          {gardenLabel(stage)}
        </span>
      </div>

      <div className="relative mx-auto mt-6 flex h-44 w-full max-w-xs items-end justify-center">
        <div className="absolute bottom-0 h-10 w-full rounded-[2rem] bg-gradient-to-t from-[#c4a484] to-[#e2c9a8]" />
        <div className="absolute bottom-6 h-2 w-[70%] rounded-full bg-ink/10 blur-sm" />

        {stage === 'seed' && (
          <div className="garden-seed absolute bottom-10 h-4 w-5 rounded-[40%] bg-[#6b4f3a] shadow-sm" />
        )}

        {stage === 'sprout' && (
          <div className="absolute bottom-8 flex flex-col items-center">
            <div className="garden-sprout h-10 w-1.5 rounded-full bg-sage" />
            <div className="garden-leaf -mt-8 ml-3 h-4 w-6 rounded-full bg-[#8fbf7a]" />
            <div className="garden-leaf -mt-3 -ml-3 h-4 w-6 rounded-full bg-[#7aaf68]" />
          </div>
        )}

        {stage === 'growing' && (
          <div className="absolute bottom-8 flex flex-col items-center">
            <div className="garden-stem h-20 w-2 rounded-full bg-[#6a9a5a]" />
            <div className="garden-leaf absolute bottom-16 left-1/2 h-5 w-8 -translate-x-[120%] rounded-full bg-[#8fbf7a]" />
            <div className="garden-leaf absolute bottom-12 left-1/2 h-5 w-8 translate-x-[20%] rounded-full bg-[#7aaf68]" />
            <div className="garden-bud absolute -top-1 h-5 w-5 rounded-full bg-blush" />
          </div>
        )}

        {stage === 'bloom' && (
          <div className="absolute bottom-8 flex flex-col items-center">
            <div className="garden-stem h-24 w-2 rounded-full bg-[#6a9a5a]" />
            <div className="garden-leaf absolute bottom-16 left-1/2 h-5 w-8 -translate-x-[120%] rounded-full bg-[#8fbf7a]" />
            <div className="garden-leaf absolute bottom-12 left-1/2 h-5 w-8 translate-x-[20%] rounded-full bg-[#7aaf68]" />
            <div className="garden-bloom absolute -top-3 animate-soft-pulse">
              <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden>
                <path
                  d="M32 18c-2.8-6.2-10.4-8.4-14.8-4.8C12.4 17.2 13.6 25.2 20 30c4.2 3.2 8.4 5.2 12 6.4 3.6-1.2 7.8-3.2 12-6.4 6.4-4.8 7.6-12.8 2.8-16.8C42.4 9.6 34.8 11.8 32 18Z"
                  fill="#9D5185"
                />
                <path
                  d="M32 46c2.8 6.2 10.4 8.4 14.8 4.8 4.8-4 3.6-12-2.8-16.8-4.2-3.2-8.4-5.2-12-6.4-3.6 1.2-7.8 3.2-12 6.4-6.4 4.8-7.6 12.8-2.8 16.8C21.6 54.4 29.2 52.2 32 46Z"
                  fill="#C8DABF"
                />
                <path
                  d="M18 32c-6.2-2.8-8.4-10.4-4.8-14.8C17.2 12.4 25.2 13.6 30 20c3.2 4.2 5.2 8.4 6.4 12-1.2 3.6-3.2 7.8-6.4 12-4.8 6.4-12.8 7.6-16.8 2.8C9.6 42.4 11.8 34.8 18 32Z"
                  fill="#F2D5E6"
                />
                <path
                  d="M46 32c6.2 2.8 8.4 10.4 4.8 14.8-4 4.8-12 3.6-16.8-2.8-3.2-4.2-5.2-8.4-6.4-12 1.2-3.6 3.2-7.8 6.4-12 4.8-6.4 12.8-7.6 16.8-2.8C54.4 21.6 52.2 29.2 46 32Z"
                  fill="#F6E7F2"
                />
                <circle cx="32" cy="32" r="5.5" fill="#4A3548" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-ink/60">
        {completedCount} complete today · stage updates at 0 / 1 / 2 / 4+
      </p>
    </div>
  )
}
