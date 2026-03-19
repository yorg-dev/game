import { useState } from 'react'
import { useListContext } from 'ra-core'
import type { Expert, ExpertTag } from '@/models/Expert'
import { ExpertCard } from './Card'

export function ExpertGrid() {
  const { data: experts = [], isPending: loading, error } = useListContext<Expert>()
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // Collect all unique tags across experts
  const allTags: ExpertTag[] = []
  const seen = new Set<string>()
  for (const expert of experts) {
    for (const tag of expert.tags) {
      if (!seen.has(tag.id)) {
        seen.add(tag.id)
        allTags.push(tag)
      }
    }
  }
  allTags.sort((a, b) => a.name.localeCompare(b.name))

  const filtered = activeTag
    ? experts.filter((e) => e.tags.some((t) => t.slug === activeTag))
    : experts

  return (
    <>
      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 px-5 py-2.5 border-b-2 border-parchment-500 bg-parchment-250 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTag(null)}
            className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors ${
              activeTag === null
                ? 'border-wood-900 bg-wood-500 text-soil-800'
                : 'border-wood-600 bg-parchment-150 text-wood-700 hover:bg-parchment-400'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveTag(activeTag === tag.slug ? null : tag.slug)}
              className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors ${
                activeTag === tag.slug
                  ? 'border-wood-900 bg-wood-500 text-soil-800'
                  : 'border-wood-600 bg-parchment-150 text-wood-700 hover:bg-parchment-400'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-parchment-250 border-2 border-parchment-500 animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-xs text-red-700 font-bold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {(error as any)?.message ?? 'Could not load experts.'}
          </p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <span className="text-3xl">🔍</span>
            <p className="text-sm font-bold text-soil-800">No experts found</p>
            <p className="text-xs text-wood-600">
              {activeTag ? 'Try a different tag.' : 'No experts have been added yet.'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="flex flex-col gap-3">
            {filtered.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
