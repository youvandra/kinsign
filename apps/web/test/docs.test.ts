import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NAVIGATION } from '../src/features/docs/content/navigation'
import { parseDoc } from '../src/features/docs/content/parse'
import { search } from '../src/features/docs/content/search'

const DOCS = new URL('../../../docs/', import.meta.url).pathname

function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? markdownFiles(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : [],
  )
}

const pages = markdownFiles(DOCS).map((file) => parseDoc(relative(DOCS, file).replace(/\.md$/, ''), readFileSync(file, 'utf8')))

describe('docs', () => {
  it('lists every page in the sidebar exactly once, and nothing else', () => {
    const inNav = NAVIGATION.flatMap((s) => s.pages)
    expect(new Set(inNav).size).toBe(inNav.length)
    expect([...inNav].sort()).toEqual(pages.map((p) => p.slug).sort())
  })

  it('gives every page a title and a description', () => {
    for (const p of pages) {
      expect(p.title, p.slug).not.toBe(p.slug)
      expect(p.description, p.slug).not.toBe('')
    }
  })

  it('links only to pages that exist', () => {
    const slugs = new Set(pages.map((p) => p.slug))
    const sitePages = new Set(['/', '/benchmarks', '/stage', '/phone', '/family'])
    for (const p of pages) {
      for (const [, href] of p.body.matchAll(/\]\((\/[^)#\s]*)/g)) {
        const ok = href!.startsWith('/docs/') ? slugs.has(href!.slice('/docs/'.length)) : sitePages.has(href!)
        expect(ok, `${p.slug} links to ${href}`).toBe(true)
      }
    }
  })
})

describe('parseDoc', () => {
  const page = parseDoc(
    'x',
    '---\ntitle: X page\ndescription: About x.\n---\n\n# X page\n\n## The `client`\n\n```ts\n## not a heading\n```\n\n### Deep [link](/a)\n',
  )

  it('reads the frontmatter and drops the H1', () => {
    expect(page.title).toBe('X page')
    expect(page.description).toBe('About x.')
    expect(page.body.startsWith('\n## The')).toBe(true)
  })

  it('collects h2 and h3 outside code, as plain text with ids', () => {
    expect(page.headings).toEqual([
      { depth: 2, text: 'The client', id: 'the-client' },
      { depth: 3, text: 'Deep link', id: 'deep-link' },
    ])
  })
})

describe('search', () => {
  it('ranks a title match above a body match and finds headings', () => {
    const hits = search(pages, 'signed decisions')
    expect(hits[0]!.page.slug).toBe('sdk/signing')
    expect(search(pages, 'timelock').length).toBeGreaterThan(0)
    expect(search(pages, '')).toEqual([])
  })
})
