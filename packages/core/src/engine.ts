import type { Hex, HoldState, TxResult } from '@kinsign/protocol'
import { encodeAbiParameters, keccak256, toHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import type { MockLedger } from './ledger.ts'
import { CORE_POLICY, decide, type PolicyConfig } from './policy.ts'
import { RecordStore, type DecisionRecord } from './records.ts'
import type { Decision, ReleaseLedgerPort, TransferRequest } from './types.ts'

export const holdIdOf = (transferId: string): Hex => keccak256(toHex(`kinsign-hold:${transferId}`))

/** Binds a release to this payee, amount and transfer, so it cannot be replayed onto another. */
export const digestOf = (t: Pick<TransferRequest, 'id' | 'payee' | 'amount'>): Hex =>
  keccak256(encodeAbiParameters([{ type: 'string' }, { type: 'string' }, { type: 'uint256' }], [t.id, t.payee, BigInt(Math.round(t.amount * 100))]))

export interface Outcome {
  transferId: string
  decision: Decision
  holdId?: Hex
}

export interface EngineOptions {
  flagged?: ReadonlySet<string>
  policy?: PolicyConfig
}

/**
 * The bank side. The policy decides pay or hold; a hold reserves the money in
 * the ledger and opens on the release contract. The bank settles or refunds
 * only by reading the contract, so a release is never the bank's own call.
 */
export class Engine {
  readonly records = new RecordStore()
  private readonly transfers = new Map<Hex, TransferRequest>()
  /** Records handed to a device for its own transaction, filed once its receipt is seen. */
  private readonly issued = new Map<Hex, DecisionRecord>()
  private readonly flagged: ReadonlySet<string>
  private readonly policy: PolicyConfig

  constructor(
    readonly ledger: MockLedger,
    private readonly release: ReleaseLedgerPort,
    private readonly operatorKey: Hex,
    options: EngineOptions = {},
  ) {
    this.flagged = options.flagged ?? new Set()
    this.policy = options.policy ?? CORE_POLICY
  }

  transfer(holdId: Hex): TransferRequest | undefined {
    return this.transfers.get(holdId)
  }

  async request(t: TransferRequest): Promise<Outcome> {
    const customer = this.ledger.get(t.customer)
    const decision = decide(customer, t, this.flagged, this.policy)
    if (decision.action === 'pay') {
      this.ledger.pay(t.customer, t.payee, t.amount, t.id)
      return { transferId: t.id, decision }
    }
    const holdId = holdIdOf(t.id)
    this.ledger.reserve(holdId, t.customer, t.payee, t.amount)
    this.transfers.set(holdId, t)
    const body = { transfer: { ...t, interview: t.interview ?? null }, score: decision.score, reasons: decision.reasons }
    const r = await this.recorded('hold', holdId, body, this.operatorKey, 'openHold', (h) => [holdId, customer.address, digestOf(t), h])
    if (!r.ok) throw new Error(`openHold failed: ${r.error}`)
    return { transferId: t.id, decision, holdId }
  }

  /** Interview, explanation or debrief added to a live hold's record chain. */
  attest(holdId: Hex, kind: string, body: unknown): Promise<TxResult> {
    return this.recorded(kind, holdId, body, this.operatorKey, 'attest', (h) => [holdId, h])
  }

  escalate(holdId: Hex): Promise<TxResult> {
    return this.recorded('escalate', holdId, { reason: 'no circle decision within the response window' }, this.operatorKey, 'escalate', (h) => [holdId, h])
  }

  review(holdId: Hex, reviewerKey: Hex, approve: boolean, note: string): Promise<TxResult> {
    const t = this.requireTransfer(holdId)
    return this.recorded('review', holdId, { approve, note }, reviewerKey, 'reviewDecide', (h) => [holdId, approve, digestOf(t), h])
  }

  // Device actions signed with a key the caller holds. The API never holds these
  // keys: devices sign in their browsers. The benchmark uses them to play devices.

  releaseAs(holdId: Hex, signerKey: Hex): Promise<TxResult> {
    const t = this.requireTransfer(holdId)
    return this.recorded('release', holdId, { by: privateKeyToAccount(signerKey).address }, signerKey, 'release', (h) => [holdId, digestOf(t), h])
  }

  blockAs(holdId: Hex, signerKey: Hex): Promise<TxResult> {
    return this.recorded('block', holdId, { by: privateKeyToAccount(signerKey).address }, signerKey, 'blockHold', (h) => [holdId, h])
  }

  cancelAs(holdId: Hex, holderKey: Hex): Promise<TxResult> {
    return this.recorded('cancel', holdId, {}, holderKey, 'cancel', (h) => [holdId, h])
  }

  // Device actions signed in a browser: the bank issues the salted record, the
  // device puts its hash in its own transaction, the bank files it by receipt.

  issueRecord(holdId: Hex, kind: string, body: unknown): DecisionRecord {
    const record = this.records.make(kind, holdId, body)
    this.issued.set(record.hash, record)
    return record
  }

  fileIssuedRecord(hash: Hex, landed: boolean): void {
    const record = this.issued.get(hash)
    if (!record) return
    this.issued.delete(hash)
    this.records.file(record, landed, 'reverted on chain')
  }

  /** Reads the contract and moves the money accordingly. Returns the state seen. */
  async sync(holdId: Hex): Promise<HoldState> {
    const hold = await this.release.hold(holdId)
    if (this.ledger.isReserved(holdId)) {
      if (hold.state === 'Released') this.ledger.settle(holdId)
      else if (hold.state === 'Blocked' || hold.state === 'Cancelled') this.ledger.refund(holdId)
    }
    return hold.state
  }

  private requireTransfer(holdId: Hex): TransferRequest {
    const t = this.transfers.get(holdId)
    if (!t) throw new Error(`unknown hold ${holdId}`)
    return t
  }

  private async recorded(kind: string, holdId: Hex, body: unknown, key: Hex, fn: string, args: (hash: Hex) => unknown[]): Promise<TxResult> {
    const record = this.records.make(kind, holdId, body)
    const result = await this.release.send(key, fn, args(record.hash))
    this.records.file(record, result.ok, result.error)
    return result
  }
}
