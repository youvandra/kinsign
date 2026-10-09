import Anthropic from '@anthropic-ai/sdk'
import type { ModelPort, ModelRequest } from './model.ts'

export const CLAUDE_MODEL = 'claude-opus-5-5'

/**
 * Claude through the Anthropic SDK. Credentials come from the environment
 * (`ANTHROPIC_API_KEY` or an `ant auth login` profile). The system prompt is
 * cached, effort is low for short conversational turns, and a refusal falls
 * back to the model the API picks for its category.
 */
export class ClaudeModel implements ModelPort {
  readonly name = CLAUDE_MODEL

  constructor(private readonly client: Anthropic = new Anthropic()) {}

  create({ system, messages, tools, schema, maxTokens = 4000 }: ModelRequest) {
    return this.client.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages,
      ...(tools && { tools }),
      output_config: { effort: 'low', ...(schema && { format: { type: 'json_schema', schema } }) },
    })
  }
}
