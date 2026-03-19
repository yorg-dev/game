import type { Land } from '@/models/Land'
import type { LandPlacement } from '@/models/LandPlacement'
import type { LandObject } from '@/models/LandObject'
import type { Connection } from '@/models/Connection'

const PLACEHOLDER_LAND: Land = {
  id: '',
  world_id: '',
  name: '',
  owner_id: '',
  owner_type: 'user',
  is_public: false,
  created_at: '',
  updated_at: '',
}

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

let _state: ActiveLandState = {
  land: PLACEHOLDER_LAND,
  placements: [],
  landObjects: [],
  connections: [],
  canInteract: false,
  canManage: false,
}

/** Extract canInteract / canManage from the land's embedded viewer object. */
export function viewerPermissions(land: Land): { canInteract: boolean; canManage: boolean } {
  return {
    canInteract: land.viewer?.can_interact ?? false,
    canManage: land.viewer?.can_manage ?? false,
  }
}

export function setActiveLand(state: ActiveLandState): void {
  _state = state
}

export function getActiveLand(): ActiveLandState {
  return _state
}
