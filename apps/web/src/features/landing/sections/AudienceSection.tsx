import { Check } from 'lucide-react'
import { Reveal } from '@/components/motion'
import Container from '@/components/site/Container'
import SectionHeading from '../components/SectionHeading'
import { AUDIENCES } from '../content'

export default function AudienceSection() {
  return (
    <section className="bg-ground2 py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow="Built for everyone involved" title="One mechanism, three kinds of peace of mind." center />
        <div className="grid gap-4 lg:grid-cols-3">
          {AUDIENCES.map(({ icon: Icon, eyebrow, title, body, points }, i) => (
            <Reveal key={eyebrow} delay={i * 0.08} className="h-full">
              <article className="group flex h-full flex-col rounded-3xl bg-white p-7 transition-shadow duration-500 ease-axion hover:shadow-lift sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-gray-500">{eyebrow}</span>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ground2 text-ink transition-colors duration-500 group-hover:bg-accent group-hover:text-white">
                    <Icon size={20} />
                  </span>
                </div>
                <h3 className="mt-10 text-[24px] font-medium leading-[1.15] tracking-[-0.025em]">{title}</h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-gray-600">{body}</p>
                <ul className="mt-8 space-y-3 border-t border-gray-100 pt-6">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-[14px] text-gray-800">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
