import { NavLink } from 'react-router'
import { NAVIGATION, PAGES } from '../content'

/** Sections and pages in reading order; the current page carries the accent. */
export default function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Documentation" className="space-y-8">
      {NAVIGATION.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-gray-400">{section.title}</p>
          <ul className="space-y-0.5">
            {section.pages.map((slug) => {
              const page = PAGES.get(slug)
              if (!page) return null
              return (
                <li key={slug}>
                  <NavLink
                    to={`/docs/${slug}`}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `relative block rounded-xl px-3 py-2 text-[14px] transition-colors duration-200 ${isActive ? 'bg-white font-medium text-ink shadow-card' : 'text-gray-600 hover:bg-white/60 hover:text-ink'}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent" aria-hidden="true" />}
                        {page.title}
                      </>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
