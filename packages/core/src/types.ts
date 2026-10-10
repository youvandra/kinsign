import type { ChannelState, Hex, InterviewAnswers, HoldState, TxResult } from '@kinsign/protocol'

export interface TransferRequest {
  id: string
  customer: string
  payee: string
  /** Yuan. The benchmark has no need for minor units. */
  amount: number
  channel: ChannelState
  /** Set when the customer typed the duress PIN instead of the real one. */
  duress?: boolean
  /** On-screen answers during a call; they can only raise risk (I3). */
  interview?: InterviewAnswers
  /** Set by the bank: what she already paid during this call or its after-call window. */
  paidOnChannel?: number
}

export interface Features {
  onChannel: boolean
  /** No call is live, but a long call from an unsaved number ended moments ago. */
  afterCall: boolean
  newPayee: boolean
  /** Amount divided by the customer's recent median. */
  amountRatio: number
  aboveNorm: boolean
  /** Paid on this channel so far plus this transfer, over the customer's norm. */
  channelRatio: number
  /** The channel's running total passed its cap: many small payments add up. */
  overChannelCap: boolean
  flaggedPayee: boolean
  callSeconds: number
  screenCaptured: boolean
  remoteControlApp: boolean
  callerSaved: boolean
}

export type Action = 'pay' | 'hold'

export interface Decision {
  action: Action
  triggered: boolean
  score: number
  reasons: string[]
  features: Features
}

export interface Customer {
  id: string
  /** Device-key address that signs the customer's own on-chain actions. */
  address: Hex
  balance: number
  knownPayees: Set<string>
  /** Recent outgoing amounts, used for the norm. */
  history: number[]
}

/** What the engine reads back from the release contract about one hold. */
export interface HoldOnChain {
  holder: Hex
  openedAt: bigint
  state: HoldState
  decidedBy: Hex
  transferDigest: Hex
  chain: Hex
}

/**
 * The engine's view of the shared release record. `packages/chain` implements
 * it against the contract; tests can implement it in memory. The domain never
 * depends on a chain client.
 */
export interface ReleaseLedgerPort {
  send(key: Hex, functionName: string, args: readonly unknown[]): Promise<TxResult>
  hold(holdId: Hex): Promise<HoldOnChain>
}
