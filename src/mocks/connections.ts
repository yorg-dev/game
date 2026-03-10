import type { Connection } from '@/models/Connection'

/**
 * Demo connections that are active in the workspace.
 * Each one will render as a house in the game world.
 */
export const SAMPLE_CONNECTIONS: Connection[] = [
  {
    id: 'home',
    appId: 'Home',
    label: 'Home',
    status: 'connected',
    credentials: {},
    connectedAt: '2025-01-10T09:00:00Z',
    lastUsedAt: '2026-02-20T14:32:00Z',
  },
]

/**
 * World-space pixel positions for each connection's house.
 * Placed on open grass areas, away from water/stone/paths.
 */
export const CONNECTION_HOUSE_POSITIONS: Record<string, { x: number; y: number }> = {
  home: { x: 240, y: 136 },
}

/**
 * Available positions for dynamically added connection houses.
 * Used in order; wraps around if exhausted.
 */
export const EXTRA_HOUSE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 176, y: 104 },
  { x: 304, y: 104 },
  { x: 112, y: 104 },
  { x: 368, y: 104 },
  { x: 176, y: 200 },
  { x: 304, y: 200 },
  { x: 240, y: 152 },
  { x: 240, y: 200 },
]
