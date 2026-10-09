import { ShieldCheck } from 'lucide-react'
import type { Strings } from '@/i18n'

export default function EmptyState({ t }: { t: Strings }) {
  return (
    <div className="rounded-3xl bg-white px-6 py-10 text-center shadow-card">
      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-ok-soft text-ok">
        <ShieldCheck size={24} />
      </span>
      <p className="text-[18px] font-medium tracking-[-0.01em]">{t.allClear}</p>
      <p className="mx-auto mt-1 max-w-[36ch] text-[14px] text-gray-500">{t.allClearBody}</p>
    </div>
  )
}
