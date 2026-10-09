import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import type { DocPage } from '../content'

function Card({ page, dir }: { page: DocPage; dir: 'prev' | 'next' }) {
  const next = dir === 'next'
  return (
    <Link
      to={`/docs/${page.slug}`}
      className={`group flex flex-col gap-1 rounded-2xl p-5 ring-1 ring-inset ring-gray-200 transition-all duration-300 hover:ring-ink ${next ? 'items-end text-right sm:col-start-2' : ''}`}
    >
      <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
        {!next && <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />}
        {next ? 'Next' : 'Previous'}
        {next && <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />}
      </span>
      <span className="text-[16px] font-medium text-ink">{page.title}</span>
    </Link>
  )
}

export default function PrevNext({ prev, next }: { prev?: DocPage; next?: DocPage }) {
  return (
    <div className="mt-16 grid gap-3 sm:grid-cols-2">
      {prev && <Card page={prev} dir="prev" />}
      {next && <Card page={next} dir="next" />}
    </div>
  )
}
