import type { Land } from '@/models/Land'
import { SAMPLE_LAND_OBJECTS } from './landObjects'

/**
 * Demo lands inside 'world_demo_01'.
 * In production these are fetched from GET /worlds/:id/lands.
 * The full show response (GET /lands/:id) embeds objects[].
 */
export const SAMPLE_LANDS: Land[] = [
  {
    id: 'land_main_01',
    worldId: 'world_demo_01',
    name: 'My Sandbox',
    ownerId: 'org_demo_01',
    ownerType: 'team',
    isPublic: true,
    objects: SAMPLE_LAND_OBJECTS.filter((o) => o.landId === 'land_main_01'),
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'land_mktg_01',
    worldId: 'world_demo_01',
    name: 'Marketing Team',
    ownerId: 'team_mktg_01',
    ownerType: 'team',
    isPublic: true,
    objects: SAMPLE_LAND_OBJECTS.filter((o) => o.landId === 'land_main_01'),
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'land_sandbox_01',
    worldId: 'world_demo_01',
    name: 'My Sandbox',
    ownerId: 'user_demo_01',
    ownerType: 'user',
    isPublic: false,
    objects: SAMPLE_LAND_OBJECTS.filter((o) => o.landId === 'land_main_01'),
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
  },
]

/** The land loaded on game start when no selection has been made. */
export const DEFAULT_LAND = SAMPLE_LANDS[0]
