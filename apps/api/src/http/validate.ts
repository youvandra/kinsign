import type { ChannelState, Hex, InterviewAnswers } from '@kinsign/protocol'
import { HttpError } from './router.ts'

type Obj = Record<string, unknown>

export function object(value: unknown, what = 'body'): Obj {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new HttpError(400, `${what} must be an object`)
  return value as Obj
}

export function string(o: Obj, key: string, maxLength = 200): string {
  const v = o[key]
  if (typeof v !== 'string' || v.trim() === '') throw new HttpError(400, `${key} must be a non-empty string`)
  return v.trim().slice(0, maxLength)
}

export function number(o: Obj, key: string, { min = -Infinity, max = Infinity } = {}): number {
  const v = Number(o[key])
  if (!Number.isFinite(v) || v < min || v > max) throw new HttpError(400, `${key} must be a number between ${min} and ${max}`)
  return v
}

export function boolean(o: Obj, key: string): boolean {
  return o[key] === true
}

export function hex32(o: Obj, key: string): Hex {
  const v = o[key]
  if (typeof v !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(v)) throw new HttpError(400, `${key} must be a 32-byte hex string`)
  return v as Hex
}

export function address(o: Obj, key: string): Hex {
  const v = o[key]
  if (typeof v !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(v)) throw new HttpError(400, `${key} must be an address`)
  return v as Hex
}

export function channel(value: unknown): ChannelState {
  const c = object(value, 'channel')
  const onCall = boolean(c, 'onCall')
  return {
    onCall,
    callSeconds: onCall ? number(c, 'callSeconds', { min: 0, max: 86_400 }) : 0,
    callerSaved: onCall && boolean(c, 'callerSaved'),
    screenCaptured: boolean(c, 'screenCaptured'),
    remoteControlApp: boolean(c, 'remoteControlApp'),
  }
}

/** Keeps only "yes" answers: the interview can raise risk and never lower it (I3). */
export function interviewYeses(value: unknown): InterviewAnswers {
  if (value === undefined || value === null) return {}
  const a = object(value, 'answers')
  const out: InterviewAnswers = {}
  for (const key of ['askedBySomeoneOnCall', 'toldToKeepSecret', 'promisedReturnOrThreatened'] as const) if (a[key] === true) out[key] = true
  return out
}
