import { ArrowUpRight, CreditCard, Grid2x2, ReceiptText } from 'lucide-react'
import type { Strings } from '@/i18n'

/** Decorative shortcuts, as on a real banking home screen. */
export default function QuickActions({ t }: { t: Strings }) {
  const items = [
    { icon: ArrowUpRight, label: t.qTransfer },
    { icon: ReceiptText, label: t.qBills },
    { icon: CreditCard, label: t.qTopup },
    { icon: Grid2x2, label: t.qMore },
  ]
  return (
    <div className="mt-4 grid grid-cols-4 gap-2" aria-hidden="true">
      {items.map(({ icon: Icon, label }) => (
        <div key={label} className="grid justify-items-center gap-1.5 text-[11px] text-gray-600">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-card">
            <Icon size={20} />
          </span>
          {label}
        </div>
      ))}
    </div>
  )
}
