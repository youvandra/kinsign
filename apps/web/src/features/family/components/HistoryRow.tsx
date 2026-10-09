import type { Hex, HoldView } from '@kinsign/protocol'
import { motion } from 'motion/react'
import { Status } from '@/components/ui'
import { useT, type Strings } from '@/i18n'
import { timeOf, yuan } from '@/lib/format'
import { CARD_SPRING } from './HoldCard'

function decidedBy(hold: HoldView, me: Hex | undefined, holder: Hex | undefined, t: Strings): string {
  const by = hold.decidedBy?.toLowerCase()
  if (!by) return ''
  if (by === me?.toLowerCase()) return t.decidedByYou
  if (by === holder?.toLowerCase()) return t.decidedByHer
  return t.decidedByBank
}

export default function HistoryRow({ hold, me, holder }: { hold: HoldView; me?: Hex; holder?: Hex }) {
  const { t, lang } = useT()
  return (
    <motion.div layout transition={CARD_SPRING} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-t border-gray-100 py-4 first:border-t-0 first:pt-0">
      <span className="truncate text-[14px] font-medium">{hold.payee}</span>
      <span className={`text-[14px] font-semibold tabular-nums ${hold.state === 'Released' ? '' : 'text-gray-400 line-through'}`}>
        {yuan(hold.amount, lang)}
      </span>
      <span className="flex items-center gap-2 text-[12px] text-gray-500">
        <Status state={hold.state} label={t.state[hold.state]} /> {decidedBy(hold, me, holder, t)}
      </span>
      <span className="text-[12px] tabular-nums text-gray-400">{timeOf(hold.at, lang)}</span>
    </motion.div>
  )
}
