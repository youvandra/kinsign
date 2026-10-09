import { Reveal } from '@/components/motion'
import { ArrowLink } from '@/components/ui'
import Container from '@/components/site/Container'
import HeroShader from '../components/HeroShader'

export default function CtaSection() {
  return (
    <section className="bg-white px-2 pb-2 sm:px-3 sm:pb-3">
      <div className="relative isolate overflow-hidden rounded-[32px] bg-ground">
        <HeroShader />
        <Container className="relative z-20 py-24 text-center sm:py-32">
          <Reveal>
            <h2 className="mx-auto max-w-[18ch] text-balance text-[clamp(2rem,5.4vw,4.4rem)] font-medium leading-[1.02] tracking-[-0.04em]">
              Watch a scam call fail, start to finish.
            </h2>
            <p className="mx-auto mt-6 max-w-[48ch] text-[17px] leading-[1.6] text-gray-700">
              Two phones side by side: play a call on one, see the payment wait, and decide on the other. Every step is a real transaction.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ArrowLink text="Open the live demo" to="/stage" size="lg" />
              <ArrowLink text="See the benchmarks" to="/benchmarks" size="lg" variant="light" />
            </div>
          </Reveal>
        </Container>
      </div>
    </section>
  )
}
