/**
 * State and actions of Mum's phone: the call the director sets, the transfer
 * form, the sheet that shows a hold or a result, and her own device's actions.
 */
import type { ChannelState, Hex, HoldView, TransferResult } from '@kinsign/protocol'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/ui'
import { useT } from '@/i18n'
import { api, isLive } from '@/lib/api'
import { usePoll } from '@/lib/hooks'
import { NO_CALL, useSceneChannel, type CallState } from '@/lib/scene'
import { useSigner } from '@/lib/use-signer'

export type AnswerKey = 'askedBySomeoneOnCall' | 'toldToKeepSecret' | 'promisedReturnOrThreatened'
export type Answers = Partial<Record<AnswerKey, boolean>>

export type SheetState =
  | { kind: 'closed' }
  | { kind: 'hold'; holdId: Hex }
  | { kind: 'paid'; amount: number; payee: string }
  | { kind: 'result'; hold: HoldView }

export type PhoneAction = 'send' | 'self' | 'cancel' | 'add'

export interface FeedRow {
  at: number
  payee: string
  amount: number
  state: HoldView['state'] | 'paid'
}

const MINUTE = 60_000

export function usePhoneSession() {
  const { t } = useT()
  const toast = useToast()
  const [cfg] = usePoll(api.config, 60_000)
  const [links] = usePoll(api.demo.links, 60_000)
  const [account, refreshAccount] = usePoll(api.account, 2000)
  const [holds, refreshHolds] = usePoll(api.holds, 2000)
  const signer = useSigner('customer', cfg)

  const [call, setCall] = useState<CallState>(NO_CALL)
  const [callSince, setCallSince] = useState<number | null>(null)
  /** The call that just ended, so a payment straight after it is judged like one made during it. */
  const [lastCall, setLastCall] = useState<{ endedAt: number; seconds: number; callerSaved: boolean } | null>(null)
  const [payee, setPayee] = useState('')
  const [amount, setAmount] = useState('')
  /** A payment that went through and has not been dismissed. */
  const [paid, setPaid] = useState<{ amount: number; payee: string } | null>(null)
  /** The hold this phone is following, and the one whose result was dismissed. */
  const [watched, setWatched] = useState<Hex | null>(null)
  const [dismissed, setDismissed] = useState<Hex | null>(null)
  const [answers, setAnswers] = useState<Answers>({})
  const [busy, setBusy] = useState<PhoneAction | null>(null)

  /** `fresh` starts a new scene, which forgets the previous call. */
  const applyCall = useCallback(
    (c: CallState, fresh = false) => {
      if (fresh) setLastCall(null)
      else if (call.onCall && !c.onCall && callSince)
        setLastCall({ endedAt: Date.now(), seconds: Math.round((Date.now() - callSince) / 1000), callerSaved: call.callerSaved })
      setCall(c)
      setCallSince(c.onCall ? Date.now() - c.minutes * MINUTE : null)
    },
    [call, callSince],
  )

  const post = useSceneChannel((m) => {
    if (m.type === 'scene') {
      setPayee(m.payee)
      setAmount(String(m.amount))
      applyCall(m.call, true)
      setPaid(null)
      setDismissed(watched)
    } else if (m.type === 'call') {
      applyCall(m.call)
    }
  })
  // Tell the director what the phone's call looks like, whenever it changes.
  useEffect(() => post({ type: 'state', call }), [post, call])

  // Follow the newest live hold, including one opened before a reload. Adjusting
  // state during render (not in an effect) is React's pattern for derived state.
  const live = holds?.find(isLive)
  if (live && live.holdId !== watched) setWatched(live.holdId)
  const watchedHold = holds?.find((h) => h.holdId === watched)

  // The sheet is derived from the data: a live hold shows the pause screen; once
  // decided, its result shows until dismissed; a fresh payment shows its receipt.
  const sheet: SheetState = paid
    ? { kind: 'paid', ...paid }
    : watchedHold && isLive(watchedHold)
      ? { kind: 'hold', holdId: watchedHold.holdId }
      : watchedHold && watched !== dismissed
        ? { kind: 'result', hold: watchedHold }
        : { kind: 'closed' }
  const currentHold = sheet.kind === 'hold' ? watchedHold : undefined

  const refresh = useCallback(() => Promise.all([refreshHolds(), refreshAccount()]), [refreshHolds, refreshAccount])

  /** Runs one action with a busy flag and turns failures into a toast. */
  const run = useCallback(
    async (action: PhoneAction, body: () => Promise<void>) => {
      setBusy(action)
      try {
        await body()
      } catch (e) {
        toast((e as Error).message, 'warn')
      } finally {
        setBusy(null)
        void refresh()
      }
    },
    [toast, refresh],
  )

  /** What the phone reports about the call at this moment, for any transfer it sends. */
  const channelNow = useCallback(
    (): ChannelState => ({
      onCall: call.onCall,
      callSeconds: call.onCall && callSince ? Math.round((Date.now() - callSince) / 1000) : 0,
      callerSaved: call.onCall && call.callerSaved,
      screenCaptured: call.screenCaptured,
      remoteControlApp: call.remoteControlApp,
      ...(!call.onCall && lastCall
        ? { lastCall: { endedSecondsAgo: Math.round((Date.now() - lastCall.endedAt) / 1000), seconds: lastCall.seconds, callerSaved: lastCall.callerSaved } }
        : {}),
    }),
    [call, callSince, lastCall],
  )

  /** A transfer the bank answered: follow its hold, or show the receipt. */
  const showResult = useCallback((result: TransferResult, amount: number, to: string) => {
    setAnswers({})
    if (result.holdId) setWatched(result.holdId)
    else setPaid({ amount, payee: to })
  }, [])

  const send = () =>
    run('send', async () => {
      const value = Number(amount)
      const to = payee.trim()
      if (!to || !value) return
      showResult(await api.transfer({ payee: to, amount: value, duress: call.duress, channel: channelNow() }), value, to)
    })

  const releaseMyself = () =>
    run('self', async () => {
      if (!signer || !currentHold) return
      const r = await signer.release(currentHold)
      toast(r.ok ? t.state.Released : `${t.releaseRefused} (${r.error})`, r.ok ? 'ok' : 'warn')
    })

  const cancel = () =>
    run('cancel', async () => {
      if (!signer || !currentHold) return
      const r = await signer.cancel(currentHold)
      toast(r.ok ? t.cancelled : String(r.error), r.ok ? 'ok' : 'warn')
    })

  const addCallersColleague = () =>
    run('add', async () => {
      if (!signer || !links) return
      const r = await signer.proposeMember(links.colleague)
      toast(r.ok ? t.addDone : `${t.addRefused} (${r.error})`, r.ok ? 'info' : 'warn')
    })

  /** Only a "yes" reaches the bank: the interview can raise risk, never lower it. */
  const answer = (key: AnswerKey, yes: boolean) => {
    setAnswers((a) => ({ ...a, [key]: yes }))
    if (yes && currentHold) void api.interview(currentHold.holdId, { [key]: true }).catch(() => {})
  }

  const feed = useMemo<FeedRow[]>(() => {
    const rows: FeedRow[] = [
      ...(account?.paid ?? []).map((p) => ({ at: p.at, payee: p.payee, amount: p.amount, state: 'paid' as const })),
      ...(holds ?? []).map((h) => ({ at: h.at, payee: h.payee, amount: h.amount, state: h.state })),
    ]
    return rows.sort((a, b) => b.at - a.at).slice(0, 6)
  }, [account, holds])

  return {
    cfg,
    account,
    feed,
    call,
    callSince,
    form: { payee, amount, setPayee, setAmount: (v: string) => setAmount(v.replace(/[^\d]/g, '')) },
    sheet,
    currentHold,
    closeSheet: () => {
      setPaid(null)
      setDismissed(watched)
    },
    answers,
    busy,
    transfers: { channelNow, duress: call.duress, showResult, refresh },
    actions: { send, releaseMyself, cancel, addCallersColleague, answer },
  }
}

export type PhoneSession = ReturnType<typeof usePhoneSession>
