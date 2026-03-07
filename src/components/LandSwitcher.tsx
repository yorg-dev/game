import { useState, useEffect, useRef } from 'react'
import { landProvider, landPlacementProvider } from '@/providers/landProvider'
import { getActiveLand, setActiveLand, viewerPermissions } from '@/providers/activeLand'
import { EventBus } from '@/game/EventBus'
import type { Land } from '@/models/Land'
import { SAMPLE_CONNECTIONS } from '@/mocks/connections'
import { CreateLandModal } from './CreateLandModal'
import { InviteLandModal } from './InviteLandModal'

export function LandSwitcher() {
  const [currentLand,  setCurrentLand]  = useState<Land>(() => getActiveLand().land)
  const [lands,        setLands]        = useState<Land[]>([])
  const [open,         setOpen]         = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [showCreate,   setShowCreate]   = useState(false)
  const [showInvite,   setShowInvite]   = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  async function loadLands(worldId: string) {
    const fetched = await landProvider.getLands(worldId)
    if (fetched.length > 0) setLands(fetched)
  }

  // On mount: load lands using the real worldId from the backend.
  // Falls back to the active land's worldId if the user has no orgs/worlds yet.
  useEffect(() => {
    landProvider.getMyFirstLand().then(land => {
      const worldId = land?.worldId ?? getActiveLand().land.worldId
      loadLands(worldId)
    })
  }, [])

  useEffect(() => {
    return EventBus.on('land-ready', ({ land }) => {
      setCurrentLand(land)
      // Only reload lands if the worldId actually changed
      if (land.worldId !== getActiveLand().land.worldId) {
        loadLands(land.worldId)
      }
    })
  }, [])

  useEffect(() => {
    // After login the user has real lands — reload from backend
    return EventBus.on('login-confirmed', () => {
      landProvider.getMyFirstLand().then(land => {
        if (land) loadLands(land.worldId)
      })
    })
  }, [])

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  async function handleCreateLand(name: string, isPublic: boolean) {
    const { land: activeLand } = getActiveLand()
    const newLand = await landProvider.createLand({
      worldId:   activeLand.worldId,
      name,
      isPublic,
      ownerId:   '',   // set server-side from token
      ownerType: 'user',
    })
    setLands(prev => [...prev, newLand])
    setShowCreate(false)
    await switchLand(newLand)
  }

  async function switchLand(land: Land) {
    if (land.id === currentLand.id) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    try {
      const placements  = await landPlacementProvider.getPlacements(land.id)
      const connections = [...SAMPLE_CONNECTIONS]
      const landObjects = land.objects ?? getActiveLand().landObjects
      const { canInteract, canManage } = viewerPermissions(land)
      const state       = { land, placements, connections, landObjects, canInteract, canManage }
      setActiveLand(state)
      setCurrentLand(land)
      EventBus.emit('land-ready', state)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div ref={ref} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      <div className="flex items-center gap-2">
        {/* Land switcher pill */}
        <button
          onClick={() => setOpen(v => !v)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-4 border-[#7a5230] bg-[#e8d5a8] shadow-[inset_0_0_0_2px_#f5edd5,inset_0_0_0_4px_#c8a86a] hover:brightness-105 active:brightness-95 transition-[filter] text-sm font-bold text-[#3d2010] disabled:opacity-50"
        >
          <svg width="10" height="13" viewBox="0 0 10 13" fill="none" aria-hidden="true">
            <path d="M5 1C2.79 1 1 2.79 1 5c0 3 4 7 4 7s4-4 4-7c0-2.21-1.79-4-4-4z" stroke="#7a5230" strokeWidth="1.5" strokeLinecap="square"/>
            <circle cx="5" cy="5" r="1.5" fill="#7a5230"/>
          </svg>
          {loading ? 'Switching…' : currentLand.name}
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          >
            <path d="M1 3l4 4 4-4" stroke="#7a5230" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"/>
          </svg>
        </button>

        {/* Invite button */}
        <button
          onClick={() => setShowInvite(true)}
          aria-label="Invite to land"
          title="Invite to land"
          className="flex items-center justify-center w-10 h-10 rounded-xl border-4 border-[#7a5230] bg-[#e8d5a8] shadow-[inset_0_0_0_2px_#f5edd5,inset_0_0_0_4px_#c8a86a] hover:brightness-105 active:brightness-95 transition-[filter]"
        >
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true">
            <circle cx="6" cy="4" r="2.5" stroke="#7a5230" strokeWidth="1.5"/>
            <path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#7a5230" strokeWidth="1.5" strokeLinecap="square"/>
            <path d="M13 4v4M11 6h4" stroke="#7a5230" strokeWidth="1.5" strokeLinecap="square"/>
          </svg>
        </button>
      </div>

      {open && lands.length > 0 && (
        <div
          data-modal="true"
          className="absolute bottom-full mb-2 w-60 bg-[#e8d5a8] border-4 border-[#7a5230] rounded-xl shadow-[inset_0_0_0_2px_#f5edd5] overflow-hidden"
          onKeyDown={e => e.nativeEvent.stopImmediatePropagation()}
        >
          <div className="px-4 py-2 border-b-4 border-[#7a5230] bg-[#dcc898]">
            <p className="text-[10px] font-bold text-[#7a5230] uppercase tracking-widest">Switch Land</p>
          </div>
          <div className="flex flex-col gap-1 p-2">
            {lands.map(land => (
              <button
                key={land.id}
                onClick={() => switchLand(land)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg border-2 text-left text-sm font-bold transition-colors ${
                  land.id === currentLand.id
                    ? 'border-[#7a5230] bg-[#c8974c] text-[#3d2010]'
                    : 'border-[#9a6b28] bg-[#dcc898] text-[#3d2010] hover:border-[#7a5230] hover:bg-[#c8b07a]'
                }`}
              >
                <span className="flex-1 truncate">{land.name}</span>
                {!land.isPublic && (
                  <svg width="10" height="11" viewBox="0 0 10 11" fill="none" className="shrink-0 text-[#7a5230]" aria-label="Private">
                    <rect x="1.5" y="4.5" width="7" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 4.5V3a2 2 0 114 0v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                  </svg>
                )}
                {land.id === currentLand.id && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="shrink-0">
                    <path d="M1 4l3 3 5-6" stroke="#3d2010" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"/>
                  </svg>
                )}
              </button>
            ))}
            <div className="mt-1 pt-1 border-t-2 border-[#b8955a]">
              <button
                onClick={() => { setOpen(false); setShowCreate(true) }}
                className="flex items-center gap-2 px-3 py-1.5 w-full rounded-lg border-2 border-dashed border-[#b8955a] text-left text-xs text-[#9a6b28] font-bold hover:border-[#7a5230] hover:text-[#5a3810] hover:bg-[#dcc898] transition-colors"
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
      <CreateLandModal
        onSubmit={handleCreateLand}
        onCancel={() => setShowCreate(false)}
      />
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
