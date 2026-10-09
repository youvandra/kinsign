import type { HoldView } from '@kinsign/protocol'
import { AlertTriangle, PhoneCall } from 'lucide-react'
import { motion } from 'motion/react'
import { ArrowButton, ArrowLink, Pill, Status } from '@/components/ui'
import { useT } from '@/i18n'
import { timeOf, yuan } from '@/lib/format'
import { useEntrance } from '@/lib/hooks'
import FamilyNote from './FamilyNote'
import InterviewAnswers from './InterviewAnswers'
import RiskMeter from './RiskMeter'
import SharedRecord from './SharedRecord'
import SignalList from './SignalList'
import { signalsOf } from './signals'

export const CARD_SPRING = { type: 'spring', stiffness: 380, damping: 34 } as const
/** Demo number for "Call Mum". A real app dials her saved number. */
const MUM_PHONE = 'tel:+8613800000000'

/** A hold waiting for the family: the facts, her answers, and the decision. */
export default function HoldCard({ hold, busy, onBlock, onApprove }: { hold: HoldView; busy: boolean; onBlock: () => void; onApprove: () => void }) {
  const { t, lang } = useT()
  const entrance = useEntrance({ y: 18, scale: 0.985 })
  return (
    <motion.article
      layout
      {...entrance}
      animate={{ y: 0, scale: 1 }}
      transition={CARD_SPRING}
      className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-lift ring-[1.5px] ring-accent sm:p-7"
    >
      <header className="mb-5 flex items-center justify-between gap-3">
        <Status state={hold.state} label={t.state[hold.state]} />
        <span className="text-[12px] tabular-nums text-gray-500">{timeOf(hold.at, lang)}</span>
      </header>

      <p className="text-[14px] text-gray-600">{lang === 'zh' ? `${t.mum}${t.wantsToSend}` : `${t.mum} ${t.wantsToSend}`}</p>
      <p className="mt-1 text-[clamp(2.6rem,7vw,3.6rem)] font-medium leading-none tracking-[-0.04em] tabular-nums">{yuan(hold.amount, lang)}</p>
      <p className="mt-3 text-[15px] text-gray-700">
        {t.to} <strong className="font-semibold text-ink">{hold.payee}</strong>
      </p>

      <FamilyNote hold={hold} />
      <RiskMeter score={hold.score} t={t} />
      <SignalList signals={signalsOf(hold, t)} />
      <InterviewAnswers hold={hold} t={t} />

      <div className="mt-5 flex gap-3 rounded-xl bg-ink px-[18px] py-4 text-[15px] font-medium leading-[1.5] text-white">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-accent" />
        {t.advice}
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        <ArrowButton text={t.block} size="lg" block disabled={busy} onClick={onBlock} className="sm:col-span-2" />
        <ArrowLink text={t.callMum} variant="outline" href={MUM_PHONE} icon={PhoneCall} block />
        <Pill disabled={busy} onClick={onApprove} className="min-h-[48px] w-full">
          {t.approveOpen}
        </Pill>
      </div>
      <p className="mt-4 text-[12px] leading-[1.5] text-gray-500">{t.reviewIn}</p>
      <SharedRecord hold={hold} t={t} />
    </motion.article>
  )
}
