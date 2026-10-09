import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { usePageVisible } from '@/lib/hooks'
import Container from '@/components/site/Container'
import PhoneShell from '../components/PhoneShell'
import SectionHeading from '../components/SectionHeading'
import { CallIsland, SCREENS } from '../components/screens'
import { STEPS } from '../content'

const STEP_MS = 5200

/** Four steps beside one phone. Steps advance on their own until the reader picks one. */
export default function HowItWorksSection() {
  const visible = usePageVisible()
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(true)
  useEffect(() => {
    if (!auto || !visible) return
    const id = setInterval(() => setActive((n) => (n + 1) % STEPS.length), STEP_MS)
    return () => clearInterval(id)
  }, [auto, visible])

  const step = STEPS[active]!
  const Screen = SCREENS[step.screen]
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-white py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="Four moments, one safe outcome."
          lead="The customer’s experience stays the same until the moment it matters. Then the money waits, and the decision travels."
        />
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <ol className="space-y-3" role="tablist" aria-label="Steps">
            {STEPS.map((s, i) => {
              const on = i === active
              const Icon = s.icon
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => {
                      setActive(i)
                      setAuto(false)
                    }}
                    className={`relative w-full overflow-hidden rounded-3xl p-6 text-left transition-colors duration-500 ease-axion sm:p-7 ${on ? 'bg-ink text-white' : 'bg-ground2 text-ink hover:bg-gray-200/70'}`}
                  >
                    <div className="flex items-start gap-5">
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${on ? 'bg-accent text-white' : 'bg-white text-ink'}`}>
                        <Icon size={22} />
                      </span>
                      <div>
                        <p className={`text-[12px] font-medium tabular-nums ${on ? 'text-white/50' : 'text-gray-500'}`}>{s.key}</p>
                        <h3 className="mt-1 text-[19px] font-medium tracking-[-0.02em] sm:text-[21px]">{s.title}</h3>
                        <p className={`mt-2 text-[15px] leading-[1.6] ${on ? 'text-white/70' : 'text-gray-600'}`}>{s.body}</p>
                      </div>
                    </div>
                    {on && auto && visible && (
                      <motion.span
                        key={active}
                        className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-accent"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: STEP_MS / 1000, ease: 'linear' }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="relative mx-auto w-[280px] sm:w-[300px]">
            <div className="absolute -inset-12 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
            <PhoneShell island={step.screen === 'call' || step.screen === 'hold' ? <CallIsland /> : null} className="relative">
              <motion.div
                key={step.screen}
                className="flex h-full flex-col"
                initial={visible ? { y: 18 } : false}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              >
                <Screen />
              </motion.div>
            </PhoneShell>
          </div>
        </div>
      </Container>
    </section>
  )
}
