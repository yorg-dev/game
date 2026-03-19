import { useState, useEffect } from 'react'
import { EventBus } from '@/game/EventBus'
import type { Notification, NotificationSeverity } from '@/models/Notification'
import {
  GameDialog,
  GameDialogContent,
  GameDialogHeader,
  GameDialogTitle,
  GameDialogDescription,
} from '@/components/ui/game-dialog'

const SEVERITY_STYLES: Record<NotificationSeverity, { bar: string; badge: string; label: string }> =
  {
    success: {
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
      label: 'Success',
    },
    info: {
      bar: 'bg-blue-500',
      badge: 'bg-blue-900/60 text-blue-300 border-blue-700',
      label: 'Info',
    },
    warning: {
      bar: 'bg-amber-500',
      badge: 'bg-amber-900/60 text-amber-300 border-amber-700',
      label: 'Warning',
    },
    error: {
      bar: 'bg-red-500',
      badge: 'bg-red-900/60 text-red-300 border-red-700',
      label: 'Error',
    },
  }

function formatTs(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NotificationRow({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const s = SEVERITY_STYLES[notif.severity]
  return (
    <div
      className={`flex gap-3 px-5 py-3.5 border-b border-wood-700/30 last:border-0 transition-colors ${notif.isRead ? 'opacity-60' : 'bg-parchment-250/30'}`}
      onClick={() => onRead(notif.id)}
    >
      <div className={`w-1 shrink-0 rounded-full self-stretch ${s.bar}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-wood-500 shrink-0" />}
          <p className="text-sm font-bold text-soil-800 leading-snug truncate">{notif.title}</p>
        </div>
        <p className="text-xs text-wood-700 leading-relaxed line-clamp-2">{notif.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${s.badge}`}>
            {s.label}
          </span>
          <span className="text-[10px] text-wood-600 font-mono">
            {notif.agentName ?? notif.category}
          </span>
          <span className="text-[10px] text-parchment-500 ml-auto font-mono">
            {formatTs(notif.timestamp)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function NotificationsModal() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    return EventBus.on('sign-clicked', () => setOpen(true))
  }, [])

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const unread = notifications.filter((n) => !n.isRead).length

  return (
    <GameDialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <GameDialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <GameDialogHeader className="flex-row flex items-center gap-3 pr-14">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-wood-500 border-2 border-wood-700/40 text-base shrink-0">
            📋
          </div>
          <div className="flex-1 min-w-0">
            <GameDialogTitle>Bulletin Board</GameDialogTitle>
            <GameDialogDescription>
              {unread > 0
                ? `${unread} unread notification${unread !== 1 ? 's' : ''}`
                : 'All caught up'}
            </GameDialogDescription>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="shrink-0 text-[10px] font-bold text-wood-700 hover:text-soil-800 transition-colors uppercase tracking-widest"
            >
              Mark all read
            </button>
          )}
        </GameDialogHeader>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-2xl">📭</p>
              <p className="text-sm font-bold text-soil-800">No notifications</p>
              <p className="text-xs text-wood-600">Check back later</p>
            </div>
          ) : (
            notifications.map((n) => <NotificationRow key={n.id} notif={n} onRead={markRead} />)
          )}
        </div>
      </GameDialogContent>
    </GameDialog>
  )
}
