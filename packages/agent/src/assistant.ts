/**
 * The customer's payment assistant. Conversations live on the server, so the
 * model's full replies (thinking included) are appended unchanged and the
 * browser only sees the plain transcript and the drafts.
 */
import type { AssistantView, ChatLine, TransferDraft } from '@kinsign/protocol'
import { guessLang } from './lang.ts'
import { textOf, type MessageParam, type ModelPort, type ToolResult } from './model.ts'
import { OFFLINE_REPLIES, offlineIntent } from './offline.ts'
import { ASSISTANT_SYSTEM } from './prompts.ts'
import { runTool, TOOLS, ToolError, type BankReader } from './tools.ts'

/** Model calls per customer message: enough to look up, draft and answer. */
const MAX_STEPS = 6
const MAX_CONVERSATIONS = 100
const MAX_TEXT = 1000

export const REFUSAL_REPLY = 'I can’t help with that here. For anything about a payment, you can always call the bank on the number on your card.'

interface Conversation {
  id: string
  messages: MessageParam[]
  transcript: ChatLine[]
  drafts: TransferDraft[]
}

export class UnknownConversationError extends Error {}

export class Assistant {
  private readonly conversations = new Map<string, Conversation>()
  private seq = 0

  /** `model` null runs the offline rules. */
  constructor(
    private readonly bank: BankReader,
    private readonly model: ModelPort | null,
    private readonly formatMoney: (n: number) => string = (n) => `¥${n.toLocaleString('en-US')}`,
  ) {}

  get mode(): AssistantView['mode'] {
    return this.model ? 'claude' : 'offline'
  }

  view(conversationId: string): AssistantView {
    const c = this.get(conversationId)
    return { conversationId: c.id, mode: this.mode, transcript: [...c.transcript], drafts: c.drafts.map((d) => ({ ...d })) }
  }

  async chat(conversationId: string | undefined, rawText: string): Promise<AssistantView> {
    const c = conversationId ? this.get(conversationId) : this.open()
    const text = rawText.trim().slice(0, MAX_TEXT)
    c.transcript.push({ role: 'customer', text })
    const reply = this.model ? await this.modelTurn(c, text) : await this.offlineTurn(c, text)
    c.transcript.push({ role: 'assistant', text: reply })
    return this.view(c.id)
  }

  /** Marks a draft as sent or dismissed. Sending itself is the bank's transfer, done by the caller. */
  settle(conversationId: string, draftId: string, state: 'sent' | 'dismissed'): TransferDraft {
    const draft = this.get(conversationId).drafts.find((d) => d.id === draftId)
    if (!draft) throw new UnknownConversationError(`unknown draft ${draftId}`)
    if (draft.state !== 'pending') throw new UnknownConversationError(`draft ${draftId} is already ${draft.state}`)
    draft.state = state
    return { ...draft }
  }

  /** Puts a draft back to pending after its transfer failed, so the customer can try again. */
  reopen(conversationId: string, draftId: string): void {
    const draft = this.get(conversationId).drafts.find((d) => d.id === draftId)
    if (draft?.state === 'sent') draft.state = 'pending'
  }

  draft(conversationId: string, draftId: string): TransferDraft {
    const draft = this.get(conversationId).drafts.find((d) => d.id === draftId)
    if (!draft) throw new UnknownConversationError(`unknown draft ${draftId}`)
    return { ...draft }
  }

  private open(): Conversation {
    if (this.conversations.size >= MAX_CONVERSATIONS) this.conversations.delete(this.conversations.keys().next().value!)
    const c: Conversation = { id: `c${Date.now().toString(36)}${++this.seq}`, messages: [], transcript: [], drafts: [] }
    this.conversations.set(c.id, c)
    return c
  }

  private get(id: string): Conversation {
    const c = this.conversations.get(id)
    if (!c) throw new UnknownConversationError(`unknown conversation ${id}`)
    return c
  }

  private addDraft(c: Conversation) {
    return (d: Omit<TransferDraft, 'id' | 'state'>): TransferDraft => {
      const draft: TransferDraft = { ...d, id: `d${c.drafts.length + 1}`, state: 'pending' }
      c.drafts.push(draft)
      return draft
    }
  }

  private async modelTurn(c: Conversation, text: string): Promise<string> {
    const model = this.model!
    c.messages.push({ role: 'user', content: text })
    for (let step = 0; step < MAX_STEPS; step++) {
      const res = await model.create({ system: ASSISTANT_SYSTEM, messages: c.messages, tools: TOOLS })
      // Appended whole, thinking blocks included: the history stays append-only.
      c.messages.push({ role: 'assistant', content: res.content })
      if (res.stop_reason === 'refusal') return REFUSAL_REPLY
      if (res.stop_reason !== 'tool_use') return textOf(res) || OFFLINE_REPLIES[guessLang(text)].help()

      const results: ToolResult[] = []
      for (const block of res.content) {
        if (block.type !== 'tool_use') continue
        try {
          const out = await runTool(block.name, block.input, { bank: this.bank, addDraft: this.addDraft(c) })
          results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(out) })
        } catch (e) {
          const message = e instanceof ToolError ? e.message : 'the bank could not answer'
          results.push({ type: 'tool_result', tool_use_id: block.id, content: message, is_error: true })
        }
      }
      c.messages.push({ role: 'user', content: results })
    }
    return OFFLINE_REPLIES[guessLang(text)].help()
  }

  private async offlineTurn(c: Conversation, text: string): Promise<string> {
    const replies = OFFLINE_REPLIES[guessLang(text)]
    const intent = offlineIntent(text)
    switch (intent.kind) {
      case 'balance':
        return replies.balance(this.formatMoney((await this.bank.account()).balance))
      case 'draft': {
        // "Electricity Co" is the payee she knows as "Electricity Co.": use the name on file.
        const plain = (s: string) => s.replace(/\.+$/, '').toLowerCase()
        const known = (await this.bank.account()).knownPayees.find((k) => plain(k) === plain(intent.payee))
        const payee = known ?? intent.payee
        this.addDraft(c)({ payee, amount: intent.amount, note: '' })
        return replies.draft(this.formatMoney(intent.amount), payee)
      }
      case 'scam':
        return replies.scam()
      case 'help':
        return replies.help()
    }
  }
}
