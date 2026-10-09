import { useEffect, useState } from 'react'
import type { Heading } from '../content'

/** Follows the heading nearest the top of the view as the reader scrolls. */
function useActiveHeading(ids: string[]): string | undefined {
  const [active, setActive] = useState<string>()
  useEffect(() => {
    const onScroll = () => {
      let current: string | undefined
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < 140) current = id
      }
      setActive(current ?? ids[0])
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [ids])
  return active
}

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const active = useActiveHeading(headings.map((h) => h.id))
  if (headings.length === 0) return null
  return (
    <nav aria-label="On this page">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-gray-400">On this page</p>
      <ul className="space-y-1 border-l border-gray-200">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`-ml-px block border-l-2 py-1 text-[13px] leading-[1.45] transition-colors duration-200 ${h.depth === 3 ? 'pl-6' : 'pl-4'} ${active === h.id ? 'border-accent font-medium text-ink' : 'border-transparent text-gray-500 hover:text-ink'}`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
