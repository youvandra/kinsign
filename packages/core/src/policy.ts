/**
 * The hold rule (docs/concepts/holds.md). Pure functions: given a customer and a
 * transfer request, decide whether to pay now or hold for the circle.
 */
import type { InterviewAnswers } from '@kinsign/protocol'
import type { Customer, Decision, Features, TransferRequest } from './types.ts'

export interface PolicyConfig {
  /** A transfer above this multiple of the customer's norm counts as unusual. */
  normMultiple: number
  /** Hold threshold on the score for triggered transfers. 0 holds every triggered transfer. */
  holdThreshold: number
}

/** The core configuration: hold every triggered transfer. */
export const CORE_POLICY: PolicyConfig = { normMultiple: 3, holdThreshold: 0 }

export function norm(history: readonly number[]): number {
  if (history.length === 0) return 0
  const sorted = [...history].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]!
}

export function features(customer: Customer, request: TransferRequest, flagged: ReadonlySet<string>, cfg: PolicyConfig = CORE_POLICY): Features {
  const n = norm(customer.history)
  const ratio = n > 0 ? request.amount / n : Number.POSITIVE_INFINITY
  const { channel } = request
  return {
    onChannel: channel.onCall || channel.screenCaptured || channel.remoteControlApp,
    newPayee: !customer.knownPayees.has(request.payee),
    amountRatio: ratio,
    aboveNorm: ratio > cfg.normMultiple,
    flaggedPayee: flagged.has(request.payee),
    callSeconds: channel.callSeconds,
    screenCaptured: channel.screenCaptured,
    remoteControlApp: channel.remoteControlApp,
    callerSaved: channel.callerSaved,
  }
}

/**
 * First two terms of the hold rule: a live coercion channel and a risky
 * transaction feature. A call with a saved contact still counts as a channel,
 * because a scammer can be saved under a familiar name; the score weighs it.
 */
export function triggered(f: Features): boolean {
  return f.onChannel && (f.newPayee || f.aboveNorm || f.flaggedPayee)
}

/** Hand-written bank-only score in [0, 1]. The federated model replaces it when the operator layer is on. */
export function bankScore(f: Features): number {
  let z = -3
  if (f.onChannel) z += 1.2
  if (f.newPayee) z += 1.0
  if (f.aboveNorm) z += 0.8 + Math.min(Math.log10(Math.max(f.amountRatio, 1)), 2) * 0.6
  if (f.flaggedPayee) z += 2.5
  if (f.screenCaptured) z += 1.0
  if (f.remoteControlApp) z += 1.5
  if (!f.callerSaved && f.onChannel) z += 0.6
  z += Math.min(f.callSeconds / 600, 2) * 0.5
  return 1 / (1 + Math.exp(-z))
}

const INTERVIEW_WEIGHTS: Record<keyof InterviewAnswers, { add: number; reason: string }> = {
  askedBySomeoneOnCall: { add: 0.15, reason: 'someone on the call asked for this payment' },
  toldToKeepSecret: { add: 0.25, reason: 'told to keep it secret' },
  promisedReturnOrThreatened: { add: 0.2, reason: 'promised money or threatened' },
}

/** I3: the in-call interview can only add risk. A "no" changes nothing. */
export function interviewBoost(answers: InterviewAnswers | undefined): { add: number; reasons: string[] } {
  const out = { add: 0, reasons: [] as string[] }
  if (!answers) return out
  for (const key of Object.keys(INTERVIEW_WEIGHTS) as (keyof InterviewAnswers)[]) {
    if (answers[key] === true) {
      out.add += INTERVIEW_WEIGHTS[key].add
      out.reasons.push(INTERVIEW_WEIGHTS[key].reason)
    }
  }
  return out
}

function explain(f: Features, onCall: boolean): string[] {
  const reasons: string[] = []
  if (onCall) reasons.push(`on a call for ${Math.round(f.callSeconds / 60)} min`)
  if (f.screenCaptured) reasons.push('screen is being shared')
  if (f.remoteControlApp) reasons.push('remote-control app active')
  if (f.newPayee) reasons.push('new payee')
  if (f.aboveNorm) reasons.push(`amount ${f.amountRatio.toFixed(1)}x the usual`)
  if (f.flaggedPayee) reasons.push('payee account flagged')
  return reasons
}

export const DURESS_REASON = 'duress PIN entered'

export function decide(
  customer: Customer,
  request: TransferRequest,
  flagged: ReadonlySet<string> = new Set(),
  cfg: PolicyConfig = CORE_POLICY,
  score: (f: Features) => number = bankScore,
): Decision {
  const f = features(customer, request, flagged, cfg)
  const boost = interviewBoost(request.interview)
  const s = Math.min(1, score(f) + boost.add)

  if (request.duress) return { action: 'hold', triggered: true, score: 1, reasons: [...boost.reasons, DURESS_REASON], features: f }
  if (!triggered(f)) return { action: 'pay', triggered: false, score: s, reasons: boost.reasons, features: f }

  const reasons = [...boost.reasons, ...explain(f, request.channel.onCall)]
  return { action: s >= cfg.holdThreshold ? 'hold' : 'pay', triggered: true, score: s, reasons, features: f }
}
