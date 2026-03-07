// ─────────────────────────────────────────
// LAND
// A browsable, spatial map that lives inside
// a World. Teams and users create their own
// Lands and populate them with placements.
// ─────────────────────────────────────────

import type { LandObject } from './LandObject'

/**
 * Per-request viewer context embedded in GET /v1/lands/:id.
 * Keys are camelCased from the Rails snake_case response via camelize().
 */
export interface LandViewer {
  isGuest:     boolean  // authenticated via a guest session
  isOwner:     boolean  // org-level owner of this land
  canInteract: boolean  // may enter home, talk to connections (!guest)
  canManage:   boolean  // may add/move/remove placements (owner only)
}

/**
 * A Land is a named, playable map within a World.
 *
 * Each Land has its own spatial layout of placed entities
 * (connections, agents, objects) defined by LandPlacement records.
 * Multiple users can browse the same Land simultaneously over WebSocket,
 * scoped by landId.
 *
 * Lands can be personal (a single user's workspace) or shared
 * (a team's common view). Visibility is controlled by `isPublic`.
 */
export interface Land {
  id:      string   // "land_mktg_01"
  worldId: string   // parent World
  name:    string   // "Marketing Team", "Dan's Sandbox"

  /**
   * The user or team that created and owns this Land.
   * Determines who can rename, delete, or change visibility.
   */
  ownerId:   string   // user ID or team ID
  ownerType: 'user' | 'team'

  /**
   * When true, any member of the parent World can browse this Land.
   * When false, only the owner (and explicit collaborators) can access it.
   */
  isPublic: boolean

  /**
   * Map objects embedded in the land response (home, bulletin board, chest, etc.).
   * Returned by GET /v1/lands/:id — no separate fetch needed.
   * May be absent on list responses (GET /v1/worlds/:id/lands).
   */
  objects?: LandObject[]

  /**
   * Per-request viewer permissions embedded by the serializer.
   * Present on GET /v1/lands/:id; absent on list responses.
   */
  viewer?: LandViewer

  /** ISO-8601 timestamps. */
  createdAt: string
  updatedAt: string
}
