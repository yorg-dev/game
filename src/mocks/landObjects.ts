import type { LandObject } from '@/models/LandObject'

/**
 * Default map objects for the local sandbox land.
 * In production these come from the land serializer's objects attribute.
 */
export const SAMPLE_LAND_OBJECTS: LandObject[] = [
  {
    id: 'lo_home_01',
    land_id: 'land_main_01',
    object_type: 'home',
    x: 240,
    y: 136,
    config: {},
    layout: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'lo_bulletin_01',
    land_id: 'land_main_01',
    object_type: 'bulletin_board',
    x: 184,
    y: 152,
    config: {},
    layout: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'lo_chest_01',
    land_id: 'land_main_01',
    object_type: 'chest',
    x: 312,
    y: 136,
    config: {},
    layout: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
]
