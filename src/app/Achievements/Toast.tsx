import { useState, useEffect, useRef } from 'react'
import { EventBus } from '@/game/EventBus'
import type { AchievementRarity } from '@/models/Achievement'

interface Toast {
  id: number
  title: string
  icon: string
  rarity: AchievementRarity
  visible: boolean
}

const RARITY_STYLE: Record<AchievementRarity, { border: string; badge: string; label: string }> = {
  common: {
    border: 'border-[#9a6b28]',
    badge: 'bg-[#dcc898] text-[#5a3810]',
    label: 'Common',
  },
  rare: {
    border: 'border-[#5a7cb8]',
    badge: 'bg-[#c8ddf5] text-[#1a3870]',
    label: 'Rare',
  },
  epic: {
    border: 'border-[#8a50b8]',
    badge: 'bg-[#e8c8f5] text-[#4a1870]',
    label: 'Epic',
  },
  legendary: {
    border: 'border-[#c8900a]',
    badge: 'bg-[#fff0c0] text-[#703000]',
    label: 'Legendary',
  },
}

let nextId = 0

export function AchievementToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    return EventBus.on('achievement-unlocked', ({ id: _id, title, icon, rarity }) => {
      const toastId = nextId++
      setToasts((prev) => [...prev, { id: toastId, title, icon, rarity, visible: false }])

      // Trigger enter transition on next frame
      requestAnimationFrame(() => {
        setToasts((prev) => prev.map((t) => (t.id === toastId ? { ...t, visible: true } : t)))
      })

      // Auto-dismiss after 4s
      const timer = setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === toastId ? { ...t, visible: false } : t)))
        // Remove from DOM after slide-out
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId))
          timers.current.delete(toastId)
        }, 350)
      }, 4000)
      timers.current.set(toastId, timer)
    })
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    const map = timers.current
    return () => map.forEach((t) => clearTimeout(t))
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((toast) => {
        const s = RARITY_STYLE[toast.rarity]
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-[#e8d5a8] shadow-lg transition-all duration-300 ${s.border} ${
              toast.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            <span className="text-2xl leading-none">{toast.icon}</span>
            <div>
              <p className="text-[10px] font-bold text-[#7a5230] uppercase tracking-wider">
                Achievement unlocked!
              </p>
              <p className="text-xs font-bold text-[#3d2010]">{toast.title}</p>
              <span
                className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${s.badge}`}
              >
                {s.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
