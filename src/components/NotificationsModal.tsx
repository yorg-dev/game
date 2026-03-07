import { useState, useEffect } from 'react'
import { EventBus } from '../game/EventBus'
import { SAMPLE_NOTIFICATIONS } from '@/mocks/notifications'
import type { Notification, NotificationSeverity } from '../models/Notification'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<NotificationSeverity, { bar: string; badge: string; label: string }> = {
  success: { bar: 'bg-emerald-500', badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700', label: 'Success' },
  info:    { bar: 'bg-blue-500',    badge: 'bg-blue-900/60 text-blue-300 border-blue-700',          label: 'Info'    },
  warning: { bar: 'bg-amber-500',   badge: 'bg-amber-900/60 text-amber-300 border-amber-700',       label: 'Warning' },
  error:   { bar: 'bg-red-500',     badge: 'bg-red-900/60 text-red-300 border-red-700',             label: 'Error'   },
}

function formatTs(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function NotificationRow({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const s = SEVERITY_STYLES[notif.severity]
  return (
    <div
      className={`flex gap-3 px-5 py-3.5 border-b border-[#7a5230]/30 last:border-0 transition-colors ${notif.isRead ? 'opacity-60' : 'bg-[#dcc898]/30'}`}
      onClick={() => onRead(notif.id)}
    >
      {/* Severity bar */}
      <div className={`w-1 shrink-0 rounded-full self-stretch ${s.bar}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {!notif.isRead && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8974c] shrink-0" />
          )}
          <p className="text-sm font-bold text-[#3d2010] leading-snug truncate">{notif.title}</p>
        </div>
        <p className="text-xs text-[#7a5230] leading-relaxed line-clamp-2">{notif.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${s.badge}`}>
            {s.label}
          </span>
          <span className="text-[10px] text-[#9a6b28] font-mono">{notif.agentName ?? notif.category}</span>
          <span className="text-[10px] text-[#b8955a] ml-auto font-mono">{formatTs(notif.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function NotificationsModal() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS)

  useEffect(() => {
    return EventBus.on('sign-clicked', () => setOpen(true))
  }, [])

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  if (!open) return null

  const unread = notifications.filter(n => !n.isRead).length

  return (
    <div
      data-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative flex flex-col w-full max-w-md max-h-[80vh] bg-[#e8d5a8] border-4 border-[#7a5230] rounded-2xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.nativeEvent.stopImmediatePropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-[#7a5230] bg-[#c8974c] shadow-[inset_0_2px_0_0_#e8c07a,inset_0_-3px_0_0_#5a3810] text-[#3d2010] hover:brightness-110 transition-[filter]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M10 2L2 10M2 2l8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"/>
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 shrink-0 bg-[#dcc898] border-b-4 border-[#7a5230]">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#c8974c] border-2 border-[#7a5230]/40 text-base shrink-0">
            📋
          </div>
          <div className="flex-1 pr-10">
            <h2 className="text-base font-bold text-[#3d2010] leading-tight">Bulletin Board</h2>
            <p className="text-xs text-[#7a5230] mt-0.5">
              {unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="shrink-0 text-[10px] font-bold text-[#7a5230] hover:text-[#3d2010] transition-colors uppercase tracking-widest"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-2xl">📭</p>
              <p className="text-sm font-bold text-[#3d2010]">No notifications</p>
              <p className="text-xs text-[#9a6b28]">Check back later</p>
            </div>
          ) : (
            notifications.map(n => (
              <NotificationRow key={n.id} notif={n} onRead={markRead} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
