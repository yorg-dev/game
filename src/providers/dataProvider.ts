import httpProvider from './httpProvider'
import jsonServerProvider from 'ra-data-json-server'

import type { DataProvider } from 'ra-core'
import { overridesCapability, registerCapability } from './capabilities'

const baseProvider = jsonServerProvider(import.meta.env.VITE_API_URL, httpProvider)

/**
 * Data provider for the Admin API
 *
 * Uses json-server format with custom overrides for:
 * - Pagination: _start/_end parameters
 * - Sorting: _sort/_order parameters
 * - Filtering: Ransack predicates (field_eq, field_cont, etc.)
 * - Array formatting: bracket notation for query params
 *
 * The API returns X-Total-Count header for pagination metadata.
 *
 * See API.md for complete API documentation.
 */
export const dataProvider: DataProvider = {
  ...baseProvider,
  ...overridesCapability(import.meta.env.VITE_API_URL, httpProvider),
  ...registerCapability(import.meta.env.VITE_API_URL, httpProvider),
}
