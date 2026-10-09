import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import type { Lang, Strings } from '@/i18n'
import { yuan } from '@/lib/format'
import type { FeedRow } from '../usePhoneSession'

const LIVE = new Set(['Held', 'Review'])
const RETURNED = new Set(['Blocked', 'Cancelled'])

export default function RecentFeed({ rows, t, lang }: { rows: readonly FeedRow[]; t: Strings; lang: Lang }) {
  return (
    <section className="mt-4 rounded-[22px] bg-white px-[18px] py-1.5 shadow-card">
      <p className="pb-1 pt-3 text-[12px] font-medium text-gray-500">{t.recent}</p>
      {rows.length === 0 && <p className="py-4 text-[13px] text-gray-500">{t.nothingYet}</p>}
      {rows.map((r) => (
        <div key={`${r.at}-${r.payee}`} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 border-t border-gray-100 py-3 first:border-t-0">
          <span className={`grid h-9 w-9 place-items-center rounded-full ${LIVE.has(r.state) ? 'bg-accent-soft text-accent-ink' : 'bg-ground2 text-gray-600'}`}>
            {RETURNED.has(r.state) ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-medium">{r.payee}</span>
            <span className="block text-[12px] text-gray-500">{r.state === 'paid' ? t.paidTitle : t.state[r.state]}</span>
          </span>
          <span className={`text-[14px] font-semibold tabular-nums ${RETURNED.has(r.state) ? 'text-gray-400 line-through' : ''}`}>−{yuan(r.amount, lang)}</span>
        </div>
      ))}
    </section>
  )
}
