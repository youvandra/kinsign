import { BUILT_FOR } from '../content'

/** Each copy repeats the list so one copy is wider than any screen; two copies make the loop seamless. */
const ROW = [...BUILT_FOR, ...BUILT_FOR, ...BUILT_FOR]

/** A slow marquee of who Kinsign is built for. */
export default function TechStrip() {
  return (
    <section className="border-y border-gray-200 bg-white py-6" aria-label="Built for">
      <div className="group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 animate-marquee items-center gap-12 pr-12 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          >
            {ROW.map((name, i) => (
              <li key={i} className="flex items-center gap-12 whitespace-nowrap">
                {i % BUILT_FOR.length === 0 && <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">Built for</span>}
                <span className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{name}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  )
}
