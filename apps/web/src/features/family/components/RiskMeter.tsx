import type { Strings } from '@/i18n'

/** Score 0–100 on a gradient. The knob is positioned directly; CSS only eases later changes. */
export default function RiskMeter({ score, t }: { score: number; t: Strings }) {
  const risk = Math.round(score * 100)
  return (
    <div className="mt-6" role="meter" aria-label={t.risk} aria-valuemin={0} aria-valuemax={100} aria-valuenow={risk}>
      <div className="mb-2 flex justify-between text-[12px] text-gray-500">
        <span>{t.risk}</span>
        <b className="font-semibold tabular-nums text-ink">{risk}/100</b>
      </div>
      <div className="relative h-2 rounded-full bg-gradient-to-r from-gray-200 via-[#f7c4a6] to-accent">
        <i
          className="absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_3px_#111827] transition-[left] duration-700 ease-sheet"
          style={{ left: `${risk}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-gray-400">
        <span>{t.low}</span>
        <span>{t.high}</span>
      </div>
    </div>
  )
}
