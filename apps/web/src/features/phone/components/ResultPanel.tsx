import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { ArrowButton } from '@/components/ui'
import { useEntrance } from '@/lib/hooks'

/** A finished payment or a decided hold. `good` means the money is where it should be. */
export default function ResultPanel({ good, title, body, cta, onClose }: { good: boolean; title: string; body: string; cta: string; onClose: () => void }) {
  const entrance = useEntrance({ scale: 0.6 })
  return (
    <div className="pb-1 pt-2 text-center">
      <motion.span
        {...entrance}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full ${good ? 'bg-ok-soft text-ok' : 'bg-ground2 text-ink'}`}
      >
        <Check size={30} strokeWidth={2.4} />
      </motion.span>
      <p className="text-[22px] font-medium tracking-[-0.02em]">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[30ch] text-[14px] text-gray-600">{body}</p>
      <ArrowButton className="mt-6" variant="dark" block text={cta} onClick={onClose} />
    </div>
  )
}
