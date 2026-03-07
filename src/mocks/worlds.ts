import type { World } from '@/models/World'

/**
 * Demo worlds.
 * In production these are fetched from GET /worlds.
 */
export const SAMPLE_WORLDS: World[] = [
  {
    id:             'world_demo_01',
    name:           'Demo World',
    organizationId: 'org_demo_01',
    createdAt:      '2025-01-01T00:00:00Z',
    updatedAt:      '2025-01-01T00:00:00Z',
  },
]

/** The world loaded when no API is available. */
export const DEFAULT_WORLD = SAMPLE_WORLDS[0]
