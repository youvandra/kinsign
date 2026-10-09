import { themes, type PrismTheme } from 'prism-react-renderer'
import './prism-languages'

/** One code theme for the docs and the landing: Axion ink with the accent for keywords. */
export const codeTheme: PrismTheme = {
  ...themes.oneDark,
  plain: { color: '#E5E7EB', backgroundColor: 'transparent' },
  styles: [
    ...themes.oneDark.styles,
    { types: ['keyword', 'builtin', 'important'], style: { color: '#FF8A4C' } },
    { types: ['string', 'char', 'attr-value'], style: { color: '#A7E3B9' } },
    { types: ['comment'], style: { color: '#7B8494', fontStyle: 'italic' } },
    { types: ['function'], style: { color: '#93C5FD' } },
    { types: ['number', 'boolean', 'constant'], style: { color: '#FCD34D' } },
  ],
}

const ALIASES: Record<string, string> = { sh: 'bash', shell: 'bash', zsh: 'bash', ts: 'tsx', typescript: 'tsx', js: 'jsx', sol: 'solidity', txt: 'text' }

/** The grammars this site loads; anything else renders as plain text. */
const SUPPORTED = new Set(['tsx', 'jsx', 'bash', 'json', 'solidity', 'python', 'yaml', 'markdown', 'text'])

export function languageOf(raw: string | undefined): string {
  const lang = ALIASES[raw ?? ''] ?? raw ?? 'text'
  return SUPPORTED.has(lang) ? lang : 'text'
}
