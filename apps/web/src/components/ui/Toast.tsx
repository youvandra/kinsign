import { motion } from 'motion/react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Tone = 'ok' | 'warn' | 'info'
const Ctx = createContext<(msg: string, tone?: Tone) => void>(() => {})
export const useToast = () => useContext(Ctx)

export function ToastHost({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; tone: Tone }[]>([])
  const push = useCallback((msg: string, tone: Tone = 'info') => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x.slice(-2), { id, msg, tone }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4200)
  }, [])
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[90] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {items.map((i) => (
          <motion.div
            key={i.id}
            layout
            initial={document.visibilityState === 'visible' ? { y: 24, scale: 0.96 } : false}
            animate={{ y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="pointer-events-auto flex max-w-[min(560px,100%)] items-center gap-3 rounded-2xl bg-ink px-5 py-3 leading-snug text-[14px] text-white shadow-lift"
          >
            {i.tone !== 'info' && <span className={`h-2 w-2 shrink-0 rounded-full ${i.tone === 'ok' ? 'bg-emerald-400' : 'bg-accent'}`} />}
            <span>{i.msg}</span>
          </motion.div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
