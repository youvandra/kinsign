import type { DocPage } from './parse'

export interface SearchHit {
  page: DocPage
  /** A heading inside the page, when the match is there. */
  anchor?: { id: string; text: string }
  snippet: string
  score: number
}

const SNIPPET_RADIUS = 60

function snippetAround(text: string, at: number, length: number): string {
  const start = Math.max(0, at - SNIPPET_RADIUS)
  const end = Math.min(text.length, at + length + SNIPPET_RADIUS)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

/** Ranks pages by where every term appears: title, then headings, then body. */
export function search(pages: Iterable<DocPage>, query: string, limit = 8): SearchHit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []
  const hits: SearchHit[] = []
  for (const page of pages) {
    const title = page.title.toLowerCase()
    const text = page.text.toLowerCase()
    const all = `${title} ${page.description.toLowerCase()} ${page.headings.map((h) => h.text.toLowerCase()).join(' ')} ${text}`
    if (!terms.every((t) => all.includes(t))) continue

    const heading = page.headings.find((h) => terms.some((t) => h.text.toLowerCase().includes(t)))
    const first = text.indexOf(terms[0]!)
    let score = 0
    for (const t of terms) {
      if (title.includes(t)) score += 10
      if (heading?.text.toLowerCase().includes(t)) score += 4
      if (text.includes(t)) score += 1
    }
    hits.push({
      page,
      anchor: heading && { id: heading.id, text: heading.text },
      snippet: first >= 0 ? snippetAround(page.text, first, terms[0]!.length) : page.description,
      score,
    })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}
