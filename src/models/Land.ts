// ─────────────────────────────────────────
// LAND
// A browsable, spatial map that lives inside
// a World. Teams and users create their own
// Lands and populate them with placements.
// ─────────────────────────────────────────

import type { LandObject } from './LandObject'

/**
 * Per-request viewer context embedded in GET /v1/lands/:id.
 * Keys match the Rails snake_case response.
 */
export interface LandViewer {
  is_guest: boolean // authenticated via a guest session
  is_owner: boolean // org-level owner of this land
  can_interact: boolean // may enter home, talk to connections (!guest)
  can_manage: boolean // may add/move/remove placements (owner only)
}

/**
 * A Land is a named, playable map within a World.
 */
export interface Land {
  id: string
  world_id: string
  name: string
  owner_id: string
  owner_type: 'user' | 'team'
  is_public: boolean
  objects?: LandObject[]
  viewer?: LandViewer
  created_at: string
  updated_at: string
}
