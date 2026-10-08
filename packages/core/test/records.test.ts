import type { Hex } from '@kinsign/protocol'
import { encodeAbiParameters, keccak256 } from 'viem'
import { describe, expect, it } from 'vitest'
import { extendChain, RecordStore } from '../src/index.ts'

const HOLD: Hex = `0x${'11'.repeat(32)}`

describe('records', () => {
  it('folds the chain the way the contract does: keccak256(abi.encode(chain, recordHash))', () => {
    const chain: Hex = `0x${'00'.repeat(32)}`
    const hash: Hex = `0x${'ab'.repeat(32)}`
    const solidity = keccak256(encodeAbiParameters([{ type: 'bytes32' }, { type: 'bytes32' }], [chain, hash]))
    expect(extendChain(chain, hash)).toBe(solidity)
  })

  it('salts every record, so equal bodies hash differently', () => {
    const store = new RecordStore()
    expect(store.make('block', HOLD, { by: 'son' }).hash).not.toBe(store.make('block', HOLD, { by: 'son' }).hash)
  })

  it('keeps refused attempts out of the chain', () => {
    const store = new RecordStore()
    const accepted = store.make('hold', HOLD, {})
    store.file(accepted, true)
    const before = store.chainFor(HOLD)
    store.file(store.make('release', HOLD, { by: 'mum' }), false, 'NotMember')
    expect(store.chainFor(HOLD)).toBe(before)
    expect(store.refusedForHold(HOLD)).toHaveLength(1)
    expect(store.refusedForHold(HOLD)[0]!.error).toBe('NotMember')
  })
})
