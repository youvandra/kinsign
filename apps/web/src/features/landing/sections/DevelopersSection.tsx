import { BookOpen, Boxes, FileCode2, Terminal } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { CodeBlock } from '@/components/code'
import { Reveal } from '@/components/motion'
import { ArrowLink } from '@/components/ui'
import Container from '@/components/site/Container'
import SectionHeading from '../components/SectionHeading'
import { SDK_SNIPPETS } from '../content'

const RESOURCES = [
  { icon: Terminal, title: 'Quickstart', body: 'Chain, bank API and two phones, running locally.', to: '/docs/quickstart' },
  { icon: Boxes, title: 'SDK', body: 'Client, device keys and signed decisions.', to: '/docs/sdk/overview' },
  { icon: FileCode2, title: 'Release contract', body: 'Functions, events and errors.', to: '/docs/reference/contract' },
  { icon: BookOpen, title: 'Concepts', body: 'Holds, circles, records and the score.', to: '/docs/concepts/holds' },
]

export default function DevelopersSection() {
  const [tab, setTab] = useState(0)
  const snippet = SDK_SNIPPETS[tab]!
  const tabs = (
    <div className="flex gap-1" role="tablist" aria-label="Code samples">
      {SDK_SNIPPETS.map((s, i) => (
        <button
          key={s.label}
          type="button"
          role="tab"
          aria-selected={i === tab}
          onClick={() => setTab(i)}
          className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${i === tab ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/80'}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
  return (
    <section id="developers" className="scroll-mt-24 bg-white py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="For developers"
          title="A few lines to hold, a few more to decide."
          lead="A typed TypeScript SDK, a small HTTP API and one Solidity contract. Every path is tested, and the docs walk through each of them."
        />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
          <Reveal className="min-w-0">
            <CodeBlock code={snippet.code} language={snippet.language} header={tabs} />
          </Reveal>
          <div className="flex flex-col">
            <div className="grid gap-3 sm:grid-cols-2">
              {RESOURCES.map(({ icon: Icon, title, body, to }, i) => (
                <Reveal key={title} delay={i * 0.06} className="h-full">
                  <Link to={to} className="group flex h-full flex-col rounded-2xl bg-ground2 p-5 transition-colors duration-300 hover:bg-gray-200/70">
                    <Icon size={20} className="text-accent" />
                    <span className="mt-6 text-[16px] font-medium tracking-[-0.01em]">
                      {title} <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
                    </span>
                    <span className="mt-1 text-[14px] text-gray-600">{body}</span>
                  </Link>
                </Reveal>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <ArrowLink text="Read the docs" to="/docs" variant="dark" size="lg" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
