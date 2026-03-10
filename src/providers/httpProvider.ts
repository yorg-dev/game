import { fetchUtils } from 'ra-core'
import { EventBus } from '@/game/EventBus'

import type { Token } from './types'

const httpProvider = (url: string, options: any = {}) => {
  if (!options.headers) {
    options.headers = new Headers({
      Accept: 'application/json',
    })
  }

  const token: Token = localStorage.getItem('token')
  if (token) {
    options.headers.set('Authorization', `Bearer ${token}`)
  }

  return fetchUtils.fetchJson(url, options).catch((error: any) => {
    if (error?.status === 403) {
      EventBus.emit('show-login', { tab: 'register' })
    }
    throw error
  })
}

export default httpProvider
