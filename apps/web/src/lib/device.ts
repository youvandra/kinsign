/**
 * This browser's device key. It comes from the link's fragment (never sent to
 * a server), else this browser's storage, else it is generated here.
 */
import { generateKey, type Hex } from '@kinsign/sdk'

export type DeviceSlot = 'customer' | 'family'

const KEY_IN_FRAGMENT = /k=(0x[0-9a-fA-F]{64})/

export function loadDeviceKey(slot: DeviceSlot): Hex {
  const storageKey = `kinsign-key-${slot}`
  const fromLink = location.hash.match(KEY_IN_FRAGMENT)?.[1] as Hex | undefined
  let key = fromLink
  try {
    if (fromLink) localStorage.setItem(storageKey, fromLink)
    else key = (localStorage.getItem(storageKey) as Hex | null) ?? undefined
  } catch {
    // storage blocked: the key lives for this page only
  }
  if (fromLink) history.replaceState(null, '', location.pathname + location.search)
  return key ?? generateKey()
}
