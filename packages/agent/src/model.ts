/**
 * The model behind the assistant, as a port. `ClaudeModel` calls the Claude
 * API; tests use a scripted model. Without a model the assistant runs on its
 * offline rules, so the demo and the tests never need a key.
 */
import type Anthropic from '@anthropic-ai/sdk'

export type Message = Anthropic.Beta.Messages.BetaMessage
export type MessageParam = Anthropic.Beta.Messages.BetaMessageParam
export type Tool = Anthropic.Beta.Messages.BetaTool
export type ToolResult = Anthropic.Beta.Messages.BetaToolResultBlockParam

export interface ModelRequest {
  system: string
  messages: MessageParam[]
  tools?: Tool[]
  /** JSON schema for a structured answer instead of free text. */
  schema?: Record<string, unknown>
  maxTokens?: number
}

export interface ModelPort {
  readonly name: string
  create(request: ModelRequest): Promise<Message>
}

/** The text blocks of a reply, joined. */
export const textOf = (message: Pick<Message, 'content'>) =>
  message.content
    .flatMap((b) => (b.type === 'text' ? [b.text] : []))
    .join('\n')
    .trim()
