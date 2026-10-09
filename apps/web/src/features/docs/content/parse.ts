/** Turns a docs Markdown file into a page: frontmatter, body, headings and plain text for search. */
import { slug } from 'github-slugger'

export interface Heading {
  depth: 2 | 3
  text: string
  id: string
}

export interface DocPage {
  slug: string
  title: string
  description: string
  /** Markdown without the H1. */
  body: string
  headings: Heading[]
  /** Body without Markdown syntax, for search. */
  text: string
}

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/

function frontmatter(source: string): { data: Record<string, string>; body: string } {
  const match = source.match(FRONTMATTER)
  if (!match) return { data: {}, body: source }
  const data: Record<string, string> = {}
  for (const line of match[1]!.split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { data, body: source.slice(match[0].length) }
}

/** Inline Markdown to the text a reader sees: `code`, [links](…), **bold**. */
export const plainInline = (s: string) =>
  s
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')

/** The id a heading gets, shared by the renderer and the table of contents. */
export const headingId = (text: string) => slug(text)

function withoutCode(body: string): string[] {
  let inFence = false
  return body.split('\n').filter((line) => {
    if (line.startsWith('```')) inFence = !inFence
    return !inFence && !line.startsWith('```')
  })
}

export function parseDoc(slugPath: string, source: string): DocPage {
  const { data, body } = frontmatter(source)
  const lines = withoutCode(body)
  const headings: Heading[] = []
  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.+)$/)
    if (m) {
      const text = plainInline(m[2]!.trim())
      headings.push({ depth: m[1]!.length as 2 | 3, text, id: headingId(text) })
    }
  }
  const title = data.title ?? body.match(/^#\s+(.+)$/m)?.[1] ?? slugPath
  // The page header shows the title, so the Markdown's own H1 is dropped.
  const content = body.replace(/^\s*#\s+.+\n/, '')
  const text = plainInline(lines.join(' ').replace(/[#>|]/g, ' ')).replace(/\s+/g, ' ').trim()
  return { slug: slugPath, title, description: data.description ?? '', body: content, headings, text }
}
