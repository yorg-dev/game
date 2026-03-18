import queryString from 'query-string'
import * as fetchUtils from '../fetchUtils'

// ---------------------------------------------------------------------------
// Ransack + Pagy query helpers
//
// react-admin filter keys are Ransack predicates by convention.
// Examples: { name_cont: 'foo', status_eq: 'active', created_at_gteq: '2024-01-01' }
//
// These get serialised as q[name_cont]=foo&q[status_eq]=active ...
// Pagination uses Pagy's `page` + `items` params.
// Sort uses Ransack's `q[s]=field+direction`.
// ---------------------------------------------------------------------------

/**
 * Wrap each filter/sort key in `q[...]` for Ransack.
 * Array values stay as arrays so queryString can apply arrayFormat: 'bracket'.
 * e.g. { name_cont: 'foo', id_in: [1, 2] }
 *   → { 'q[name_cont]': 'foo', 'q[id_in]': [1, 2] }
 */
function toRansackParams(q: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(q).map(([k, v]) => [`q[${k}]`, v]))
}

function parseTotalCount(headers: Headers): number {
  const raw = headers.get('x-total-count')
  if (raw == null) {
    throw new Error(
      'The X-Total-Count header is missing. ' +
        'Ensure the API exposes it and CORS Access-Control-Expose-Headers includes X-Total-Count.',
    )
  }
  // Pagy returns a plain integer; guard against legacy "offset/total" shapes.
  const total = parseInt(raw.split('/').pop()!, 10)
  if (isNaN(total)) throw new Error(`X-Total-Count value is not a number: "${raw}"`)
  return total
}

// ---------------------------------------------------------------------------

const capability = (apiUrl: string, httpClient = fetchUtils.fetchJson) => ({
  /**
   * GET /resource?q[field_predicate]=value&q[s]=field+asc&page=1&items=25
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getList: async (resource: string, params: any) => {
    const { page, perPage } = params.pagination || {}
    const { field, order } = params.sort || {}

    const q: Record<string, unknown> = { ...fetchUtils.flattenObject(params.filter) }
    if (field) q['s'] = `${field} ${(order ?? 'ASC').toLowerCase()}`

    const query: Record<string, unknown> = {
      page,
      items: perPage,
      ...toRansackParams(q),
      _embed: params?.meta?.embed,
    }

    const url = `${apiUrl}/${resource}?${queryString.stringify(query, { arrayFormat: 'bracket', skipNull: true, skipEmptyString: true })}`

    const { headers, json } = await httpClient(url, { signal: params?.signal })

    return { data: json, total: parseTotalCount(headers) }
  },

  /**
   * GET /resource?q[id_in][]=1&q[id_in][]=2
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMany: (resource: string, params: any) => {
    const query = toRansackParams({ id_in: params.ids })
    const url = `${apiUrl}/${resource}?${queryString.stringify(query, { arrayFormat: 'bracket' })}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return httpClient(url).then(({ json }: any) => ({ data: json }))
  },

  /**
   * GET /resource?q[target_eq]=id&q[field_predicate]=value&q[s]=field+asc&page=1&items=25
   *
   * `params.target` should be the foreign-key column name (e.g. "land_id").
   * The Ransack predicate becomes `land_id_eq`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getManyReference: async (resource: string, params: any) => {
    const { page, perPage } = params.pagination
    const { field, order } = params.sort

    const q: Record<string, unknown> = {
      ...fetchUtils.flattenObject(params.filter),
      [`${params.target}_eq`]: params.id,
      s: `${field} ${order.toLowerCase()}`,
    }

    const query: Record<string, unknown> = {
      page,
      items: perPage,
      ...toRansackParams(q),
      _embed: params?.meta?.embed,
    }

    const url = `${apiUrl}/${resource}?${queryString.stringify(query, { arrayFormat: 'bracket', skipNull: true, skipEmptyString: true })}`

    const { headers, json } = await httpClient(url, { signal: params?.signal })

    return { data: json, total: parseTotalCount(headers) }
  },
})

export default capability
