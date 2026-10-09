/** Site-wide destinations, so the header, the footer and the pages agree. */
export const REPO_URL = 'https://github.com/youvandra/kinsign'

export interface SiteLink {
  label: string
  to: string
  external?: boolean
}

export const HEADER_LINKS: SiteLink[] = [
  { label: 'Product', to: '/#product' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Developers', to: '/#developers' },
  { label: 'Docs', to: '/docs' },
  { label: 'Benchmarks', to: '/benchmarks' },
]

export const FOOTER_COLUMNS: { title: string; links: SiteLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', to: '/#product' },
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Live demo', to: '/stage' },
      { label: 'Benchmarks', to: '/benchmarks' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Documentation', to: '/docs' },
      { label: 'Quickstart', to: '/docs/quickstart' },
      { label: 'SDK', to: '/docs/sdk/overview' },
      { label: 'HTTP API', to: '/docs/reference/http-api' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Security model', to: '/docs/security' },
      { label: 'Release contract', to: '/docs/reference/contract' },
      { label: 'Federated score', to: '/docs/concepts/risk-score' },
      { label: 'Source code', to: REPO_URL, external: true },
    ],
  },
]
