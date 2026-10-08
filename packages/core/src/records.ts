import { randomBytes } from 'node:crypto'
import type { Hex } from '@kinsign/protocol'
import { concat, keccak256, toBytes, toHex } from 'viem'

export interface DecisionRecord {
  kind: string
  holdId: Hex
  body: unknown
  salt: Hex
  hash: Hex
}

export interface RefusedRecord extends DecisionRecord {
  error: string
}

const ZERO: Hex = `0x${'00'.repeat(32)}`

/** keccak256(salt ‖ json). The salt stops anyone brute-forcing low-entropy fields such as an amount. */
export function recordHash(salt: Hex, json: string): Hex {
  return keccak256(concat([salt, toHex(toBytes(json))]))
}

/** Same fold as the contract: chain = keccak256(abi.encode(chain, recordHash)). */
export function extendChain(chain: Hex, hash: Hex): Hex {
  return keccak256(concat([chain, hash]))
}

/**
 * Off-chain decision records. Only the salted hash goes on chain; the record
 * and its salt stay with the bank and are disclosed for a dispute.
 */
export class RecordStore {
  readonly records: DecisionRecord[] = []
  /** Attempts the contract refused. Kept for the audit, never part of the chain. */
  readonly refused: RefusedRecord[] = []

  constructor(private readonly newSalt: () => Hex = () => toHex(randomBytes(32))) {}

  make(kind: string, holdId: Hex, body: unknown): DecisionRecord {
    const salt = this.newSalt()
    return { kind, holdId, body, salt, hash: recordHash(salt, JSON.stringify({ kind, holdId, body })) }
  }

  /** Files the record once the contract accepted it, or as a refusal if it did not. */
  file(record: DecisionRecord, ok: boolean, error = 'reverted'): void {
    if (ok) this.records.push(record)
    else this.refused.push({ ...record, error })
  }

  forHold(holdId: Hex): DecisionRecord[] {
    return this.records.filter((r) => r.holdId === holdId)
  }

  refusedForHold(holdId: Hex): RefusedRecord[] {
    return this.refused.filter((r) => r.holdId === holdId)
  }

  /** Recomputes the on-chain hash chain for a hold from the disclosed records. */
  chainFor(holdId: Hex): Hex {
    return this.forHold(holdId).reduce((chain, r) => extendChain(chain, r.hash), ZERO)
  }
}
