import type { Hex, ProposalView } from '@kinsign/protocol'
import { motion } from 'motion/react'
import { useT } from '@/i18n'
import { short } from '@/lib/format'
import { useEntrance } from '@/lib/hooks'
import { CARD_SPRING } from './HoldCard'

const TIMELOCK_SECONDS = 72 * 3600

function Person({ initial, name, sub, dark, mono }: { initial: string; name: string; sub: string; dark?: boolean; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[40px_1fr] items-center gap-3 border-t border-gray-100 py-3 first:border-t-0 first:pt-0">
      <span className={`grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold ${dark ? 'bg-ink text-white' : 'bg-ground2'}`}>{initial}</span>
      <span>
        <span className="block text-[14px] font-medium">{name}</span>
        <span className={`block text-gray-500 ${mono ? 'font-mono text-[11px]' : 'text-[12px]'}`}>{sub}</span>
      </span>
    </div>
  )
}

function Proposal({ p, now, busy, onVeto }: { p: ProposalView; now: number; busy: boolean; onVeto: (m: Hex) => void }) {
  const { t } = useT()
  const left = Math.max(0, p.effectiveAt - now)
  const progress = Math.min(100, ((TIMELOCK_SECONDS - left) / TIMELOCK_SECONDS) * 100)
  const pending = p.status === 'pending'
  const entrance = useEntrance({ y: 10 })
  const status = pending ? t.pendingIn(Math.ceil(left / 3600)) : p.status === 'vetoed' ? t.vetoedNote : t.effectiveNote
  return (
    <motion.div layout {...entrance} animate={{ y: 0 }} transition={CARD_SPRING} className="border-t border-gray-100 py-3">
      <div className="grid grid-cols-[40px_1fr_auto] items-center gap-3">
        <span
          className={`grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold ${pending ? 'bg-accent-soft text-accent-ink' : 'bg-ground2 text-gray-500'}`}
        >
          ?
        </span>
        <span className="min-w-0">
          <span className={`block truncate text-[14px] font-medium ${p.status === 'vetoed' ? 'text-gray-400 line-through' : ''}`}>{t[p.label]}</span>
          <span className="block text-[12px] text-gray-500">{status}</span>
        </span>
        {pending && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onVeto(p.member)}
            className="min-h-[36px] rounded-full bg-accent px-4 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            {t.veto}
          </button>
        )}
      </div>
      {pending && (
        <div className="ml-[52px] mt-2 h-1 overflow-hidden rounded bg-gray-100">
          <i className="block h-full rounded bg-accent transition-[width] duration-700 ease-axion" style={{ width: `${progress}%` }} />
        </div>
      )}
    </motion.div>
  )
}

/** Who can release Mum's held transfers, and anyone waiting out the 72-hour timelock to join. */
export default function CircleCard({
  me,
  proposals,
  now,
  busy,
  onVeto,
}: {
  me?: Hex
  proposals: readonly ProposalView[]
  now: number
  busy: boolean
  onVeto: (m: Hex) => void
}) {
  const { t } = useT()
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
      <Person initial={t.mum.slice(0, 1)} name={t.mum} sub={t.holder} />
      <Person initial={t.you.slice(0, 1)} name={t.you} sub={`${t.memberSince} · ${me ? short(me) : '…'}`} dark mono />
      {proposals.map((p) => (
        <Proposal key={p.member} p={p} now={now} busy={busy} onVeto={onVeto} />
      ))}
    </div>
  )
}
