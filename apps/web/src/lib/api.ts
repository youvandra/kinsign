/** The bank API, same origin: Vite proxies it in development, the API serves this app in production. */
import { createClient, isLiveState } from '@kinsign/sdk'
import type { HoldView } from '@kinsign/protocol'

export const api = createClient()

export const isLive = (h: Pick<HoldView, 'state'>) => isLiveState(h.state)
