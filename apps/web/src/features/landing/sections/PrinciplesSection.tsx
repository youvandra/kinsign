import { Reveal } from '@/components/motion'
import { ArrowLink } from '@/components/ui'
import Container from '@/components/site/Container'
import SectionHeading from '../components/SectionHeading'
import { PRINCIPLES } from '../content'

export default function PrinciplesSection() {
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-white sm:py-32">
      <div className="absolute -right-40 top-20 h-[480px] w-[480px] rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
      <Container className="relative">
        <SectionHeading
          dark
          eyebrow="Principles"
          title="Designed so that no one has to be trusted with everything."
          lead="Each party holds only the part of the decision it is best placed to hold. The design is written down as invariants and checked by tests on every change."
        />
        <div className="grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.06} className="h-full">
              <div className="flex h-full flex-col bg-ink p-8 transition-colors duration-500 hover:bg-[#161c28] sm:p-10">
                <Icon size={26} className="text-accent" />
                <h3 className="mt-8 text-[22px] font-medium tracking-[-0.02em]">{title}</h3>
                <p className="mt-3 max-w-[44ch] text-[15px] leading-[1.6] text-white/60">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-10">
          <ArrowLink text="Read the security model" to="/docs/security" variant="light" />
        </div>
      </Container>
    </section>
  )
}
