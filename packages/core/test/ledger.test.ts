import { describe, expect, it } from 'vitest'
import { MockLedger } from '../src/index.ts'
import { customer } from './fixtures.ts'

const ledgerWithMum = () => {
  const ledger = new MockLedger(() => 0)
  ledger.add(customer({ balance: 1_000 }))
  return ledger
}

describe('MockLedger', () => {
  it('reserves without paying anyone, then settles to the payee', () => {
    const ledger = ledgerWithMum()
    ledger.reserve('h1', 'mum', 'landlord', 600)
    expect(ledger.get('mum').balance).toBe(400)
    expect(ledger.paidTo('landlord')).toBe(0)
    ledger.settle('h1')
    expect(ledger.paidTo('landlord')).toBe(600)
    expect(ledger.get('mum').knownPayees.has('landlord')).toBe(true)
  })

  it('refunds a blocked hold in full', () => {
    const ledger = ledgerWithMum()
    ledger.reserve('h1', 'mum', 'mule', 900)
    ledger.refund('h1')
    expect(ledger.get('mum').balance).toBe(1_000)
    expect(ledger.paidTo('mule')).toBe(0)
  })

  it('refuses overdrafts and double reservations', () => {
    const ledger = ledgerWithMum()
    expect(() => ledger.pay('mum', 'x', 5_000, 'r')).toThrow('insufficient funds')
    ledger.reserve('h1', 'mum', 'x', 10)
    expect(() => ledger.reserve('h1', 'mum', 'x', 10)).toThrow('exists')
  })
})
