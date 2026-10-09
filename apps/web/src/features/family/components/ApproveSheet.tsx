import type { HoldView } from '@kinsign/protocol'
import { useState } from 'react'
import { ArrowButton, Pill, Sheet } from '@/components/ui'
import { useT } from '@/i18n'
import { yuan } from '@/lib/format'

/** Approval asks the member to confirm they spoke with her outside the call. */
export default function ApproveSheet({
  hold,
  busy,
  onApprove,
  onClose,
}: {
  hold: HoldView | null
  busy: boolean
  onApprove: (h: HoldView) => void
  onClose: () => void
}) {
  const { t, lang } = useT()
  const [confirmed, setConfirmed] = useState(false)
  const close = () => {
    setConfirmed(false)
    onClose()
  }
  return (
    <Sheet open={!!hold} onClose={close} label={t.approveTitle}>
      {hold && (
        <>
          <p className="text-[22px] font-medium tracking-[-0.02em]">{t.approveTitle}</p>
          <p className="mt-1 text-[14px] text-gray-600">
            {yuan(hold.amount, lang)} → {hold.payee}
          </p>
          <p className="mt-4 rounded-xl bg-ground2 px-4 py-3 text-[14px] leading-[1.55] text-gray-700">{t.approveBody}</p>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-[15px] text-gray-700">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-accent" />
            {t.approveCheck}
          </label>
          <div className="mt-6 grid gap-2.5">
            <ArrowButton
              variant="dark"
              size="lg"
              block
              text={t.approve}
              disabled={!confirmed || busy}
              onClick={() => {
                setConfirmed(false)
                onApprove(hold)
              }}
            />
            <Pill onClick={close} className="min-h-[48px] w-full">
              {t.cancel}
            </Pill>
          </div>
        </>
      )}
    </Sheet>
  )
}
