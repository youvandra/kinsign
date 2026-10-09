import type { ChannelState, Hex, InterviewAnswers, TransferResult, Txn } from '@kinsign/protocol'
import { categorize, type Budgets } from '@kinsign/finance'
import { Engine, MockLedger, type Decision } from '@kinsign/core'
import { fundOnFisco, ReleaseClient, type Network } from '@kinsign/chain'
import { config } from './config.ts'
import { addressOf, DEMO_CUSTOMER_ID, DEMO_KEYS, demoCustomer, demoStatement } from './demo.ts'

/** What the bank remembers about a held transfer, beside what the contract holds. */
export interface HoldMeta {
  at: number
  payee: string
  amount: number
  channel: ChannelState
  decision: Decision
}

export interface PaidTransfer {
  at: number
  payee: string
  amount: number
  id: string
}

/**
 * The bank behind the API: one demo customer, the engine, and the release
 * contract it reads. Holds only the operator and review-desk keys.
 */
export class Bank {
  readonly ledger = new MockLedger()
  readonly engine: Engine
  readonly holds = new Map<Hex, HoldMeta>()
  readonly paid: PaidTransfer[] = []
  /** Budgets the customer set herself. The assistant can suggest one, never set it. */
  readonly budgets: Budgets = { dining: 400 }
  private readonly opened = Date.now()
  private seq = 0

  private constructor(readonly chain: ReleaseClient) {
    this.ledger.add(demoCustomer())
    this.engine = new Engine(this.ledger, chain, DEMO_KEYS.operator)
  }

  /** Deploys the release contract and enrols the demo customer with her son. */
  static async open(network: Network): Promise<Bank> {
    const chain = new ReleaseClient(network)
    const everyone = Object.values(DEMO_KEYS).map(addressOf)
    if (network.canWarp) for (const a of everyone) await chain.fund(a)
    else await fundOnFisco(chain.pub, everyone)

    await chain.deploy(DEMO_KEYS.operator, addressOf(DEMO_KEYS.reviewer), config.responseWindowSeconds)
    const enrolled = await chain.send(DEMO_KEYS.operator, 'enroll', [addressOf(DEMO_KEYS.mum), [addressOf(DEMO_KEYS.son)]])
    if (!enrolled.ok) throw new Error(`enroll failed: ${enrolled.error}`)
    return new Bank(chain)
  }

  get holder(): Hex {
    return this.ledger.get(DEMO_CUSTOMER_ID).address
  }

  async transfer(payee: string, amount: number, channel: ChannelState, interview: InterviewAnswers, duress: boolean): Promise<TransferResult> {
    const id = `t${Date.now()}-${++this.seq}`
    const outcome = await this.engine.request({ id, customer: DEMO_CUSTOMER_ID, payee, amount, channel, interview, duress })
    const { decision } = outcome
    if (outcome.holdId) this.holds.set(outcome.holdId, { at: Date.now(), payee, amount, channel, decision })
    else this.paid.push({ at: Date.now(), payee, amount, id })
    return { action: decision.action, holdId: outcome.holdId ?? null, reasons: decision.reasons, score: decision.score }
  }

  /** Her statement: the seeded history, then every payment that left the ledger since the API started. */
  statement(): Txn[] {
    const seeded = demoStatement(this.opened)
    const live: Txn[] = this.ledger.audit
      .filter((e) => e.customer === DEMO_CUSTOMER_ID && (e.kind === 'paid' || e.kind === 'settled'))
      .map((e) => ({ id: e.ref, at: e.at, payee: e.payee, amount: e.amount, direction: 'out', category: categorize(e.payee) }))
    return [...seeded, ...live]
  }

  requireHold(holdId: Hex): HoldMeta {
    const meta = this.holds.get(holdId)
    if (!meta) throw new Error(`unknown hold ${holdId}`)
    return meta
  }
}
