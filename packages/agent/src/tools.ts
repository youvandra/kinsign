/**
 * The assistant's tools. They read the account and prepare drafts. None of
 * them moves money: a draft waits for the customer to confirm it on screen,
 * and that confirmation goes through the same hold rule as any transfer. No
 * tool releases a hold, approves one, or changes the trusted circle.
 */
import type { AccountView, FinanceView, HoldView, Lang, TransferDraft } from '@kinsign/protocol'
import type { Tool } from './model.ts'

/** What the assistant may read from the bank. */
export interface BankReader {
  account(): Promise<AccountView>
  holds(): Promise<HoldView[]>
  /** Monthly summary, bills, budgets and recommendations, written in `lang`. */
  finance(lang: Lang): Promise<FinanceView>
}

export const MAX_DRAFT_AMOUNT = 10_000_000

const object = (properties: Record<string, unknown>, required: string[]) => ({
  type: 'object' as const,
  properties,
  required,
  additionalProperties: false,
})

export const TOOLS: Tool[] = [
  {
    name: 'get_account',
    description: 'The customer’s balance, the amount reserved by paused payments, and the payees she has paid before.',
    strict: true,
    input_schema: object({}, []),
  },
  {
    name: 'recent_payments',
    description: 'The last payments that went through, newest first.',
    strict: true,
    input_schema: object({}, []),
  },
  {
    name: 'paused_payments',
    description: 'Payments Kinsign paused because they were made under pressure, with their state and the reasons.',
    strict: true,
    input_schema: object({}, []),
  },
  {
    name: 'spending_summary',
    description: 'This month so far and last month: income, spending, what is left, and spending by category against the usual three-month average.',
    strict: true,
    input_schema: object({}, []),
  },
  {
    name: 'bills',
    description:
      'Her regular bills found from the statement, with the usual amount, the latest one, when the next is due, and flags for a rise or a double charge.',
    strict: true,
    input_schema: object({}, []),
  },
  {
    name: 'budgets_and_tips',
    description:
      'Her budgets with spending projected to the end of the month, and ranked recommendations. A recommendation may carry a prepared action; setting a budget is done by her on screen, and a transfer only through draft_transfer after she agrees.',
    strict: true,
    input_schema: object({}, []),
  },
  {
    name: 'draft_transfer',
    description:
      'Prepare a transfer for the customer to review. It appears on her screen with a Confirm button and moves no money by itself. Use it once the payee and the amount are clear.',
    strict: true,
    input_schema: object(
      {
        payee: { type: 'string', description: 'Who receives the money, as the customer named them.' },
        amount: { type: 'number', description: 'Amount in yuan.' },
        note: { type: 'string', description: 'A short reason shown on the draft, e.g. "October electricity bill".' },
      },
      ['payee', 'amount', 'note'],
    ),
  },
]

export const TOOL_NAMES = TOOLS.map((t) => t.name)

export class ToolError extends Error {}

export interface ToolContext {
  bank: BankReader
  lang: Lang
  addDraft(draft: Omit<TransferDraft, 'id' | 'state'>): TransferDraft
}

function draftInput(input: unknown): Omit<TransferDraft, 'id' | 'state'> {
  const i = input as Record<string, unknown>
  const payee = typeof i.payee === 'string' ? i.payee.trim().slice(0, 80) : ''
  const amount = typeof i.amount === 'number' ? Math.round(i.amount) : NaN
  const note = typeof i.note === 'string' ? i.note.trim().slice(0, 120) : ''
  if (!payee) throw new ToolError('payee is required')
  if (!Number.isFinite(amount) || amount < 1 || amount > MAX_DRAFT_AMOUNT) throw new ToolError(`amount must be between 1 and ${MAX_DRAFT_AMOUNT}`)
  return { payee, amount, note }
}

/** Runs one tool call and returns what the model reads back. */
export async function runTool(name: string, input: unknown, ctx: ToolContext): Promise<unknown> {
  switch (name) {
    case 'get_account': {
      const a = await ctx.bank.account()
      return { balance: a.balance, reserved: a.reserved, knownPayees: a.knownPayees }
    }
    case 'recent_payments':
      return (await ctx.bank.account()).paid.map(({ at, payee, amount }) => ({ at: new Date(at).toISOString(), payee, amount }))
    case 'paused_payments':
      return (await ctx.bank.holds()).map(({ payee, amount, state, reasons }) => ({ payee, amount, state, reasons }))
    case 'spending_summary': {
      const { summary, previous } = await ctx.bank.finance(ctx.lang)
      const brief = (m: typeof summary) => ({
        month: m.month,
        income: m.income,
        spending: m.spending,
        left: m.net,
        savingsRate: Math.round(m.savingsRate * 100) / 100,
      })
      return {
        thisMonth: { ...brief(summary), daysElapsed: summary.daysElapsed, daysInMonth: summary.daysInMonth, byCategory: summary.byCategory },
        lastMonth: brief(previous),
      }
    }
    case 'bills':
      return (await ctx.bank.finance(ctx.lang)).bills.map(({ payee, average, last, lastAt, nextDueAt, change, flags }) => ({
        payee,
        usual: average,
        latest: last,
        latestOn: new Date(lastAt).toISOString().slice(0, 10),
        nextDue: new Date(nextDueAt).toISOString().slice(0, 10),
        change: Math.round(change * 100) / 100,
        flags,
      }))
    case 'budgets_and_tips': {
      const { budgets, insights } = await ctx.bank.finance(ctx.lang)
      return { budgets, tips: insights.map(({ severity, title, detail, action }) => ({ severity, title, detail, action })) }
    }
    case 'draft_transfer': {
      const draft = ctx.addDraft(draftInput(input))
      return { draftId: draft.id, status: 'shown to the customer; it moves no money until she confirms it' }
    }
    default:
      throw new ToolError(`unknown tool ${name}`)
  }
}
