import { useState, useEffect, useRef } from 'react'
import { dataProvider } from '@/providers/dataProvider'
import { getActiveLand, setActiveLand, viewerPermissions } from '@/providers/activeLand'
import { EventBus } from '@/game/EventBus'
import type { Land } from '@/models/Land'
import { CreateLandModal } from './CreateModal'
import { InviteLandModal } from './InviteModal'

export function LandSwitcher() {
  const [currentLand, setCurrentLand] = useState<Land>(() => getActiveLand().land)
  const [lands, setLands] = useState<Land[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  async function loadLands(world_id: string) {
    const { data: fetched } = await dataProvider.getList<Land>('lands', {
      pagination: { page: 1, perPage: 100 },
      sort: { field: 'id', order: 'ASC' },
      filter: { world_id_eq: world_id },
    })
    if (fetched.length > 0) setLands(fetched)
  }

  // On mount: load lands using the real world_id from the backend.
  // Falls back to the active land's world_id if the user has no orgs/worlds yet.
  useEffect(() => {
    dataProvider
      .getOne<Land>('my_land', { id: '' })
      .then(({ data: land }) => {
        const world_id = land?.world_id ?? getActiveLand().land.world_id
        loadLands(world_id)
      })
      .catch(() => loadLands(getActiveLand().land.world_id))
  }, [])

  useEffect(() => {
    return EventBus.on('land-ready', ({ land }) => {
      setCurrentLand(land)
      // Only reload lands if the world_id actually changed
      if (land.world_id !== getActiveLand().land.world_id) {
        loadLands(land.world_id)
      }
    })
  }, [])

  useEffect(() => {
    // After login the user has real lands — reload from backend
    return EventBus.on('login-confirmed', () => {
      dataProvider
        .getOne<Land>('my_land', { id: '' })
        .then(({ data: land }) => {
          if (land) loadLands(land.world_id)
        })
        .catch(() => {})
    })
  }, [])

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  async function handleCreateLand(name: string, is_public: boolean) {
    const { land: activeLand } = getActiveLand()
    const { data: newLand } = await dataProvider.create<Land>('lands', {
      data: { world_id: activeLand.world_id, name, is_public, owner_id: '', owner_type: 'user' },
    })
    setLands((prev) => [...prev, newLand])
    setShowCreate(false)
    await switchLand(newLand)
  }

  async function switchLand(land: Land) {
    if (land.id === currentLand.id) {
      setOpen(false)
      return
    }
    setLoading(true)
    setOpen(false)
    try {
      const { data: placements } = await dataProvider.getList('land_placements', {
        pagination: { page: 1, perPage: 500 },
        sort: { field: 'id', order: 'ASC' },
        filter: { land_id_eq: land.id },
      })
      const connections: import('@/models/Connection').Connection[] = []
      const landObjects = land.objects ?? getActiveLand().landObjects
      const { canInteract, canManage } = viewerPermissions(land)
      const state = { land, placements, connections, landObjects, canInteract, canManage }
      setActiveLand(state)
      setCurrentLand(land)
      EventBus.emit('land-ready', state)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        ref={ref}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center"
      >
        <div className="flex items-center gap-2">
          {/* Land switcher pill */}
          <button
            onClick={() => setOpen((v) => !v)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-4 border-wood-700 bg-parchment-150 shadow-[inset_0_0_0_2px_var(--color-parchment-50),inset_0_0_0_4px_#c8a86a] hover:brightness-105 active:brightness-95 transition-[filter] text-sm font-bold text-soil-800 disabled:opacity-50"
          >
            <svg width="10" height="13" viewBox="0 0 10 13" fill="none" aria-hidden="true">
              <path
                d="M5 1C2.79 1 1 2.79 1 5c0 3 4 7 4 7s4-4 4-7c0-2.21-1.79-4-4-4z"
                stroke="#7a5230"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
              <circle cx="5" cy="5" r="1.5" fill="#7a5230" />
            </svg>
            {loading ? 'Switching…' : currentLand.name}
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            >
              <path
                d="M1 3l4 4 4-4"
                stroke="#7a5230"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
            </svg>
          </button>

          {/* Invite button */}
          <button
            onClick={() => setShowInvite(true)}
            aria-label="Invite to land"
            title="Invite to land"
            className="flex items-center justify-center w-10 h-10 rounded-xl border-4 border-wood-700 bg-parchment-150 shadow-[inset_0_0_0_2px_var(--color-parchment-50),inset_0_0_0_4px_#c8a86a] hover:brightness-105 active:brightness-95 transition-[filter]"
          >
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true">
              <circle cx="6" cy="4" r="2.5" stroke="#7a5230" strokeWidth="1.5" />
              <path
                d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5"
                stroke="#7a5230"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
              <path d="M13 4v4M11 6h4" stroke="#7a5230" strokeWidth="1.5" strokeLinecap="square" />
            </svg>
          </button>
        </div>

        {open && lands.length === 0 && (
          <div
            data-modal="true"
            className="absolute bottom-full mb-2 w-60 bg-parchment-150 border-4 border-wood-700 rounded-xl shadow-[inset_0_0_0_2px_var(--color-parchment-50)] overflow-hidden"
            onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
          >
            <div className="flex flex-col gap-3 p-3">
              <p className="text-xs text-wood-700">Sign in to create and manage lands.</p>
              <button
                onClick={() => {
                  setOpen(false)
                  EventBus.emit('show-login', { tab: 'register' })
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-wood-700 bg-wood-500 shadow-[inset_0_2px_0_0_var(--color-wood-300),inset_0_-3px_0_0_var(--color-wood-900)] text-soil-800 text-sm font-bold hover:brightness-110 transition-[filter]"
              >
                <span className="text-base leading-none">+</span>
                Create Land
              </button>
            </div>
          </div>
        )}

        {open && lands.length > 0 && (
          <div
            data-modal="true"
            className="absolute bottom-full mb-2 w-60 bg-parchment-150 border-4 border-wood-700 rounded-xl shadow-[inset_0_0_0_2px_var(--color-parchment-50)] overflow-hidden"
            onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
          >
            <div className="px-4 py-2 border-b-4 border-wood-700 bg-parchment-250">
              <p className="text-[10px] font-bold text-wood-700 uppercase tracking-widest">
                Switch Land
              </p>
            </div>
            <div className="flex flex-col gap-1 p-2">
              {lands.map((land) => (
                <button
                  key={land.id}
                  onClick={() => switchLand(land)}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg border-2 text-left text-sm font-bold transition-colors ${
                    land.id === currentLand.id
                      ? 'border-wood-700 bg-wood-500 text-soil-800'
                      : 'border-wood-600 bg-parchment-250 text-soil-800 hover:border-wood-700 hover:bg-parchment-400'
                  }`}
                >
                  <span className="flex-1 truncate">{land.name}</span>
                  {!land.is_public && (
                    <svg
                      width="10"
                      height="11"
                      viewBox="0 0 10 11"
                      fill="none"
                      className="shrink-0 text-wood-700"
                      aria-label="Private"
                    >
                      <rect
                        x="1.5"
                        y="4.5"
                        width="7"
                        height="5.5"
                        rx="1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M3 4.5V3a2 2 0 114 0v1.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                      />
                    </svg>
                  )}
                  {land.id === currentLand.id && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="shrink-0">
                      <path
                        d="M1 4l3 3 5-6"
                        stroke="#3d2010"
                        strokeWidth="2"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                    </svg>
                  )}
                </button>
              ))}
              <div className="mt-1 pt-1 border-t-2 border-parchment-500">
                <button
                  onClick={() => {
                    setOpen(false)
                    setShowCreate(true)
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 w-full rounded-lg border-2 border-dashed border-parchment-500 text-left text-xs text-wood-600 font-bold hover:border-wood-700 hover:text-wood-900 hover:bg-parchment-250 transition-colors"
                >
                  <span className="text-sm leading-none">+</span>
                  <span>Create Land</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateLandModal onSubmit={handleCreateLand} onCancel={() => setShowCreate(false)} />
      )}

      {showInvite && (
        <InviteLandModal
          landId={currentLand.id}
          landName={currentLand.name}
          onSignIn={() => EventBus.emit('show-login', { tab: 'register' })}
          onCancel={() => setShowInvite(false)}
        />
      )}
    </>
  )
}
