import { TECH } from '../content'

/** A slow marquee of what Kinsign is built on. The list is doubled so the loop is seamless. */
export default function TechStrip() {
  return (
    <section className="border-y border-gray-200 bg-white py-6" aria-label="Built on">
      <div className="group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 animate-marquee items-center gap-12 pr-12 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          >
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
