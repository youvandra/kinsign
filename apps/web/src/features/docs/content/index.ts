/**
 * All docs pages, read at build time from the repository's docs/ folder, the
 * same files GitHub renders. Vite inlines them, so the docs need no server.
 */
import { DEFAULT_PAGE, NAVIGATION } from './navigation'
import { parseDoc, type DocPage } from './parse'

const files = import.meta.glob<string>('@docs/**/*.md', { query: '?raw', import: 'default', eager: true })

const slugOf = (path: string) => path.replace(/^.*?\/docs\//, '').replace(/\.md$/, '')

export const PAGES: ReadonlyMap<string, DocPage> = new Map(Object.entries(files).map(([path, source]) => [slugOf(path), parseDoc(slugOf(path), source)]))

/** Pages in sidebar order, for previous and next links. */
export const ORDER: string[] = NAVIGATION.flatMap((s) => s.pages).filter((p) => PAGES.has(p))

export const sectionOf = (slug: string) => NAVIGATION.find((s) => s.pages.includes(slug))

export function neighbours(slug: string): { prev?: DocPage; next?: DocPage } {
  const i = ORDER.indexOf(slug)
  return { prev: i > 0 ? PAGES.get(ORDER[i - 1]!) : undefined, next: i >= 0 ? PAGES.get(ORDER[i + 1] ?? '') : undefined }
}

export { DEFAULT_PAGE, NAVIGATION, type DocPage }
export type { Heading } from './parse'
