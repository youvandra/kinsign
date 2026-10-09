import { AlertTriangle, Info, Lightbulb, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type CalloutKind = 'note' | 'tip' | 'warning'

const STYLES: Record<CalloutKind, { icon: LucideIcon; label: string; box: string; mark: string }> = {
  note: { icon: Info, label: 'Note', box: 'bg-[#F1F5FB] ring-[#D6E2F3]', mark: 'text-[#2F5EA8]' },
  tip: { icon: Lightbulb, label: 'Tip', box: 'bg-ok-soft ring-[#CFE3D6]', mark: 'text-ok' },
  warning: { icon: AlertTriangle, label: 'Warning', box: 'bg-accent-soft ring-[#F6D3BF]', mark: 'text-accent-ink' },
}

/** GitHub-style alerts (`> [!NOTE]`), so the same files read well on GitHub and here. */
export default function Callout({ kind, children }: { kind: CalloutKind; children: ReactNode }) {
  const { icon: Icon, label, box, mark } = STYLES[kind]
  return (
    <aside className={`my-6 flex gap-3 rounded-2xl p-4 ring-1 ring-inset ${box}`}>
      <Icon size={18} className={`mt-[3px] shrink-0 ${mark}`} />
      <div className="min-w-0 text-[15px] leading-[1.65] [&>p]:m-0">
        <span className={`mr-1.5 font-semibold ${mark}`}>{label}.</span>
        {children}
      </div>
    </aside>
  )
}
