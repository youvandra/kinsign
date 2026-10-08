import { describe, expect, it } from 'vitest'
import { DURESS_REASON, decide, features, interviewBoost, norm, triggered } from '../src/index.ts'
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
