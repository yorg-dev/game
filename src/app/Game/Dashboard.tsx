import { useEffect, useRef, useState } from 'react'
import { useAuthProvider } from 'ra-core'
import type { AuthProvider } from 'ra-core'
import { PhaserGame } from '@/game/PhaserGame'
import { GameMenu } from '@/app/Game/Menu'
import { AgentPopover } from '@/app/Agents/Popover'
import { CommandBar } from '@/app/Command/Bar'
import { ConnectionPopover } from '@/app/Connections/Popover'
import { IndoorHUD } from '@/app/Connections/IndoorHUD'
import { ControlHUD } from '@/app/Agents/ControlHUD'
import { NotificationsModal } from '@/app/Notifications/List'
import { LoginModal } from '@/app/Auth/LoginModal'
import { ProfileButton } from '@/app/Auth/ProfileButton'
import { ChatPanel } from '@/app/Chat/Panel'
import { LandSwitcher } from '@/app/Lands/Switcher'
import { QuestTracker } from '@/app/Quests/Tracker'
import { AgentExecutionPanel } from '@/app/Agents/ExecutionPanel'
import { AchievementList } from '@/app/Achievements/List'
import { AchievementToast } from '@/app/Achievements/Toast'
import { ExpertList } from '@/app/Experts/List'
import { LeaderboardList } from '@/app/Leaderboard/List'
import { EventBus } from '@/game/EventBus'
import { landProvider, landPlacementProvider, landObjectProvider } from '@/providers/landProvider'
import { setActiveLand, getActiveLand, viewerPermissions } from '@/providers/activeLand'

type GameAuthProvider = AuthProvider & {
  isGuest: () => boolean
}

export const GameDashboard = () => {
  const authProvider = useAuthProvider() as GameAuthProvider
  const [gameStarted, setGameStarted] = useState(false)
  const [indoor, setIndoor] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginTab, setLoginTab] = useState<'login' | 'register'>('login')
  const [canManage, setCanManage] = useState(false)
  const initRan = useRef(false)

  // Phase 1: ensure a valid session exists, then emit session-ready.
  // Land resolution is deferred to phase 2 (game-started) so no API calls
  // fire while the player is still on the TitleScene.
  // initRan guard prevents React StrictMode from running this twice in dev.
  useEffect(() => {
    if (initRan.current) return
    initRan.current = true

    async function init() {
      let authenticated = false
      try {
        await authProvider.checkAuth({})
        authenticated = !authProvider.isGuest()
      } catch {
        // Not authenticated — show the title screen menu
      }
      EventBus.emit('session-ready', { authenticated })
    }

    init()
  }, [authProvider])

  // Phase 2: once the player starts the game, resolve their land and load data.
  // Kept separate so land API calls never fire during TitleScene.
  useEffect(() => {
    async function resolveStartingLand(urlLandId: string | null) {
      if (urlLandId) {
        const land = await landProvider.getLand(urlLandId)
        if (land?.id === urlLandId) return land
      }
      return landProvider.getMyFirstLand()
    }

    async function loadLand() {
      const urlLandId = new URLSearchParams(window.location.search).get('landId')
      const land = await resolveStartingLand(urlLandId)

      if (!land) {
        console.warn('[App:loadLand] No land found — game will wait for land-ready')
        return
      }

      console.debug('[App:loadLand] resolved land:', land.id, '| viewer:', land.viewer)

      const placements = await landPlacementProvider.getPlacements(land.id)
      const landObjects =
        land.objects && land.objects.length > 0
          ? land.objects
          : await landObjectProvider.getObjects(land.id)

      const { canInteract, canManage } = viewerPermissions(land)
      console.debug(
        '[App:loadLand] permissions — canInteract:',
        canInteract,
        '| canManage:',
        canManage,
      )
      const state = { land, placements, landObjects, connections: [], canInteract, canManage }
      setActiveLand(state)
      setCanManage(canManage)
      EventBus.emit('land-ready', state)
      EventBus.emit('connections-loaded', { connections: [] })
    }

    return EventBus.on('game-started', () => {
      setGameStarted(true)
      loadLand()
    })
  }, [])

  useEffect(() => {
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
        const { canInteract, canManage } = viewerPermissions(land)
        const state = { land, placements, landObjects, connections: [], canInteract, canManage }
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
      unsubLogout()
      unsubEnter()
      unsubExit()
      unsubLogin()
      unsubLandRdy()
      unsubConfirm()
    }
  }, [])

  return (
    <>
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
              <AchievementList />
              <AchievementToast />
              <ExpertList />
              <LeaderboardList />
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
    </>
  )
}
