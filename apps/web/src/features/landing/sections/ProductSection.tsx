import { ArrowRight, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { Reveal } from '@/components/motion'
import Container from '@/components/site/Container'
import PhoneShell from '../components/PhoneShell'
import SectionHeading from '../components/SectionHeading'
import { CallIsland, FamilyScreen, HoldScreen } from '../components/screens'

function Side({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-[13px] font-medium text-white/80">{label}</p>
      <p className="mt-1 text-center text-[12px] text-white/45">{note}</p>
      <div className="mt-6 w-[230px] sm:w-[250px]">{children}</div>
    </div>
  )
}

export default function ProductSection() {
  return (
    <section id="product" className="scroll-mt-24 bg-ground2 py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="The idea"
          title="Move the final step outside the call."
          lead="A caller can coach every tap on one phone. They cannot reach a second phone in someone else’s hand. Kinsign puts the release there, with a person the customer trusted before the call began."
        />
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-12 sm:px-12 sm:py-16">
            <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
            <div className="relative grid items-center gap-12 md:grid-cols-[1fr_auto_1fr]">
              <Side label="Inside the call" note="The customer, guided by the caller">
                <PhoneShell island={<CallIsland />}>
                  <HoldScreen />
                </PhoneShell>
              </Side>
              <div className="flex flex-col items-center gap-3 text-white" aria-hidden="true">
                <div className="relative h-px w-40 overflow-hidden bg-white/15 md:w-48">
                  <span className="absolute inset-y-0 left-0 w-1/3 animate-flow bg-gradient-to-r from-transparent via-accent to-transparent motion-reduce:animate-none" />
                </div>
                <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13px] font-medium ring-1 ring-inset ring-white/15">
                  <Lock size={14} className="text-accent" /> Release moves here <ArrowRight size={14} />
                </span>
              </div>
              <Side label="Outside the call" note="A trusted person, on their own phone">
                <PhoneShell>
                  <FamilyScreen />
                </PhoneShell>
              </Side>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
