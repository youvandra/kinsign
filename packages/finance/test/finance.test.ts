import type { Category, Txn } from '@kinsign/protocol'
import { describe, expect, it } from 'vitest'
import { budgetLines, categorize, financeView, findBills, insights, monthSummary, SAVINGS_PAYEE } from '../src/index.ts'

const at = (month: string, day: number) => Date.parse(`${month}-${String(day).padStart(2, '0')}T09:00:00Z`)
let n = 0
const tx = (month: string, day: number, payee: string, amount: number, direction: 'in' | 'out' = 'out', category?: Category): Txn => ({
  id: `x${++n}`,
  at: at(month, day),
  payee,
  amount,
  direction,
  category: category ?? categorize(payee, direction),
})

/** Three steady months, then October: electricity up, phone charged twice, groceries fast. */
function statement(): Txn[] {
  const rows: Txn[] = []
  for (const m of ['2026-07', '2026-08', '2026-09']) {
    rows.push(tx(m, 1, 'Pension', 6_800, 'in'))
    rows.push(tx(m, 5, 'State Grid electricity', 260))
    rows.push(tx(m, 6, 'China Mobile', 58))
    rows.push(tx(m, 8, 'Hema supermarket', 700))
    rows.push(tx(m, 20, 'Hema supermarket', 700))
    rows.push(tx(m, 15, 'Grandson Wei', 500))
  }
  rows.push(tx('2026-10', 1, 'Pension', 6_800, 'in'))
  rows.push(tx('2026-10', 3, 'China Mobile', 58))
  rows.push(tx('2026-10', 5, 'State Grid electricity', 360))
  rows.push(tx('2026-10', 6, 'China Mobile', 58))
  rows.push(tx('2026-10', 8, 'Hema supermarket', 900))
  return rows
}
const ASOF = at('2026-10', 10)

describe('categorize', () => {
  it('reads the payee in three languages', () => {
    expect(categorize('State Grid electricity')).toBe('utilities')
    expect(categorize('超市')).toBe('groceries')
    expect(categorize('Tagihan PLN')).toBe('utilities')
    expect(categorize('Grandson Wei')).toBe('family')
    expect(categorize(SAVINGS_PAYEE)).toBe('savings')
    expect(categorize('Someone new')).toBe('other')
    expect(categorize('anything', 'in')).toBe('income')
  })
})

describe('monthSummary', () => {
  it('adds income and spending and keeps savings out of spending', () => {
    const rows = [...statement(), tx('2026-09', 25, SAVINGS_PAYEE, 1_000)]
    const sep = monthSummary(rows, '2026-09', ASOF)
    expect(sep.income).toBe(6_800)
    expect(sep.spending).toBe(260 + 58 + 1_400 + 500)
    expect(sep.net).toBe(6_800 - 2_218)
    expect(sep.daysElapsed).toBe(30)
  })

  it('compares each category with its three-month average', () => {
    const oct = monthSummary(statement(), '2026-10', ASOF)
    expect(oct.daysElapsed).toBe(10)
    expect(oct.byCategory.find((c) => c.category === 'groceries')).toEqual({ category: 'groceries', amount: 900, average: 1_400 })
  })
})

describe('findBills', () => {
  const bills = findBills(statement(), ASOF)
  it('finds bill payees paid in at least two of the last three months', () => {
    expect(bills.map((b) => b.payee).sort()).toEqual(['China Mobile', 'State Grid electricity'])
  })
  it('treats two shopping trips as shopping and two equal phone charges in a week as a double charge', () => {
    expect(bills.some((b) => b.payee === 'Hema supermarket')).toBe(false)
    const far = [
      ...statement().filter((t) => !(t.payee === 'China Mobile' && t.at >= at('2026-10', 1))),
      tx('2026-10', 1, 'China Mobile', 58),
      tx('2026-10', 9, 'China Mobile', 58),
    ]
    expect(findBills(far, ASOF).find((b) => b.payee === 'China Mobile')!.flags).not.toContain('duplicate')
  })
  it('flags a rise and a double charge', () => {
    const power = bills.find((b) => b.payee === 'State Grid electricity')!
    expect(power.flags).toContain('increased')
    expect(power.change).toBeCloseTo(100 / 260)
    expect(bills.find((b) => b.payee === 'China Mobile')!.flags).toContain('duplicate')
  })
  it('leaves family support out of bills', () => {
    expect(bills.some((b) => b.payee === 'Grandson Wei')).toBe(false)
  })
})

describe('budgetLines', () => {
  it('projects spending to the end of the month', () => {
    const oct = monthSummary(statement(), '2026-10', ASOF)
    const [line] = budgetLines(oct, { groceries: 1_800 })
    expect(line).toMatchObject({ spent: 900, projected: 2_790, status: 'watch' })
    expect(budgetLines(oct, { groceries: 800 })[0].status).toBe('over')
    expect(budgetLines(oct, { groceries: 0 })).toEqual([])
  })
})

describe('insights', () => {
  it('ranks the double charge and the bill rise first, in the reader’s language', () => {
    const v = financeView(statement(), {}, ASOF, 'en')
    expect(v.insights[0]).toMatchObject({ kind: 'duplicateCharge', severity: 'act', title: 'China Mobile charged you twice' })
    expect(v.insights.some((i) => i.kind === 'billIncrease' && i.title === 'State Grid electricity is up 38%')).toBe(true)
    expect(financeView(statement(), {}, ASOF, 'zh').insights[0].title).toBe('China Mobile重复扣费')
  })

  it('prepares actions and takes none', () => {
    const v = financeView(statement(), {}, ASOF, 'en')
    const save = v.insights.find((i) => i.kind === 'saveSurplus')!
    expect(save.action).toEqual({ kind: 'draftTransfer', payee: SAVINGS_PAYEE, amount: 2_300, note: 'Monthly savings' })
    const jump = v.insights.find((i) => i.kind === 'categoryJump')!
    expect(jump.action).toEqual({ kind: 'setBudget', category: 'groceries', limit: 1_500 })
  })

  it('warns on a budget instead of suggesting one', () => {
    const v = financeView(statement(), { groceries: 1_500 }, ASOF, 'en')
    expect(v.insights.find((i) => i.id === 'budget:groceries')?.severity).toBe('watch')
    expect(v.insights.some((i) => i.kind === 'categoryJump' || i.kind === 'setBudget')).toBe(false)
  })

  it('says nothing about pace in the first days of a month', () => {
    const early = at('2026-10', 3)
    const rows = statement().filter((t) => t.at <= early)
    const v = financeView(rows, {}, early, 'en')
    expect(v.insights.some((i) => i.kind === 'categoryJump')).toBe(false)
  })

  it('stays quiet when there is nothing to say', () => {
    const quiet = statement().filter((t) => t.at < at('2026-10', 1))
    const asOf = at('2026-09', 30)
    const v = financeView(quiet, {}, asOf, 'en')
    expect(
      insights({ txns: quiet, summary: v.summary, previous: v.previous, bills: v.bills, budgets: [], asOf, lang: 'en' }).every((i) => i.severity !== 'act'),
    ).toBe(true)
  })
})
