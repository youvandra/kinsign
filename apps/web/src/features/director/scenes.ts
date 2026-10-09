import { NO_CALL, type CallState } from '@/lib/scene'

export type SceneKey = 'bill' | 'police' | 'kid' | 'landlord'

export interface Scene {
  key: SceneKey
  scam: boolean
  payee: string
  amount: number
  call: CallState
}

/** The four scenes the director can set. Titles live in the locales under `scenes`. */
export const SCENES: readonly Scene[] = [
  { key: 'bill', scam: false, payee: 'State Grid electricity', amount: 260, call: { ...NO_CALL, onCall: true, minutes: 12, callerSaved: true } },
  { key: 'police', scam: true, payee: 'Public Security Safe Account', amount: 50_000, call: { ...NO_CALL, onCall: true, minutes: 40 } },
  { key: 'kid', scam: true, payee: 'Renji Hospital deposit', amount: 20_000, call: { ...NO_CALL, onCall: true, minutes: 8 } },
  { key: 'landlord', scam: false, payee: 'Landlord Zhang', amount: 6_000, call: { ...NO_CALL, onCall: true, minutes: 6 } },
]
