import type { HoldView } from '@kinsign/protocol'
import { ShieldAlert, Smartphone, X } from 'lucide-react'
import { ArrowButton, Segmented, Status } from '@/components/ui'
import type { Lang, Strings } from '@/i18n'
import { yuan } from '@/lib/format'
import type { AnswerKey, Answers, PhoneAction } from '../usePhoneSession'
import InterviewText from './InterviewText'

interface Props {
  hold: HoldView
  t: Strings
  lang: Lang
  answers: Answers
  busy: PhoneAction | null
  onAnswer: (key: AnswerKey, yes: boolean) => void
  onReleaseMyself: () => void
  onCancel: () => void
  onAddColleague: () => void
}

/** The pause screen: what happened, the on-screen interview, and what she can (and cannot) do. */
export default function HoldPanel({ hold, t, lang, answers, busy, onAnswer, onReleaseMyself, onCancel, onAddColleague }: Props) {
  const questions: [AnswerKey, string][] = [
    ['askedBySomeoneOnCall', t.meAsked],
    ['toldToKeepSecret', t.meSecret],
    ['promisedReturnOrThreatened', t.meThreat],
  ]
  return (
    <>
      <div className="relative overflow-hidden rounded-[22px] bg-ink p-[22px] text-white">
        <div className="absolute -bottom-32 -right-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(242,101,34,0.65),transparent_65%)]" />
        <div className="relative">
          <span className="mb-3.5 grid h-11 w-11 place-items-center rounded-[14px] bg-accent">
            <ShieldAlert size={22} />
          </span>
          <h3 className="text-[22px] font-medium leading-[1.2] tracking-[-0.02em]">{t.paused}</h3>
          <p className="mt-2 text-[14px] leading-[1.55] text-white/80">{t.pausedWhy}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Status state={hold.state} label={t.state[hold.state]} onDark />
            <span className="text-[13px] tabular-nums text-white/70">
              {yuan(hold.amount, lang)} → {hold.payee}
            </span>
          </div>
        </div>
      </div>

      <p className="mb-1 mt-5 text-[12px] font-medium text-gray-500">{t.questions}</p>
      {questions.map(([key, label]) => (
        <div
          key={key}
          className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-gray-100 py-2.5 text-[14px] text-gray-700 first-of-type:border-t-0"
        >
          <span>{label}</span>
          <Segmented
            value={answers[key] === undefined ? undefined : answers[key] ? 'yes' : 'no'}
            options={[
              { v: 'yes', label: t.yes },
              { v: 'no', label: t.no },
            ]}
            onChange={(v) => onAnswer(key, v === 'yes')}
          />
        </div>
      ))}
      <InterviewText hold={hold} t={t} />

      <div className="mt-4 grid gap-2.5">
        <ArrowButton variant="dark" block text={t.releaseSelf} icon={Smartphone} disabled={!!busy} onClick={onReleaseMyself} />
        <ArrowButton variant="outline" block text={t.cancelPay} icon={X} disabled={!!busy} onClick={onCancel} />
        <button
          type="button"
          disabled={!!busy}
          onClick={onAddColleague}
          className="min-h-[40px] rounded-full text-[13px] font-medium text-gray-600 transition-colors hover:text-ink disabled:opacity-40"
        >
          {t.addPerson}
        </button>
      </div>
    </>
  )
}
