import type { Category, CategorySpend, MonthSummary, Txn } from '@kinsign/protocol'
import { daysIn, dayOfMonth, monthOf, shift } from './months.ts'

const spendOf = (txns: readonly Txn[], month: string) => txns.filter((t) => t.direction === 'out' && t.category !== 'savings' && monthOf(t.at) === month)

/** Income, spending and where it went, for one month. Moving money to savings is not spending. */
export function monthSummary(txns: readonly Txn[], month: string, asOf: number): MonthSummary {
  const inMonth = txns.filter((t) => monthOf(t.at) === month)
  const income = inMonth.filter((t) => t.direction === 'in').reduce((s, t) => s + t.amount, 0)
  const spent = spendOf(txns, month)
  const spending = spent.reduce((s, t) => s + t.amount, 0)

  const totals = new Map<Category, number>()
  for (const t of spent) totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount)
  const average = (category: Category) => {
    let sum = 0
    for (let i = 1; i <= 3; i++)
      sum += spendOf(txns, shift(month, i))
        .filter((t) => t.category === category)
        .reduce((s, t) => s + t.amount, 0)
    return Math.round(sum / 3)
  }
  const byCategory: CategorySpend[] = [...totals]
    .map(([category, amount]) => ({ category, amount, average: average(category) }))
    .sort((a, b) => b.amount - a.amount)

  const current = monthOf(asOf) === month
  const days = daysIn(month)
  return {
    month,
    income,
    spending,
    net: income - spending,
    savingsRate: income > 0 ? (income - spending) / income : 0,
    byCategory,
    daysElapsed: current ? dayOfMonth(asOf) : days,
    daysInMonth: days,
  }
}
