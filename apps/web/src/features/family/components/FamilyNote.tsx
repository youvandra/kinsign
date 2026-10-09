import type { HoldView } from '@kinsign/protocol'
import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useT } from '@/i18n'
import { api } from '@/lib/api'

/**
 * The bank's note on this hold, in the reader's language. It is refreshed
 * when her answers change, and it is only words: deciding stays with him.
 */
export default function FamilyNote({ hold }: { hold: HoldView }) {
  const { t, lang } = useT()
  const [note, setNote] = useState<string>()
  const answers = hold.records.filter((r) => r.kind === 'interview').length
  useEffect(() => {
    let current = true
    api
      .holdSummary(hold.holdId, lang)
      .then((s) => current && setNote(s.text))
      .catch(() => {})
    return () => {
      current = false
    }
  }, [hold.holdId, lang, answers])
  if (!note) return null
  return (
    <div className="mt-5 rounded-2xl bg-ground2 p-4">
      <p className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500">
        <Sparkles size={13} className="text-accent" /> {t.familyNote}
      </p>
      <p className="mt-1.5 text-[15px] leading-[1.55] text-ink">{note}</p>
    </div>
  )
}
