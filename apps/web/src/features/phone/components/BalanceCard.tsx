import { yuan } from '@/lib/format'
import type { Lang, Strings } from '@/i18n'

export default function BalanceCard({ balance, t, lang }: { balance: number | undefined; t: Strings; lang: Lang }) {
  return (
    <div className="relative mt-4 overflow-hidden rounded-[22px] bg-ink p-5 text-white">
      <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(242,101,34,0.75),transparent_65%)] blur-md" />
      <div className="relative">
        <p className="text-[12px] text-white/60">{t.balance}</p>
        <p className="mt-1 text-[34px] font-medium tabular-nums tracking-[-0.03em]">{balance === undefined ? '—' : yuan(balance, lang)}</p>
        <div className="mt-5 flex justify-between text-[12px] text-white/60">
          <span>{t.account}</span>
          <span className="tabular-nums">•••• 6411</span>
        </div>
      </div>
    </div>
  )
}
