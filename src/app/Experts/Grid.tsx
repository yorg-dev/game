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
        <div className="flex items-center gap-2 px-5 py-2.5 border-b-2 border-[#b8955a] bg-[#dcc898] overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTag(null)}
            className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors ${
              activeTag === null
                ? 'border-[#5a3810] bg-[#c8974c] text-[#3d2010]'
                : 'border-[#9a6b28] bg-[#e8d5a8] text-[#7a5230] hover:bg-[#c8b07a]'
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
                  ? 'border-[#5a3810] bg-[#c8974c] text-[#3d2010]'
                  : 'border-[#9a6b28] bg-[#e8d5a8] text-[#7a5230] hover:bg-[#c8b07a]'
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
                className="h-28 rounded-xl bg-[#dcc898] border-2 border-[#b8955a] animate-pulse"
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
            <p className="text-sm font-bold text-[#3d2010]">No experts found</p>
            <p className="text-xs text-[#9a6b28]">
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
