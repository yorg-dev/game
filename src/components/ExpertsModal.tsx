import { useState, useEffect } from 'react'
import { expertsProvider } from '@/providers/expertsProvider'
import type { Expert, ExpertTag } from '@/models/Expert'

interface Props {
  onClose: () => void
}

const CONTACT_ICONS: Record<string, string> = {
  phone:     '📞',
  website:   '🌐',
  email:     '✉️',
  linkedin:  '💼',
  twitter:   '𝕏',
  instagram: '📷',
  facebook:  '🔵',
}

function ContactLink({ type, value }: { type: string; value: string }) {
  const icon = CONTACT_ICONS[type] ?? '🔗'

  let href: string | null = null
  if (type === 'website') href = value.startsWith('http') ? value : `https://${value}`
  else if (type === 'email') href = `mailto:${value}`
  else if (type === 'phone') href = `tel:${value.replace(/\s/g, '')}`
  else if (type === 'linkedin') href = value.startsWith('http') ? value : `https://linkedin.com/in/${value}`
  else if (type === 'twitter') href = value.startsWith('http') ? value : `https://x.com/${value.replace(/^@/, '')}`
  else if (type === 'instagram') href = value.startsWith('http') ? value : `https://instagram.com/${value.replace(/^@/, '')}`
  else if (type === 'facebook') href = value.startsWith('http') ? value : `https://facebook.com/${value}`

  const label = (
    <span className="flex items-center gap-1.5 text-xs font-medium text-[#5a3810]">
      <span>{icon}</span>
      <span className="truncate max-w-[140px]">{value}</span>
    </span>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#dcc898] border border-[#9a6b28] hover:bg-[#c8b07a] transition-colors"
      >
        {label}
      </a>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#dcc898] border border-[#9a6b28]">
      {label}
    </span>
  )
}

function ExpertCard({ expert }: { expert: Expert }) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border-2 border-[#9a6b28] bg-[#dcc898]">
      {/* Name + tags */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-[#3d2010] leading-tight">{expert.name}</h3>
        <div className="flex flex-wrap gap-1 justify-end shrink-0">
          {expert.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-block text-[10px] px-1.5 py-0.5 rounded border font-bold bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Bio */}
      {expert.bio && (
        <p className="text-xs text-[#5a3810] leading-relaxed line-clamp-3">{expert.bio}</p>
      )}

      {/* Contacts */}
      {expert.expert_contacts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {expert.expert_contacts.map((c) => (
            <ContactLink key={c.id} type={c.contact_type} value={c.value} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ExpertsModal({ onClose }: Props) {
  const [experts, setExperts] = useState<Expert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    expertsProvider
      .list()
      .then(setExperts)
      .catch(() => setError('Could not load experts.'))
      .finally(() => setLoading(false))
  }, [])

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
    <div
      data-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-xl bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] hover:brightness-110 transition-[filter]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M10 2L2 10M2 2l8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b-4 border-[#7a5230] bg-[#dcc898] pr-14 shrink-0">
          <h2 className="text-[#3d2010] font-bold text-base">Experts Directory</h2>
          <p className="text-xs text-[#7a5230] mt-0.5">Find specialists who can help with your land.</p>
        </div>

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
                <div key={i} className="h-28 rounded-xl bg-[#dcc898] border-2 border-[#b8955a] animate-pulse" />
              ))}
            </div>
          )}

          {!loading && error && (
            <p className="text-xs text-red-700 font-bold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
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
      </div>
    </div>
  )
}
