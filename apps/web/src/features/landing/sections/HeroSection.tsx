import { ArrowDown } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLink } from '@/components/ui'
import { usePageVisible } from '@/lib/hooks'
import Container from '@/components/site/Container'
import HeroShader from '../components/HeroShader'
import PhoneShell from '../components/PhoneShell'
import { CallIsland, CallScreen, FamilyScreen, HoldScreen } from '../components/screens'

const CYCLE = [CallScreen, HoldScreen, FamilyScreen] as const
const CYCLE_MS = 3600

/** The hero phone steps through call, pause and family decision. It rests while the page is hidden. */
function HeroPhone() {
  const visible = usePageVisible()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setI((n) => (n + 1) % CYCLE.length), CYCLE_MS)
    return () => clearInterval(id)
  }, [visible])
  const Screen = CYCLE[i]!
  return (
    <div className="relative mx-auto w-[300px] xl:w-[320px]">
      <div className="absolute -inset-10 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
      <PhoneShell island={i < 2 ? <CallIsland /> : null} className="relative">
        <motion.div
          key={i}
          className="flex h-full flex-col"
          initial={visible && i > 0 ? { x: 24 } : false}
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        >
          <Screen />
        </motion.div>
      </PhoneShell>
      <div className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
        {CYCLE.map((_, n) => (
          <span key={n} className={`h-1.5 rounded-full transition-all duration-500 ${n === i ? 'w-6 bg-ink' : 'w-1.5 bg-ink/25'}`} />
        ))}
      </div>
    </div>
  )
}

export default function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ground pt-24">
      <HeroShader />
      <Container className="relative z-20 grid flex-1 items-center gap-14 pb-16 pt-10 lg:grid-cols-[1.35fr_1fr] lg:pb-20">
        <div>
          <Link
            to="/docs/introduction"
            className="group inline-flex items-center gap-2 rounded-full bg-white/80 py-1.5 pl-1.5 pr-3.5 text-[13px] shadow-card backdrop-blur transition-shadow hover:shadow-lift"
          >
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-semibold text-white">New</span>
            <span className="text-gray-700">The Kinsign SDK and docs are live</span>
            <span className="text-gray-400 transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <h1 className="mt-7 max-w-[15ch] text-balance text-[clamp(2.5rem,7vw,5.6rem)] font-medium leading-[0.98] tracking-[-0.045em] text-ink">
            When a call turns into a payment, family has the final say.
          </h1>
          <p className="mt-7 max-w-[52ch] text-[17px] leading-[1.6] text-gray-700 sm:text-[19px]">
            Kinsign is a release layer for banks. Everyday payments go straight through. A payment made under pressure waits for someone the customer chose in
            advance, deciding from their own phone.
          </p>
          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <ArrowLink text="Read the docs" to="/docs" size="lg" />
            <ArrowLink text="See it work" to="/stage" size="lg" variant="light" />
          </div>
        </div>
        <div className="hidden lg:block">
          <HeroPhone />
        </div>
      </Container>
      <Container className="relative z-20 hidden pb-8 lg:block">
        <a href="#shift" className="inline-flex items-center gap-2 text-[13px] text-gray-700">
          Scroll <ArrowDown size={14} className="animate-bob motion-reduce:animate-none" />
        </a>
      </Container>
    </section>
  )
}
