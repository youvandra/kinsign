import { BUILT_FOR, TECH } from '../content'

function Label({ text }: { text: string }) {
  return <li className="whitespace-nowrap font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">{text}</li>
}

/** A slow marquee: who Kinsign is built for, then what it is built on. The list is doubled so the loop is seamless. */
export default function TechStrip() {
  return (
    <section className="border-y border-gray-200 bg-white py-6" aria-label="Built for and built on">
      <div className="group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 animate-marquee items-center gap-12 pr-12 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          >
            <Label text="Built for" />
            {BUILT_FOR.map((name) => (
              <li key={name} className="whitespace-nowrap text-[16px] font-semibold tracking-[-0.01em] text-ink">
                {name}
              </li>
            ))}
            <Label text="Built on" />
            {TECH.map((name) => (
              <li key={name} className="flex items-center gap-3 whitespace-nowrap text-[15px] font-medium text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
                {name}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  )
}
