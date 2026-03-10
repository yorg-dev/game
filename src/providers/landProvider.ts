import httpProvider from './httpProvider'
import type { World } from '@/models/World'
import type { Land } from '@/models/Land'
import type { LandPlacement, PlacementEntityType } from '@/models/LandPlacement'
import type { LandObject } from '@/models/LandObject'
import { SAMPLE_WORLDS, DEFAULT_WORLD } from '@/mocks/worlds'
import { SAMPLE_LANDS, DEFAULT_LAND } from '@/mocks/lands'
import { SAMPLE_LAND_PLACEMENTS } from '@/mocks/landPlacements'
import { SAMPLE_LAND_OBJECTS } from '@/mocks/landObjects'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const api = import.meta.env.VITE_API_URL as string

function url(path: string): string {
  return `${api}/${path}`
}

/** Convert snake_case keys from the Rails API to camelCase. */
function camelize(obj: unknown): any {
  if (Array.isArray(obj)) return obj.map(camelize)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
        camelize(v),
      ]),
    )
  }
  return obj
}

async function getList<T>(path: string): Promise<T[]> {
  const { json } = await httpProvider(url(path))
  return camelize(json) as T[]
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const { json } = await httpProvider(url(path), {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return camelize(json) as T
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const { json } = await httpProvider(url(path), {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return camelize(json) as T
}

async function del(path: string): Promise<void> {
  await httpProvider(url(path), { method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// World
// ---------------------------------------------------------------------------

export const worldProvider = {
  /**
   * Fetch all Worlds the current user can access.
   * Falls back to SAMPLE_WORLDS when the API is unavailable.
   */
  async getWorlds(): Promise<World[]> {
    if (!api) return SAMPLE_WORLDS
    try {
      return await getList<World>('worlds')
    } catch {
      return SAMPLE_WORLDS
    }
  },

  /**
   * Fetch a single World by ID.
   * Falls back to DEFAULT_WORLD when the API is unavailable.
   */
  async getWorld(id: string): Promise<World> {
    if (!api) return DEFAULT_WORLD
    try {
      const { json } = await httpProvider(url(`worlds/${id}`))
      return camelize(json) as World
    } catch {
      return SAMPLE_WORLDS.find((w) => w.id === id) ?? DEFAULT_WORLD
    }
  },
}

// ---------------------------------------------------------------------------
// Land
// ---------------------------------------------------------------------------

export const landProvider = {
  /**
   * Fetch all Lands inside a World.
   * Falls back to SAMPLE_LANDS filtered by worldId.
   */
  async getLands(worldId: string): Promise<Land[]> {
    if (!api) return SAMPLE_LANDS.filter((l) => l.worldId === worldId)
    try {
      return await getList<Land>(`worlds/${worldId}/lands`)
    } catch {
      return []
    }
  },

  /**
   * Fetch a single Land by ID.
   * Falls back to DEFAULT_LAND when the API is unavailable.
   */
  async getLand(id: string): Promise<Land> {
    if (!api) return SAMPLE_LANDS.find((l) => l.id === id) ?? DEFAULT_LAND
    try {
      const { json } = await httpProvider(url(`lands/${id}`))
      return camelize(json) as Land
    } catch (err: any) {
      // Auth errors: return DEFAULT_LAND so caller can check if the right land loaded
      if (err?.status === 401 || err?.status === 403) {
        console.warn(`[landProvider] GET /lands/${id} → ${err.status} (no access)`)
        return DEFAULT_LAND
      }
      return SAMPLE_LANDS.find((l) => l.id === id) ?? DEFAULT_LAND
    }
  },

  /**
   * Create a new Land inside a World.
   */
  async createLand(data: Omit<Land, 'id' | 'createdAt' | 'updatedAt'>): Promise<Land> {
    if (!api) throw new Error('API not configured')
    return post<Land>('lands', data)
  },

  /**
   * Rename a Land or change its visibility.
   */
  async updateLand(id: string, data: Partial<Pick<Land, 'name' | 'isPublic'>>): Promise<Land> {
    if (!api) throw new Error('API not configured')
    return patch<Land>(`lands/${id}`, data)
  },

  /**
   * Permanently delete a Land and all its placements.
   */
  async deleteLand(id: string): Promise<void> {
    if (!api) throw new Error('API not configured')
    return del(`lands/${id}`)
  },

  /**
   * Fetch the first land accessible to the current user by walking
   * organizations → worlds → lands. Returns null when the API is
   * unavailable or the user has no lands yet.
   */
  async getMyFirstLand(): Promise<Land | null> {
    if (!api) return null
    try {
      const orgs = await getList<{ id: string }>('organizations')
      if (!orgs.length) return null
      const worlds = await getList<{ id: string }>(`organizations/${orgs[0].id}/worlds`)
      if (!worlds.length) return null
      const lands = await getList<Land>(`worlds/${worlds[0].id}/lands`)
      if (!lands[0]) return null
      // Fetch full detail so the viewer permissions object is included.
      return await landProvider.getLand(lands[0].id)
    } catch {
      return null
    }
  },

  /**
   * Invite a user by email to a Land.
   */
  async inviteToLand(landId: string, email: string): Promise<void> {
    if (!api) throw new Error('API not configured')
    await post(`lands/${landId}/invitations`, { email })
  },
}

// ---------------------------------------------------------------------------
// LandPlacement
// ---------------------------------------------------------------------------

export const landPlacementProvider = {
  /**
   * Fetch all placements on a Land, optionally filtered by entity type.
   * Falls back to SAMPLE_LAND_PLACEMENTS when the API is unavailable.
   */
  async getPlacements(landId: string, entityType?: PlacementEntityType): Promise<LandPlacement[]> {
    const mockFallback = SAMPLE_LAND_PLACEMENTS.filter(
      (p) => p.landId === landId && (entityType == null || p.entityType === entityType),
    )

    if (!api) return mockFallback

    const qs = entityType ? `?entityType=${entityType}` : ''

    try {
      return await getList<LandPlacement>(`lands/${landId}/placements${qs}`)
    } catch {
      return mockFallback
    }
  },

  async createPlacement(
    data: Omit<LandPlacement, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LandPlacement> {
    if (!api) throw new Error('API not configured')
    return post<LandPlacement>(`lands/${data.landId}/placements`, data)
  },

  async movePlacement(
    landId: string,
    id: string,
    worldX: number,
    worldY: number,
  ): Promise<LandPlacement> {
    if (!api) throw new Error('API not configured')
    return patch<LandPlacement>(`lands/${landId}/placements/${id}`, { worldX, worldY })
  },

  async deletePlacement(landId: string, id: string): Promise<void> {
    if (!api) throw new Error('API not configured')
    return del(`lands/${landId}/placements/${id}`)
  },
}

// ---------------------------------------------------------------------------
// LandObject
// ---------------------------------------------------------------------------

export const landObjectProvider = {
  /**
   * Fetch all map objects for a land (home, bulletin board, chest, etc.).
   * Falls back to SAMPLE_LAND_OBJECTS when the API is unavailable or the
   * backend endpoint does not exist yet.
   *
   * Falls back gracefully so the game works before the backend implements
   * GET /v1/lands/:id/objects.
   */
  async getObjects(landId: string): Promise<LandObject[]> {
    const mockFallback = SAMPLE_LAND_OBJECTS.filter((o) => o.landId === landId)

    if (!api) return mockFallback

    try {
      return await getList<LandObject>(`lands/${landId}/objects`)
    } catch {
      // Derive a minimal set from land.home if we have the land cached,
      // otherwise return the mock fallback so the game always has something.
      return mockFallback
    }
  },
}
