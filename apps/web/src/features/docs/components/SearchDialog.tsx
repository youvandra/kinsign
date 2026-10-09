import { CornerDownLeft, FileText, Hash, Search } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { usePageVisible } from '@/lib/hooks'
import { PAGES } from '../content'
import { search, type SearchHit } from '../content/search'

const hrefOf = (hit: SearchHit) => `/docs/${hit.page.slug}${hit.anchor ? `#${hit.anchor.id}` : ''}`

/** ⌘K search over every page's title, headings and text. Arrow keys move, Enter opens. */
export default function SearchDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const visible = usePageVisible()
  const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const hits = useMemo(() => search(PAGES.values(), query), [query])

  useEffect(() => input.current?.focus(), [])
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const open = (hit: SearchHit | undefined) => {
    if (!hit) return
    navigate(hrefOf(hit))
    onClose()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === 'Enter') open(hits[cursor])
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search documentation">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-[620px] overflow-hidden rounded-3xl bg-white shadow-device"
        initial={visible ? { y: -12, scale: 0.98 } : false}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-5">
          <Search size={18} className="text-gray-400" />
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setCursor(0)
            }}
            placeholder="Search the docs"
            className="h-14 flex-1 bg-transparent text-[16px] outline-none placeholder:text-gray-400"
            aria-label="Search the docs"
          />
          <kbd className="rounded-md bg-ground2 px-2 py-1 font-mono text-[11px] text-gray-500">Esc</kbd>
        </div>
        <ul className="max-h-[56vh] overflow-y-auto p-2" role="listbox">
          {query && hits.length === 0 && <li className="px-4 py-10 text-center text-[14px] text-gray-500">Nothing matches “{query}”.</li>}
          {!query && <li className="px-4 py-10 text-center text-[14px] text-gray-500">Search titles, headings and text across every page.</li>}
          {hits.map((hit, i) => (
            <li key={hrefOf(hit)} role="option" aria-selected={i === cursor}>
              <button
                type="button"
                onMouseEnter={() => setCursor(i)}
                onClick={() => open(hit)}
                className={`flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left ${i === cursor ? 'bg-ground2' : ''}`}
              >
                <span className="mt-0.5 text-gray-400">{hit.anchor ? <Hash size={16} /> : <FileText size={16} />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-ink">
                    {hit.page.title}
                    {hit.anchor && <span className="font-normal text-gray-500"> › {hit.anchor.text}</span>}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[13px] text-gray-500">{hit.snippet}</span>
                </span>
                {i === cursor && <CornerDownLeft size={14} className="mt-1 text-gray-400" />}
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}
