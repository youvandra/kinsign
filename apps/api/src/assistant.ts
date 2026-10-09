/** The assistant, the interview reader and the family summary, wired to this bank. */
import { Assistant, ClaudeModel, type BankReader, type ModelPort } from '@kinsign/agent'
import { financeView } from '@kinsign/finance'
import type { Bank } from './bank.ts'
import { config } from './config.ts'
import { accountView, holdViews } from './views.ts'

export interface AssistantContext {
  assistant: Assistant
  /** The model the interview reader and the summary use; null runs their offline rules. */
  model: ModelPort | null
}

export function openAssistant(bank: Bank): AssistantContext {
  const reader: BankReader = {
    account: async () => accountView(bank),
    holds: () => holdViews(bank),
    finance: async (lang) => financeView(bank.statement(), bank.budgets, Date.now(), lang),
  }
  const model = config.assistant === 'claude' ? new ClaudeModel() : null
  return { assistant: new Assistant(reader, model), model }
}
