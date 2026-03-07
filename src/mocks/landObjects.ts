import type { LandObject } from '@/models/LandObject'

/**
 * Default map objects for the local sandbox land.
 * In production these come from GET /v1/lands/:id/objects.
 */
export const SAMPLE_LAND_OBJECTS: LandObject[] = [
  {
    id:         'lo_home_01',
    landId:     'land_main_01',
    objectType: 'home',
    x:          240,
    y:          136,
    config:     {},
    layout:     null,
    createdAt:  '2025-01-01T00:00:00Z',
    updatedAt:  '2025-01-01T00:00:00Z',
  },
  {
    id:         'lo_bulletin_01',
    landId:     'land_main_01',
    objectType: 'bulletin_board',
    x:          184,
    y:          152,
    config:     {},
    layout:     null,
    createdAt:  '2025-01-01T00:00:00Z',
    updatedAt:  '2025-01-01T00:00:00Z',
  },
  {
    id:         'lo_chest_01',
    landId:     'land_main_01',
    objectType: 'chest',
    x:          312,
    y:          136,
    config:     {},
    layout:     null,
    createdAt:  '2025-01-01T00:00:00Z',
    updatedAt:  '2025-01-01T00:00:00Z',
  },
]
