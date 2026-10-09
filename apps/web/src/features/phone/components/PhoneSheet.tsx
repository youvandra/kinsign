import { AnimatePresence, motion } from 'motion/react'
import { useT } from '@/i18n'
import { usePageVisible } from '@/lib/hooks'
import { yuan } from '@/lib/format'
import type { PhoneSession } from '../usePhoneSession'
import HoldPanel from './HoldPanel'
import ResultPanel from './ResultPanel'

/**
 * Bottom sheet inside the phone. `contained` pins it to the device frame;
 * otherwise it covers the viewport. Only transform is animated; the backdrop
 * is static, so nothing is hidden while a frame waits to run.
 */
export default function PhoneSheet({ session, contained }: { session: PhoneSession; contained: boolean }) {
  const { t, lang } = useT()
  const visible = usePageVisible()
  const { sheet, currentHold, closeSheet, answers, busy, actions } = session
  const position = contained ? 'absolute' : 'fixed'
  const open = sheet.kind === 'paid' || sheet.kind === 'result' || (sheet.kind === 'hold' && !!currentHold)

  const resultBody = (state: string) => (state === 'Blocked' ? t.heldBlocked : state === 'Released' ? t.heldReleased : t.heldCancelled)

  return (
    <AnimatePresence>
      {open && (
        <>
          <div key="backdrop" className={`${position} inset-0 z-40 bg-ink/40`} onClick={() => sheet.kind !== 'hold' && closeSheet()} />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            className={`${position} inset-x-0 bottom-0 z-50 mx-auto max-h-[92%] overflow-y-auto rounded-t-[30px] bg-white px-5 pb-9 pt-3.5 [scrollbar-width:none] ${contained ? '' : 'max-w-[480px]'}`}
            initial={visible ? { y: '105%' } : false}
            animate={{ y: 0 }}
            exit={{ y: '105%' }}
            transition={visible ? { type: 'spring', stiffness: 360, damping: 36 } : { duration: 0 }}
          >
            <div className="mx-auto mb-4 h-[5px] w-10 rounded bg-gray-300" />
            {sheet.kind === 'hold' && currentHold && (
              <HoldPanel
                hold={currentHold}
                t={t}
                lang={lang}
                answers={answers}
                busy={busy}
                onAnswer={actions.answer}
                onReleaseMyself={actions.releaseMyself}
                onCancel={actions.cancel}
                onAddColleague={actions.addCallersColleague}
              />
            )}
            {sheet.kind === 'paid' && (
              <ResultPanel good title={t.paidTitle} body={t.paidBody(yuan(sheet.amount, lang), sheet.payee)} cta={t.done} onClose={closeSheet} />
            )}
            {sheet.kind === 'result' && (
              <ResultPanel
                good={sheet.hold.state !== 'Released'}
                title={t.state[sheet.hold.state]}
                body={resultBody(sheet.hold.state)}
                cta={t.done}
                onClose={closeSheet}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
