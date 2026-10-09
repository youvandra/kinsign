/**
 * Renders a docs page. Links inside the site stay in the app, headings get
 * the ids the table of contents uses, fenced code gets the shared CodeBlock,
 * and GitHub alerts become callouts.
 */
import { Link2 } from 'lucide-react'
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import { Link } from 'react-router'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from '@/components/code'
import { headingId } from '../content/parse'
import Callout, { type CalloutKind } from './Callout'

/** The text a reader sees inside rendered children, for heading ids. */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
  return ''
}

function Heading({ level, children }: { level: 2 | 3; children: ReactNode }) {
  const id = headingId(textOf(children))
  const Tag = level === 2 ? 'h2' : 'h3'
  const size = level === 2 ? 'mt-14 mb-4 text-[26px] tracking-[-0.025em]' : 'mt-10 mb-3 text-[19px] tracking-[-0.015em]'
  return (
    <Tag id={id} className={`group scroll-mt-28 font-medium leading-[1.25] text-ink ${size}`}>
      <a href={`#${id}`} className="relative">
        {children}
        <Link2 size={16} className="absolute -left-6 top-1/2 hidden -translate-y-1/2 text-gray-400 group-hover:block" aria-hidden="true" />
      </a>
    </Tag>
  )
}

const ALERT = /^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*/

/** A blockquote whose first line is `[!KIND]` is a GitHub alert. */
function Blockquote({ children }: { children?: ReactNode }) {
  const nodes = Children.toArray(children).filter((c) => !(typeof c === 'string' && c.trim() === ''))
  const first = nodes[0] as ReactElement<{ children?: ReactNode }> | undefined
  const firstChildren = first && isValidElement<{ children?: ReactNode }>(first) ? Children.toArray(first.props.children) : []
  const lead = firstChildren[0]
  const match = typeof lead === 'string' ? lead.match(ALERT) : null
  if (!match) return <blockquote className="my-6 border-l-2 border-accent pl-5 text-gray-700">{children}</blockquote>

  const kind: CalloutKind = match[1] === 'TIP' ? 'tip' : match[1] === 'NOTE' ? 'note' : 'warning'
  const rest = [String(lead).slice(match[0].length), ...firstChildren.slice(1)]
  return (
    <Callout kind={kind}>
      <p>{rest}</p>
      {nodes.slice(1)}
    </Callout>
  )
}

const isInternal = (href: string) => href.startsWith('/') && !href.startsWith('//')

const components: Components = {
  h1: ({ children }) => <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.035em] text-ink">{children}</h1>,
  h2: ({ children }) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  p: ({ children }) => <p className="my-4 text-[16px] leading-[1.75] text-gray-700">{children}</p>,
  a: ({ href = '', children }) =>
    isInternal(href) ? (
      <Link
        to={href}
        className="font-medium text-ink underline decoration-accent/50 decoration-2 underline-offset-[3px] transition-colors hover:decoration-accent"
      >
        {children}
      </Link>
    ) : (
      <a
        href={href}
        target={href.startsWith('#') ? undefined : '_blank'}
        rel="noopener"
        className="font-medium text-ink underline decoration-gray-300 decoration-2 underline-offset-[3px] transition-colors hover:decoration-ink"
      >
        {children}
      </a>
    ),
  ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-6 text-[16px] leading-[1.7] text-gray-700 marker:text-gray-400">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-6 text-[16px] leading-[1.7] text-gray-700 marker:text-gray-500">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  blockquote: Blockquote,
  hr: () => <hr className="my-10 border-gray-200" />,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-2xl ring-1 ring-inset ring-gray-200">
      <table className="w-full border-collapse text-left text-[14px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-ground2">{children}</thead>,
  th: ({ children }) => <th className="whitespace-nowrap px-4 py-3 font-medium text-ink">{children}</th>,
  td: ({ children }) => <td className="border-t border-gray-100 px-4 py-3 align-top leading-[1.6] text-gray-700">{children}</td>,
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const language = className?.match(/language-(\w+)/)?.[1]
    const code = String(children)
    if (language || code.includes('\n')) {
      return (
        <div className="my-6">
          <CodeBlock code={code} language={language} />
        </div>
      )
    }
    return <code className="rounded-md bg-ground2 px-1.5 py-0.5 font-mono text-[0.86em] text-ink ring-1 ring-inset ring-gray-200">{children}</code>
  },
}

export default function Markdown({ source }: { source: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {source}
    </ReactMarkdown>
  )
}
