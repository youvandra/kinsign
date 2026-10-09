import type { HoldView } from '@kinsign/protocol'
import type { Strings } from '@/i18n'

type Key = 'askedBySomeoneOnCall' | 'toldToKeepSecret' | 'promisedReturnOrThreatened'

/** What she answered on screen, merged across every attested interview record. */
export default function InterviewAnswers({ hold, t }: { hold: HoldView; t: Strings }) {
  const answers: Partial<Record<Key, boolean>> = Object.assign({}, ...hold.records.filter((r) => r.kind === 'interview').map((r) => r.body as object))
  const rows: [Key, string][] = (
    [
      ['askedBySomeoneOnCall', t.qAsked],
      ['toldToKeepSecret', t.qSecret],
      ['promisedReturnOrThreatened', t.qThreat],
    ] as [Key, string][]
  ).filter(([k]) => answers[k] !== undefined)
  if (rows.length === 0) return null
  return (
    <div className="mt-5 rounded-xl bg-ground2 px-4 py-3.5 text-[14px]">
      <p className="mb-1.5 text-[12px] font-medium text-gray-500">{t.answers}</p>
      {rows.map(([key, label]) => (
        <div key={key} className="flex justify-between gap-3 py-0.5 text-gray-700">
          <span>{label}</span>
          <b className={answers[key] ? 'text-accent-ink' : 'text-gray-500'}>{answers[key] ? t.yes : t.no}</b>
        </div>
      ))}
    </div>
  )
}
