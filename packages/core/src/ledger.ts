import type { Customer } from './types.ts'

export type LedgerEntryKind = 'paid' | 'reserved' | 'settled' | 'refunded'

export interface LedgerEntry {
  at: number
  kind: LedgerEntryKind
  customer: string
  payee: string
  amount: number
  ref: string
}

interface Reservation {
  customer: string
  payee: string
  amount: number
}

/**
 * Stand-in for the bank's core ledger. Money never touches the chain: a held
 * transfer is reserved here, and settled or refunded only after the bank reads
 * the hold's state from the release contract.
 */
export class MockLedger {
  private readonly customers = new Map<string, Customer>()
  private readonly reservations = new Map<string, Reservation>()
  readonly audit: LedgerEntry[] = []

  constructor(private readonly now: () => number = Date.now) {}

  add(customer: Customer): void {
    this.customers.set(customer.id, customer)
  }

  get(id: string): Customer {
    const customer = this.customers.get(id)
    if (!customer) throw new Error(`unknown customer ${id}`)
    return customer
  }

  isReserved(ref: string): boolean {
    return this.reservations.has(ref)
  }

  reservedTotal(): number {
    let total = 0
    for (const r of this.reservations.values()) total += r.amount
    return total
  }

  pay(customer: string, payee: string, amount: number, ref: string): void {
    this.debit(customer, amount)
    this.remember(customer, payee, amount)
    this.log('paid', customer, payee, amount, ref)
  }

  reserve(ref: string, customer: string, payee: string, amount: number): void {
    if (this.reservations.has(ref)) throw new Error(`reservation ${ref} exists`)
    this.debit(customer, amount)
    this.reservations.set(ref, { customer, payee, amount })
    this.log('reserved', customer, payee, amount, ref)
  }

  settle(ref: string): void {
    const r = this.take(ref)
    this.remember(r.customer, r.payee, r.amount)
    this.log('settled', r.customer, r.payee, r.amount, ref)
  }

  refund(ref: string): void {
    const r = this.take(ref)
    this.get(r.customer).balance += r.amount
    this.log('refunded', r.customer, r.payee, r.amount, ref)
  }

  /** Total that actually left the bank to a payee. */
  paidTo(payee: string): number {
    return this.audit.filter((e) => (e.kind === 'paid' || e.kind === 'settled') && e.payee === payee).reduce((sum, e) => sum + e.amount, 0)
  }

  private debit(customer: string, amount: number): void {
    const c = this.get(customer)
    if (c.balance < amount) throw new Error('insufficient funds')
    c.balance -= amount
  }

  /** A paid transfer becomes part of the norm, and its payee becomes known. */
  private remember(customer: string, payee: string, amount: number): void {
    const c = this.get(customer)
    c.history.push(amount)
    c.knownPayees.add(payee)
  }

  private take(ref: string): Reservation {
    const r = this.reservations.get(ref)
    if (!r) throw new Error(`no reservation ${ref}`)
    this.reservations.delete(ref)
    return r
  }

  private log(kind: LedgerEntryKind, customer: string, payee: string, amount: number, ref: string): void {
    this.audit.push({ at: this.now(), kind, customer, payee, amount, ref })
  }
}
