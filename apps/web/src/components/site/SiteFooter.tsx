import { Link } from 'react-router'
import { FOOTER_COLUMNS } from './links'
import { LogoMark } from '@/components/ui'

export default function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-[1440px] px-5 pb-10 pt-16 sm:px-8 lg:px-12 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark className="h-10 w-10 ring-1 ring-white/15" />
              <span className="text-[18px] font-semibold">Kinsign · 亲签</span>
            </div>
            <p className="mt-5 max-w-[38ch] text-[15px] leading-[1.6] text-white/60">
              A release layer for payments made under pressure. Everyday payments go straight through; the rest wait for someone you trust.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[13px] font-medium text-white/40">{col.title}</p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.external ? (
                        <a href={l.to} target="_blank" rel="noopener" className="text-[14px] text-white/80 transition-colors hover:text-white">
                          {l.label}
                        </a>
                      ) : (
                        <Link to={l.to} className="text-[14px] text-white/80 transition-colors hover:text-white">
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-wrap items-end justify-between gap-6 border-t border-white/10 pt-8">
          <p className="select-none text-[clamp(3.5rem,14vw,11rem)] font-semibold leading-[0.8] tracking-[-0.06em] text-white/[0.07]" aria-hidden="true">
            Kinsign
          </p>
          <p className="text-[13px] text-white/40">© 2026 Kinsign</p>
        </div>
      </div>
    </footer>
  )
}
