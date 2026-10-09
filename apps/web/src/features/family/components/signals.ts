import type { HoldView } from '@kinsign/protocol'
import { BadgePlus, CheckCircle2, KeyRound, MonitorSmartphone, MousePointerClick, PhoneCall, TrendingUp, UserCheck, UserX, type LucideIcon } from 'lucide-react'
import type { Strings } from '@/i18n'

export interface Signal {
  icon: LucideIcon
  text: string
  /** A signal that argues against a scam, drawn muted. */
  calm?: boolean
}

const DURESS_REASON = 'duress PIN entered'

/** The facts a family member sees, in the order they matter. */
export function signalsOf(h: HoldView, t: Strings): Signal[] {
  const out: Signal[] = []
  if (h.reasons.includes(DURESS_REASON)) out.push({ icon: KeyRound, text: t.duress })
  if (h.channel.onCall) {
    out.push({ icon: PhoneCall, text: t.onCall(Math.round(h.channel.callSeconds / 60)) })
    out.push(h.channel.callerSaved ? { icon: UserCheck, text: t.saved, calm: true } : { icon: UserX, text: t.unsaved })
  }
  if (h.channel.screenCaptured) out.push({ icon: MonitorSmartphone, text: t.screen })
  if (h.channel.remoteControlApp) out.push({ icon: MousePointerClick, text: t.remote })
  out.push(h.features.newPayee ? { icon: BadgePlus, text: t.newPayee } : { icon: CheckCircle2, text: t.knownPayee, calm: true })
  if (h.features.aboveNorm) out.push({ icon: TrendingUp, text: t.ratio(h.features.amountRatio.toFixed(1)) })
  return out
}
