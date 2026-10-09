/**
 * The assistant and the language features around a hold. The assistant only
 * reads and drafts; a draft becomes a transfer here, when the customer
 * confirms it on her own screen, and goes through the same hold rule.
 */
import { readInterview, summarizeHold, UnknownConversationError } from '@kinsign/agent'
import { API, type AssistantView, type HoldSummary, type InterviewReading, type TransferResult } from '@kinsign/protocol'
import type { AssistantContext } from '../assistant.ts'
import type { Bank } from '../bank.ts'
import { HttpError, type Router } from '../http/router.ts'
import { boolean, channel, hex32, lang, object, optionalString, string } from '../http/validate.ts'
import { holdView } from '../views.ts'

/** Turns the assistant's lookup errors into 404s. */
async function found<T>(run: () => T | Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (e) {
    if (e instanceof UnknownConversationError) throw new HttpError(404, e.message)
    throw e
  }
}

export function assistantRoutes(router: Router, bank: Bank, { assistant, model }: AssistantContext): void {
  router
    .get(API.assistant, async () => ({ mode: assistant.mode }))

    .post(API.assistantChat, async (raw): Promise<AssistantView> => {
      const b = object(raw)
      return found(() => assistant.chat(optionalString(b, 'conversationId', 40), string(b, 'text', 1000)))
    })

    .post(API.assistantConfirm, async (raw): Promise<{ view: AssistantView; result: TransferResult }> => {
      const b = object(raw)
      const conversationId = string(b, 'conversationId', 40)
      const draftId = string(b, 'draftId', 20)
      const draft = await found(() => assistant.draft(conversationId, draftId))
      if (draft.state !== 'pending') throw new HttpError(409, `draft ${draftId} is already ${draft.state}`)
      const call = channel(b.channel)
      // Claimed before the transfer, so a second tap cannot send it twice.
      assistant.settle(conversationId, draftId, 'sent')
      try {
        const result = await bank.transfer(draft.payee, draft.amount, call, {}, boolean(b, 'duress'))
        return { view: assistant.view(conversationId), result }
      } catch (e) {
        assistant.reopen(conversationId, draftId)
        throw e
      }
    })

    .post(API.assistantDismiss, async (raw): Promise<AssistantView> => {
      const b = object(raw)
      const conversationId = string(b, 'conversationId', 40)
      await found(() => assistant.settle(conversationId, string(b, 'draftId', 20), 'dismissed'))
      return assistant.view(conversationId)
    })

    // Her own words during a hold. Only the "yes" answers read from them are attested (I3).
    .post(API.interviewText, async (raw): Promise<InterviewReading> => {
      const b = object(raw)
      const holdId = hex32(b, 'holdId')
      bank.requireHold(holdId)
      const answers = await readInterview(string(b, 'text', 2000), model)
      if (Object.keys(answers).length === 0) return { answers, attested: false }
      const tx = await bank.engine.attest(holdId, 'interview', answers)
      return { answers, attested: tx.ok }
    })

    .post(API.familySummary, async (raw): Promise<HoldSummary> => {
      const b = object(raw)
      const holdId = hex32(b, 'holdId')
      const l = lang(b, 'lang')
      const text = await summarizeHold(await holdView(bank, holdId), l, model)
      return { holdId, lang: l, mode: model ? 'claude' : 'offline', text }
    })
}
