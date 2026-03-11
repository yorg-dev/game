import { useEffect, useRef, useState } from 'react'
import { PhaserGame } from './components/PhaserGame'
import { GameMenu } from './components/GameMenu'
import { AgentPopover } from './components/AgentPopover'
import { CommandBar } from './components/CommandBar'
import { ConnectionPopover } from './components/ConnectionPopover'
import { IndoorHUD } from './components/IndoorHUD'
import { ControlHUD } from './components/ControlHUD'
import { NotificationsModal } from './components/NotificationsModal'
import { LoginModal } from './components/LoginModal'
import { ProfileButton } from './components/ProfileButton'
import { ChatPanel } from './components/ChatPanel'
import { LandSwitcher } from './components/LandSwitcher'
import { QuestTracker } from './components/QuestTracker'
import { AgentExecutionPanel } from './components/AgentExecutionPanel'
import { AchievementsModal } from './components/AchievementsModal'
import { AchievementToast } from './components/AchievementToast'
import { EventBus } from './game/EventBus'
import { authProvider } from './providers'
import { landProvider, landPlacementProvider, landObjectProvider } from './providers/landProvider'
import { setActiveLand, getActiveLand, viewerPermissions } from './providers/activeLand'
import { DEFAULT_LAND } from './mocks/lands'

import { SAMPLE_CONNECTIONS } from './mocks/connections'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [indoor, setIndoor] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginTab, setLoginTab] = useState<'login' | 'register'>('login')
  const [canManage, setCanManage] = useState(false)
  const initRan = useRef(false)

  // 1. Ensure a valid session exists, then 2. resolve the starting land.
  // Sequential so land requests always have a valid token.
  // initRan guard prevents React StrictMode from running this twice in dev,
  // which would create duplicate guest users / organizations on every page load.
  useEffect(() => {
    if (initRan.current) return
    initRan.current = true
    async function ensureGuestSession(): Promise<boolean> {
      try {
        await authProvider.createGuestSession()
        return true
      } catch (err) {
        console.error('[App] Guest session creation failed:', err)
        return false
      }
    }

    /**
     * Resolve which land to start on:
     * 1. URL ?landId param (invite link) — with or without auth
     * 2. The user's own first land from the backend
     * 3. Local "My Sandbox" fallback (mock, no backend needed)
     */
    async function resolveStartingLand(urlLandId: string | null): Promise<typeof DEFAULT_LAND> {
      // 1. Try the invite link land (with current token, including guest token)
      if (urlLandId) {
        const land = await landProvider.getLand(urlLandId)
        // getLand returns DEFAULT_LAND only on non-auth errors; auth errors propagate
        if (land.id === urlLandId) return land
      }

      // 2. Try to load the user's first real land from the backend
      const myLand = await landProvider.getMyFirstLand()
      if (myLand) return myLand

      // 3. Local sandbox fallback (always works, no backend needed)
      return DEFAULT_LAND
    }

    async function init() {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      console.debug('[App:init] stored token:', storedToken, '| stored user:', storedUser)

      // Record synchronously (before any await) whether the user had a valid token
      // when the page loaded. TitleScene uses this to distinguish returning users
      // (who should skip the title screen) from freshly-created guest sessions
      // (who should see the menu). Without this flag, createGuestSession() can
      // complete before Phaser's first rAF, and the bare localStorage check would
      // auto-start the game for new guests.
      const hadToken = !!storedToken && storedToken !== 'undefined'
      sessionStorage.setItem('_returningUser', hadToken ? '1' : '0')

      if (!storedToken || storedToken === 'undefined') {
        if (storedToken === 'undefined') localStorage.removeItem('token')
        console.debug('[App:init] No valid token — creating guest session')
        const ok = await ensureGuestSession()
        if (!ok) {
          // Guest session failed — still proceed, using local sandbox
          console.warn('[App] Proceeding without a session token.')
        }
        console.debug('[App:init] After guest session — token:', localStorage.getItem('token'), '| user:', localStorage.getItem('user'))
      } else {
        console.debug('[App:init] Existing token found — skipping guest session')
      }
      EventBus.emit('session-ready', undefined)

      const urlLandId = new URLSearchParams(window.location.search).get('landId')
      const land = await resolveStartingLand(urlLandId)
      console.debug('[App:init] resolved land:', land?.id, '| viewer:', land?.viewer)

      const placements = await landPlacementProvider.getPlacements(land.id)
      // Prefer objects embedded in the land detail response. If absent or empty,
      // fetch from the dedicated endpoint (falls back to mocks if API is unavailable).
      const landObjects =
        land.objects && land.objects.length > 0
          ? land.objects
          : await landObjectProvider.getObjects(land.id)
      const connections = [...SAMPLE_CONNECTIONS]

      const { canInteract, canManage } = viewerPermissions(land)
      console.debug('[App:init] permissions — canInteract:', canInteract, '| canManage:', canManage)
      const state = { land, placements, landObjects, connections, canInteract, canManage }
      setActiveLand(state)
      setCanManage(canManage)
      EventBus.emit('land-ready', state)
      EventBus.emit('connections-loaded', { connections })
    }

    init()
  }, [])

  useEffect(() => {
    const unsubStarted = EventBus.on('game-started', () => setGameStarted(true))
    const unsubLogout = EventBus.on('logout', () => setGameStarted(false))
    const unsubEnter = EventBus.on('enter-house', () => setIndoor(true))
    const unsubExit = EventBus.on('exit-house', () => setIndoor(false))
    const unsubLogin = EventBus.on('show-login', (p) => {
      setLoginTab(p?.tab ?? 'login')
      setShowLogin(true)
    })
    const unsubLandRdy = EventBus.on('land-ready', ({ land }) => {
      const { canManage } = viewerPermissions(land)
      setCanManage(canManage)
    })
    const unsubConfirm = EventBus.on('login-confirmed', async () => {
      // Switch to the user's first real land now that they're authenticated.
      const land = await landProvider.getMyFirstLand()
      if (land) {
        const placements = await landPlacementProvider.getPlacements(land.id)
        const landObjects =
          land.objects && land.objects.length > 0
            ? land.objects
            : await landObjectProvider.getObjects(land.id)
        const connections = [...SAMPLE_CONNECTIONS]
        const { canInteract, canManage } = viewerPermissions(land)
        const state = { land, placements, landObjects, connections, canInteract, canManage }
        setActiveLand(state)
        setCanManage(canManage)
        EventBus.emit('land-ready', state)
      } else {
        // No land found — permissions stay as-is from the active land.
        const { canManage } = viewerPermissions(getActiveLand().land)
        setCanManage(canManage)
      }
    })
    return () => {
      unsubStarted()
      unsubLogout()
      unsubEnter()
      unsubExit()
      unsubLogin()
      unsubLandRdy()
      unsubConfirm()
    }
  }, [])

  return (
    <div id="app">
      <PhaserGame />

      {gameStarted && (
        <>
          {/* Indoor overlay — shown when player is inside a house */}
          <IndoorHUD />

          {/* Profile button — always visible in-game, indoor or outdoor */}
          <ProfileButton />

          {/* Outdoor game UI — hidden while indoors so hotkeys/panels don't interfere */}
          {!indoor && (
            <>
              <GameMenu canManage={canManage} />
              <ChatPanel />
              <LandSwitcher />
              <AgentPopover />
              <CommandBar />
              <ConnectionPopover />
              <ControlHUD />
              <NotificationsModal />
              <QuestTracker />
              <AgentExecutionPanel />
              <AchievementsModal />
              <AchievementToast />
            </>
          )}
        </>
      )}
      {showLogin && (
        <LoginModal
          defaultTab={loginTab}
          onSuccess={() => {
            setShowLogin(false)
            EventBus.emit('login-confirmed', undefined)
          }}
          onCancel={() => {
            setShowLogin(false)
            EventBus.emit('login-cancelled', undefined)
          }}
        />
      )}
    </div>
  )
}

export default App
