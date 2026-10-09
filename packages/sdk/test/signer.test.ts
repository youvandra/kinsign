import type { Hex } from '@kinsign/protocol'
import { describe, expect, it } from 'vitest'
import type { KinsignClient } from '../src/client.ts'
import type { Device } from '../src/device.ts'
import { createSigner } from '../src/signer.ts'

const HOLD = { holdId: '0xh' as Hex, transferDigest: '0xd' as Hex }

function setup() {
  const steps: string[] = []
  const client = {
    issueRecord: async (holdId: Hex, kind: string, by: Hex) => {
      steps.push(`issue ${holdId} ${kind} ${by}`)
      return { recordHash: '0xr' as Hex }
    },
    sync: async (holdId: Hex, recordHash?: Hex, txHash?: Hex) => {
      steps.push(`sync ${holdId} ${recordHash} ${txHash}`)
      return { state: 'Released' as const }
    },
  } as unknown as KinsignClient
  const device: Device = {
    address: '0xme',
    send: async (fn, args) => {
      steps.push(`send ${fn} ${args.join(',')}`)
      return { ok: true, hash: '0xtx' }
    },
  }
  return { steps, signer: createSigner(client, device) }
}

describe('createSigner', () => {
  it('issues a record, signs its hash on the device, then syncs by the receipt', async () => {
    const { steps, signer } = setup()
    const result = await signer.release(HOLD)
    expect(steps).toEqual(['issue 0xh release 0xme', 'send release 0xh,0xd,0xr', 'sync 0xh 0xr 0xtx'])
    expect(result).toMatchObject({ ok: true, hash: '0xtx', state: 'Released' })
  })

  it('maps block and cancel to their contract functions', async () => {
    const { steps, signer } = setup()
    await signer.block(HOLD)
    await signer.cancel(HOLD)
    expect(steps.filter((s) => s.startsWith('send'))).toEqual(['send blockHold 0xh,0xr', 'send cancel 0xh,0xr'])
  })
})
