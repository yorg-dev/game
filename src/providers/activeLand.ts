import type { Land } from '@/models/Land'
import type { LandPlacement } from '@/models/LandPlacement'
import type { LandObject } from '@/models/LandObject'
import type { Connection } from '@/models/Connection'
import { DEFAULT_LAND } from '@/mocks/lands'
import { SAMPLE_LAND_PLACEMENTS } from '@/mocks/landPlacements'
import { SAMPLE_LAND_OBJECTS } from '@/mocks/landObjects'
import { SAMPLE_CONNECTIONS } from '@/mocks/connections'

// ---------------------------------------------------------------------------
// Active Land store
//
// A plain module-level singleton so both React (App.tsx) and Phaser
// (GameScene.create) can read the current land state synchronously —
// without prop-drilling or EventBus timing issues.
//
// App.tsx writes here before emitting 'land-ready'.
// GameScene.create() reads here directly.
// ---------------------------------------------------------------------------

export interface ActiveLandState {
  land: Land
  placements: LandPlacement[]
  landObjects: LandObject[]
  connections: Connection[]
  /** May enter home, talk to connections. False for guests. */
  canInteract: boolean
  /** May add/move/remove placements and objects. True for org owners only. */
  canManage: boolean
}

// Initialised from mock data so GameScene always has something to render
// even before App.tsx finishes its async fetch.
let _state: ActiveLandState = {
  land: DEFAULT_LAND,
  placements: SAMPLE_LAND_PLACEMENTS,
  landObjects: DEFAULT_LAND.objects ?? SAMPLE_LAND_OBJECTS,
  connections: SAMPLE_CONNECTIONS,
  canInteract: false,
  canManage: false,
}

/** Extract canInteract / canManage from the land's embedded viewer object. */
export function viewerPermissions(land: Land): { canInteract: boolean; canManage: boolean } {
  return {
    canInteract: land.viewer?.canInteract ?? false,
    canManage: land.viewer?.canManage ?? false,
  }
}

export function setActiveLand(state: ActiveLandState): void {
  _state = state
}

export function getActiveLand(): ActiveLandState {
  return _state
}
