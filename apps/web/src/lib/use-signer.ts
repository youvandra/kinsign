import { API, type ConfigView } from '@kinsign/protocol'
import { createDevice, createSigner, type Signer } from '@kinsign/sdk'
import { useMemo } from 'react'
import { api } from './api'
import { loadDeviceKey, type DeviceSlot } from './device'

/** This browser's signer for a slot; undefined until the bank's config has loaded. */
export function useSigner(slot: DeviceSlot, cfg: ConfigView | undefined): Signer | undefined {
  const key = useMemo(() => loadDeviceKey(slot), [slot])
  return useMemo(() => (cfg ? createSigner(api, createDevice({ key, config: cfg, rpcUrl: `${location.origin}${API.rpc}` })) : undefined), [key, cfg])
}
