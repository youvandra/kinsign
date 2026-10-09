import type { HoldView } from '@kinsign/protocol'
import { useState } from 'react'
import { DeviceFrame, isEmbedded } from '@/components/device'
import { Badge, LangSelect, LiveDot, NavPill } from '@/components/ui'
import { useT } from '@/i18n'
import { useTitle } from '@/lib/hooks'
import { short } from '@/lib/format'
import ApproveSheet from './components/ApproveSheet'
import CircleCard from './components/CircleCard'
import EmptyState from './components/EmptyState'
import HistoryRow from './components/HistoryRow'
import HoldCard from './components/HoldCard'
import { useFamily } from './useFamily'

/** Her son's device: decide held transfers, watch the circle, see what happened. */
export default function FamilyPage() {
  const embed = isEmbedded()
  const { t } = useT()
  useTitle(`Kinsign · ${t.appFamily}`)
  const family = useFamily()
  const { live, decided, busy, actions } = family
  const [approving, setApproving] = useState<HoldView | null>(null)

  const body = (
    <>
      <header className={embed ? 'mb-5 mt-1' : 'mb-8 mt-4 sm:mb-10'}>
        <h1 className={`font-medium leading-[1.08] tracking-[-0.03em] ${embed ? 'text-[26px]' : 'text-[clamp(1.9rem,4.6vw,3.2rem)]'}`}>{t.famHello}</h1>
        <p className="mt-2 flex items-center gap-2 text-[14px] text-gray-600">
          <LiveDot ok={live.length === 0} />
          {live.length ? t.famSubSome(live.length) : t.famSubNone}
        </p>
      </header>

      <div className={`grid items-start gap-8 ${embed ? '' : 'lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-12 lg:gap-y-10'}`}>
        <section className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="mb-4">
            <Badge n="1" label={t.needsYou} />
          </div>
          {/* Lists driven by polling never animate out: in a hidden tab animation frames stop, and an exit would linger. */}
          {live.length === 0 && <EmptyState t={t} />}
          {live.map((h) => (
            <HoldCard key={h.holdId} hold={h} busy={busy} onBlock={() => actions.block(h)} onApprove={() => setApproving(h)} />
          ))}
        </section>

        <aside className={`row-start-2 grid gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 ${embed ? '' : 'lg:sticky lg:top-4'}`}>
          <div className="mb-1">
            <Badge n="2" label={t.circle} />
          </div>
          <CircleCard me={family.me} proposals={family.proposals} now={family.chainNow} busy={busy} onVeto={actions.veto} />
        </aside>

        {decided.length > 0 && (
          <section className="min-w-0 lg:col-start-1 lg:row-start-2">
            <div className="mb-4">
              <Badge n="3" label={t.history} />
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
              {decided.map((h) => (
                <HistoryRow key={h.holdId} hold={h} me={family.me} holder={family.holder} />
              ))}
            </div>
          </section>
        )}
      </div>

      <ApproveSheet
        hold={approving}
        busy={busy}
        onClose={() => setApproving(null)}
        onApprove={(h) => {
          setApproving(null)
          actions.approve(h)
        }}
      />
    </>
  )

  if (embed) return <DeviceFrame embed>{body}</DeviceFrame>
  return (
    <div className="min-h-screen">
      <NavPill
        title={t.appFamily}
        right={<LangSelect />}
        note={
          <>
            <LiveDot ok={live.length === 0} /> {t.thisDevice} {family.me ? short(family.me) : '…'}
          </>
        }
      />
      <main className="mx-auto max-w-[1440px] px-5 pb-24 sm:px-8 lg:px-12">{body}</main>
    </div>
  )
}
