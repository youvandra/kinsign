import { describe, expect, it } from 'vitest'
import { DURESS_REASON, decide, features, inAfterCallWindow, interviewBoost, norm, triggered } from '../src/index.ts'
import { callFor, customer, NO_CALL, request } from './fixtures.ts'

describe('norm', () => {
  it('is the median of recent amounts', () => {
    expect(norm([5, 1, 3])).toBe(3)
    expect(norm([])).toBe(0)
  })
})

describe('trigger', () => {
  it('needs a live channel', () => {
    const f = features(customer(), request({ payee: 'stranger', amount: 50_000, channel: NO_CALL }), new Set())
    expect(triggered(f)).toBe(false)
  })

  it('needs a risky feature on top of the channel', () => {
    const known = features(customer(), request({ channel: callFor(10) }), new Set())
    const newPayee = features(customer(), request({ payee: 'stranger', channel: callFor(10) }), new Set())
    expect(triggered(known)).toBe(false)
    expect(triggered(newPayee)).toBe(true)
  })

  it('counts screen sharing or remote control as a channel without a call', () => {
    const f = features(customer(), request({ payee: 'stranger', channel: { ...NO_CALL, screenCaptured: true } }), new Set())
    expect(triggered(f)).toBe(true)
  })

  it('treats more than three times the norm as unusual', () => {
    const f = features(customer(), request({ amount: 3_100, channel: callFor(5) }), new Set())
    expect(f.aboveNorm).toBe(true)
    expect(triggered(f)).toBe(true)
  })
})

describe('decide', () => {
  it('pays a known payee during a call', () => {
    expect(decide(customer(), request({ channel: callFor(12) })).action).toBe('pay')
  })

  it('holds a new payee during a call', () => {
    const d = decide(customer(), request({ payee: 'Public Security Safe Account', amount: 50_000, channel: callFor(40) }))
    expect(d.action).toBe('hold')
    expect(d.reasons).toContain('new payee')
  })

  it('always holds on the duress PIN, even with no other signal', () => {
    const d = decide(customer(), request({ duress: true }))
    expect(d.action).toBe('hold')
    expect(d.reasons).toContain(DURESS_REASON)
  })
})

describe('interview ratchet (I3)', () => {
  it('only adds risk', () => {
    expect(interviewBoost(undefined).add).toBe(0)
    expect(interviewBoost({ askedBySomeoneOnCall: false, toldToKeepSecret: false, promisedReturnOrThreatened: false }).add).toBe(0)
    expect(interviewBoost({ toldToKeepSecret: true }).add).toBeGreaterThan(0)
  })

  it('never lowers the score of a request', () => {
    const base = request({ payee: 'stranger', channel: callFor(10) })
    const plain = decide(customer(), base).score
    const coached = decide(customer(), { ...base, interview: { askedBySomeoneOnCall: false, toldToKeepSecret: false } }).score
    const honest = decide(customer(), { ...base, interview: { toldToKeepSecret: true } }).score
    expect(coached).toBe(plain)
    expect(honest).toBeGreaterThan(plain)
  })
})

describe('after-call window', () => {
  const after = (endedMinutesAgo: number, minutes = 20, callerSaved = false) => ({
    ...NO_CALL,
    lastCall: { endedSecondsAgo: endedMinutesAgo * 60, seconds: minutes * 60, callerSaved },
  })

  it('holds a new payee paid straight after a long call from an unsaved number', () => {
    const d = decide(customer(), request({ payee: 'stranger', amount: 5_000, channel: after(4) }))
    expect(d.action).toBe('hold')
    expect(d.features.afterCall).toBe(true)
    expect(d.reasons).toContain('a 20-min call ended 4 min ago')
  })

  it('closes after the window, for short calls and for saved callers', () => {
    expect(decide(customer(), request({ payee: 'stranger', amount: 5_000, channel: after(31) })).action).toBe('pay')
    expect(decide(customer(), request({ payee: 'stranger', amount: 5_000, channel: after(4, 3) })).action).toBe('pay')
    expect(decide(customer(), request({ payee: 'stranger', amount: 5_000, channel: after(4, 20, true) })).action).toBe('pay')
  })

  it('leaves everyday payments alone after a call', () => {
    expect(decide(customer(), request({ channel: after(4) })).action).toBe('pay')
  })

  it('stays an input the phone reports only when no call is live', () => {
    expect(inAfterCallWindow({ ...callFor(5), lastCall: { endedSecondsAgo: 60, seconds: 1200, callerSaved: false } })).toBe(false)
  })
})

describe('channel cap', () => {
  it('holds a known payee once what she paid during the call passes five times her norm', () => {
    const d = decide(customer(), request({ amount: 2_000, channel: callFor(30), paidOnChannel: 3_500 }))
    expect(d.features.overChannelCap).toBe(true)
    expect(d.action).toBe('hold')
    expect(d.reasons).toContain('3,500 already sent during this call')
  })

  it('lets the first payment and small totals through', () => {
    expect(decide(customer(), request({ amount: 2_000, channel: callFor(30) })).action).toBe('pay')
    expect(decide(customer(), request({ amount: 1_000, channel: callFor(30), paidOnChannel: 1_000 })).action).toBe('pay')
  })

  it('applies only on a channel', () => {
    expect(decide(customer(), request({ amount: 2_000, paidOnChannel: 9_000 })).action).toBe('pay')
  })
})
