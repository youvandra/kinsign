import type { ReactNode } from 'react'
import { Reveal } from '@/components/motion'

/** A titled block of the benchmarks page. */
export default function Panel({ id, eyebrow, title, lead, children }: { id: string; eyebrow: string; title: string; lead: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 py-16 sm:py-20">
      <Reveal className="mb-10 grid gap-5 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
        <div>
          <p className="text-[13px] font-medium text-accent">{eyebrow}</p>
          <h2 className="mt-3 text-[clamp(1.7rem,3.4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.03em]">{title}</h2>
        </div>
        <p className="max-w-[52ch] text-[16px] leading-[1.65] text-gray-600">{lead}</p>
      </Reveal>
      {children}
    </section>
  )
}
