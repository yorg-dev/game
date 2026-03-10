import queryString from 'query-string'
import * as fetchUtils from '../fetchUtils'

const capability = (apiUrl: string, httpClient = fetchUtils.fetchJson) => ({
  /*
   * Overload of getList for stringify arrayFormat
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getList: async (resource: string, params: any) => {
    const { page, perPage } = params.pagination || {}
    const { field, order } = params.sort || {}
    const query = {
      ...fetchUtils.flattenObject(params.filter),
      _sort: field,
      _order: order,
      _start: page != null && perPage != null ? (page - 1) * perPage : undefined,
      _end: page != null && perPage != null ? page * perPage : undefined,
      _embed: params?.meta?.embed,
    }
    const url = `${apiUrl}/${resource}?${queryString.stringify(query, { arrayFormat: 'bracket' })}` /// Uses arrayFormat here

    const { headers, json } = await httpClient(url, {
      signal: params?.signal,
    })

    if (!headers.has('x-total-count')) {
      throw new Error(
        'The X-Total-Count header is missing in the HTTP Response. The jsonServer Data Provider expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare X-Total-Count in the Access-Control-Expose-Headers header?',
      )
    }

    const totalString = headers.get('x-total-count')!.split('/').pop()

    if (totalString == null) {
      throw new Error('The X-Total-Count header is invalid in the HTTP Response.')
    }

    return { data: json, total: parseInt(totalString, 10) }
  },

  /*
   * Overload of ra-data-json-server.getMany so that ids are passed as array
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMany: (resource: string, params: any) => {
    const query = {
      [`id_like`]: params.ids.join('|'),
    }

    const url = `${apiUrl}/${resource}?${queryString.stringify(query)}`

    return (
      httpClient(url)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ json }: any) => ({ data: json }))
    )
  },

  /*
   * Overload of ra-data-json-server.getManyReference
   * Needs to adjust stringify so that it converts arrays into right format
   *
   * <SelectArrayInput choices={[{ id: 1, name: "First" }, { id: 2, name: "Second" }]} />
   *
   *  stringify(query, { arrayFormat: 'bracket' })
   *
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getManyReference: async (resource: string, params: any) => {
    const { page, perPage } = params.pagination
    const { field, order } = params.sort
    const query = {
      ...fetchUtils.flattenObject(params.filter),
      [params.target]: params.id,
      _sort: field,
      _order: order,
      _start: (page - 1) * perPage,
      _end: page * perPage,
      _embed: params?.meta?.embed,
    }
    const url = `${apiUrl}/${resource}?${queryString.stringify(query, { arrayFormat: 'bracket' })}` /// NOTE: This allows stringify to pass an array in URL

    const { headers, json } = await httpClient(url, {
      signal: params?.signal,
    })

    if (!headers.has('x-total-count')) {
      throw new Error(
        'The X-Total-Count header is missing in the HTTP Response. The jsonServer Data Provider expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare X-Total-Count in the Access-Control-Expose-Headers header?',
      )
    }

    const totalString = headers.get('x-total-count')!.split('/').pop()

    if (totalString == null) {
      throw new Error('The X-Total-Count header is invalid in the HTTP Response.')
    }

    return { data: json, total: parseInt(totalString, 10) }
  },
})

export default capability
