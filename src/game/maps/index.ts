import type { MapDefinition } from './MapDefinition'
import { MEADOW_MAP } from './meadowMap'
import { COAST_MAP }  from './coastMap'

// ── Registry ──────────────────────────────────────────────────────────────────
// Add new maps here.  The first entry is the default.

export const MAP_REGISTRY: MapDefinition[] = [
  MEADOW_MAP,
  COAST_MAP,
]

// ── Active map ────────────────────────────────────────────────────────────────
// GameScene reads this on create().  Call setActiveMap() before starting/
// restarting the scene to switch maps.

let activeMapId = MAP_REGISTRY[0].id

export function getActiveMap(): MapDefinition {
  return MAP_REGISTRY.find(m => m.id === activeMapId) ?? MAP_REGISTRY[0]
}

export function setActiveMap(id: string): void {
  if (MAP_REGISTRY.some(m => m.id === id)) activeMapId = id
}
