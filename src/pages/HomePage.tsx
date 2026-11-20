import { useMemo } from 'react'
import { CampaignCard } from '../components/CampaignCard'
import { ButtonLink } from '../components/Button'
import { Logo } from '../components/Logo'
import { getPublicCampaigns } from '../lib/storage'

const steps = [
  {
    title: 'Find a request',
    body: 'Browse community needs — groceries, rent bridges, baby essentials, and more.',
  },
  {
    title: 'Give a little',
    body: 'Small amounts add up. Pick what feels right; every dollar shows up on the request.',
  },
  {
    title: 'Watch kindness grow',
    body: 'Progress updates as support arrives. Small acts, shared openly.',
  },
]

export function HomePage() {
  const featured = useMemo(
    () => getPublicCampaigns().slice(0, 3),
    [],
  )

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 70% 20%, rgba(242,213,230,0.85), transparent 60%), radial-gradient(ellipse 50% 40% at 15% 60%, rgba(200,218,191,0.55), transparent 55%)',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-14">
          <div className="animate-fade-up">
            <div className="mb-5">
              <Logo size="xl" />
            </div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-plum">
              Small acts. Real impact.
            </p>
            <h1 className="font-display text-2xl font-semibold leading-snug text-ink sm:text-3xl lg:text-[2rem]">
              A little kindness can go a long way.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/75 sm:text-lg">
              Bloomly is a gentle place to care for neighbors and yourself —
              share a need, offer a little help, and grow kindness one day at a
              time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-fade-up-delay">
              <ButtonLink to="/explore" variant="primary" className="px-6 py-3">
                Make an Impact
              </ButtonLink>
              <ButtonLink to="/request" variant="secondary" className="px-6 py-3">
                Start a request
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-ink/55">
              Hackathon demo · Sample campaigns labeled · Max request $1,500
            </p>
          </div>

          <div className="relative animate-fade-up-delay-2">
            <div className="absolute -right-4 -top-4 h-28 w-28 rounded-full bg-sage/50 blur-2xl" />
            <div className="absolute -bottom-6 -left-4 h-32 w-32 rounded-full bg-blush/70 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-lavender via-cream to-sage/60 p-8 shadow-[var(--shadow-card)] ring-1 ring-blush/70">
              <div className="animate-soft-pulse mx-auto mb-6 flex items-center justify-center">
                <Logo size="lg" link={false} />
              </div>
              <blockquote className="font-display text-2xl font-medium leading-snug text-ink">
                “Care doesn’t have to be loud to matter.”
              </blockquote>
              <p className="mt-4 text-sm text-ink/65">
                Daily Blooms live in your account — tiny habits that help you
                grow, with optional giving when you’re ready.
              </p>
              <ButtonLink to="/login" variant="sage" className="mt-5">
                Login / Sign up
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink">
              Featured requests
            </h2>
            <p className="mt-2 text-ink/65">
              Demo samples so you can feel the flow — clearly labeled.
            </p>
          </div>
          <ButtonLink to="/explore" variant="ghost">
            See all
          </ButtonLink>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      </section>

      <section className="bg-lavender/35 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-ink">
            How Bloomly Works
          </h2>
          <p className="mt-2 max-w-2xl text-ink/65">
            Three gentle steps from noticing a need to offering support.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="rounded-3xl bg-cream/90 p-6 shadow-[var(--shadow-soft)] ring-1 ring-blush/50"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-plum text-sm font-bold text-cream">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-blush/80 via-lavender to-sage/60 p-8 shadow-[var(--shadow-card)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-plum">
            Daily Blooms
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
            Grow yourself. Help others grow.
          </h2>
          <p className="mt-3 max-w-2xl text-ink/75">
            Mark study, workout, reading, or kindness for the day — watch your
            garden bloom. Giving is always optional and never automatic.
          </p>
          <ButtonLink to="/account" variant="primary" className="mt-6">
            Open your account
          </ButtonLink>
        </div>
      </section>
    </div>
  )
}
