import { useState, useEffect, useRef } from 'react'
import { authProvider } from '@/providers'
import { LoginModal } from './LoginModal'
import { EventBus } from '@/game/EventBus'

function getEmail(): string | null {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    return JSON.parse(raw)?.email ?? null
  } catch {
    return null
  }
}

export function ProfileButton() {
  const [guest, setGuest] = useState(() => authProvider.isGuest())
  const [email, setEmail] = useState<string | null>(getEmail)
  const [showLogin, setShowLogin] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync state when login completes via App.tsx's modal
  useEffect(() => {
    return EventBus.on('login-confirmed', () => {
      setGuest(authProvider.isGuest())
      setEmail(getEmail())
    })
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [showDropdown])

  function handleClick() {
    if (guest) {
      setShowLogin(true)
    } else {
      setShowDropdown((v) => !v)
    }
  }

  function handleLoginSuccess() {
    setGuest(authProvider.isGuest())
    setEmail(getEmail())
    setShowLogin(false)
    EventBus.emit('login-confirmed', undefined)
  }

  async function handleLogout() {
    await authProvider.logout()
    setGuest(true)
    setEmail(null)
    setShowDropdown(false)
    EventBus.emit('logout', undefined)
  }

  return (
    <>
      <div ref={dropdownRef} className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
        {/* Profile button */}
        <button
          onClick={handleClick}
          aria-label={guest ? 'Save progress' : 'Profile'}
          title={guest ? 'Save progress' : (email ?? 'Profile')}
          className="relative w-12 h-12 rounded-xl border-4 border-[#7a5230] bg-[#e8d5a8] shadow-[inset_0_0_0_3px_#f5edd5,inset_0_0_0_5px_#c8a86a] hover:brightness-105 active:brightness-95 transition-[filter] flex items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle
              cx="10"
              cy="6.5"
              r="3.5"
              stroke="#7a5230"
              strokeWidth="2"
              strokeLinecap="square"
            />
            <path
              d="M2 18c0-3.866 3.582-7 8-7s8 3.134 8 7"
              stroke="#7a5230"
              strokeWidth="2"
              strokeLinecap="square"
            />
          </svg>

          {/* Status dot: amber = guest, green = signed in */}
          <span
            className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-[#e8d5a8] ${guest ? 'bg-amber-400' : 'bg-emerald-500'}`}
          />
        </button>

        {/* Guest nudge */}
        {guest && showDropdown && (
          <div className="w-52 bg-[#e8d5a8] border-4 border-[#7a5230] rounded-xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden">
            <div className="px-4 py-3 border-b-4 border-[#7a5230] bg-[#dcc898]">
              <p className="text-[10px] font-bold text-[#7a5230] uppercase tracking-widest">
                Playing as guest
              </p>
              <p className="text-xs text-[#7a5230] mt-0.5">Sign in to save your progress.</p>
            </div>
            <div className="px-3 py-2">
              <button
                onClick={() => {
                  setShowDropdown(false)
                  setShowLogin(true)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border-2 border-[#7a5230] bg-[#c8974c] text-left text-xs text-[#3d2010] font-bold hover:brightness-110 transition-[filter]"
              >
                Save progress
              </button>
            </div>
          </div>
        )}

        {/* Signed-in dropdown */}
        {!guest && showDropdown && (
          <div className="w-52 bg-[#e8d5a8] border-4 border-[#7a5230] rounded-xl shadow-[inset_0_0_0_3px_#f5edd5] overflow-hidden">
            <div className="px-4 py-3 border-b-4 border-[#7a5230] bg-[#dcc898]">
              <p className="text-[10px] font-bold text-[#7a5230] uppercase tracking-widest">
                Signed in as
              </p>
              <p className="text-sm font-bold text-[#3d2010] truncate mt-0.5">
                {email ?? 'Unknown'}
              </p>
            </div>
            <div className="px-3 py-2 flex flex-col gap-1">
              <button
                onClick={() => {
                  setShowDropdown(false)
                  EventBus.emit('show-achievements', undefined)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border-2 border-[#9a6b28] bg-[#e8d5a8] text-left text-xs text-[#5a3810] font-bold hover:bg-[#c8b07a] hover:border-[#7a5230] transition-colors"
              >
                🏆 Achievements
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border-2 border-[#9a6b28] bg-[#e8d5a8] text-left text-xs text-[#5a3810] font-bold hover:bg-[#c8b07a] hover:border-[#7a5230] transition-colors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="shrink-0 text-[#7a5230]"
                >
                  <path
                    d="M5 2H2v8h3M8 4l2 2-2 2M10 6H5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Login modal (when not logged in and button clicked) */}
      {showLogin && (
        <LoginModal onSuccess={handleLoginSuccess} onCancel={() => setShowLogin(false)} />
      )}
    </>
  )
}
