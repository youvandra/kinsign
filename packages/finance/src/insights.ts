import type { BillView, BudgetLine, Category, Insight, Lang, MonthSummary } from '@kinsign/protocol'
import { round } from './months.ts'
import { categoryName, shortDate, TEXT } from './text.ts'
import type { Txn } from '@kinsign/protocol'

/** Everyday categories where a budget helps. Bills and family support are planned, not budgeted. */
export const BUDGETABLE: Category[] = ['groceries', 'dining', 'transport', 'health', 'other']
export const SAVINGS_PAYEE = 'Savings account'

const JUMP = 0.4
const JUMP_MIN = 200
const SURPLUS_MIN = 1_000
const MAX_INSIGHTS = 6
const RANK = { act: 0, watch: 1, info: 2 } as const

export interface InsightInput {
  txns: readonly Txn[]
  summary: MonthSummary
  previous: MonthSummary
  bills: BillView[]
  budgets: BudgetLine[]
  asOf: number
  lang: Lang
}

/**
 * Recommendations ranked by urgency. Each one states the evidence, and an
 * action, when there is one, is prepared for the customer to confirm: the
 * assistant never sets a budget or moves money by itself.
 */
export function insights({ txns, summary, previous, bills, budgets, lang }: InsightInput): Insight[] {
  const t = TEXT[lang]
  const out: Insight[] = []
  const cat = (c: Category) => categoryName(c, lang)

  for (const b of bills) {
    if (b.flags.includes('duplicate')) {
      const charges = txns.filter((x) => x.payee === b.payee && new Date(x.at).toISOString().slice(0, 7) === summary.month)
      out.push({
        id: `dup:${b.payee}`,
        kind: 'duplicateCharge',
        severity: 'act',
        ...t.duplicateCharge(
          b.payee,
          b.last,
          charges.map((x) => shortDate(x.at, lang)),
        ),
      })
    } else if (b.flags.includes('increased')) {
      out.push({
        id: `bill:${b.payee}`,
        kind: 'billIncrease',
        severity: b.change >= 0.5 ? 'act' : 'watch',
        ...t.billIncrease(b.payee, b.change, b.last, b.average),
      })
    }
  }

  for (const line of budgets) {
    if (line.status === 'ok') continue
    out.push({
      id: `budget:${line.category}`,
      kind: 'budgetPace',
      severity: line.status === 'over' ? 'act' : 'watch',
      ...t.budgetPace(cat(line.category), line.spent, line.limit, line.projected, line.status === 'over'),
    })
  }

  const budgeted = new Set(budgets.map((b) => b.category))
  const early = summary.daysElapsed < 5
  for (const c of summary.byCategory) {
    if (!BUDGETABLE.includes(c.category) || budgeted.has(c.category) || early) continue
    const projected = Math.round((c.amount / summary.daysElapsed) * summary.daysInMonth)
    if (c.average > 0 && projected > c.average * (1 + JUMP) && projected - c.average >= JUMP_MIN) {
      const limit = round(c.average * 1.05, 100)
      out.push({
        id: `jump:${c.category}`,
        kind: 'categoryJump',
        severity: 'watch',
        ...t.categoryJump(cat(c.category), projected, c.average, limit),
        action: { kind: 'setBudget', category: c.category, limit },
      })
    }
  }

  if (previous.net >= SURPLUS_MIN) {
    const amount = round(previous.net / 2, 100)
    out.push({
      id: `save:${previous.month}`,
      kind: 'saveSurplus',
      severity: 'info',
      ...t.saveSurplus(previous.net, amount),
      action: { kind: 'draftTransfer', payee: SAVINGS_PAYEE, amount, note: t.savingsNote },
    })
  }

  const suggested = new Set(out.flatMap((i) => (i.action?.kind === 'setBudget' ? [i.action.category] : [])))
  for (const c of summary.byCategory) {
    if (!BUDGETABLE.includes(c.category) || budgeted.has(c.category) || suggested.has(c.category) || c.average < 300) continue
    const limit = round(c.average * 1.05, 100)
    out.push({
      id: `set:${c.category}`,
      kind: 'setBudget',
      severity: 'info',
      ...t.setBudget(cat(c.category), c.average, limit),
      action: { kind: 'setBudget', category: c.category, limit },
    })
  }

  return out.sort((a, b) => RANK[a.severity] - RANK[b.severity]).slice(0, MAX_INSIGHTS)
}
