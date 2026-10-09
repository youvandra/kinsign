import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { Reveal } from '@/components/motion'
import Container from '@/components/site/Container'
import { SHIFT_STATEMENT, WHY_CONTROLS_MISS } from '../content'

/** One word whose ink deepens as the statement scrolls through the view. Never below a readable floor. */
function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.28, 1])
  return <motion.span style={{ opacity }}>{word} </motion.span>
}

export default function ShiftSection() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] })
  const words = SHIFT_STATEMENT.split(' ')
  return (
    <section id="shift" className="scroll-mt-24 bg-white py-24 sm:py-32">
      <Container>
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3.5 py-1.5 text-[13px] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          The shift
        </span>
        <p ref={ref} className="mt-8 max-w-[26ch] text-[clamp(1.7rem,4.2vw,3.5rem)] font-medium leading-[1.12] tracking-[-0.03em]">
          {words.map((w, i) => (
            <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
          ))}
        </p>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {WHY_CONTROLS_MISS.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div className="flex h-full flex-col rounded-3xl bg-ground2 p-7">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-ink shadow-card">
                  <Icon size={22} />
                </span>
                <h3 className="mt-10 text-[20px] font-medium tracking-[-0.02em]">{title}</h3>
                <p className="mt-2 text-[15px] leading-[1.6] text-gray-600">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
