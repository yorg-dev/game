import type { Expert } from '@/models/Expert'

const CONTACT_ICONS: Record<string, string> = {
  phone: '📞',
  website: '🌐',
  email: '✉️',
  linkedin: '💼',
  twitter: '𝕏',
  instagram: '📷',
  facebook: '🔵',
}

function ContactLink({ type, value }: { type: string; value: string }) {
  const icon = CONTACT_ICONS[type] ?? '🔗'

  let href: string | null = null
  if (type === 'website') href = value.startsWith('http') ? value : `https://${value}`
  else if (type === 'email') href = `mailto:${value}`
  else if (type === 'phone') href = `tel:${value.replace(/\s/g, '')}`
  else if (type === 'linkedin')
    href = value.startsWith('http') ? value : `https://linkedin.com/in/${value}`
  else if (type === 'twitter')
    href = value.startsWith('http') ? value : `https://x.com/${value.replace(/^@/, '')}`
  else if (type === 'instagram')
    href = value.startsWith('http') ? value : `https://instagram.com/${value.replace(/^@/, '')}`
  else if (type === 'facebook')
    href = value.startsWith('http') ? value : `https://facebook.com/${value}`

  const label = (
    <span className="flex items-center gap-1.5 text-xs font-medium text-wood-900">
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
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-parchment-250 border border-wood-600 hover:bg-parchment-400 transition-colors"
      >
        {label}
      </a>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-parchment-250 border border-wood-600">
      {label}
    </span>
  )
}

export function ExpertCard({ expert }: { expert: Expert }) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border-2 border-wood-600 bg-parchment-250">
      {/* Name + tags */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-soil-800 leading-tight">{expert.name}</h3>
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
        <p className="text-xs text-wood-900 leading-relaxed line-clamp-3">{expert.bio}</p>
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
