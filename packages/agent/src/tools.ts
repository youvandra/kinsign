/**
 * The assistant's tools. They read the account and prepare drafts. None of
 * them moves money: a draft waits for the customer to confirm it on screen,
 * and that confirmation goes through the same hold rule as any transfer. No
 * tool releases a hold, approves one, or changes the trusted circle.
 */
import type { AccountView, HoldView, TransferDraft } from '@kinsign/protocol'
import type { Tool } from './model.ts'

/** What the assistant may read from the bank. */
export interface BankReader {
  account(): Promise<AccountView>
  holds(): Promise<HoldView[]>
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
    case 'draft_transfer': {
      const draft = ctx.addDraft(draftInput(input))
      return { draftId: draft.id, status: 'shown to the customer; it moves no money until she confirms it' }
    }
    default:
      throw new ToolError(`unknown tool ${name}`)
  }
}
