import { describe, expect, it } from 'vitest'
import { readInterview, yesOnly } from '../src/interview.ts'
import { summarizeHold } from '../src/summary.ts'
import { HOLD, reply, ScriptedModel, text } from './fixtures.ts'

describe('interview reading (I3)', () => {
  it('keeps only answers that are exactly true', () => {
    expect(yesOnly({ askedBySomeoneOnCall: true, toldToKeepSecret: false, promisedReturnOrThreatened: 'yes' })).toEqual({ askedBySomeoneOnCall: true })
    expect(yesOnly(null)).toEqual({})
  })

  it('reads pressure offline in three languages', async () => {
    expect(await readInterview('The police told me to keep this secret', null)).toEqual({ askedBySomeoneOnCall: true, toldToKeepSecret: true })
    expect(await readInterview('Polisi bilang rekening aman', null)).toEqual({ askedBySomeoneOnCall: true, promisedReturnOrThreatened: true })
    expect(await readInterview('警察说要保密', null)).toEqual({ askedBySomeoneOnCall: true, toldToKeepSecret: true })
    expect(await readInterview('He said he is from the police and I must not tell anyone', null)).toEqual({
      askedBySomeoneOnCall: true,
      toldToKeepSecret: true,
    })
    expect(await readInterview('I am paying my landlord', null)).toEqual({})
  })

  it('lets the model add answers and never hide one the rules found', async () => {
    const model = new ScriptedModel([reply([text('{"askedBySomeoneOnCall":false,"toldToKeepSecret":false,"promisedReturnOrThreatened":true}')])])
    expect(await readInterview('the officer on the phone said I would get it back', model)).toEqual({
      askedBySomeoneOnCall: true,
      promisedReturnOrThreatened: true,
    })
  })

  it('falls back to the rules when the model answer is unusable', async () => {
    const model = new ScriptedModel([reply([text('not json')])])
    expect(await readInterview('they said do not tell anyone', model)).toEqual({ askedBySomeoneOnCall: true, toldToKeepSecret: true })
  })
})

describe('family summary', () => {
  it('states the amount, the call, her answers and the call-back advice offline', async () => {
    const note = await summarizeHold(HOLD, 'en', null)
    expect(note).toContain('¥50,000')
    expect(note).toContain('40-minute call')
    expect(note).toContain('keep it secret')
    expect(note).toMatch(/Call her on a number you already know/)
    expect(await summarizeHold(HOLD, 'zh', null)).toContain('请先用您知道的号码给她打电话')
  })

  it('passes the facts as data and uses the model text', async () => {
    const model = new ScriptedModel([reply([text('Mum is paying ¥50,000 to a new account during a long call.')])])
    expect(await summarizeHold(HOLD, 'en', model)).toBe('Mum is paying ¥50,000 to a new account during a long call.')
    expect(model.requests[0]!.messages[0]!.content).toContain('<hold_facts>{"payee":"Public Security Safe Account"')
  })
})
