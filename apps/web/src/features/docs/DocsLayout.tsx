import { X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { usePageVisible } from '@/lib/hooks'
import DocsHeader from './components/DocsHeader'
import DocsSidebar from './components/DocsSidebar'
import SearchDialog from './components/SearchDialog'

/** GitBook-style shell: header with search, sidebar, and the page with its own table of contents. */
export default function DocsLayout() {
  const { pathname } = useLocation()
  const visible = usePageVisible()
  const [searching, setSearching] = useState(false)
  // The drawer belongs to the page it was opened on, so navigating closes it.
  const [drawerOn, setDrawerOn] = useState<string | null>(null)
  const drawer = drawerOn === pathname
  const setDrawer = (open: boolean) => setDrawerOn(open ? pathname : null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearching((s) => !s)
      } else if (e.key === '/' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        setSearching(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen bg-ground">
      <DocsHeader onSearch={() => setSearching(true)} onMenu={() => setDrawer(true)} />
      <div className="mx-auto flex max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <aside className="sticky top-16 hidden scroll-quiet h-[calc(100vh-4rem)] w-[260px] shrink-0 overflow-y-auto py-8 pr-6 lg:block">
          <DocsSidebar />
        </aside>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawer(false)} />
          <motion.aside
            className="absolute inset-y-0 left-0 w-[300px] max-w-[85vw] overflow-y-auto bg-ground p-5"
            initial={visible ? { x: -40 } : false}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <button
              type="button"
              onClick={() => setDrawer(false)}
              className="mb-6 grid h-10 w-10 place-items-center rounded-full bg-white"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            <DocsSidebar onNavigate={() => setDrawer(false)} />
          </motion.aside>
        </div>
      )}
      {searching && <SearchDialog onClose={() => setSearching(false)} />}
    </div>
  )
}
