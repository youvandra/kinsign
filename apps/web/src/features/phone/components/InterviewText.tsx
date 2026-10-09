import type { HoldView, InterviewReading } from '@kinsign/protocol'
import { useState, type FormEvent } from 'react'
import type { Strings } from '@/i18n'
import { api } from '@/lib/api'

/** Her own words during the pause. The bank adds only the warning signs it reads; nothing here can lift the pause. */
export default function InterviewText({ hold, t }: { hold: HoldView; t: Strings }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [reading, setReading] = useState<InterviewReading | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try {
      setReading(await api.interviewText(hold.holdId, text))
      setText('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-3">
      <label htmlFor="tell-us" className="text-[12px] font-medium text-gray-500">
        {t.tellUs}
      </label>
      <textarea
        id="tell-us"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.tellUsPlaceholder}
        className="mt-1.5 w-full resize-none rounded-2xl bg-ground2 px-4 py-3 text-[15px] outline-none ring-1 ring-inset ring-transparent focus:ring-ink"
      />
      <button
        type="submit"
        disabled={busy || !text.trim()}
        className="mt-2 min-h-[40px] w-full rounded-full bg-ground2 text-[13px] font-medium ring-1 ring-inset ring-gray-300 disabled:opacity-40"
      >
        {t.tellUsSend}
      </button>
      {reading && <p className="mt-2 text-[13px] text-ok">{t.noted(Object.keys(reading.answers).length)}</p>}
    </form>
  )
}
