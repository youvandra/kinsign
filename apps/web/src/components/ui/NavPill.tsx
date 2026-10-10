import { Menu, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLink } from './ArrowButton'
import { Wordmark } from './LogoMark'

export interface NavLink {
  label: string
  href: string
}

/**
 * Axion's navigation: a white pill across the page with a dark round mark,
 * text links, a live note and a dark call to action; a bottom sheet on phones.
 */
export default function NavPill({
  title,
  links = [],
  note,
  cta,
  right,
}: {
  title?: string
  links?: NavLink[]
  note?: ReactNode
  cta?: { label: string; href: string }
  right?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])
  return (
    <header className={`relative ${open ? 'z-[60]' : 'z-20'}`}>
      <div className="mx-auto max-w-[1440px] p-2 sm:p-3">
        <div className="flex items-center justify-between gap-3 rounded-full bg-white p-[5px]">
          <div className="flex min-w-0 items-center gap-6">
            <a href="/" className="flex min-w-0 items-center gap-3 pl-3" aria-label="Kinsign home">
              <Wordmark className="h-[26px] sm:h-[28px]" />
              {title && <span className="truncate pr-1 text-[14px] text-gray-500">{title}</span>}
            </a>
            {links.length > 0 && (
              <nav className="hidden items-center gap-6 md:flex">
                {links.map((l) => (
                  <a key={l.href} href={l.href} className="text-[14px] text-gray-900 transition-colors duration-300 hover:text-gray-500">
                    {l.label}
                  </a>
                ))}
              </nav>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-4">
            {note && <span className="hidden items-center gap-2 text-[13px] text-gray-600 lg:flex">{note}</span>}
            {right}
            {cta && <ArrowLink className="hidden md:inline-flex" variant="dark" text={cta.label} href={cta.href} />}
            {(links.length > 0 || cta) && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-[13px] font-medium text-white md:hidden"
                aria-expanded={open}
                aria-label={open ? 'Close menu' : 'Open menu'}
              >
                <span>{open ? 'Close' : 'Menu'}</span>
                {open ? <X size={16} /> : <Menu size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 md:hidden ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black/60 transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
        <div className={`absolute inset-x-0 bottom-0 transition-transform duration-500 ease-sheet ${open ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="mx-3 mb-3 rounded-2xl bg-white p-6">
            {note && <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-[13px] text-gray-600">{note}</div>}
            <nav className="mt-6 flex flex-col gap-1">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-[28px] font-medium leading-tight tracking-[-0.02em] text-gray-900 transition-colors duration-300 hover:text-gray-500"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            {cta && <ArrowLink className="mt-8" block size="lg" text={cta.label} href={cta.href} onClick={() => setOpen(false)} />}
          </div>
        </div>
      </div>
    </header>
  )
}
