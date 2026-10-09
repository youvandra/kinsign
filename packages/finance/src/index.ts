/**
 * The customer's money at a glance: monthly summary, bills found from the
 * statement, budgets and ranked recommendations. Pure functions over a
 * statement; the bank supplies the statement, the apps and the assistant read
 * the result.
 */
import type { FinanceView, Lang, Txn } from '@kinsign/protocol'
import { findBills } from './bills.ts'
import { budgetLines, type Budgets } from './budgets.ts'
import { insights } from './insights.ts'
import { monthOf, shift } from './months.ts'
import { monthSummary } from './summary.ts'

export { categorize } from './categories.ts'
export { findBills, duplicates, BILL_CATEGORIES, BILL_RISE } from './bills.ts'
export { budgetLines, type Budgets } from './budgets.ts'
export { insights, BUDGETABLE, SAVINGS_PAYEE } from './insights.ts'
export { monthSummary } from './summary.ts'
export { categoryName, money, shortDate } from './text.ts'
export { DAY, monthOf, shift } from './months.ts'

export function financeView(txns: readonly Txn[], budgets: Budgets, asOf: number, lang: Lang): FinanceView {
  const month = monthOf(asOf)
  const summary = monthSummary(txns, month, asOf)
  const previous = monthSummary(txns, shift(month, 1), asOf)
  const bills = findBills(txns, asOf)
  const lines = budgetLines(summary, budgets)
  return { asOf, lang, summary, previous, bills, budgets: lines, insights: insights({ txns, summary, previous, bills, budgets: lines, asOf, lang }) }
}
