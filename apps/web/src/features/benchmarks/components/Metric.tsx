import type { ReactNode } from 'react'

/** A headline figure with what it means and the file it comes from. */
export default function Metric({ value, label, source, accent = false }: { value: ReactNode; label: string; source: string; accent?: boolean }) {
  return (
    <div className="flex flex-col rounded-3xl bg-white p-6 sm:p-7">
      <p className={`text-[clamp(2.2rem,4vw,3.2rem)] font-medium leading-none tracking-[-0.04em] tabular-nums ${accent ? 'text-accent' : 'text-ink'}`}>
        {value}
      </p>
      <p className="mt-5 text-[15px] leading-[1.55] text-gray-700">{label}</p>
      <p className="mt-auto pt-5 font-mono text-[11px] text-gray-400">{source}</p>
    </div>
  )
}
