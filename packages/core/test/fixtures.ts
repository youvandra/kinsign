import type { ChannelState, Hex, TxResult } from '@kinsign/protocol'
import type { Customer, HoldOnChain, ReleaseLedgerPort, TransferRequest } from '../src/index.ts'

export const NO_CALL: ChannelState = { onCall: false, callSeconds: 0, callerSaved: false, screenCaptured: false, remoteControlApp: false }
export const callFor = (minutes: number, extra: Partial<ChannelState> = {}): ChannelState => ({ ...NO_CALL, onCall: true, callSeconds: minutes * 60, ...extra })

export function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'mum',
    address: '0x00000000000000000000000000000000000000aa',
    balance: 100_000,
    knownPayees: new Set(['electric']),
    history: [800, 1_000, 1_200],
    ...overrides,
  }
}

export const request = (overrides: Partial<TransferRequest> = {}): TransferRequest => ({
  id: 't1',
  customer: 'mum',
  payee: 'electric',
  amount: 300,
  channel: NO_CALL,
  ...overrides,
})

/**
 * In-memory stand-in for the release contract: records calls, keeps one state
 * per hold, and lets a test decide what the next call returns.
 */
export class FakeReleaseLedger implements ReleaseLedgerPort {
  readonly calls: { key: Hex; fn: string; args: readonly unknown[] }[] = []
  readonly states = new Map<Hex, HoldOnChain['state']>()
  nextResult: TxResult = { ok: true }

  async send(key: Hex, fn: string, args: readonly unknown[]): Promise<TxResult> {
    this.calls.push({ key, fn, args })
    const result = this.nextResult
    this.nextResult = { ok: true }
    if (result.ok && fn === 'openHold') this.states.set(args[0] as Hex, 'Held')
    return result
  }

  async hold(holdId: Hex): Promise<HoldOnChain> {
    const zero = '0x' as Hex
    return { holder: zero, openedAt: 0n, state: this.states.get(holdId) ?? 'None', decidedBy: zero, transferDigest: zero, chain: zero }
  }
}
