import type { ReactNode } from 'react'
import { Reveal } from '@/components/motion'

/** Eyebrow, headline and an optional lead beside it, in the landing's rhythm. */
export default function SectionHeading({
  eyebrow,
  title,
  lead,
  dark = false,
  center = false,
}: {
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  dark?: boolean
  center?: boolean
}) {
  return (
    <Reveal className={`mb-12 sm:mb-16 ${center ? 'mx-auto max-w-[760px] text-center' : ''}`}>
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-medium sm:text-[13px] ${dark ? 'border-white/20 text-white/80' : 'border-gray-300 text-ink'}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        {eyebrow}
      </span>
      <div className={`mt-6 grid gap-6 ${lead && !center ? 'lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-16' : ''}`}>
        <h2 className="text-balance text-[clamp(1.9rem,4.4vw,3.6rem)] font-medium leading-[1.06] tracking-[-0.035em]">{title}</h2>
        {lead && (
          <p className={`max-w-[48ch] text-[16px] leading-[1.65] sm:text-[17px] ${dark ? 'text-white/65' : 'text-gray-600'} ${center ? 'mx-auto' : ''}`}>
            {lead}
          </p>
        )}
      </div>
    </Reveal>
  )
}
