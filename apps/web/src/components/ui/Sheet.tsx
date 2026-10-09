import { AnimatePresence, motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { usePageVisible } from '@/lib/hooks'

/**
 * Bottom sheet on phones, centred dialog on wider screens. Only transform is
 * animated, so the content is never invisible because a frame did not run.
 */
export default function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  const visible = usePageVisible()
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        // The wrapper only stays mounted while the panel slides out; nothing fades in.
        <motion.div
          exit={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <div className="absolute inset-0 bg-black/55" onClick={onClose} />
          <motion.div
            className="relative m-3 w-full max-w-[520px] rounded-3xl bg-white p-6 shadow-lift"
            initial={visible ? { y: '110%' } : false}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={visible ? { type: 'spring', stiffness: 380, damping: 36 } : { duration: 0 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => i.offset.y > 120 && onClose()}
          >
            <div className="mx-auto -mt-2 mb-4 h-1 w-10 rounded bg-gray-300 sm:hidden" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
