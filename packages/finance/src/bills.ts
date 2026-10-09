import type { BillFlag, BillView, Category, Txn } from '@kinsign/protocol'
import { DAY, monthOf, shift } from './months.ts'

/** A rise this large on a bill is worth a look. */
export const BILL_RISE = 0.25
const DUE_SOON_DAYS = 5
/** Two charges of the same amount this close together are one bill paid twice. */
const DUPLICATE_DAYS = 7
/** Categories that arrive as bills. Groceries and dining are budgeted instead. */
export const BILL_CATEGORIES: Category[] = ['housing', 'utilities', 'phone', 'education']

/**
 * Bills are payees she paid in at least two of the last three full months.
 * Flags: the latest amount rose, the same bill was charged twice this month,
 * or the next one is due within a few days.
 */
export function findBills(txns: readonly Txn[], asOf: number): BillView[] {
  const month = monthOf(asOf)
  const window = new Set([shift(month, 1), shift(month, 2), shift(month, 3)])
  const out = txns.filter((t) => t.direction === 'out' && BILL_CATEGORIES.includes(t.category))
  const byPayee = new Map<string, Txn[]>()
  for (const t of out) byPayee.set(t.payee, [...(byPayee.get(t.payee) ?? []), t])

  const bills: BillView[] = []
  for (const [payee, list] of byPayee) {
    const months = new Set(list.filter((t) => window.has(monthOf(t.at))).map((t) => monthOf(t.at)))
    if (months.size < 2) continue
    const sorted = [...list].sort((a, b) => a.at - b.at)
    const last = sorted[sorted.length - 1]
    const earlier = sorted.slice(0, -1).filter((t) => monthOf(t.at) !== monthOf(last.at))
    const average = earlier.length ? Math.round(earlier.reduce((s, t) => s + t.amount, 0) / earlier.length) : last.amount
    const change = average > 0 ? (last.amount - average) / average : 0
    const thisMonth = list.filter((t) => monthOf(t.at) === month)
    const nextDueAt = monthOf(last.at) === month ? last.at + 30 * DAY : sameDayThisMonth(last.at, asOf)

    const flags: BillFlag[] = []
    if (thisMonth.length && change >= BILL_RISE) flags.push('increased')
    if (duplicates(thisMonth).length) flags.push('duplicate')
    if (!thisMonth.length && nextDueAt >= asOf && nextDueAt - asOf <= DUE_SOON_DAYS * DAY) flags.push('dueSoon')

    bills.push({ payee, category: last.category, months: months.size, average, last: last.amount, lastAt: last.at, nextDueAt, change, flags })
  }
  return bills.sort((a, b) => b.flags.length - a.flags.length || b.average - a.average)
}

/** The same day of the month as `at`, in the month of `asOf`. */
function sameDayThisMonth(at: number, asOf: number): number {
  const d = new Date(at)
  const now = new Date(asOf)
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), d.getUTCDate())
}

/** Charges this month that repeat an earlier one of the same amount within a week. */
export function duplicates(charges: readonly Txn[]): Txn[] {
  const sorted = [...charges].sort((a, b) => a.at - b.at)
  return sorted.filter((t, i) => sorted.slice(0, i).some((e) => e.amount === t.amount && t.at - e.at <= DUPLICATE_DAYS * DAY))
}
