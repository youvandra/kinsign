/**
 * The sidebar: every page of docs/ in reading order. A unit test checks that
 * this list and the files on disk name the same pages.
 */
export interface NavSection {
  title: string
  pages: string[]
}

export const NAVIGATION: NavSection[] = [
  { title: 'Getting started', pages: ['introduction', 'quickstart'] },
  { title: 'Concepts', pages: ['concepts/holds', 'concepts/trusted-circle', 'concepts/release-record', 'concepts/risk-score', 'concepts/assistant'] },
  { title: 'SDK', pages: ['sdk/overview', 'sdk/client', 'sdk/devices', 'sdk/signing'] },
  { title: 'Reference', pages: ['reference/http-api', 'reference/contract'] },
  { title: 'Guides', pages: ['guides/fisco-bcos', 'guides/federation', 'guides/benchmarks'] },
  { title: 'Trust', pages: ['security'] },
]

export const DEFAULT_PAGE = 'introduction'
