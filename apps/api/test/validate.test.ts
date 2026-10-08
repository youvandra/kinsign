import { describe, expect, it } from 'vitest'
import { HttpError } from '../src/http/router.ts'
import { channel, hex32, interviewYeses, number, object, string } from '../src/http/validate.ts'

describe('request validation', () => {
  it('rejects non-objects and bad fields with a 400', () => {
    expect(() => object([])).toThrow(HttpError)
    expect(() => string({ payee: '  ' }, 'payee')).toThrow(/non-empty/)
    expect(() => number({ amount: 'x' }, 'amount', { min: 1 })).toThrow(/number/)
    expect(() => hex32({ holdId: '0x12' }, 'holdId')).toThrow(/32-byte/)
  })

  it('caps string length', () => {
    expect(string({ payee: 'a'.repeat(500) }, 'payee', 80)).toHaveLength(80)
  })

  it('ignores call details when there is no call', () => {
    expect(channel({ onCall: false, callSeconds: 999, callerSaved: true })).toEqual({
      onCall: false,
      callSeconds: 0,
      callerSaved: false,
      screenCaptured: false,
      remoteControlApp: false,
    })
  })

  it('keeps only "yes" interview answers (I3)', () => {
    expect(interviewYeses({ askedBySomeoneOnCall: false, toldToKeepSecret: true, injected: true })).toEqual({ toldToKeepSecret: true })
  })
})
