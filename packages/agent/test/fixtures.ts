import type { AccountView, HoldView, Txn } from '@kinsign/protocol'
import { categorize, financeView } from '@kinsign/finance'
import type { Message, ModelPort, ModelRequest } from '../src/model.ts'
import type { BankReader } from '../src/tools.ts'

/** A model that answers from a script and records what it was asked. */
export class ScriptedModel implements ModelPort {
  readonly name = 'scripted'
  readonly requests: ModelRequest[] = []

  constructor(private readonly replies: Message[]) {}

  async create(request: ModelRequest): Promise<Message> {
    // Copied, because the assistant keeps appending to the same history array.
    this.requests.push({ ...request, messages: [...request.messages] })
    const next = this.replies.shift()
    if (!next) throw new Error('script ran out')
    return next
  }
}

export function reply(content: unknown[], stop_reason = 'end_turn'): Message {
  return {
    id: 'msg',
    type: 'message',
    role: 'assistant',
    model: 'scripted',
    content,
    stop_reason,
    stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: 0 },
  } as unknown as Message
}

export const text = (t: string) => ({ type: 'text', text: t, citations: null })
export const thinking = () => ({ type: 'thinking', thinking: '', signature: 'sig' })
export const toolUse = (id: string, name: string, input: unknown) => ({ type: 'tool_use', id, name, input })

export const ACCOUNT: AccountView = { balance: 250_000, knownPayees: ['Electricity Co.'], reserved: 0, paid: [] }

/** Two steady months, then this month: electricity up 38% and the phone charged twice. */
export const ASOF = Date.parse('2026-10-10T09:00:00Z')
const row = (date: string, payee: string, amount: number, direction: 'in' | 'out' = 'out'): Txn => ({
  id: `${date}-${payee}`,
  at: Date.parse(`${date}T09:00:00Z`),
  payee,
  amount,
  direction,
  category: categorize(payee, direction),
})
export const STATEMENT: Txn[] = [
  ...['2026-08', '2026-09'].flatMap((m) => [
    row(`${m}-01`, 'Pension', 6_800, 'in'),
    row(`${m}-05`, 'State Grid electricity', 260),
    row(`${m}-06`, 'China Mobile', 58),
    row(`${m}-08`, 'Hema supermarket', 1_200),
  ]),
  row('2026-10-01', 'Pension', 6_800, 'in'),
  row('2026-10-03', 'China Mobile', 58),
  row('2026-10-05', 'State Grid electricity', 360),
  row('2026-10-06', 'China Mobile', 58),
]

export const bank = (holds: HoldView[] = []): BankReader => ({
  account: async () => ACCOUNT,
  holds: async () => holds,
  finance: async (lang) => financeView(STATEMENT, {}, ASOF, lang),
})

export const HOLD: HoldView = {
  holdId: '0x01',
  at: 0,
  payee: 'Public Security Safe Account',
  amount: 50_000,
  channel: { onCall: true, callSeconds: 2400, callerSaved: false, screenCaptured: false, remoteControlApp: false },
  score: 0.94,
  reasons: ['on a call for 40 min', 'new payee'],
  features: { newPayee: true, amountRatio: 62.5, aboveNorm: true },
  state: 'Held',
  decidedBy: null,
  transferDigest: '0x02',
  chainHash: '0x03',
  chainMatches: true,
  records: [{ kind: 'interview', body: { toldToKeepSecret: true }, hash: '0x04' }],
  refused: [],
}
