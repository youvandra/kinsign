import { motion } from 'motion/react'
import { usePageVisible } from '@/lib/hooks'

export interface Bar {
  key: string
  label: string
  sub?: string
  value: number
  display: string
  highlight?: boolean
}

/**
 * the view; the value labels are plain text and readable from the start.
 */
export default function BarChart({ bars, max }: { bars: Bar[]; max?: number }) {
  const visible = usePageVisible()
  const top = max ?? Math.max(...bars.map((b) => b.value), 1e-9)
  return (
    <ul className="space-y-3">
      {bars.map((b, i) => (
        <li key={b.key} className="grid grid-cols-[minmax(0,11rem)_1fr] items-center gap-4 sm:grid-cols-[minmax(0,15rem)_1fr]">
          <div className="min-w-0">
            <p className={`truncate text-[14px] ${b.highlight ? 'font-semibold text-ink' : 'text-gray-700'}`}>{b.label}</p>
            {b.sub && <p className="truncate text-[12px] text-gray-500">{b.sub}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="h-7 flex-1 overflow-hidden rounded-lg bg-ground2">
              <motion.div
                className={`h-full rounded-lg ${b.highlight ? 'bg-accent' : 'bg-ink/80'}`}
                style={{ width: `${Math.max((b.value / top) * 100, 0.8)}%`, transformOrigin: 'left' }}
                initial={visible ? { scaleX: 0.3 } : false}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className={`w-16 shrink-0 text-right text-[14px] tabular-nums ${b.highlight ? 'font-semibold text-accent' : 'text-gray-700'}`}>
              {b.display}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
