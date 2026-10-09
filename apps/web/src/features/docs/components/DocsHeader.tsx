import { Menu, Search } from 'lucide-react'
import { Link } from 'react-router'
import GitHubIcon from '@/components/site/GitHubIcon'
import { REPO_URL } from '@/components/site/links'
import Logo from '@/components/site/Logo'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export default function DocsHeader({ onSearch, onMenu }: { onSearch: () => void; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-ground/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white lg:hidden" aria-label="Open navigation">
          <Menu size={18} />
        </button>
        <Logo suffix="Docs" />
        <button
          type="button"
          onClick={onSearch}
          className="ml-auto flex h-10 w-10 items-center gap-3 rounded-full bg-white px-3 text-[14px] text-gray-500 ring-1 ring-inset ring-gray-200 transition-shadow hover:ring-gray-300 sm:w-[300px] sm:px-4 lg:ml-10 lg:mr-auto"
          aria-label="Search the docs"
        >
          <Search size={16} className="shrink-0" />
          <span className="hidden flex-1 text-left sm:block">Search the docs</span>
          <kbd className="hidden rounded-md bg-ground2 px-1.5 py-0.5 font-mono text-[11px] sm:block">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/" className="rounded-full px-3 py-2 text-[14px] text-gray-600 hover:text-ink">
            Home
          </Link>
          <Link to="/benchmarks" className="rounded-full px-3 py-2 text-[14px] text-gray-600 hover:text-ink">
            Benchmarks
          </Link>
          <Link to="/stage" className="rounded-full px-3 py-2 text-[14px] text-gray-600 hover:text-ink">
            Demo
          </Link>
        </nav>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener"
          aria-label="Source code on GitHub"
          className="grid h-10 w-10 place-items-center rounded-full text-gray-600 hover:bg-white hover:text-ink"
        >
          <GitHubIcon />
        </a>
      </div>
    </header>
  )
}
