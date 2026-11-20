import { useMemo, useState } from 'react'
import { CampaignCard } from '../components/CampaignCard'
import { CategoryFilter } from '../components/CategoryFilter'
import { getPublicCampaigns } from '../lib/storage'
import type { Category } from '../types/campaign'

export function ExplorePage() {
  const [category, setCategory] = useState<Category | 'All'>('All')
  const campaigns = useMemo(() => getPublicCampaigns(), [])

  const filtered = useMemo(() => {
    return category === 'All'
      ? campaigns
      : campaigns.filter((c) => c.category === category)
  }, [campaigns, category])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-fade-up max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-ink">
          Make an Impact
        </h1>
        <p className="mt-3 text-ink/70">
          Find a story that resonates. Filter by need, read the full request,
          and give what you can.
        </p>
      </div>

      <div className="mt-8 animate-fade-up-delay">
        <CategoryFilter value={category} onChange={setCategory} />
      </div>

      <p className="mt-6 text-sm text-ink/55">
        Showing {filtered.length} request{filtered.length === 1 ? '' : 's'}
        {category !== 'All' ? ` in ${category}` : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-lavender/50 p-8 text-center text-ink/70">
          No requests in this category yet. Try another filter or check back soon.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  )
}
