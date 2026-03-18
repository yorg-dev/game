import httpProvider from './httpProvider'
import { dataProvider } from './dataProvider'
import type { Land } from '@/models/Land'
import type { LandPlacement, PlacementEntityType } from '@/models/LandPlacement'
import type { LandObject } from '@/models/LandObject'

// ---------------------------------------------------------------------------
// Helpers — used only for custom action endpoints with no dataProvider equiv.
// ---------------------------------------------------------------------------

const api = import.meta.env.VITE_API_URL as string

// ---------------------------------------------------------------------------
// Land
// ---------------------------------------------------------------------------

export const landProvider = {
  async getLands(worldId: string): Promise<Land[]> {
    try {
      const { data } = await dataProvider.getList<Land>('lands', {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'id', order: 'ASC' },
        filter: { world_id_eq: worldId },
      })
      return data
    } catch {
      return []
    }
  },

  async getLand(id: string): Promise<Land | null> {
    try {
      const { data } = await dataProvider.getOne<Land>('lands', { id })
      return data
    } catch (err: any) {
      console.warn(`[landProvider] GET /lands/${id} → ${err?.status ?? 'error'}`)
      return null
    }
  },

  async createLand(data: Omit<Land, 'id' | 'createdAt' | 'updatedAt'>): Promise<Land> {
    const { data: land } = await dataProvider.create<Land>('lands', { data })
    return land
  },

  async updateLand(id: string, data: Partial<Pick<Land, 'name' | 'isPublic'>>): Promise<Land> {
    const { data: land } = await dataProvider.update<Land>('lands', { id, data, previousData: {} })
    return land
  },

  async deleteLand(id: string): Promise<void> {
    await dataProvider.delete('lands', { id, previousData: { id } })
  },

  /**
   * Fetch the first land accessible to the current user by walking
   * organizations → worlds → lands.
   */
  async getMyFirstLand(): Promise<Land | null> {
    try {
      const { data: orgs } = await dataProvider.getList<{ id: string }>('organizations', {
        pagination: { page: 1, perPage: 1 },
        sort: { field: 'id', order: 'ASC' },
        filter: {},
      })
      console.debug('[landProvider:getMyFirstLand] orgs:', orgs)
      if (!orgs.length) return null

      const { data: worlds } = await dataProvider.getList<{ id: string }>('worlds', {
        pagination: { page: 1, perPage: 1 },
        sort: { field: 'id', order: 'ASC' },
        filter: { organization_id_eq: orgs[0].id },
      })
      console.debug('[landProvider:getMyFirstLand] worlds:', worlds)
      if (!worlds.length) return null

      const lands = await landProvider.getLands(worlds[0].id)
      console.debug('[landProvider:getMyFirstLand] lands:', lands)
      if (!lands[0]) return null

      // Fetch full detail so viewer permissions are included.
      return landProvider.getLand(lands[0].id)
    } catch (err) {
      console.warn('[landProvider:getMyFirstLand] failed:', err)
      return null
    }
  },

  /** Custom POST action — no dataProvider equivalent. */
  async inviteToLand(landId: string, email: string): Promise<void> {
    await httpProvider(`${api}/lands/${landId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
}

// ---------------------------------------------------------------------------
// LandPlacement
// ---------------------------------------------------------------------------

export const landPlacementProvider = {
  async getPlacements(landId: string, entityType?: PlacementEntityType): Promise<LandPlacement[]> {
    try {
      const filter: Record<string, string> = { land_id_eq: landId }
      if (entityType) filter['entity_type_eq'] = entityType
      const { data } = await dataProvider.getList<LandPlacement>('land_placements', {
        pagination: { page: 1, perPage: 500 },
        sort: { field: 'id', order: 'ASC' },
        filter,
      })
      return data
    } catch {
      return []
    }
  },

  async createPlacement(
    data: Omit<LandPlacement, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LandPlacement> {
    const { data: placement } = await dataProvider.create<LandPlacement>('land_placements', {
      data,
    })
    return placement
  },

  async movePlacement(
    _landId: string,
    id: string,
    worldX: number,
    worldY: number,
  ): Promise<LandPlacement> {
    const { data: placement } = await dataProvider.update<LandPlacement>('land_placements', {
      id,
      data: { worldX, worldY },
      previousData: {},
    })
    return placement
  },

  async deletePlacement(_landId: string, id: string): Promise<void> {
    await dataProvider.delete('land_placements', { id, previousData: { id } })
  },
}

// ---------------------------------------------------------------------------
// LandObject
// ---------------------------------------------------------------------------

export const landObjectProvider = {
  async getObjects(landId: string): Promise<LandObject[]> {
    try {
      const { data } = await dataProvider.getList<LandObject>('land_objects', {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'id', order: 'ASC' },
        filter: { land_id_eq: landId },
      })
      return data
    } catch {
      return []
    }
  },
}
