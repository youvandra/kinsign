import { describe, expect, it } from 'vitest'
import { Engine, holdIdOf, MockLedger } from '../src/index.ts'
import { callFor, customer, FakeReleaseLedger, request } from './fixtures.ts'

const OPERATOR = `0x${'01'.repeat(32)}` as const
const MUM_KEY = `0x${'02'.repeat(32)}` as const

function setup() {
  const ledger = new MockLedger(() => 0)
  ledger.add(customer())
  const release = new FakeReleaseLedger()
  return { ledger, release, engine: new Engine(ledger, release, OPERATOR) }
}

describe('Engine', () => {
  it('pays at once when the policy says pay, without touching the contract', async () => {
    const { engine, release, ledger } = setup()
    const out = await engine.request(request({ channel: callFor(5) }))
    expect(out.holdId).toBeUndefined()
    expect(release.calls).toHaveLength(0)
    expect(ledger.paidTo('electric')).toBe(300)
  })

  it('reserves the money and opens a hold with the operator key', async () => {
    const { engine, release, ledger } = setup()
    const out = await engine.request(request({ id: 'scam', payee: 'mule', amount: 50_000, channel: callFor(40) }))
    expect(out.holdId).toBe(holdIdOf('scam'))
    expect(release.calls[0]).toMatchObject({ key: OPERATOR, fn: 'openHold' })
    expect(ledger.isReserved(out.holdId!)).toBe(true)
    expect(ledger.paidTo('mule')).toBe(0)
  })

  it('settles only by what the contract says', async () => {
    const { engine, release, ledger } = setup()
    const { holdId } = await engine.request(request({ id: 'rent', payee: 'landlord', amount: 600, channel: callFor(6) }))
    expect(await engine.sync(holdId!)).toBe('Held')
    expect(ledger.paidTo('landlord')).toBe(0)
    release.states.set(holdId!, 'Released')
    await engine.sync(holdId!)
    expect(ledger.paidTo('landlord')).toBe(600)
  })

  it('files a refused release as a refusal, not as part of the record chain', async () => {
    const { engine, release } = setup()
    const { holdId } = await engine.request(request({ id: 'scam', payee: 'mule', amount: 50_000, channel: callFor(40) }))
    const before = engine.records.chainFor(holdId!)
    release.nextResult = { ok: false, error: 'NotMember' }
    const r = await engine.releaseAs(holdId!, MUM_KEY)
    expect(r.error).toBe('NotMember')
    expect(engine.records.chainFor(holdId!)).toBe(before)
    expect(engine.records.refusedForHold(holdId!)).toHaveLength(1)
  })

  it('files a device record only once its receipt is known', async () => {
    const { engine } = setup()
    const { holdId } = await engine.request(request({ id: 'rent', payee: 'landlord', amount: 600, channel: callFor(6) }))
    const before = engine.records.chainFor(holdId!)
    const issued = engine.issueRecord(holdId!, 'block', { by: 'son' })
    expect(engine.records.chainFor(holdId!)).toBe(before)
    engine.fileIssuedRecord(issued.hash, true)
    expect(engine.records.chainFor(holdId!)).not.toBe(before)
  })
})
