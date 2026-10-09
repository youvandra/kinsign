/**
 * The wire contract between the bank API (apps/api) and its clients
 * (apps/web, bench). Types only, plus the few constants both sides must agree
 * on. Nothing here may import a runtime dependency.
 */

export type Hex = `0x${string}`

/** On-chain hold states, in the order of the contract's `State` enum. */
export const HOLD_STATES = ['None', 'Held', 'Released', 'Blocked', 'Cancelled', 'Review'] as const
export type HoldState = (typeof HOLD_STATES)[number]

/** States in which the money is still reserved and a decision is pending. */
export const LIVE_STATES: readonly HoldState[] = ['Held', 'Review']
export const isLiveState = (s: HoldState) => LIVE_STATES.includes(s)

/** What the phone reports at the moment a transfer is requested. */
export interface ChannelState {
  onCall: boolean
  callSeconds: number
  /** The phone cannot see the caller's number; this is the contact-list match only. */
  callerSaved: boolean
  screenCaptured: boolean
  remoteControlApp: boolean
}

/** On-screen answers during a call. They can only raise risk (invariant I3). */
export interface InterviewAnswers {
  askedBySomeoneOnCall?: boolean
  toldToKeepSecret?: boolean
  promisedReturnOrThreatened?: boolean
}

export interface RecordView {
  kind: string
  body: unknown
  hash: Hex
}

export interface HoldView {
  holdId: Hex
  at: number
  payee: string
  amount: number
  channel: ChannelState
  score: number
  reasons: string[]
  features: { newPayee: boolean; amountRatio: number; aboveNorm: boolean }
  state: HoldState
  decidedBy: Hex | null
  transferDigest: Hex
  chainHash: Hex
  chainMatches: boolean
  records: RecordView[]
  refused: { kind: string; error: string; body: unknown }[]
}

export interface ConfigView {
  chainId: number
  contract: Hex
  abi: readonly unknown[]
  canWarp: boolean
  network: string
  holder: Hex
  members: Hex[]
}

export interface AccountView {
  balance: number
  knownPayees: string[]
  reserved: number
  paid: { at: number; payee: string; amount: number; id: string }[]
}

export type ProposalStatus = 'pending' | 'vetoed' | 'effective'

export interface ProposalView {
  member: Hex
  effectiveAt: number
  removedAt: number
  status: ProposalStatus
  /** Demo label for a known address, e.g. the caller's "colleague". */
  label: 'callerColleague' | 'newPerson'
}

export interface ProposalsView {
  now: number
  proposals: ProposalView[]
}

export interface DemoLinks {
  customer: string
  family: string
  colleague: Hex
}

export interface TransferBody {
  payee: string
  amount: number
  channel: ChannelState
  interview?: InterviewAnswers
  duress?: boolean
}

export interface TransferResult {
  action: 'pay' | 'hold'
  holdId: Hex | null
  reasons: string[]
  score: number
}

export interface TxResult {
  ok: boolean
  /** Custom error name when the contract refused the call. */
  error?: string
  hash?: Hex
}

export type Lang = 'en' | 'zh' | 'id'

/** A transfer the assistant prepared. It moves no money until the customer confirms it on screen. */
export interface TransferDraft {
  id: string
  payee: string
  amount: number
  note: string
  state: 'pending' | 'sent' | 'dismissed'
}

export interface ChatLine {
  role: 'customer' | 'assistant'
  text: string
}

export interface AssistantView {
  conversationId: string
  /** Who answers: Claude through the API, or the offline rules when no model is configured. */
  mode: 'claude' | 'offline'
  transcript: ChatLine[]
  drafts: TransferDraft[]
}

export interface ChatBody {
  conversationId?: string
  text: string
}

export interface ConfirmDraftBody {
  conversationId: string
  draftId: string
  channel: ChannelState
  duress?: boolean
}

/** What the customer said in her own words during a hold, and the answers taken from it. */
export interface InterviewTextBody {
  holdId: Hex
  text: string
}

export interface InterviewReading {
  answers: InterviewAnswers
  /** Whether anything was attested: a reading with no "yes" changes nothing (I3). */
  attested: boolean
}

export interface HoldSummary {
  holdId: Hex
  lang: Lang
  mode: 'claude' | 'offline'
  text: string
}

/** Every API path in one place, so a typo is a type error on both sides. */
export const API = {
  config: '/api/config',
  account: '/api/account',
  holds: '/api/holds',
  proposals: '/api/proposals',
  transfer: '/api/transfer',
  record: '/api/record',
  sync: '/api/holds/sync',
  interview: '/api/interview',
  links: '/api/demo/links',
  escalate: '/api/demo/escalate',
  review: '/api/demo/review',
  warp: '/api/demo/warp',
  assistant: '/api/assistant',
  assistantChat: '/api/assistant/chat',
  assistantConfirm: '/api/assistant/confirm',
  assistantDismiss: '/api/assistant/dismiss',
  interviewText: '/api/interview/text',
  familySummary: '/api/holds/summary',
  rpc: '/rpc',
} as const
