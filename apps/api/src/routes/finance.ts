/**
 * Budgets, bills and spending insights. Reading is free; setting a budget is
 * the customer's own action from her screen, never the assistant's.
 */
import { BUDGETABLE, financeView } from '@kinsign/finance'
import { API, type Category, type FinanceView } from '@kinsign/protocol'
import type { Bank } from '../bank.ts'
import { HttpError, type Router } from '../http/router.ts'
import { lang, number, object, string } from '../http/validate.ts'

export const MAX_BUDGET = 1_000_000

export function financeRoutes(router: Router, bank: Bank): void {
  router
    .post(API.finance, async (raw): Promise<FinanceView> => financeView(bank.statement(), bank.budgets, Date.now(), lang(object(raw), 'lang')))

    .post(API.financeBudget, async (raw): Promise<FinanceView> => {
      const b = object(raw)
      const category = string(b, 'category', 20) as Category
      if (!BUDGETABLE.includes(category)) throw new HttpError(400, `category must be one of ${BUDGETABLE.join(', ')}`)
      const limit = Math.round(number(b, 'limit', { min: 0, max: MAX_BUDGET }))
      // A limit of 0 removes the budget: lines with no limit are not shown.
      bank.budgets[category] = limit
      return financeView(bank.statement(), bank.budgets, Date.now(), lang(b, 'lang'))
    })
}
