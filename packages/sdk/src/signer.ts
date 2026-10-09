/**
 * Decisions on a hold, signed on the device. Each one follows the same
 * three steps: the bank issues a salted record, the device puts the record's
 * hash in its own transaction, and the bank files the record by the receipt.
 * The contract, not the bank, decides whether the device may act.
 */
import type { Hex, HoldState, HoldView, TxResult } from '@kinsign/protocol'
import type { KinsignClient, RecordKind } from './client.ts'
import type { Device } from './device.ts'

export type HoldRef = Pick<HoldView, 'holdId' | 'transferDigest'>

export interface DecisionResult extends TxResult {
  hash: Hex
  /** The hold's state after the bank synced it with the contract. */
  state: HoldState
}

export function createSigner(client: KinsignClient, device: Device) {
  async function decide(holdId: Hex, kind: RecordKind, fn: string, args: (recordHash: Hex) => readonly unknown[]): Promise<DecisionResult> {
    const { recordHash } = await client.issueRecord(holdId, kind, device.address)
    const result = await device.send(fn, args(recordHash))
    const { state } = await client.sync(holdId, recordHash, result.hash)
    return { ...result, state }
  }

  return {
    address: device.address,
    /** A circle member releases the money to the payee. The account holder is refused (`NotMember`). */
    release: (hold: HoldRef) => decide(hold.holdId, 'release', 'release', (rec) => [hold.holdId, hold.transferDigest, rec]),
    /** A circle member blocks the transfer; the money returns to the account. */
    block: (hold: HoldRef) => decide(hold.holdId, 'block', 'blockHold', (rec) => [hold.holdId, rec]),
    /** The account holder withdraws the transfer. */
    cancel: (hold: HoldRef) => decide(hold.holdId, 'cancel', 'cancel', (rec) => [hold.holdId, rec]),
    /** The holder proposes a new member; it becomes effective after the 72-hour timelock. */
    proposeMember: (member: Hex) => device.send('proposeMember', [member]),
    /** An effective member vetoes a pending proposal. */
    vetoMember: (holder: Hex, member: Hex) => device.send('vetoMember', [holder, member]),
  }
}

export type Signer = ReturnType<typeof createSigner>
