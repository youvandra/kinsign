/**
 * The assistant on Mum's phone. It drafts; Confirm sends the draft through
 * the bank's transfer with the phone's current call state, so a draft made
 * during a scam call is held like any other payment.
 */
import type { AssistantView } from '@kinsign/protocol'
import { useState } from 'react'
import { useToast } from '@/components/ui'
import { api } from '@/lib/api'
import type { PhoneSession } from './usePhoneSession'

export function useAssistant({ channelNow, duress, showResult, refresh }: PhoneSession['transfers']) {
  const toast = useToast()
  const [view, setView] = useState<AssistantView | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (body: () => Promise<void>) => {
    setBusy(true)
    try {
      await body()
    } catch (e) {
      toast((e as Error).message, 'warn')
    } finally {
      setBusy(false)
    }
  }

  const ask = () =>
    run(async () => {
      const said = text.trim()
      if (!said) return
      setText('')
      setView(await api.assistant.chat(said, view?.conversationId))
    })

  const confirm = (draftId: string) =>
    run(async () => {
      if (!view) return
      const draft = view.drafts.find((d) => d.id === draftId)
      const { view: next, result } = await api.assistant.confirm(view.conversationId, draftId, channelNow(), duress)
      setView(next)
      if (draft) showResult(result, draft.amount, draft.payee)
      void refresh()
    })

  const dismiss = (draftId: string) =>
    run(async () => {
      if (view) setView(await api.assistant.dismiss(view.conversationId, draftId))
    })

  return { view, text, setText, busy, ask, confirm, dismiss }
}

export type AssistantSession = ReturnType<typeof useAssistant>
