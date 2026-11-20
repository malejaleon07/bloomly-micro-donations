import { CATEGORIES, type Category } from '../types/campaign'

export function CategoryFilter({
  value,
  onChange,
}: {
  value: Category | 'All'
  onChange: (v: Category | 'All') => void
}) {
  const options: Array<Category | 'All'> = ['All', ...CATEGORIES]

  return (
    <div className="flex flex-wrap gap-2" role="listbox" aria-label="Filter by category">
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onChange(opt)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              active
                ? 'bg-plum text-cream shadow-[var(--shadow-soft)]'
                : 'bg-cream text-ink ring-1 ring-blush hover:bg-lavender'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
