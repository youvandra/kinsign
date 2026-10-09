import type { BudgetLine, Category, MonthSummary } from '@kinsign/protocol'

export type Budgets = Partial<Record<Category, number>>

/** Spending against each budget, projected to the end of the month at the current pace. */
export function budgetLines(summary: MonthSummary, budgets: Budgets): BudgetLine[] {
  return (Object.entries(budgets) as [Category, number][])
    .filter(([, limit]) => limit > 0)
    .map(([category, limit]) => {
      const spent = summary.byCategory.find((c) => c.category === category)?.amount ?? 0
      const projected = Math.round((spent / Math.max(1, summary.daysElapsed)) * summary.daysInMonth)
      const status: BudgetLine['status'] = spent > limit ? 'over' : projected > limit ? 'watch' : 'ok'
      return { category, limit, spent, projected, status }
    })
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit)
}
