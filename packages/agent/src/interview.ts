/**
 * Reads the customer's own words during a hold into interview answers. Only
 * "yes" survives: whatever the text or the model says, a reading can add
 * risk and never remove it (invariant I3).
 */
import type { InterviewAnswers } from '@kinsign/protocol'
import { textOf, type ModelPort } from './model.ts'
import { readPressure } from './offline.ts'
import { INTERVIEW_SYSTEM } from './prompts.ts'

const KEYS = ['askedBySomeoneOnCall', 'toldToKeepSecret', 'promisedReturnOrThreatened'] as const satisfies readonly (keyof InterviewAnswers)[]

export const INTERVIEW_SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(KEYS.map((k) => [k, { type: 'boolean' }])),
  required: [...KEYS],
  additionalProperties: false,
}

/** Keeps the keys that are exactly `true`. */
export function yesOnly(raw: unknown): InterviewAnswers {
  const out: InterviewAnswers = {}
  if (typeof raw !== 'object' || raw === null) return out
  for (const k of KEYS) if ((raw as Record<string, unknown>)[k] === true) out[k] = true
  return out
}

export async function readInterview(text: string, model: ModelPort | null): Promise<InterviewAnswers> {
  const words = text.trim().slice(0, 2000)
  if (!words) return {}
  // The offline reading always counts too: a model can add answers, never hide one the rules found.
  const rules = readPressure(words)
  if (!model) return rules
  const res = await model.create({ system: INTERVIEW_SYSTEM, messages: [{ role: 'user', content: words }], schema: INTERVIEW_SCHEMA, maxTokens: 1000 })
  if (res.stop_reason !== 'end_turn') return rules
  let parsed: unknown
  try {
    parsed = JSON.parse(textOf(res))
  } catch {
    return rules
  }
  return { ...yesOnly(parsed), ...rules }
}
