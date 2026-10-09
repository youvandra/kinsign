import { ArrowUp, Check, Sparkles, X } from 'lucide-react'
import type { FormEvent } from 'react'
import type { Lang, Strings } from '@/i18n'
import { yuan } from '@/lib/format'
import type { AssistantSession } from '../useAssistant'

const SHOWN_LINES = 4

/** The assistant on the home screen: the last lines of the chat, its drafts, and the question box. */
export default function AssistantCard({ session, t, lang }: { session: AssistantSession; t: Strings; lang: Lang }) {
  const { view, text, setText, busy, ask, confirm, dismiss } = session
  const lines = view?.transcript.slice(-SHOWN_LINES) ?? []
  const submit = (e: FormEvent) => {
    e.preventDefault()
    void ask()
  }
  return (
    <section className="mt-4 rounded-[22px] bg-white p-[18px] shadow-card" aria-label={t.assistant}>
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft text-accent">
            <Sparkles size={16} />
          </span>
          <p className="text-[16px] font-semibold tracking-[-0.01em]">{t.assistant}</p>
        </div>
        {view && (
          <span className="rounded-full bg-ground2 px-2.5 py-1 text-[11px] font-medium text-gray-600">
            {view.mode === 'claude' ? t.assistantClaude : t.assistantOffline}
          </span>
        )}
      </header>

      {lines.length === 0 ? (
        <p className="mt-2 text-[13px] text-gray-500">{t.assistantSub}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {lines.map((line, i) => (
            <li
              key={`${view!.transcript.length - lines.length + i}`}
              className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-[14px] leading-[1.45] ${line.role === 'customer' ? 'ml-auto bg-ink text-white' : 'bg-ground2 text-ink'}`}
            >
              {line.text}
            </li>
          ))}
          {busy && <li className="w-fit rounded-2xl bg-ground2 px-3.5 py-2 text-[13px] text-gray-500">{t.assistantThinking}</li>}
        </ol>
      )}

      {view?.drafts.map((d) => (
        <div key={d.id} className="mt-3 rounded-2xl p-3.5 ring-1 ring-inset ring-gray-200">
          <p className="text-[11px] font-medium text-gray-500">{d.state === 'pending' ? t.draftFor : d.state === 'sent' ? t.draftSent : t.draftDismissed}</p>
          <p className="mt-0.5 text-[15px] font-medium">
            {yuan(d.amount, lang)} → {d.payee}
          </p>
          {d.note && <p className="text-[12px] text-gray-500">{d.note}</p>}
          {d.state === 'pending' && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirm(d.id)}
                className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-full bg-accent text-[13px] font-medium text-white disabled:opacity-40"
              >
                <Check size={15} /> {t.draftConfirm}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void dismiss(d.id)}
                className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-full bg-ground2 text-[13px] font-medium disabled:opacity-40"
              >
                <X size={15} /> {t.draftDismiss}
              </button>
            </div>
          )}
        </div>
      ))}

      <form onSubmit={submit} className="mt-3 flex items-center gap-2 rounded-full bg-ground2 p-1 pl-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.assistantPlaceholder}
          aria-label={t.assistant}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          aria-label={t.assistantAsk}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-white disabled:opacity-30"
        >
          <ArrowUp size={16} />
        </button>
      </form>
    </section>
  )
}
