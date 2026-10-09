import type { HoldView } from '@kinsign/protocol'
import { ChevronDown, ShieldCheck } from 'lucide-react'
import type { Strings } from '@/i18n'

/** The hold's records, its on-chain hash chain, and whether the two agree. */
export default function SharedRecord({ hold, t }: { hold: HoldView; t: Strings }) {
  return (
    <details className="group mt-5 border-t border-gray-100 pt-3.5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] text-gray-500 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <ChevronDown size={14} className="transition-transform duration-300 group-open:rotate-180" /> {t.record}
        </span>
        <span className={`inline-flex items-center gap-1.5 font-medium ${hold.chainMatches ? 'text-ok' : 'text-accent-ink'}`}>
          <ShieldCheck size={14} /> {hold.chainMatches ? t.recordOk : t.recordBad}
        </span>
      </summary>
      <ol className="mt-2.5 grid list-decimal gap-1 pl-5 text-[12px] text-gray-600">
        {hold.records.map((r) => (
          <li key={r.hash}>
            {r.kind} <span className="font-mono text-gray-400">{r.hash.slice(0, 14)}…</span>
          </li>
        ))}
        {hold.refused.map((r, i) => (
          <li key={`refused-${i}`} className="text-accent-ink">
            {r.kind} · {t.refusedNote} ({r.error})
          </li>
        ))}
      </ol>
      <p className="mt-2 break-all font-mono text-[11px] text-gray-400">{hold.chainHash}</p>
    </details>
  )
}
