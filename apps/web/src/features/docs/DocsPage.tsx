import { ChevronRight, PencilLine } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { REPO_URL } from '@/components/site/links'
import { useTitle } from '@/lib/hooks'
import Markdown from './components/Markdown'
import PrevNext from './components/PrevNext'
import TableOfContents from './components/TableOfContents'
import { neighbours, PAGES, sectionOf } from './content'

function Missing({ slug }: { slug: string }) {
  return (
    <div className="py-24">
      <p className="text-[13px] font-medium text-accent">404</p>
      <h1 className="mt-2 text-[32px] font-medium tracking-[-0.03em]">No page at /docs/{slug}</h1>
      <p className="mt-3 text-gray-600">
        It may have moved. Try the search, or start from the{' '}
        <Link to="/docs/introduction" className="font-medium text-ink underline decoration-accent/50 decoration-2 underline-offset-[3px]">
          introduction
        </Link>
        .
      </p>
    </div>
  )
}

export default function DocsPage() {
  const slug = (useParams()['*'] ?? '').replace(/\/+$/, '')
  const page = PAGES.get(slug)
  useTitle(page ? `${page.title} · Kinsign Docs` : 'Kinsign Docs')
  if (!page) return <Missing slug={slug} />

  const section = sectionOf(slug)
  const { prev, next } = neighbours(slug)
  return (
    <div className="flex gap-12 xl:gap-16">
      <article key={slug} className="min-w-0 max-w-[760px] flex-1 animate-page-in py-10 lg:py-12">
        <div className="mb-6 flex items-center gap-1.5 text-[13px] text-gray-500">
          <Link to="/docs" className="hover:text-ink">
            Docs
          </Link>
          {section && (
            <>
              <ChevronRight size={13} />
              <span>{section.title}</span>
            </>
          )}
        </div>
        <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.035em] text-ink">{page.title}</h1>
        {page.description && <p className="mt-3 text-[18px] leading-[1.6] text-gray-500">{page.description}</p>}
        <div className="mt-8 border-t border-gray-200" />
        <Markdown source={page.body} />
        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-6 text-[13px] text-gray-500">
          <a href={`${REPO_URL}/blob/main/docs/${slug}.md`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 hover:text-ink">
            <PencilLine size={14} /> Edit this page on GitHub
          </a>
        </div>
        <PrevNext prev={prev} next={next} />
      </article>
      <aside className="sticky top-16 hidden scroll-quiet h-[calc(100vh-4rem)] w-[220px] shrink-0 overflow-y-auto py-12 xl:block">
        <TableOfContents headings={page.headings} />
      </aside>
    </div>
  )
}
