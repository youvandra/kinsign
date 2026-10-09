import { describe, expect, it } from 'vitest'
import { Assistant, REFUSAL_REPLY } from '../src/assistant.ts'
import { TOOL_NAMES } from '../src/tools.ts'
import { bank, reply, ScriptedModel, text, thinking, toolUse } from './fixtures.ts'

describe('tools', () => {
  it('read and draft only: nothing sends, releases, approves or changes the circle', () => {
    expect(TOOL_NAMES).toEqual(['get_account', 'recent_payments', 'paused_payments', 'draft_transfer'])
    for (const name of TOOL_NAMES) expect(name).not.toMatch(/send|release|approve|confirm|block|member|circle/)
  })
})

describe('assistant with a model', () => {
  it('drafts through the tool, keeps the history append-only and answers in text', async () => {
    const model = new ScriptedModel([
      reply([thinking(), toolUse('t1', 'draft_transfer', { payee: 'Electricity Co.', amount: 320, note: 'October bill' })], 'tool_use'),
      reply([text('I prepared ¥320 to Electricity Co. Press Confirm when it looks right.')]),
    ])
    const a = new Assistant(bank(), model)
    const view = await a.chat(undefined, 'pay the electricity bill, 320')

    expect(view.mode).toBe('claude')
    expect(view.drafts).toEqual([{ id: 'd1', payee: 'Electricity Co.', amount: 320, note: 'October bill', state: 'pending' }])
    expect(view.transcript.at(-1)).toEqual({ role: 'assistant', text: 'I prepared ¥320 to Electricity Co. Press Confirm when it looks right.' })

    const second = model.requests[1]!.messages
    expect(second[1]).toEqual({
      role: 'assistant',
      content: [thinking(), toolUse('t1', 'draft_transfer', { payee: 'Electricity Co.', amount: 320, note: 'October bill' })],
    })
    expect(second[2]).toMatchObject({ role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1' }] })
  })

  it('returns an invalid draft to the model as an error and creates nothing', async () => {
    const model = new ScriptedModel([
      reply([toolUse('t1', 'draft_transfer', { payee: 'X', amount: -5, note: '' })], 'tool_use'),
      reply([text('Which amount?')]),
    ])
    const view = await new Assistant(bank(), model).chat(undefined, 'pay X')
    expect(view.drafts).toEqual([])
    expect(model.requests[1]!.messages[2]).toMatchObject({ content: [{ type: 'tool_result', is_error: true }] })
  })

  it('answers a refusal with a fixed reply', async () => {
    const view = await new Assistant(bank(), new ScriptedModel([reply([], 'refusal')])).chat(undefined, 'hello')
    expect(view.transcript.at(-1)!.text).toBe(REFUSAL_REPLY)
  })
})

describe('assistant offline', () => {
  const offline = () => new Assistant(bank(), null)

  it('drafts a payment in English, Indonesian and Chinese', async () => {
    const a = offline()
    expect((await a.chat(undefined, 'pay 320 to Electricity Co.')).drafts[0]).toMatchObject({ payee: 'Electricity Co.', amount: 320 })
    expect((await a.chat(undefined, 'bayar 150000 ke PLN')).drafts[0]).toMatchObject({ payee: 'PLN', amount: 150000 })
    expect((await a.chat(undefined, '给张伟转500')).drafts[0]).toMatchObject({ payee: '张伟', amount: 500 })
  })

  it('warns about a coached payment and drafts nothing', async () => {
    const view = await offline().chat(undefined, 'the police said to move 50000 to a safe account')
    expect(view.drafts).toEqual([])
    expect(view.transcript.at(-1)!.text).toMatch(/scam/)
  })

  it('reads the balance', async () => {
    expect((await offline().chat(undefined, 'what is my balance?')).transcript.at(-1)!.text).toBe('Your balance is ¥250,000.')
  })

  it('settles a draft once', async () => {
    const a = offline()
    const { conversationId } = await a.chat(undefined, 'pay 320 to Electricity Co.')
    expect(a.settle(conversationId, 'd1', 'sent').state).toBe('sent')
    expect(() => a.settle(conversationId, 'd1', 'dismissed')).toThrow(/already sent/)
  })
})
