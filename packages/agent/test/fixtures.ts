import type { AccountView, HoldView } from '@kinsign/protocol'
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

export const bank = (holds: HoldView[] = []): BankReader => ({ account: async () => ACCOUNT, holds: async () => holds })

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
